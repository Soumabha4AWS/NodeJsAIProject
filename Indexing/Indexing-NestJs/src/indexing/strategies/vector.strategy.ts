import { Injectable, Logger } from '@nestjs/common';
import { OpenAiService } from '../../common/openai.service';
import { DocumentsService } from '../../documents/documents.service';
import { TicketDocument } from '../../documents/ticket-document.interface';
import { IndexResult, QueryResponse } from '../interfaces/query-response.interface';

interface VectorEntry {
  id: string;
  text: string;
  metadata: TicketDocument['metadata'];
  vector: number[];
}

@Injectable()
export class VectorStrategy {
  private readonly logger = new Logger(VectorStrategy.name);

  constructor(
    private readonly openAiService: OpenAiService,
    private readonly documentsService: DocumentsService,
  ) {}

  // ─── Math helpers ────────────────────────────────────────────────────────────

  private dot(a: number[], b: number[]): number {
    return a.reduce((sum, val, i) => sum + val * b[i], 0);
  }

  private magnitude(a: number[]): number {
    return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    return this.dot(a, b) / (this.magnitude(a) * this.magnitude(b) + 1e-12);
  }

  // ─── Index building ──────────────────────────────────────────────────────────

  /**
   * Embed all documents into in-memory vector entries.
   * Port of buildIndex() from vector-index.js
   */
  private async buildIndex(docs: TicketDocument[]): Promise<VectorEntry[]> {
    const index: VectorEntry[] = [];
    for (const doc of docs) {
      const vector = await this.openAiService.embedText(doc.text);
      index.push({ id: doc.id, text: doc.text, metadata: doc.metadata, vector });
    }
    return index;
  }

  /**
   * Score and rank documents by cosine similarity to the query.
   * Port of retrieve() from vector-index.js
   */
  private async retrieve(
    index: VectorEntry[],
    query: string,
    topK: number,
  ): Promise<Array<VectorEntry & { score: number }>> {
    const queryVec = await this.openAiService.embedText(query);
    const scored = index.map((item) => ({
      ...item,
      score: this.cosineSimilarity(queryVec, item.vector),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK);
  }

  /**
   * Synthesize an LLM answer from retrieved documents.
   * Port of synthesizeAnswer() from vector-index.js
   */
  private async synthesizeAnswer(
    retrieved: Array<VectorEntry & { score: number }>,
    query: string,
  ): Promise<string> {
    const context = retrieved
      .map((r, i) => `Document ${i + 1} (ID: ${r.id}):\n${r.text}\n`)
      .join('\n');

    const prompt = [
      'You are a helpful assistant. Use the following documents to answer the query.',
      '',
      'Documents:',
      context,
      `Query: ${query}`,
      'Provide a concise answer and cite document IDs when appropriate.',
    ].join('\n');

    return this.openAiService.chatCompletion(prompt, 512);
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /**
   * Run the full vector retrieval + LLM synthesis pipeline.
   */
  async query(userQuery: string, topK: number): Promise<QueryResponse> {
    const start = Date.now();
    const docs = this.documentsService.getAll();

    this.logger.log(`Building in-memory vector index for ${docs.length} documents...`);
    const index = await this.buildIndex(docs);
    this.logger.log('✓ Vector index built');

    const retrieved = await this.retrieve(index, userQuery, topK);

    const results: IndexResult[] = retrieved.map((r) => ({
      id: r.id,
      score: parseFloat(r.score.toFixed(4)),
      text: r.text,
      metadata: r.metadata,
    }));

    this.logger.log('Synthesizing answer with LLM...');
    const answer = await this.synthesizeAnswer(retrieved, userQuery);

    return {
      strategy: 'vector',
      query: userQuery,
      topK,
      results,
      answer,
      durationMs: Date.now() - start,
    };
  }
}
