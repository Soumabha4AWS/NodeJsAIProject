import { OnModuleInit } from '@nestjs/common';
import { TicketDocument } from './ticket-document.interface';
export declare class DocumentsService implements OnModuleInit {
    private readonly logger;
    private documents;
    onModuleInit(): void;
    getAll(): TicketDocument[];
    count(): number;
}
