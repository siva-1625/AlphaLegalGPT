import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

async function testGeneration() {
  try {
    console.log('Testing key:', apiKey.slice(0, 10) + '...');
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent("Say hello world in Tamil");
    const response = await result.response;
    console.log('AI Response:', response.text());
  } catch (error) {
    console.error('Generation Error:', error);
  }
}

testGeneration();
