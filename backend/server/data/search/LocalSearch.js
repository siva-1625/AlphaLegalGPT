import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GlobalHistory } from '../models/GlobalHistory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stopWords = new Set(['the', 'is', 'at', 'which', 'on', 'and', 'a', 'an', 'to', 'in', 'for', 'it', 'if', 'this', 'that', 'with', 'by', 'of', 'how', 'what', 'where']);

/**
 * Tokenize and normalize a string
 */
const getTokens = (str) => {
  if (!str) return [];
  return str.toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .split(/\s+/)
    .filter(token => token.length >= 2 && !stopWords.has(token)); // Changed to >= 2 to include "IPC", "FIR", "420", etc.
};

/**
 * Calculate similarity score based on word intersection
 */
const calculateScore = (queryTokens, targetStr) => {
  if (!targetStr) return 0;
  const targetTokens = new Set(getTokens(targetStr));
  if (targetTokens.size === 0) return 0;
  
  let intersection = 0;
  for (const token of queryTokens) {
    if (targetTokens.has(token)) {
      intersection++;
    }
  }
  return intersection / Math.max(queryTokens.length, targetTokens.size);
};

export class LocalSearch {
    /**
     * Search for a similar question in global history
     */
    static async findInHistory(query) {
        const history = await GlobalHistory.getAll();
        const queryTokens = getTokens(query);
        if (queryTokens.length === 0) return null;

        let bestMatch = null;
        let maxScore = 0;

        for (const item of history) {
            const score = calculateScore(queryTokens, item.question);
            // Threshold for match - 0.2 is quite loose but helpful for natural language
            if (score > maxScore && score > 0.2) { 
                maxScore = score;
                bestMatch = item;
            }
        }
        return bestMatch ? { ...bestMatch, source: 'History', score: maxScore } : null;
    }

    /**
     * Perform global local search across history only
     */
    static async search(query, language) {
        const isTamil = language === 'ta' || language === 'tamil';
        
        // Try history (exact or similar Q&A matches)
        const historyMatch = await this.findInHistory(query);
        
        if (historyMatch) {
            return historyMatch;
        }

        return {
            answer: isTamil 
                ? "மன்னிக்கவும், தற்காலிக ஆஃப்லைன் முறையில் இதற்கு என்னால் பதில் கிடைக்கவில்லை. உங்கள் இணையத்தைப் பார்க்கவும்." 
                : "I could not find a previous response for your question in our offline database. Please check your internet connection.",
            source: 'Offline Fallback',
            score: 0
        };
    }
}
