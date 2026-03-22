import { retrieveAndPrepareContext } from '../server/rag/retriever.js';
import { getVectorStore } from '../server/rag/vectorStore.js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

async function runTest() {
  console.log('--- Initializing Vector Store ---');
  try {
    const store = await getVectorStore();
    
    // We need to wait for indexing to finish if it's running but here we just re-run search
    // Actually the vectorStore might have cached the old embeddings if it wasn't re-initialized
    // But since this is a new process, it will reload the file.
    
    const query = 'What is IPC Section 420?';
    console.log(`\n--- Testing Query: "${query}" ---`);
    const result = await retrieveAndPrepareContext(query);
    
    console.log(`Confidence: ${result.confidence}`);
    
    if (result.documents && result.documents.length > 0) {
      result.documents.slice(0, 3).forEach((doc, i) => {
        console.log(`Result ${i+1}: ${doc.section} - ${doc.title}`);
        console.log(`Score: ${doc.relevanceScore?.toFixed(2)}`);
        console.log(`Content: ${doc.content.substring(0, 200)}...\n`);
      });
    } else {
      console.log('No documents found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

runTest();
