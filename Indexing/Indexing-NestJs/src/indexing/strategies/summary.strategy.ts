import { Injectable, Logger } from '@nestjs/common';
import { DocumentsService } from '../../documents/documents.service';
import { IndexResult, QueryResponse } from '../interfaces/query-response.interface';

@Injectable()
export class SummaryStrategy {
  private readonly logger = new Logger(SummaryStrategy.name);

  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Run the LlamaIndex SummaryIndex query pipeline.
   * Port of summary-index.js — falls back gracefully if llama-index is not installed.
   */
  async query(userQuery: string, topK: number): Promise<QueryResponse> {
    const start = Date.now();

    // Attempt to load the llama-index package dynamically (it may not be installed)
    let LlamaIndex: any;
    try {
      LlamaIndex = require('llama-index');
    } catch {
      this.logger.warn(
        'The `llama-index` npm package is not installed. SummaryIndex strategy is unavailable. ' +
          'Run: npm install llama-index',
      );
      return {
        strategy: 'summary',
        query: userQuery,
        topK,
        results: [],
        answer:
          'SummaryIndex strategy requires the `llama-index` npm package. ' +
          'Please install it with: npm install llama-index',
        durationMs: Date.now() - start,
      };
    }

    const { SummaryIndex } = LlamaIndex;
    const docs = this.documentsService.getAll();

    this.logger.log(`Building SummaryIndex for ${docs.length} documents (no embeddings)...`);
    const summaryIndex = await SummaryIndex.fromDocuments(docs);
    this.logger.log('✓ SummaryIndex created');

    const summaryQueryEngine = summaryIndex.asQueryEngine
      ? summaryIndex.asQueryEngine({ responseMode: 'tree_summarize' })
      : null;

    if (!summaryQueryEngine) {
      return {
        strategy: 'summary',
        query: userQuery,
        topK,
        results: [],
        answer: 'SummaryIndex created but .asQueryEngine() is not supported by this SDK version.',
        durationMs: Date.now() - start,
      };
    }

    const response = await summaryQueryEngine.query(userQuery);

    const sourceNodes: any[] = (response.source_nodes || response.sourceNodes || []).slice(0, topK);

    const results: IndexResult[] = sourceNodes.map((node: any) => ({
      id: node.metadata?.ticket_id || node.node_id || 'unknown',
      score: node.score,
      text: String(node.text || node.content || ''),
      metadata: {
        ticket_id: node.metadata?.ticket_id || 'unknown',
        category: node.metadata?.category || '',
        priority: node.metadata?.priority || '',
        title: node.metadata?.title || '',
      },
    }));

    return {
      strategy: 'summary',
      query: userQuery,
      topK,
      results,
      answer: response.response || response.answer || '',
      durationMs: Date.now() - start,
    };
  }
}
