import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TicketsService } from '../tickets/tickets.service';
import { Ticket } from '../tickets/interfaces/ticket.interface';
import {
  cosineSimilarity,
  topKIndices,
  sampleRandomIndices,
} from '../shared/math.utils';

export interface SearchResult {
  rank: number;
  ticket: Ticket;
  similarity: number;
}

export interface AnalysisResult {
  query: string;
  selected_indices: number[];
  similarity_matrix: number[][];
  query_similarities: number[];
}

@Injectable()
export class EmbeddingsService implements OnModuleInit {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly client: OpenAI;
  private readonly embeddingModel: string;
  private readonly embeddingDim: number;

  /** In-memory cache: populated once on first search call */
  private ticketEmbeddings: number[][] | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly ticketsService: TicketsService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error(
        'Missing OPENAI_API_KEY. Set it in your .env file.',
      );
    }
    this.client = new OpenAI({ apiKey });
    this.embeddingModel = this.configService.get<string>(
      'EMBEDDING_MODEL',
      'text-embedding-3-small',
    );
    this.embeddingDim = this.configService.get<number>('EMBEDDING_DIM', 1536);
  }

  async onModuleInit(): Promise<void> {
    this.logger.log(`Using OpenAI model: ${this.embeddingModel}`);
    this.logger.log(`Embedding dimension: ${this.embeddingDim}`);
  }

  // ─── Core OpenAI call ────────────────────────────────────────────────────────

  async embedTexts(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: texts,
    });
    return response.data.map((item) => item.embedding);
  }

  // ─── Ticket embedding cache ───────────────────────────────────────────────────

  private async getTicketEmbeddings(): Promise<number[][]> {
    if (this.ticketEmbeddings) {
      return this.ticketEmbeddings;
    }

    const tickets = this.ticketsService.getAll();
    this.logger.log(
      `Computing embeddings for ${tickets.length} tickets (one-time, cached)...`,
    );
    const texts = tickets.map((t) => `${t.title}. ${t.description}`);
    this.ticketEmbeddings = await this.embedTexts(texts);
    this.logger.log(
      `✓ Cached embeddings: [${this.ticketEmbeddings.length}, ${this.embeddingDim}]`,
    );
    return this.ticketEmbeddings;
  }

  // ─── Public API ──────────────────────────────────────────────────────────────

  /** Semantic search: finds the top-K tickets most similar to `query`. */
  async search(query: string, topK = 5): Promise<SearchResult[]> {
    const tickets = this.ticketsService.getAll();
    const embeddings = await this.getTicketEmbeddings();

    const [queryEmbedding] = await this.embedTexts([query]);
    const similarities = embeddings.map((emb) =>
      cosineSimilarity(queryEmbedding, emb),
    );

    const indices = topKIndices(similarities, topK);
    return indices.map((idx, rank) => ({
      rank: rank + 1,
      ticket: tickets[idx],
      similarity: parseFloat(similarities[idx].toFixed(6)),
    }));
  }

  /** Batch search: runs multiple queries in parallel and returns results per query. */
  async batchSearch(
    queries: string[],
  ): Promise<Record<string, SearchResult[]>> {
    const results = await Promise.all(
      queries.map(async (q) => ({ query: q, results: await this.search(q, 1) })),
    );
    return Object.fromEntries(results.map((r) => [r.query, r.results]));
  }

  /**
   * Generates a similarity analysis: picks the top-5 results for a fixed query
   * plus 5 random tickets and returns the full pairwise similarity matrix.
   */
  async getSimilarityAnalysis(
    query = "Users can't login after changing password",
  ): Promise<AnalysisResult> {
    const tickets = this.ticketsService.getAll();
    const embeddings = await this.getTicketEmbeddings();

    const [queryEmbedding] = await this.embedTexts([query]);
    const similarities = embeddings.map((emb) =>
      cosineSimilarity(queryEmbedding, emb),
    );

    const topIndices = topKIndices(similarities, 5);
    const selectedIndices = [
      ...topIndices,
      ...sampleRandomIndices(5, tickets.length, topIndices),
    ];

    const similarityMatrix = selectedIndices.map((i) =>
      selectedIndices.map((j) => cosineSimilarity(embeddings[i], embeddings[j])),
    );

    return {
      query,
      selected_indices: selectedIndices,
      similarity_matrix: similarityMatrix,
      query_similarities: selectedIndices.map((i) =>
        parseFloat(similarities[i].toFixed(6)),
      ),
    };
  }

  /** Returns model info useful for health-checks. */
  getModelInfo() {
    return {
      model: this.embeddingModel,
      dimension: this.embeddingDim,
      ticketCount: this.ticketsService.getAll().length,
      embeddingsCached: this.ticketEmbeddings !== null,
    };
  }
}
