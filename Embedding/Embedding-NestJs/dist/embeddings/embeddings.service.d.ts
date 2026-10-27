import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TicketsService } from '../tickets/tickets.service';
import { Ticket } from '../tickets/interfaces/ticket.interface';
export interface SearchResult {
    rank: number;
    ticket: Ticket;
    similarity: number;
}
export interface AnalysisResult {
    query: string;
    selected_indices: number[];
    similarity_matrix: number[][];
    query_similarities: number[];
}
export declare class EmbeddingsService implements OnModuleInit {
    private readonly configService;
    private readonly ticketsService;
    private readonly logger;
    private readonly client;
    private readonly embeddingModel;
    private readonly embeddingDim;
    private ticketEmbeddings;
    constructor(configService: ConfigService, ticketsService: TicketsService);
    onModuleInit(): Promise<void>;
    embedTexts(texts: string[]): Promise<number[][]>;
    private getTicketEmbeddings;
    search(query: string, topK?: number): Promise<SearchResult[]>;
    batchSearch(queries: string[]): Promise<Record<string, SearchResult[]>>;
    getSimilarityAnalysis(query?: string): Promise<AnalysisResult>;
    getModelInfo(): {
        model: string;
        dimension: number;
        ticketCount: number;
        embeddingsCached: boolean;
    };
}
