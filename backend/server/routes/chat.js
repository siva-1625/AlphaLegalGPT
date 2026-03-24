import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Chat } from '../models/Chat.js';
import { User } from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const router = express.Router();

const getGenAI = () => {
  // Explicitly reload .env with override to ensure any manual changes are picked up immediately
  dotenv.config({ path: join(__dirname, '../../.env'), override: true });
  
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('❌ Chat API: GEMINI_API_KEY is missing in .env!');
  } else {
    console.log(`🔑 Chat API: Using key starting with: ${apiKey.slice(0, 10)}... (Reloaded)`);
  }
  return new GoogleGenerativeAI(apiKey || '');
};

const getSystemPrompt = (languageCode, location) => {
  const isTamil = languageCode === 'ta';
  // Standardizing to English for the AI expert as per user request
  const defaultLanguage = "English";
  const fallbackMessage = "I am sorry, but I am an AI Legal Assistant and I can only help with law or legal-related questions.";

  const distanceConstraint = `
STRICT CONSTRAINT: You MUST only suggest offices within a 1 meter to 10 km radius. Do NOT provide "long directions" (beyond 10km). If an office is likely further away, inform the user you cannot find any within the 10km limit.
Always add a note: "Searching for offices within a 10 km radius..." when providing these links.
`;

  let locationContext = "";
  if (location && location.lat && location.lng) {
    locationContext = `
USER LOCATION: Latitude ${location.lat}, Longitude ${location.lng}
The user HAS enabled location sharing. Your primary goal is to guide them to the ACTUAL physical offices where they can solve their legal issue.
Whenever the user's question relates to a specific government service or legal process, you MUST provide a Google Maps search link for the relevant office nearby.

${distanceConstraint}

Use these search templates (replace {office_name} with the type of office):
- VAO Office: https://www.google.com/maps/search/VAO+office/@${location.lat},${location.lng},13z
- Revenue Inspector (RI) Office: https://www.google.com/maps/search/Revenue+Inspector+office/@${location.lat},${location.lng},13z
- Taluk Office: https://www.google.com/maps/search/Taluk+Office/@${location.lat},${location.lng},13z
- Sub-Registrar Office: https://www.google.com/maps/search/Sub+Registrar+Office/@${location.lat},${location.lng},13z
- District Court: https://www.google.com/maps/search/District+Court/@${location.lat},${location.lng},13z
- Police Station: https://www.google.com/maps/search/Police+Station/@${location.lat},${location.lng},13z
- District Collectorate: https://www.google.com/maps/search/District+Collectorate/@${location.lat},${location.lng},13z

Always tell the user: "You can find the nearest [Office Name] within 10 km here: [Link]"
`;
  } else {
    locationContext = `
USER LOCATION: [NOT PROVIDED]
The user has NOT enabled location sharing or it is unavailable.
${distanceConstraint}
If the user asks for directions or nearby offices, you MUST NOT guess any address. Instead, politely ask the user to enable their location using the map icon in the chat input to find offices within a 10km radius.
`;
  }

  return `You are AI LegalGPT, a professional Indian legal assistant.
Your scope is STRICTLY LIMITED to law, legal procedures, Indian statutes, and legal advice.
If a user asks a question that is NOT related to law or legal matters (e.g., general knowledge, personal advice, random facts, jokes, or non-legal topics), you MUST NOT answer it.
Instead, you must respond ONLY with the following exact message: "${fallbackMessage}"
${locationContext}
IMPORTANT: 
1. You MUST answer strictly in the ${defaultLanguage} language.
2. If the user specifically requests a different language (e.g., "in Tamil", "in English"), you can use that language.
3. Do not mention datasets or training data.
4. Provide simple, accurate explanations of Indian law suitable for the general public.`;
};

// POST /api/chat
router.post('/', async (req, res) => {
  try {
    const { query, language, location } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    console.log(`Processing AI LegalGPT request: ${query} (Language: ${language})`);

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const fullPrompt = `${getSystemPrompt(language, location)}\n\nUser Question:\n${query}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const answer = response.text();

    res.json({
      answer,
      citations: [], // No longer using local RAG, so citations are empty or generated by AI
      section_title: "",
      confidence: 1.0
    });

    // Save to history asynchronously
    const userId = req.user.id;
    const sessionId = req.body.sessionId || 'default';
    const existingChat = await Chat.findSession(userId, sessionId);

    const userMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toISOString()
    };

    const aiMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: answer,
      timestamp: new Date().toISOString()
    };

    const updatedMessages = [...(existingChat?.messages || []), userMessage, aiMessage];

    // Auto-generate title if it's the first message
    let title = existingChat?.title || 'New Chat';
    if (title === 'New Chat' || !existingChat) {
      title = query.slice(0, 30) + (query.length > 30 ? '...' : '');
    }

    await Chat.save(userId, {
      id: sessionId,
      title,
      messages: updatedMessages
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: "Failed to get response from AI LegalGPT",
      details: error.message
    });
  }
});

// GET /api/chat/history
router.get('/history', async (req, res) => {
  try {
    const userId = req.user.id;
    const chats = await Chat.findByUser(userId);
    res.json({ history: chats });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// GET /api/chat/history/:sessionId
router.get('/history/:sessionId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const chat = await Chat.findSession(userId, sessionId);
    res.json({ history: chat ? chat.messages : [] });
  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
});

// DELETE /api/chat/history/:sessionId
router.get('/clear-all', async (req, res) => {
  try {
    const userId = req.user.id;
    await Chat.clear(userId);
    res.json({ success: true, message: 'All chat history cleared' });
  } catch (error) {
    console.error('Clear history error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

router.delete('/history/:sessionId', async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    await Chat.delete(userId, sessionId);
    res.json({ success: true, message: 'Chat session deleted' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});
/**
 * Handle WebSocket chat events
 */
export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('chat:message', async (data) => {
      const { query, language, sessionId, token, location } = data;

      let userId = 'anonymous';
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (err) {
          console.error('Socket token verification failed:', err);
        }
      }

      try {
        socket.emit('chat:typing', { isTyping: true });

        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        const fullPrompt = `${getSystemPrompt(language, location)}\n\nUser Question:\n${query}`;

        // Use streaming for better responsiveness
        const result = await model.generateContentStream(fullPrompt);

        let fullResponseText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullResponseText += chunkText;
          socket.emit('chat:stream', { text: chunkText });
        }

        socket.emit('chat:complete', {
          answer: fullResponseText,
          sessionId: sessionId || 'default',
          citations: [],
          section_title: "",
          confidence: 1.0,
        });

        // Save to history in background
        if (userId !== 'anonymous') {
          const sId = sessionId || 'default';
          const existingChat = await Chat.findSession(userId, sId);

          let title = existingChat?.title || 'New Chat';
          if (title === 'New Chat' || !existingChat) {
            title = query.slice(0, 30) + (query.length > 30 ? '...' : '');
          }

          const userMessage = {
            id: `msg_${Date.now()}`,
            role: 'user',
            content: query,
            timestamp: new Date().toISOString()
          };

          const aiMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: fullResponseText,
            timestamp: new Date().toISOString()
          };

          const updatedMessages = [...(existingChat?.messages || []), userMessage, aiMessage];
          await Chat.save(userId, {
            id: sId,
            title,
            messages: updatedMessages
          });
        }

        socket.emit('chat:typing', { isTyping: false });

      } catch (error) {
        console.error('Socket streaming error detailed:', {
          message: error.message,
          status: error.status,
          details: error.errorDetails
        });
        socket.emit('chat:error', {
          error: `AI Error: ${error.message}`,
          details: error.message
        });
        socket.emit('chat:typing', { isTyping: false });
      }
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

export default router;
