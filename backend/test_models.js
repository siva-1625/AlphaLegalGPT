import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is missing');
        return;
    }
    const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });
    try {
        // There is no direct listModels in the SDK for easy use without administrative access in some cases,
        // but let's try a simple generation with a few common names.
        const modelsToTry = [
            "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.0-pro", 
            "gemini-2.5-flash", "gemini-2.5-pro", "gemini-3-flash"
        ];
        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hi");
                console.log(`✅ Model ${modelName} works!`);
            } catch (e) {
                console.log(`❌ Model ${modelName} failed: ${e.message}`);
            }
        }
    } catch (error) {
        console.error('Error listing/testing models:', error);
    }
}

listModels();
