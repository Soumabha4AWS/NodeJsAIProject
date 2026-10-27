import { OpenAiService } from '../../common/openai.service';
import { DocumentsService } from '../../documents/documents.service';
import { QueryResponse } from '../interfaces/query-response.interface';
export declare class VectorStrategy {
    private readonly openAiService;
    private readonly documentsService;
    private readonly logger;
    constructor(openAiService: OpenAiService, documentsService: DocumentsService);
    private dot;
    private magnitude;
    private cosineSimilarity;
    private buildIndex;
    private retrieve;
    private synthesizeAnswer;
    query(userQuery: string, topK: number): Promise<QueryResponse>;
}
