import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function listModels() {
    console.log('--- Listing Compatible Gemini Models ---');
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    
    if (!apiKey) {
        console.error('❌ Error: GEMINI_API_KEY is missing in .env');
        return;
    }
    
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using a manual fetch since listModels might not be directly in the high-level SDK or might behave differently
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        
        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (${m.displayName})`);
                }
            });
        } else {
            console.log('No models found or error in response:', data);
        }
    } catch (error) {
        console.error('❌ Failed to list models:', error.message);
    }
    console.log('--- End of List ---');
}

listModels().catch(console.error);
