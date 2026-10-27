import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Ticket } from './interfaces/ticket.interface';

@Injectable()
export class TicketsService implements OnModuleInit {
  private readonly logger = new Logger(TicketsService.name);
  private tickets: Ticket[] = [];

  async onModuleInit(): Promise<void> {
    await this.loadTickets();
  }

  private async loadTickets(): Promise<void> {
    // Look for the data file relative to the project root (one level above src/)
    const filePath = path.join(process.cwd(), 'synthetic_tickets.json');
    this.logger.log(`Loading tickets from: ${filePath}`);
    const raw = await fs.readFile(filePath, 'utf8');
    this.tickets = JSON.parse(raw) as Ticket[];
    this.logger.log(`✓ Loaded ${this.tickets.length} support tickets`);
  }

  getAll(): Ticket[] {
    return this.tickets;
  }

  getById(ticketId: string): Ticket | undefined {
    return this.tickets.find((t) => t.ticket_id === ticketId);
  }
}
