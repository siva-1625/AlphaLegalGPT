import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  try {
    const response = await fetch(url);
    const data = await response.json();
    if (!data.models) {
      console.log('No models found. Response:', JSON.stringify(data, null, 2));
      return;
    }
    console.log('Available Models:', JSON.stringify(data.models, null, 2));
  } catch (error) {
    console.error('Error listing models:', error);
  }
}

listModels();
