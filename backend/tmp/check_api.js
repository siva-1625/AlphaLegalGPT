import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function checkApi() {
    console.log('--- Gemini API Diagnostic ---');
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    
    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY is missing in .env');
        return;
    }
    
    console.log(`Key found (starting with): ${apiKey.slice(0, 8)}...`);
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
        
        console.log('Sending test request to Gemini (Flash Latest)...');
        const result = await model.generateContent("Hello, say 'API is working' if you can read this.");
        const response = await result.response;
        const text = response.text();
        
        console.log('✅ Success! Gemini response:', text);
    } catch (error) {
        console.error('❌ Gemini API Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        
        if (error.message.includes('403') || error.message.includes('PERMISSION_DENIED')) {
            console.error('👉 Suggestion: Your API key might be invalid or not have permission for the Generative AI API.');
        } else if (error.message.includes('429')) {
            console.error('👉 Suggestion: Quota exceeded. You are making too many requests.');
        } else if (error.message.includes('404')) {
            console.error('👉 Suggestion: Model not found. The model name "gemini-1.5-flash" might not be available for your key.');
        }
    }
    console.log('--- End of Diagnostic ---');
}

checkApi().catch(console.error);
