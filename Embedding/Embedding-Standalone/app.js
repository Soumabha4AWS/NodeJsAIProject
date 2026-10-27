import fs from 'fs/promises';
import path from 'path';
import 'dotenv/config';
import OpenAI from 'openai';

const OPENAI_API_KEY = "";
if (!OPENAI_API_KEY) {
  throw new Error(
    'Missing OPENAI_API_KEY. Set it in your environment or in a .env file.'
  );
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });
const EMBEDDING_MODEL = 'text-embedding-3-small';
const EMBEDDING_DIM = 1536;

function dotProduct(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function vectorNorm(a) {
  return Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
}

function cosineSimilarity(a, b) {
  const numerator = dotProduct(a, b);
  const denominator = vectorNorm(a) * vectorNorm(b);
  return denominator === 0 ? 0 : numerator / denominator;
}

function topKIndices(values, k) {
  return values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, k)
    .map(item => item.index);
}

function sampleRandomIndices(count, total, exclude) {
  const available = Array.from({ length: total }, (_, i) => i).filter(
    index => !exclude.includes(index)
  );
  const selected = [];
  while (selected.length < Math.min(count, available.length)) {
    const randomIndex = Math.floor(Math.random() * available.length);
    selected.push(available.splice(randomIndex, 1)[0]);
  }
  return selected;
}

async function loadTickets() {
  const filePath = path.join(process.cwd(), 'synthetic_tickets.json');
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function embedTexts(texts) {
  const response = await client.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map(item => item.embedding);
}

async function main() {
  console.log('Initializing OpenAI client...');
  console.log(`Using OpenAI model: ${EMBEDDING_MODEL}`);
  console.log(`Embedding dimension: ${EMBEDDING_DIM}`);

  const tickets = await loadTickets();
  console.log(`Loaded ${tickets.length} support tickets`);

  const sample = tickets[0];
  console.log('\n' + '='.repeat(80));
  console.log('SAMPLE TICKET:');
  console.log('=' .repeat(80));
  console.log(`ID: ${sample.ticket_id}`);
  console.log(`Title: ${sample.title}`);
  console.log(`Description: ${sample.description.slice(0, 200)}...`);
  console.log(`Category: ${sample.category}`);
  console.log(`Priority: ${sample.priority}`);

  console.log('\n' + '='.repeat(80));
  console.log('PART 1: Generating Embeddings');
  console.log('=' .repeat(80));

  const ticketTexts = tickets.map(
    ticket => `${ticket.title}. ${ticket.description}`
  );
  console.log(`\nPreparing ${ticketTexts.length} ticket texts for embedding...`);

  const embeddings = await embedTexts(ticketTexts);
  console.log(`✓ Generated embeddings with shape: [${embeddings.length}, ${EMBEDDING_DIM}]`);
  console.log(`First 10 values of the first embedding: ${embeddings[0].slice(0, 10).join(', ')}`);

  console.log('\n' + '='.repeat(80));
  console.log('PART 2: Computing Similarity Scores');
  console.log('=' .repeat(80));

  const query = "Users can't login after changing password";
  console.log(`\nSearch query: '${query}'`);

  const [queryEmbedding] = await embedTexts([query]);
  const similarities = embeddings.map(embedding => cosineSimilarity(queryEmbedding, embedding));

  console.log(`Computed similarity scores for ${similarities.length} tickets`);
  console.log(`Similarity range: [${Math.min(...similarities).toFixed(4)}, ${Math.max(...similarities).toFixed(4)}]`);

  console.log('\n' + '='.repeat(80));
  console.log('PART 3: Finding Most Similar Tickets');
  console.log('=' .repeat(80));

  const topK = 5;
  const topIndices = topKIndices(similarities, topK);
  console.log(`\nTop ${topK} most similar tickets to query: '${query}'`);
  console.log(`topIndices: ${JSON.stringify(topIndices)}`);
  console.log('-'.repeat(80));

  topIndices.forEach((idx, rank) => {
    const ticket = tickets[idx];
    const score = similarities[idx];
    console.log(`\n#${rank + 1} - Similarity: ${score.toFixed(4)}`);
    console.log(`Ticket ID: ${ticket.ticket_id}`);
    console.log(`Title: ${ticket.title}`);
    console.log(`Category: ${ticket.category} | Priority: ${ticket.priority}`);
    console.log(`Description: ${ticket.description.slice(0, 150)}...`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('PART 4: Similarity Analysis Summary');
  console.log('=' .repeat(80));

  const selectedIndices = [
    ...topIndices,
    ...sampleRandomIndices(5, tickets.length, topIndices),
  ];
  const selectedMatrix = selectedIndices.map(i =>
    selectedIndices.map(j => cosineSimilarity(embeddings[i], embeddings[j]))
  );

  await fs.writeFile(
    'embeddings_similarity_analysis.json',
    JSON.stringify({
      query,
      selected_indices: selectedIndices,
      similarity_matrix: selectedMatrix,
      query_similarities: selectedIndices.map(i => similarities[i]),
    }, null, 2),
    'utf8'
  );
  console.log("✓ Saved similarity analysis as 'embeddings_similarity_analysis.json'");

  console.log('\n' + '='.repeat(80));
  console.log('PART 5: Experiment with Different Queries');
  console.log('=' .repeat(80));

  const testQueries = [
    'Database is timing out',
    'Payment not working for foreign customers',
    'App crashes on iPhone',
    'Emails are not being sent',
  ];

  for (const testQuery of testQueries) {
    const [testEmbedding] = await embedTexts([testQuery]);
    const sims = embeddings.map(embedding => cosineSimilarity(testEmbedding, embedding));
    const bestIndex = topKIndices(sims, 1)[0];
    console.log(`\nQuery: '${testQuery}'`);
    console.log(`  → Best match: ${tickets[bestIndex].title}`);
    console.log(`  → Similarity: ${sims[bestIndex].toFixed(4)}`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('DEMO COMPLETE!');
  console.log('=' .repeat(80));
  console.log(`\nKEY TAKEAWAYS:
` +
    '1. EMBEDDINGS convert text → 1536-dimensional vectors\n' +
    '2. COSINE SIMILARITY measures how similar two vectors are\n' +
    '3. SEMANTIC SEARCH finds meaning, not just keywords\n' +
    '4. THE SAME MODEL must be used for queries and documents\n' +
    '5. SIMILARITY SCORES are the truth\n'
  );
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
