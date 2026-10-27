import { IndexingService } from './indexing.service';
import { QueryDto } from './dto/query.dto';
export declare class IndexingController {
    private readonly indexingService;
    constructor(indexingService: IndexingService);
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
    health(): {
        status: string;
        timestamp: string;
    };
    queryVector(dto: QueryDto): Promise<import("./interfaces/query-response.interface").QueryResponse>;
    querySummary(dto: QueryDto): Promise<import("./interfaces/query-response.interface").QueryResponse>;
    queryKeyword(dto: QueryDto): Promise<import("./interfaces/query-response.interface").QueryResponse>;
    queryHybrid(dto: QueryDto): Promise<import("./interfaces/query-response.interface").QueryResponse>;
}
