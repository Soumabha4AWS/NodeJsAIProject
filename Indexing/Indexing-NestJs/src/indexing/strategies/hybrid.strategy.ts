import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../../common/openai.service';
import { DocumentsService } from '../../documents/documents.service';
import { TicketDocument } from '../../documents/ticket-document.interface';
import { IndexResult, QueryResponse } from '../interfaces/query-response.interface';

@Injectable()
export class HybridStrategy {
  private readonly logger = new Logger(HybridStrategy.name);

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ─── Vector helpers (same as VectorStrategy) ─────────────────────────────────

  private dot(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private magnitude(a: number[]): number {
    return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    return this.dot(a, b) / (this.magnitude(a) * this.magnitude(b) + 1e-12);
  }

  private async vectorRetrieve(
    docs: TicketDocument[],
    query: string,
    topK: number,
  ): Promise<Array<{ id: string; text: string; metadata: TicketDocument['metadata']; score: number }>> {
    const vectors = await Promise.all(docs.map((d) => this.openAiService.embedText(d.text)));
    const queryVec = await this.openAiService.embedText(query);

    const scored = docs.map((doc, i) => ({
      id: doc.id,
      text: doc.text,
      metadata: doc.metadata,
      score: this.cosineSimilarity(queryVec, vectors[i]),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  // ─── Keyword helpers (simple TF-based fallback) ──────────────────────────────

  /**
   * Tokenize text into lowercase words, strip punctuation.
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  }

  /**
   * Simple BM25-inspired keyword retrieval using term-frequency overlap.
   * Used when llama-index is not available.
   */
  private keywordRetrieve(
    docs: TicketDocument[],
    query: string,
    topK: number,
  ): Array<{ id: string; text: string; metadata: TicketDocument['metadata']; score: number }> {
    const queryTokens = new Set(this.tokenize(query));

    const scored = docs.map((doc) => {
      const docTokens = this.tokenize(doc.text);
      const matchCount = docTokens.filter((t) => queryTokens.has(t)).length;
      const score = matchCount / (docTokens.length + 1);
      return { id: doc.id, text: doc.text, metadata: doc.metadata, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  // ─── LlamaIndex hybrid (optional) ────────────────────────────────────────────

  private async llamaIndexHybrid(
    docs: TicketDocument[],
    query: string,
    topK: number,
  ): Promise<Array<{ id: string; text: string; metadata: TicketDocument['metadata']; score?: number }> | null> {
    let LlamaIndex: any;
    try {
      LlamaIndex = require('llama-index');
    } catch {
      return null; // Package not available, use fallback
    }

    const { VectorStoreIndex, KeywordTableIndex } = LlamaIndex;

    this.logger.log('Building LlamaIndex Vector + Keyword indexes...');
    const [vectorIndex, keywordIndex] = await Promise.all([
      VectorStoreIndex.fromDocuments(docs),
      KeywordTableIndex.fromDocuments(docs),
    ]);

    const vectorRetriever = vectorIndex.asRetriever
      ? vectorIndex.asRetriever({ similarityTopK: topK + 2 })
      : null;
    const keywordRetriever = keywordIndex.asRetriever
      ? keywordIndex.asRetriever()
      : null;

    const [vectorNodes, keywordNodes] = await Promise.all([
      vectorRetriever ? vectorRetriever.retrieve(query) : [],
      keywordRetriever ? keywordRetriever.retrieve(query) : [],
    ]);

    // Simple union fusion by ticket_id (same as hybrid-index.js)
    const seen = new Set<string>();
    const hybridNodes: any[] = [];

    for (const node of [...(vectorNodes || []), ...(keywordNodes || [])]) {
      const id = node?.metadata?.ticket_id || node?.node_id || JSON.stringify(node);
      if (!seen.has(id)) {
        seen.add(id);
        hybridNodes.push(node);
      }
    }

    return hybridNodes.slice(0, topK).map((node: any) => ({
      id: node.metadata?.ticket_id || node.node_id || 'unknown',
      text: String(node.text || node.content || ''),
      metadata: {
        ticket_id: node.metadata?.ticket_id || 'unknown',
        category: node.metadata?.category || '',
        priority: node.metadata?.priority || '',
        title: node.metadata?.title || '',
      },
      score: node.score,
    }));
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Run hybrid retrieval: union of vector + keyword results with deduplication.
   * Port of hybrid-index.js — uses LlamaIndex when available, custom fallback otherwise.
   */
  async query(userQuery: string, topK: number): Promise<QueryResponse> {
    const start = Date.now();
    const docs = this.documentsService.getAll();

    // Try LlamaIndex-based hybrid first
    const llamaResults = await this.llamaIndexHybrid(docs, userQuery, topK);

    let results: IndexResult[];

    if (llamaResults) {
      this.logger.log('✓ Hybrid retrieval via LlamaIndex');
      results = llamaResults.map((r) => ({
        id: r.id,
        score: r.score ? parseFloat(r.score.toFixed(4)) : undefined,
        text: r.text,
        metadata: r.metadata as IndexResult['metadata'],
      }));
    } else {
      // Fallback: custom vector + keyword union
      this.logger.log('LlamaIndex not available — using custom vector + keyword fusion fallback');

      const [vectorHits, keywordHits] = await Promise.all([
        this.vectorRetrieve(docs, userQuery, topK + 2),
        Promise.resolve(this.keywordRetrieve(docs, userQuery, topK + 2)),
      ]);

      // Union by ticket_id
      const seen = new Set<string>();
      const merged: typeof vectorHits = [];

      for (const item of [...vectorHits, ...keywordHits]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }

      results = merged.slice(0, topK).map((r) => ({
        id: r.id,
        score: parseFloat(r.score.toFixed(4)),
        text: r.text,
        metadata: r.metadata,
      }));
    }

    return {
      strategy: 'hybrid',
      query: userQuery,
      topK,
      results,
      durationMs: Date.now() - start,
    };
  }
}
