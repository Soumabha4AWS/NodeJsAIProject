import { PROMPT, promptTemplate } from './createPromptTemplate.js';
import { llm } from './config.js';
import { vectorStore } from './vectorDbSetup.js';
import { StringOutputParser } from '@langchain/core/output_parsers';

console.log('\n' + '='.repeat(80));
console.log('PART 7: Enhanced RAG with Answer Validation (JS)');
console.log('='.repeat(80));

function toRelevance(score) {
  // MemoryVectorStore returns a distance-like score where lower is better.
  // Convert a plausible [0..2] cosine distance to [0..1] relevance.
  if (typeof score !== 'number' || Number.isNaN(score)) return 0;
  const clamped = Math.max(0, Math.min(2, score));
  return 1 - clamped / 2; // 0 → 1.0 (best), 2 → 0.0 (worst)
}

export async function ragWithValidation(query, minSimilarityScore = 0.5) {
  const docsWithScores = await vectorStore.similaritySearchWithScore(query, 3);
  console.log(`\nQuery: ${query}`);
  console.log('\nRelevance scores (0=no match, 1=identical):');
  const pairs = docsWithScores.map(([doc, score]) => ({
    doc,
    relevance: toRelevance(score),
  }));
  pairs.forEach(({ doc, relevance }) =>
    console.log(`  - ${doc.metadata.ticket_id}: ${relevance.toFixed(4)}`)
  );

  const best = pairs[0]?.relevance ?? 0;
  if (best < minSimilarityScore) {
    console.log(`\n⚠ Best match relevance (${best.toFixed(4)}) is below threshold (${minSimilarityScore}) — too dissimilar to answer confidently`);
    return "I don't have enough relevant information in the ticket history to answer that question confidently.";
  }

  const docs = pairs.map((p) => p.doc);
  const context = docs.map((d) => d.pageContent).join('\n\n---\n\n');
  const prompt = promptTemplate
    .replace('{context}', context)
    .replace('{question}', query);
  const response = await llm.invoke(prompt);
  return new StringOutputParser().parse(response);
}
