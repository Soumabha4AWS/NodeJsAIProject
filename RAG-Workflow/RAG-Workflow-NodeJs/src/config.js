import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Increase HTTP timeout for OpenAI requests (in seconds)
process.env.HTTPX_TIMEOUT = process.env.HTTPX_TIMEOUT || '300';

// --- OpenAI configuration ---
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
export const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini';

class SimpleHashEmbeddings {
  constructor(dim = 256) {
    this.dim = dim;
  }
  _vecFor(text) {
    const vec = new Array(this.dim).fill(0);
    let h = 2166136261;
    for (let i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
      const idx = h % this.dim;
      vec[idx] += 1;
    }
    const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
    return vec.map((v) => v / norm);
  }
  async embedDocuments(texts) {
    return texts.map((t) => this._vecFor(t || ''));
  }
  async embedQuery(text) {
    return this._vecFor(text || '');
  }
}

if (!OPENAI_API_KEY) {
  console.warn('⚠ OPENAI_API_KEY not set. Using local dummy embeddings and LLM.');
}

export const embedding = OPENAI_API_KEY
  ? new OpenAIEmbeddings({
      model: OPENAI_EMBEDDING_MODEL,
      apiKey: OPENAI_API_KEY,
      timeout: 120_000,
      maxRetries: 5,
    })
  : new SimpleHashEmbeddings();

export const llm = OPENAI_API_KEY
  ? new ChatOpenAI({
      model: OPENAI_CHAT_MODEL,
      apiKey: OPENAI_API_KEY,
      timeout: 300_000,
      maxRetries: 5,
    })
  : {
      async invoke(input) {
        const msg = typeof input === 'string' ? input : JSON.stringify(input);
        return `[LLM disabled: set OPENAI_API_KEY] ${msg.slice(0, 800)}`;
      },
    };

// --- Load data ---
const ticketsPath = path.resolve(__dirname, '../synthetic_tickets.json');
const ticketsRaw = fs.readFileSync(ticketsPath, 'utf-8');
const tickets = JSON.parse(ticketsRaw);

export const documents = tickets.map((ticket) => {
  const content = `Ticket ID: ${ticket.ticket_id}\nTitle: ${ticket.title}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}\nDate: ${ticket.created_date} to ${ticket.resolved_date}\n\nProblem Description:\n${ticket.description}\n\nResolution:\n${ticket.resolution}`.trim();
  return new Document({
    pageContent: content,
    metadata: {
      ticket_id: ticket.ticket_id,
      title: ticket.title,
      category: ticket.category,
      priority: ticket.priority,
      source: `Ticket ${ticket.ticket_id}`,
    },
  });
});

console.log(`✓ Created ${documents.length} documents with metadata`);
