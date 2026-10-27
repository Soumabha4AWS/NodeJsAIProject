import { OpenAiService } from '../../common/openai.service';
import { DocumentsService } from '../../documents/documents.service';
import { QueryResponse } from '../interfaces/query-response.interface';
export declare class HybridStrategy {
    private readonly openAiService;
    private readonly documentsService;
    private readonly logger;
    constructor(openAiService: OpenAiService, documentsService: DocumentsService);
    private dot;
    private magnitude;
    private cosineSimilarity;
    private vectorRetrieve;
    private tokenize;
    private keywordRetrieve;
    private llamaIndexHybrid;
    query(userQuery: string, topK: number): Promise<QueryResponse>;
}
