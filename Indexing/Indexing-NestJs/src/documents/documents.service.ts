import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { TicketDocument } from './ticket-document.interface';

interface RawTicket {
  ticket_id: string;
  title: string;
  description: string;
  resolution: string;
  category: string;
  priority: string;
  created_date?: string;
  resolved_date?: string;
}

@Injectable()
export class DocumentsService implements OnModuleInit {
  private readonly logger = new Logger(DocumentsService.name);
  private documents: TicketDocument[] = [];

  onModuleInit() {
    // Try src/data first (dev), then dist/data (prod)
    const possiblePaths = [
      path.join(__dirname, '..', 'data', 'synthetic_tickets.json'),
      path.join(__dirname, 'data', 'synthetic_tickets.json'),
      path.join(process.cwd(), 'src', 'data', 'synthetic_tickets.json'),
      path.join(process.cwd(), 'synthetic_tickets.json'),
    ];

    let ticketsPath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        ticketsPath = p;
        break;
      }
    }

    if (!ticketsPath) {
      this.logger.error('Could not find synthetic_tickets.json. Checked paths: ' + possiblePaths.join(', '));
      this.documents = [];
      return;
    }

    const raw = fs.readFileSync(ticketsPath, 'utf-8');
    const tickets: RawTicket[] = JSON.parse(raw);

    this.documents = tickets.map((ticket) => {
      const content = [
        `Ticket ID: ${ticket.ticket_id}`,
        `Title: ${ticket.title}`,
        `Description: ${ticket.description}`,
        `Resolution: ${ticket.resolution}`,
        `Category: ${ticket.category}`,
        `Priority: ${ticket.priority}`,
      ].join('\n');

      return {
        id: ticket.ticket_id,
        text: content,
        metadata: {
          ticket_id: ticket.ticket_id,
          category: ticket.category,
          priority: ticket.priority,
          title: ticket.title,
        },
      };
    });

    this.logger.log(`✓ Loaded ${this.documents.length} ticket documents from ${ticketsPath}`);
  }

  /**
   * Returns all loaded documents.
   */
  getAll(): TicketDocument[] {
    return this.documents;
  }

  /**
   * Returns the total document count.
   */
  count(): number {
    return this.documents.length;
  }
}
