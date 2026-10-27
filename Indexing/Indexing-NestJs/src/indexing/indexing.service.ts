import { Injectable } from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { QueryDto } from './dto/query.dto';
import { QueryResponse } from './interfaces/query-response.interface';
import { VectorStrategy } from './strategies/vector.strategy';
import { SummaryStrategy } from './strategies/summary.strategy';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { HybridStrategy } from './strategies/hybrid.strategy';

@Injectable()
export class IndexingService {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly vectorStrategy: VectorStrategy,
    private readonly summaryStrategy: SummaryStrategy,
    private readonly keywordStrategy: KeywordStrategy,
    private readonly hybridStrategy: HybridStrategy,
  ) {}

  /**
   * Vector retrieval: OpenAI embeddings + cosine similarity.
   */
  async queryVector(dto: QueryDto): Promise<QueryResponse> {
    return this.vectorStrategy.query(dto.query, dto.topK ?? 3);
  }

  /**
   * Summary retrieval: LlamaIndex SummaryIndex.
   */
  async querySummary(dto: QueryDto): Promise<QueryResponse> {
    return this.summaryStrategy.query(dto.query, dto.topK ?? 3);
  }

  /**
   * Keyword retrieval: LlamaIndex KeywordTableIndex.
   */
  async queryKeyword(dto: QueryDto): Promise<QueryResponse> {
    return this.keywordStrategy.query(dto.query, dto.topK ?? 3);
  }

  /**
   * Hybrid retrieval: union of vector + keyword results.
   */
  async queryHybrid(dto: QueryDto): Promise<QueryResponse> {
    return this.hybridStrategy.query(dto.query, dto.topK ?? 3);
  }

  /**
   * Return all loaded documents (metadata only).
   */
  getDocuments() {
    return {
      count: this.documentsService.count(),
      documents: this.documentsService.getAll().map((d) => ({
        id: d.id,
        metadata: d.metadata,
        textPreview: d.text.slice(0, 200) + (d.text.length > 200 ? '...' : ''),
      })),
    };
  }
}
