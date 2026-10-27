import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OpenAIEmbeddings } from "@langchain/openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

function norm(a) {
  return Math.sqrt(dot(a, a)) || 1;
}

function cosineSim(a, b) {
  return dot(a, b) / (norm(a) * norm(b));
}

class LocalEmbeddings {
  constructor({ dim = 256 } = {}) {
    this.dim = dim;
  }
  // Simple token-hash embedding for offline/demo mode
  _vec(text) {
    const v = new Array(this.dim).fill(0);
    const tokens = String(text).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const tok of tokens) {
      let h = 2166136261; // FNV-1a
      for (let i = 0; i < tok.length; i++) {
        h ^= tok.charCodeAt(i);
        h = (h * 16777619) >>> 0;
      }
      const idx = h % this.dim;
      v[idx] += 1;
    }
    return v;
  }
  async embedDocuments(texts) {
    return texts.map((t) => this._vec(t));
  }
  async embedQuery(text) {
    return this._vec(text);
  }
}

export class SupportTicketTools {
  constructor({ ticketsPath = path.resolve(__dirname, "..", "synthetic_tickets.json"), embeddingModel = "text-embedding-3-small" } = {}) {
    const raw = fs.readFileSync(ticketsPath, "utf-8");
    this.tickets = JSON.parse(raw);

    this.embeddings = process.env.OPENAI_API_KEY
      ? new OpenAIEmbeddings({ model: embeddingModel, apiKey: process.env.OPENAI_API_KEY })
      : new LocalEmbeddings();
    this.docs = [];
    this.docVectors = [];
  }

  async setupVectorstore() {
    const documents = this.tickets.map((t) => ({
      content: `Ticket ID: ${t.ticket_id}\nTitle: ${t.title}\nDescription: ${t.description}\nResolution: ${t.resolution}\nCategory: ${t.category}\nPriority: ${t.priority}`,
      meta: { ticket_id: t.ticket_id, category: t.category, priority: t.priority, title: t.title },
    }));

    const texts = documents.map((d) => d.content);
    const vectors = await this.embeddings.embedDocuments(texts);
    this.docs = documents;
    this.docVectors = vectors;
  }

  async ensureReady() {
    if (this.docVectors.length === 0) {
      await this.setupVectorstore();
    }
  }

  async search_similar_tickets(query) {
    await this.ensureReady();
    const qVec = await this.embeddings.embedQuery(query);
    const scored = this.docVectors.map((v, i) => ({ i, score: cosineSim(qVec, v) }));
    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, 3);
    if (top.length === 0) return "No similar tickets found.";
    let out = "Found similar tickets:\n\n";
    for (let rank = 0; rank < top.length; rank++) {
      const d = this.docs[top[rank].i];
      out += `--- Ticket ${rank + 1} ---\n${d.content}\n\n`;
    }
    return out;
  }

  async get_ticket_by_id(ticketId) {
    const id = String(ticketId || "").toUpperCase().trim();
    for (const t of this.tickets) {
      if (t.ticket_id === id) {
        return `Ticket ID: ${t.ticket_id}\nTitle: ${t.title}\nDescription: ${t.description}\nResolution: ${t.resolution}\nCategory: ${t.category}\nPriority: ${t.priority}\nCreated: ${t.created_date}\nResolved: ${t.resolved_date}`;
      }
    }
    return `Ticket ${id} not found in the database.`;
  }

  async search_by_category(category) {
    const c = String(category || "").trim();
    const matches = this.tickets.filter((t) => t.category.toLowerCase() === c.toLowerCase());
    if (matches.length === 0) {
      const available = [...new Set(this.tickets.map((t) => t.category))];
      return `No tickets found in category '${c}'. Available categories: ${available.join(", ")}`;
    }
    let out = `Found ${matches.length} tickets in category '${c}':\n\n`;
    for (const t of matches) {
      out += `• [${t.ticket_id}] ${t.title} (Priority: ${t.priority})\n`;
    }
    return out;
  }

  async get_ticket_statistics(_input = "") {
    const total = this.tickets.length;
    const categories = {};
    const priorities = {};
    for (const t of this.tickets) {
      categories[t.category] = (categories[t.category] || 0) + 1;
      priorities[t.priority] = (priorities[t.priority] || 0) + 1;
    }
    let out = `Ticket Database Statistics:\n`;
    out += `Total Tickets: ${total}\n\n`;
    out += `By Category:\n`;
    for (const [cat, count] of Object.entries(categories).sort((a, b) => b[1] - a[1])) {
      out += `  • ${cat}: ${count}\n`;
    }
    out += `\nBy Priority:\n`;
    for (const [pri, count] of Object.entries(priorities).sort((a, b) => b[1] - a[1])) {
      out += `  • ${pri}: ${count}\n`;
    }
    return out;
  }

  getTools() {
    // Return tool metadata + executor for OpenAI function-calling
    return [
      {
        name: "SearchSimilarTickets",
        description:
          "Use this tool to search for similar support tickets based on a problem description or question. Input should be a clear description of the issue or question. This is the PRIMARY tool for answering 'how to fix' or 'similar issue' questions.",
        parameters: {
          type: "object",
          properties: { input: { type: "string", description: "The input to the tool" } },
          required: ["input"],
        },
        func: async ({ input }) => this.search_similar_tickets(input),
      },
      {
        name: "GetTicketByID",
        description:
          "Use this tool to retrieve details of a specific ticket by its ID. Input should be a ticket ID like 'TICK-001'. Use this when the user mentions a specific ticket number.",
        parameters: {
          type: "object",
          properties: { input: { type: "string", description: "The input to the tool" } },
          required: ["input"],
        },
        func: async ({ input }) => this.get_ticket_by_id(input),
      },
      {
        name: "SearchByCategory",
        description:
          "Use this tool to find all tickets in a specific category. Input should be a category name like 'Authentication', 'Database', 'Payment', 'Mobile', etc. Use this when the user wants to see all issues of a certain type.",
        parameters: {
          type: "object",
          properties: { input: { type: "string", description: "The input to the tool" } },
          required: ["input"],
        },
        func: async ({ input }) => this.search_by_category(input),
      },
      {
        name: "GetTicketStatistics",
        description:
          "Use this tool to get statistics about the ticket database including total count, category distribution, and priority breakdown. No input needed - just call this tool. Use this when the user asks for statistics, summaries, or overview of tickets.",
        parameters: {
          type: "object",
          properties: { input: { type: "string", description: "Optional input (unused)" } },
        },
        func: async ({ input }) => this.get_ticket_statistics(input),
      },
    ];
  }
}
