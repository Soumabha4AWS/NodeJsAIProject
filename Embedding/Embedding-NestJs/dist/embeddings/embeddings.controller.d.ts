import { EmbeddingsService } from './embeddings.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { BatchQueryDto } from './dto/batch-query.dto';
export declare class EmbeddingsController {
    private readonly embeddingsService;
    constructor(embeddingsService: EmbeddingsService);
    getModelInfo(): {
        model: string;
        dimension: number;
        ticketCount: number;
        embeddingsCached: boolean;
    };
    search(dto: SearchQueryDto): Promise<{
        query: string;
        topK: number;
        results: import("./embeddings.service").SearchResult[];
    }>;
    batchSearch(dto: BatchQueryDto): Promise<{
        queryCount: number;
        results: Record<string, import("./embeddings.service").SearchResult[]>;
    }>;
    getAnalysis(query?: string): Promise<import("./embeddings.service").AnalysisResult>;
}
