import { DocumentsService } from '../documents/documents.service';
import { QueryDto } from './dto/query.dto';
import { QueryResponse } from './interfaces/query-response.interface';
import { VectorStrategy } from './strategies/vector.strategy';
import { SummaryStrategy } from './strategies/summary.strategy';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { HybridStrategy } from './strategies/hybrid.strategy';
export declare class IndexingService {
    private readonly documentsService;
    private readonly vectorStrategy;
    private readonly summaryStrategy;
    private readonly keywordStrategy;
    private readonly hybridStrategy;
    constructor(documentsService: DocumentsService, vectorStrategy: VectorStrategy, summaryStrategy: SummaryStrategy, keywordStrategy: KeywordStrategy, hybridStrategy: HybridStrategy);
    queryVector(dto: QueryDto): Promise<QueryResponse>;
    querySummary(dto: QueryDto): Promise<QueryResponse>;
    queryKeyword(dto: QueryDto): Promise<QueryResponse>;
    queryHybrid(dto: QueryDto): Promise<QueryResponse>;
    getDocuments(): {
        count: number;
        documents: {
            id: string;
            metadata: {
                ticket_id: string;
                category: string;
                priority: string;
                title: string;
            };
            textPreview: string;
        }[];
    };
}
