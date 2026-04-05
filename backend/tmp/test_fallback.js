import { GlobalHistory } from '../server/data/models/GlobalHistory.js';
import { LocalSearch } from '../server/data/search/LocalSearch.js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

async function runTest() {
    console.log('--- Testing Settings-Aware Fallback (Revised) ---');
    
    // Test Case 1: Populating History
    const testQ = "What is the role of a VAO?";
    const testA = "A Village Administrative Officer (VAO) manages village records and revenue collection.";
    
    console.log('1. Mocking successful AI response...');
    await GlobalHistory.save(testQ, testA);

    // Test Case 2: Matching from History
    console.log('\n2. Simulating Search Match from History...');
    const result1 = await LocalSearch.search(testQ, "en");
    console.log('Match Found:', result1.source);
    if (result1.source === 'History') {
       console.log('Prefix to apply: [History Match]');
    }
    console.log('Answer:', result1.answer.slice(0, 50) + "...");

    // Test Case 3: Offline Default (No match)
    console.log('\n3. Simulating Search with NO History Match...');
    const result2 = await LocalSearch.search("Tell me something unique and new", "en");
    console.log('Match Found:', result2.source);
    if (result2.source === 'Offline Fallback') {
       console.log('Prefix to apply: [Offline Response]');
    }
    console.log('Answer:', result2.answer);

    console.log('\n--- Test Complete ---');
}

runTest().catch(console.error);
