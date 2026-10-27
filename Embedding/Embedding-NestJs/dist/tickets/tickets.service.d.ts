import { OnModuleInit } from '@nestjs/common';
import { Ticket } from './interfaces/ticket.interface';
export declare class TicketsService implements OnModuleInit {
    private readonly logger;
    private tickets;
    onModuleInit(): Promise<void>;
    private loadTickets;
    getAll(): Ticket[];
    getById(ticketId: string): Ticket | undefined;
}
