import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type Ticket = {
  ticket_id: string;
  title: string;
  description: string;
  resolution: string;
  category: string;
  priority: string;
  created_date: string;
  resolved_date: string;
};

@Injectable()
export class SupportTicketService {
  private readonly tickets: Ticket[];
  private readonly openai?: OpenAI;

  constructor() {
    const ticketPath = join(process.cwd(), 'synthetic_tickets.json');
    this.tickets = JSON.parse(readFileSync(ticketPath, 'utf8')) as Ticket[];
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  async searchSimilarTickets(query: string): Promise<string> {
    const ranked = this.tickets
      .map((ticket) => ({ ticket, score: this.lexicalScore(query, this.ticketText(ticket)) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (this.openai) {
      try {
        const queryEmbedding = await this.openai.embeddings.create({
          model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
          input: query,
        });
        const ticketEmbeddings = await this.openai.embeddings.create({
          model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
          input: this.tickets.map((ticket) => this.ticketText(ticket)),
        });
        ranked.splice(0, ranked.length, ...this.tickets
          .map((ticket, index) => ({
            ticket,
            score: this.cosine(queryEmbedding.data[0].embedding, ticketEmbeddings.data[index].embedding),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 3));
      } catch {
        // Lexical ranking keeps local development and tests usable without embeddings.
      }
    }

    return `Found similar tickets:\n\n${ranked.map(({ ticket }, index) => `--- Ticket ${index + 1} ---\n${this.ticketText(ticket)}`).join('\n\n')}`;
  }

  getTicketById(ticketId: string): string {
    const normalized = ticketId.toUpperCase().trim();
    const ticket = this.tickets.find((item) => item.ticket_id === normalized);
    return ticket ? `${this.ticketText(ticket)}\nCreated: ${ticket.created_date}\nResolved: ${ticket.resolved_date}` : `Ticket ${normalized} not found in the database.`;
  }

  searchByCategory(category: string): string {
    const normalized = category.trim();
    const matching = this.tickets.filter((ticket) => ticket.category.toLowerCase() === normalized.toLowerCase());
    if (!matching.length) {
      const available = [...new Set(this.tickets.map((ticket) => ticket.category))];
      return `No tickets found in category '${normalized}'. Available categories: ${available.join(', ')}`;
    }
    return `Found ${matching.length} tickets in category '${normalized}':\n\n${matching.map((ticket) => `• [${ticket.ticket_id}] ${ticket.title} (Priority: ${ticket.priority})`).join('\n')}`;
  }

  getTicketStatistics(): string {
    const categories = this.countBy('category');
    const priorities = this.countBy('priority');
    return `Ticket Database Statistics:\nTotal Tickets: ${this.tickets.length}\n\nBy Category:\n${this.sortedCounts(categories)}\n\nBy Priority:\n${this.sortedCounts(priorities)}`;
  }

  private ticketText(ticket: Ticket): string {
    return `Ticket ID: ${ticket.ticket_id}\nTitle: ${ticket.title}\nDescription: ${ticket.description}\nResolution: ${ticket.resolution}\nCategory: ${ticket.category}\nPriority: ${ticket.priority}`;
  }

  private lexicalScore(query: string, text: string): number {
    const words = new Set(query.toLowerCase().split(/\W+/).filter(Boolean));
    return text.toLowerCase().split(/\W+/).filter((word) => words.has(word)).length;
  }

  private cosine(left: number[], right: number[]): number {
    const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
    const magnitude = (values: number[]) => Math.sqrt(values.reduce((sum, value) => sum + value * value, 0));
    return dot / ((magnitude(left) * magnitude(right)) || 1);
  }

  private countBy(field: 'category' | 'priority'): Record<string, number> {
    return this.tickets.reduce<Record<string, number>>((counts, ticket) => {
      counts[ticket[field]] = (counts[ticket[field]] ?? 0) + 1;
      return counts;
    }, {});
  }

  private sortedCounts(counts: Record<string, number>): string {
    return Object.entries(counts).sort(([, a], [, b]) => b - a).map(([name, count]) => `  • ${name}: ${count}`).join('\n');
  }
}
