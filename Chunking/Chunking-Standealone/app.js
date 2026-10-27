#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { Document, InMemoryStore } = require('langchain');

function printLine(text = '') {
  console.log(text);
}

function printSection(title) {
  console.log('\n' + '='.repeat(80));
  console.log(title);
  console.log('='.repeat(80));
}

function readTickets() {
  const filePath = path.join(__dirname, 'synthetic_tickets.json');
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function createDocument(ticket) {
  const fullText = [
    `Ticket ID: ${ticket.ticket_id}`,
    `Title: ${ticket.title}`,
    `Category: ${ticket.category}`,
    `Priority: ${ticket.priority}`,
    `Description: ${ticket.description}`,
    `Resolution: ${ticket.resolution}`
  ].join('\n').trim();

  return new Document({
    pageContent: fullText,
    metadata: {
      ticket_id: ticket.ticket_id,
      category: ticket.category,
      priority: ticket.priority
    }
  });
}

function createTextDocument(text, metadata = {}) {
  return new Document({ pageContent: text, metadata });
}

function tokenize(text) {
  return (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}

function createEmbedding(text) {
  const tokens = tokenize(text);
  const counts = new Map();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) || 0) + 1);
  }
  return counts;
}

function dotProduct(a, b) {
  let sum = 0;
  const keys = a instanceof Map ? a.keys() : Object.keys(a);
  for (const key of keys) {
    if (b instanceof Map ? b.has(key) : Object.prototype.hasOwnProperty.call(b, key)) {
      sum += (a instanceof Map ? a.get(key) : a[key]) * (b instanceof Map ? b.get(key) : b[key]);
    }
  }
  return sum;
}

function magnitude(vec) {
  let sum = 0;
  if (vec instanceof Map) {
    for (const value of vec.values()) {
      sum += value * value;
    }
  } else {
    for (const key of Object.keys(vec)) {
      sum += vec[key] * vec[key];
    }
  }
  return Math.sqrt(sum);
}

function cosineSimilarity(left, right) {
  const denom = magnitude(left) * magnitude(right);
  if (!denom) return 0;
  return dotProduct(left, right) / denom;
}

function splitByFixedSize(text, chunkSize, chunkOverlap) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + chunkSize);
    const chunk = text.slice(start, end);
    chunks.push(chunk);
    if (end >= text.length) break;
    start += chunkSize - chunkOverlap;
  }
  return chunks;
}

function splitTextRecursive(text, separators, chunkSize, chunkOverlap) {
  const normalized = text.trim();
  if (!normalized) return [];

  for (const separator of separators) {
    const parts = normalized.split(separator);
    const filtered = parts.map(part => part.trim()).filter(Boolean);
    if (filtered.length > 1) {
      const combined = [];
      for (const part of filtered) {
        if (part.length <= chunkSize) {
          combined.push(part);
        } else {
          combined.push(...splitTextRecursive(part, separators.slice(separators.indexOf(separator) + 1), chunkSize, chunkOverlap));
        }
      }
      return combined;
    }
  }

  return splitByFixedSize(normalized, chunkSize, chunkOverlap);
}

function splitMarkdown(text) {
  const lines = text.split(/\r?\n/);
  const chunks = [];
  let currentHeader = null;
  let currentContent = [];

  const flush = () => {
    if (!currentHeader && currentContent.length === 0) return;
    const content = currentContent.join('\n').trim();
    if (content) {
      chunks.push(createTextDocument(content, currentHeader ? { header: currentHeader } : {}));
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

function splitHtml(text) {
  const chunks = [];
  const tagPattern = /<(h([1-3]))[^>]*>(.*?)<\/\1>/gi;
  let match;
  while ((match = tagPattern.exec(text)) !== null) {
    const headerLevel = match[2];
    const headerText = match[3].replace(/<[^>]+>/g, '').trim();
    const start = match.index + match[0].length;
    const nextMatch = tagPattern.exec(text);
    const end = nextMatch ? nextMatch.index : text.length;
    const block = text.slice(start, end).trim();
    chunks.push(createTextDocument(`${headerText}\n${block}`.trim(), { header: `${headerLevel}:${headerText}` }));
    tagPattern.lastIndex = nextMatch ? nextMatch.index : text.length;
  }
  return chunks;
}

function filterDocuments(docs, filter) {
  if (!filter) return docs;
  return docs.filter(item => {
    const metadata = item.metadata ?? item.doc?.metadata ?? {};
    return Object.entries(filter).every(([key, value]) => metadata[key] === value);
  });
}

class LangChainVectorStore {
  constructor(documents, store) {
    this.items = documents.map(doc => ({
      doc,
      embedding: createEmbedding(doc.pageContent)
    }));
    this.store = store;
  }

  similaritySearch(query, k = 3, filter = null) {
    const queryEmbedding = createEmbedding(query);
    const filtered = filterDocuments(this.items, filter);
    const scored = filtered
      .map(item => ({
        doc: item.doc,
        score: cosineSimilarity(queryEmbedding, item.embedding)
      }))
      .sort((left, right) => right.score - left.score);
    return scored.slice(0, k).map(item => item.doc);
  }

  maxMarginalRelevanceSearch(query, k = 3, filter = null) {
    const queryEmbedding = createEmbedding(query);
    const filtered = filterDocuments(this.items, filter);
    const selected = [];
    const remaining = filtered.slice();

    while (selected.length < Math.min(k, remaining.length)) {
      let bestIndex = -1;
      let bestScore = -Infinity;

      for (let index = 0; index < remaining.length; index += 1) {
        const candidate = remaining[index];
        const relevance = cosineSimilarity(queryEmbedding, candidate.embedding);
        let diversityPenalty = 0;
        for (const selectedItem of selected) {
          diversityPenalty = Math.max(diversityPenalty, cosineSimilarity(candidate.embedding, selectedItem.embedding));
        }
        const score = relevance - (0.2 * diversityPenalty);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = index;
        }
      }

      if (bestIndex === -1) break;
      selected.push(remaining.splice(bestIndex, 1)[0]);
    }

    return selected.map(item => item.doc);
  }
}

async function buildStoreFromDocuments(docs, collectionName) {
  const store = new InMemoryStore();
  const entries = docs.map((doc, index) => [`doc-${index + 1}`, doc]);
  await store.mset(entries);
  return { collectionName, docs, store: new LangChainVectorStore(docs, store) };
}

async function main() {
  printSection('MODULE 2: CHUNKING & VECTOR STORES');
  const tickets = readTickets();
  printLine(`Loaded ${tickets.length} support tickets`);

  printSection('PART 1: Chunking Strategies');
  const documents = tickets.map(createDocument);
  printLine(`Created ${documents.length} documents`);
  printLine(`Sample document length: ${documents[0].pageContent.length} characters`);

  printLine('\n--- Strategy 1: Fixed-Size Chunking ---');
  const fixedChunks = documents.map(doc => createTextDocument(splitByFixedSize(doc.pageContent, 200, 20).join('\n---\n'), doc.metadata));
  printLine(`✓ Created ${fixedChunks.length} chunks`);
  printLine(`Chunk size: 200 chars, Overlap: 20 chars`);
  printLine(`Sample chunk: ${fixedChunks[0].pageContent.slice(0, 100)}...`);

  printLine('\n--- Strategy 2: Recursive Character Splitting ---');
  const recursiveChunks = documents.map(doc => createTextDocument(splitTextRecursive(doc.pageContent, ['\n\n', '\n', '. ', ' '], 300, 50).join('\n---\n'), doc.metadata));
  printLine(`✓ Created ${recursiveChunks.length} chunks`);
  printLine(`Sample chunk: ${recursiveChunks[0].pageContent.slice(0, 100)}...`);

  printLine('\n--- Strategy 3: Semantic Chunking ---');
  const demoParagraph = [
    'The Mars rover collected soil samples from the Jezero crater last week. Scientists believe these rocks may contain signs of ancient microbial life. NASA plans to retrieve these samples in a future mission.',
    "Grandma's apple pie recipe starts with peeling six large Granny Smith apples. Mix flour, sugar, and cinnamon for the filling. Roll the dough thin and crimp the edges carefully.",
    'The defendant was charged with breach of contract under Section 12. The plaintiff seeks damages of fifty thousand dollars plus legal fees. Both parties agreed to mediation before proceeding to trial.'
  ].join('\n\n');
  const semanticChunks = demoParagraph
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((content, index) => createTextDocument(content.trim(), { chunk_index: index + 1 }));
  printLine(`✓ Created ${semanticChunks.length} chunks`);
  semanticChunks.forEach((chunk, index) => {
    printLine(`\nChunk ${index + 1}: ${chunk.pageContent.slice(0, 80)}...`);
  });

  printLine('\n--- Strategy 4: Markdown Header Splitting ---');
  const markdownDoc = `# Database Troubleshooting Guide\n\n## Connection Issues\n\n### Timeout Errors\nIf you encounter timeout errors, check the connection string and ensure the database server is reachable.\n\n### Authentication Failures\nVerify your credentials are correct.\n\n## Performance Problems\n\n### Slow Queries\nAnalyze query execution plans using EXPLAIN.\n`;
  const markdownChunks = splitMarkdown(markdownDoc);
  printLine(`✓ Created ${markdownChunks.length} chunks from markdown`);
  if (markdownChunks.length) {
    printLine(`Sample chunk: ${markdownChunks[0].pageContent.slice(0, 80)}...`);
    printLine(`Metadata: ${JSON.stringify(markdownChunks[0].metadata)}`);
  }

  printLine('\n--- Strategy 5: HTML Header Splitting ---');
  const htmlDoc = `<!DOCTYPE html><html><body><h1>Email Configuration Guide</h1><h2>SMTP Settings</h2><p>Configure your SMTP server settings in the admin panel.</p><h2>IMAP Configuration</h2><p>Set up IMAP to sync your emails across devices.</p></body></html>`;
  const htmlChunks = splitHtml(htmlDoc);
  printLine(`✓ Created ${htmlChunks.length} chunks from HTML`);
  if (htmlChunks.length) {
    printLine(`Sample chunk: ${htmlChunks[0].pageContent.slice(0, 80)}...`);
    printLine(`Metadata: ${JSON.stringify(htmlChunks[0].metadata)}`);
  }

  printLine('\n--- Strategy 6: Whole Documents (No Chunking) ---');
  printLine(`✓ Using ${documents.length} whole documents`);

  printSection('PART 2: Chroma Vector Store');
  const query = 'Authentication problems after password reset';
  printLine(`Building vector store for query: ${query}`);
  const { store } = await buildStoreFromDocuments(documents, 'ticket-collection');
  const results = store.similaritySearch(query, 3);
  printLine('\nTop results:');
  results.forEach((doc, index) => {
    printLine(`\n#${index + 1}`);
    printLine(`Ticket: ${doc.metadata.ticket_id}`);
    printLine(`Category: ${doc.metadata.category}`);
  });

  printLine('\n--- Using MMR for Diverse Results ---');
  const mmrResults = store.maxMarginalRelevanceSearch(query, 3);
  printLine('MMR Results (more diverse):');
  mmrResults.forEach((doc, index) => {
    printLine(`\n#${index + 1}`);
    printLine(`Ticket: ${doc.metadata.ticket_id}`);
    printLine(`Title: ${tickets.find(ticket => ticket.ticket_id === doc.metadata.ticket_id)?.title || 'Unknown'}`);
  });

  printSection('PART 3: Metadata Filtering');
  printLine("\nSearching only in 'Authentication' category:");
  const filteredResults = store.similaritySearch(query, 3, { category: 'Authentication' });
  filteredResults.forEach((doc, index) => {
    printLine(`\n#${index + 1}`);
    printLine(`Ticket: ${doc.metadata.ticket_id}`);
    printLine(`Category: ${doc.metadata.category}`);
    printLine(`Content: ${doc.pageContent.slice(0, 100)}...`);
  });

  printLine('\n\nSearching only High priority tickets:');
  const highPriorityResults = store.similaritySearch('Database performance issues', 3, { priority: 'High' });
  highPriorityResults.forEach((doc, index) => {
    printLine(`\n#${index + 1}`);
    printLine(`Ticket: ${doc.metadata.ticket_id}`);
    printLine(`Priority: ${doc.metadata.priority}`);
  });

  printSection('PART 4: Evaluating Chunking Strategies');
  printLine('Building vector stores with different chunking strategies...');
  const stores = [
    ['Whole Documents', new LangChainVectorStore(documents)],
    ['Fixed Chunks', new LangChainVectorStore(fixedChunks)],
    ['Recursive Chunks', new LangChainVectorStore(recursiveChunks)]
  ];
  const testQuery = 'Database connection failures';
  printLine(`\nTest query: ${testQuery}`);
  for (const [name, chunkStore] of stores) {
    const resultsForStrategy = chunkStore.similaritySearch(testQuery, 1);
    printLine(`\n${name}:`);
    if (resultsForStrategy.length) {
      printLine(`Top result: ${resultsForStrategy[0].pageContent.slice(0, 100)}...`);
      printLine(`Length: ${resultsForStrategy[0].pageContent.length} chars`);
    }
  }

  printSection('DEMO COMPLETE!');
  printLine('KEY TAKEAWAYS:');
  printLine('1. Chunking is crucial for long documents.');
  printLine('2. Metadata filtering narrows search results quickly.');
  printLine('3. Experiment with chunking strategies for your own dataset.');
  printLine('');
  printLine('Next: Module 3 - Indexing Strategies');
}

main().catch(error => {
  console.error('Error running app:', error);
  process.exit(1);
});
