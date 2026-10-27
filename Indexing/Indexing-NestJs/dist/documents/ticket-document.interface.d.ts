export interface TicketDocument {
    id: string;
    text: string;
    metadata: {
        ticket_id: string;
        category: string;
        priority: string;
        title: string;
    };
}
