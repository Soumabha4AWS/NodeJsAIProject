import { DocumentsService } from '../../documents/documents.service';
import { QueryResponse } from '../interfaces/query-response.interface';
export declare class KeywordStrategy {
    private readonly documentsService;
    private readonly logger;
    constructor(documentsService: DocumentsService);
    query(userQuery: string, topK: number): Promise<QueryResponse>;
}
