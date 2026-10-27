import { Injectable, Logger } from '@nestjs/common';
import { DocumentsService } from '../../documents/documents.service';
import { IndexResult, QueryResponse } from '../interfaces/query-response.interface';

@Injectable()
export class KeywordStrategy {
  private readonly logger = new Logger(KeywordStrategy.name);

  constructor(private readonly documentsService: DocumentsService) {}

  /**
   * Run the LlamaIndex KeywordTableIndex query pipeline.
   * Port of keyword-index.js — falls back gracefully if llama-index is not installed.
   */
  async query(userQuery: string, topK: number): Promise<QueryResponse> {
    const start = Date.now();

    // Attempt to load the llama-index package dynamically
    let LlamaIndex: any;
    try {
      LlamaIndex = require('llama-index');
    } catch {
      this.logger.warn(
        'The `llama-index` npm package is not installed. KeywordTableIndex strategy is unavailable. ' +
          'Run: npm install llama-index',
      );
      return {
        strategy: 'keyword',
        query: userQuery,
        topK,
        results: [],
        answer:
          'KeywordTableIndex strategy requires the `llama-index` npm package. ' +
          'Please install it with: npm install llama-index',
        durationMs: Date.now() - start,
      };
    }

    const { KeywordTableIndex } = LlamaIndex;
    const docs = this.documentsService.getAll();

    this.logger.log(`Building KeywordTableIndex (may call LLM to extract keywords) for ${docs.length} documents...`);
    const keywordIndex = await KeywordTableIndex.fromDocuments(docs);
    this.logger.log('✓ KeywordTableIndex created');

    const keywordQueryEngine = keywordIndex.asQueryEngine
      ? keywordIndex.asQueryEngine()
      : null;

    if (!keywordQueryEngine) {
      return {
        strategy: 'keyword',
        query: userQuery,
        topK,
        results: [],
        answer: 'KeywordTableIndex created but .asQueryEngine() is not supported by this SDK version.',
        durationMs: Date.now() - start,
      };
    }

    const response = await keywordQueryEngine.query(userQuery);

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
      strategy: 'keyword',
      query: userQuery,
      topK,
      results,
      answer: response.response || response.answer || '',
      durationMs: Date.now() - start,
    };
  }
}
