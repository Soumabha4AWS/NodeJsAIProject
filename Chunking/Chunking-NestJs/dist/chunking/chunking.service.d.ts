export interface Ticket {
    ticket_id: string;
    title: string;
    category: string;
    priority: string;
    description: string;
    resolution: string;
}
export interface Document {
    pageContent: string;
    metadata: Record<string, unknown>;
}
export declare class LangChainVectorStore {
    private items;
    constructor(documents: Document[]);
    similaritySearch(query: string, k?: number, filter?: Record<string, unknown> | null): Document[];
    maxMarginalRelevanceSearch(query: string, k?: number, filter?: Record<string, unknown> | null): Document[];
    private filterDocuments;
}
export declare class ChunkingService {
    private readonly logger;
    readTickets(): Ticket[];
    createDocument(ticket: Ticket): Document;
    createTextDocument(text: string, metadata?: Record<string, unknown>): Document;
    splitByFixedSize(text: string, chunkSize: number, chunkOverlap: number): string[];
    splitTextRecursive(text: string, separators: string[], chunkSize: number, chunkOverlap: number): string[];
    splitMarkdown(text: string): Document[];
    splitHtml(text: string): Document[];
    runDemo(): Promise<Record<string, unknown>>;
}
