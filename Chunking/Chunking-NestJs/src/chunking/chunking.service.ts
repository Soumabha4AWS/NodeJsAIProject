import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Ticket {
  ticket_id: string;
  title: string;
  category: string;
  priority: string;
  description: string;
  resolution: string;
}

export interface Document {
  pageContent: string;
  metadata: Record<string, unknown>;
}

type EmbeddingMap = Map<string, number>;

// ─── In-memory Vector Store ───────────────────────────────────────────────────

interface VectorItem {
  doc: Document;
  embedding: EmbeddingMap;
}

function tokenize(text: string): string[] {
  return (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function createEmbedding(text: string): EmbeddingMap {
  const tokens = tokenize(text);
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function dotProduct(a: EmbeddingMap, b: EmbeddingMap): number {
  let sum = 0;
  for (const [key, val] of a) {
    if (b.has(key)) sum += val * b.get(key)!;
  }
  return sum;
}

function magnitude(vec: EmbeddingMap): number {
  let sum = 0;
  for (const value of vec.values()) sum += value * value;
  return Math.sqrt(sum);
}

function cosineSimilarity(left: EmbeddingMap, right: EmbeddingMap): number {
  const denom = magnitude(left) * magnitude(right);
  if (!denom) return 0;
  return dotProduct(left, right) / denom;
}

export class LangChainVectorStore {
  private items: VectorItem[];

  constructor(documents: Document[]) {
    this.items = documents.map((doc) => ({
      doc,
      embedding: createEmbedding(doc.pageContent),
    }));
  }

  similaritySearch(
    query: string,
    k = 3,
    filter: Record<string, unknown> | null = null,
  ): Document[] {
    const queryEmbedding = createEmbedding(query);
    const filtered = this.filterDocuments(filter);
    return filtered
      .map((item) => ({
        doc: item.doc,
        score: cosineSimilarity(queryEmbedding, item.embedding),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map((item) => item.doc);
  }

  maxMarginalRelevanceSearch(
    query: string,
    k = 3,
    filter: Record<string, unknown> | null = null,
  ): Document[] {
    const queryEmbedding = createEmbedding(query);
    const filtered = this.filterDocuments(filter);
    const selected: VectorItem[] = [];
    const remaining = [...filtered];

    while (selected.length < Math.min(k, remaining.length)) {
      let bestIndex = -1;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = cosineSimilarity(queryEmbedding, candidate.embedding);
        let diversityPenalty = 0;
        for (const sel of selected) {
          diversityPenalty = Math.max(
            diversityPenalty,
            cosineSimilarity(candidate.embedding, sel.embedding),
          );
        }
        const score = relevance - 0.2 * diversityPenalty;
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestIndex === -1) break;
      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected.map((item) => item.doc);
  }

  private filterDocuments(
    filter: Record<string, unknown> | null,
  ): VectorItem[] {
    if (!filter) return this.items;
    return this.items.filter((item) =>
      Object.entries(filter).every(
        ([key, value]) => item.doc.metadata[key] === value,
      ),
    );
  }
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);

  // ── Helpers ──────────────────────────────────────────────────────────────

  readTickets(): Ticket[] {
    const filePath = path.join(__dirname, '..', '..', 'assets', 'synthetic_tickets.json');
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as Ticket[];
  }

  createDocument(ticket: Ticket): Document {
    const fullText = [
      `Ticket ID: ${ticket.ticket_id}`,
      `Title: ${ticket.title}`,
      `Category: ${ticket.category}`,
      `Priority: ${ticket.priority}`,
      `Description: ${ticket.description}`,
      `Resolution: ${ticket.resolution}`,
    ]
      .join('\n')
      .trim();

    return {
      pageContent: fullText,
      metadata: {
        ticket_id: ticket.ticket_id,
        category: ticket.category,
        priority: ticket.priority,
      },
    };
  }

  createTextDocument(
    text: string,
    metadata: Record<string, unknown> = {},
  ): Document {
    return { pageContent: text, metadata };
  }

  // ── Chunking Strategies ──────────────────────────────────────────────────

  splitByFixedSize(
    text: string,
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const chunks: string[] = [];
    let start = 0;
    while (start < text.length) {
      const end = Math.min(text.length, start + chunkSize);
      chunks.push(text.slice(start, end));
      if (end >= text.length) break;
      start += chunkSize - chunkOverlap;
    }
    return chunks;
  }

  splitTextRecursive(
    text: string,
    separators: string[],
    chunkSize: number,
    chunkOverlap: number,
  ): string[] {
    const normalized = text.trim();
    if (!normalized) return [];

    for (const separator of separators) {
      const parts = normalized
        .split(separator)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length > 1) {
        const combined: string[] = [];
        for (const part of parts) {
          if (part.length <= chunkSize) {
            combined.push(part);
          } else {
            combined.push(
              ...this.splitTextRecursive(
                part,
                separators.slice(separators.indexOf(separator) + 1),
                chunkSize,
                chunkOverlap,
              ),
            );
          }
        }
        return combined;
      }
    }

    return this.splitByFixedSize(normalized, chunkSize, chunkOverlap);
  }

  splitMarkdown(text: string): Document[] {
    const lines = text.split(/\r?\n/);
    const chunks: Document[] = [];
    let currentHeader: string | null = null;
    let currentContent: string[] = [];

    const flush = () => {
      if (!currentHeader && currentContent.length === 0) return;
      const content = currentContent.join('\n').trim();
      if (content) {
        chunks.push(
          this.createTextDocument(
            content,
            currentHeader ? { header: currentHeader } : {},
          ),
        );
      }
      currentContent = [];
    };

    for (const line of lines) {
      const match = line.match(/^(#{1,6})\s+(.*)$/);
      if (match) {
        flush();
        currentHeader = match[2].trim();
        currentContent.push(line);
      } else if (line.trim()) {
        currentContent.push(line);
      }
    }

    flush();
    return chunks;
  }

  splitHtml(text: string): Document[] {
    const chunks: Document[] = [];
    const tagPattern = /<(h([1-3]))[^>]*>(.*?)<\/\1>/gi;
    let match: RegExpExecArray | null;

    while ((match = tagPattern.exec(text)) !== null) {
      const headerLevel = match[2];
      const headerText = match[3].replace(/<[^>]+>/g, '').trim();
      const start = match.index + match[0].length;
      const nextMatch = tagPattern.exec(text);
      const end = nextMatch ? nextMatch.index : text.length;
      const block = text.slice(start, end).trim();
      chunks.push(
        this.createTextDocument(`${headerText}\n${block}`.trim(), {
          header: `${headerLevel}:${headerText}`,
        }),
      );
      tagPattern.lastIndex = nextMatch ? nextMatch.index : text.length;
    }

    return chunks;
  }

  // ── Main Demo ─────────────────────────────────────────────────────────────

  async runDemo(): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};

    // Load tickets
    const tickets = this.readTickets();
    const documents = tickets.map((t) => this.createDocument(t));
    result['ticketsLoaded'] = tickets.length;
    result['documentsCreated'] = documents.length;

    // Strategy 1: Fixed-Size Chunking
    const fixedChunks = documents.map((doc) =>
      this.createTextDocument(
        this.splitByFixedSize(doc.pageContent, 200, 20).join('\n---\n'),
        doc.metadata,
      ),
    );
    result['fixedChunks'] = {
      count: fixedChunks.length,
      sample: fixedChunks[0]?.pageContent.slice(0, 100),
    };

    // Strategy 2: Recursive Character Splitting
    const recursiveChunks = documents.map((doc) =>
      this.createTextDocument(
        this.splitTextRecursive(
          doc.pageContent,
          ['\n\n', '\n', '. ', ' '],
          300,
          50,
        ).join('\n---\n'),
        doc.metadata,
      ),
    );
    result['recursiveChunks'] = {
      count: recursiveChunks.length,
      sample: recursiveChunks[0]?.pageContent.slice(0, 100),
    };

    // Strategy 3: Semantic Chunking
    const demoParagraph = [
      'The Mars rover collected soil samples from the Jezero crater last week. Scientists believe these rocks may contain signs of ancient microbial life. NASA plans to retrieve these samples in a future mission.',
      "Grandma's apple pie recipe starts with peeling six large Granny Smith apples. Mix flour, sugar, and cinnamon for the filling. Roll the dough thin and crimp the edges carefully.",
      'The defendant was charged with breach of contract under Section 12. The plaintiff seeks damages of fifty thousand dollars plus legal fees. Both parties agreed to mediation before proceeding to trial.',
    ].join('\n\n');
    const semanticChunks = demoParagraph
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((content, index) =>
        this.createTextDocument(content.trim(), { chunk_index: index + 1 }),
      );
    result['semanticChunks'] = {
      count: semanticChunks.length,
      chunks: semanticChunks.map((c) => c.pageContent.slice(0, 80)),
    };

    // Strategy 4: Markdown Header Splitting
    const markdownDoc = `# Database Troubleshooting Guide\n\n## Connection Issues\n\n### Timeout Errors\nIf you encounter timeout errors, check the connection string and ensure the database server is reachable.\n\n### Authentication Failures\nVerify your credentials are correct.\n\n## Performance Problems\n\n### Slow Queries\nAnalyze query execution plans using EXPLAIN.\n`;
    const markdownChunks = this.splitMarkdown(markdownDoc);
    result['markdownChunks'] = {
      count: markdownChunks.length,
      sample: markdownChunks[0]?.pageContent.slice(0, 80),
      sampleMetadata: markdownChunks[0]?.metadata,
    };

    // Strategy 5: HTML Header Splitting
    const htmlDoc = `<!DOCTYPE html><html><body><h1>Email Configuration Guide</h1><h2>SMTP Settings</h2><p>Configure your SMTP server settings in the admin panel.</p><h2>IMAP Configuration</h2><p>Set up IMAP to sync your emails across devices.</p></body></html>`;
    const htmlChunks = this.splitHtml(htmlDoc);
    result['htmlChunks'] = {
      count: htmlChunks.length,
      sample: htmlChunks[0]?.pageContent.slice(0, 80),
      sampleMetadata: htmlChunks[0]?.metadata,
    };

    // Strategy 6: Whole Documents
    result['wholeDocuments'] = { count: documents.length };

    // Part 2: Vector Store - Similarity Search
    const query = 'Authentication problems after password reset';
    const store = new LangChainVectorStore(documents);
    const similarityResults = store.similaritySearch(query, 3);
    result['similaritySearch'] = similarityResults.map((doc) => ({
      ticket_id: doc.metadata['ticket_id'],
      category: doc.metadata['category'],
    }));

    // MMR
    const mmrResults = store.maxMarginalRelevanceSearch(query, 3);
    result['mmrSearch'] = mmrResults.map((doc) => ({
      ticket_id: doc.metadata['ticket_id'],
      title:
        tickets.find((t) => t.ticket_id === doc.metadata['ticket_id'])?.title ||
        'Unknown',
    }));

    // Part 3: Metadata Filtering
    const filteredResults = store.similaritySearch(query, 3, {
      category: 'Authentication',
    });
    result['filteredByAuthentication'] = filteredResults.map((doc) => ({
      ticket_id: doc.metadata['ticket_id'],
      category: doc.metadata['category'],
      preview: doc.pageContent.slice(0, 100),
    }));

    const highPriorityResults = store.similaritySearch(
      'Database performance issues',
      3,
      { priority: 'High' },
    );
    result['filteredByHighPriority'] = highPriorityResults.map((doc) => ({
      ticket_id: doc.metadata['ticket_id'],
      priority: doc.metadata['priority'],
    }));

    // Part 4: Evaluate Chunking Strategies
    const stores: [string, LangChainVectorStore][] = [
      ['Whole Documents', new LangChainVectorStore(documents)],
      ['Fixed Chunks', new LangChainVectorStore(fixedChunks)],
      ['Recursive Chunks', new LangChainVectorStore(recursiveChunks)],
    ];
    const testQuery = 'Database connection failures';
    result['strategyComparison'] = stores.map(([name, s]) => {
      const res = s.similaritySearch(testQuery, 1);
      return {
        strategy: name,
        topResult: res[0]?.pageContent.slice(0, 100),
        length: res[0]?.pageContent.length,
      };
    });

    this.logger.log('Demo completed successfully');
    return result;
  }
}
