import { TicketsService } from '../tickets/tickets.service';
export declare class TicketsController {
    private readonly ticketsService;
    constructor(ticketsService: TicketsService);
    getAll(): {
        count: number;
        tickets: import("./interfaces/ticket.interface").Ticket[];
    };
}
