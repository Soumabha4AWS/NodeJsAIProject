// Simple vector search using OpenAI embeddings and in-memory store
const { OPENAI_API_KEY, OPENAI_EMBEDDING_MODEL, OPENAI_LLM_MODEL, documents } = require('./config');
const OpenAI = require('openai');

if (!OPENAI_API_KEY) {
  console.error('Missing OPENAI_API_KEY in environment. Set it and rerun.');
  process.exit(1);
}

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

function dot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function magnitude(a) {
  return Math.sqrt(a.reduce((s, v) => s + v * v, 0));
}

function cosineSim(a, b) {
  return dot(a, b) / (magnitude(a) * magnitude(b) + 1e-12);
}

async function embedText(text) {
  const resp = await client.embeddings.create({ model: OPENAI_EMBEDDING_MODEL, input: text });
  return resp.data[0].embedding;
}

async function buildIndex(docs) {
  const index = [];
  for (const doc of docs) {
    const vec = await embedText(doc.text);
    index.push({ id: doc.id, text: doc.text, metadata: doc.metadata, vector: vec });
  }
  return index;
}

async function retrieve(index, query, topK = 3) {
  const qvec = await embedText(query);
  const scored = index.map((item) => ({ ...item, score: cosineSim(qvec, item.vector) }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

async function synthesizeAnswer(retrieved, query) {
  const context = retrieved.map((r, i) => `Document ${i + 1} (ID: ${r.id}):\n${r.text}\n`).join('\n');
  const prompt = `You are a helpful assistant. Use the following documents to answer the query.\n\nDocuments:\n${context}\nQuery: ${query}\nProvide a concise answer and cite document IDs when appropriate.`;

  const completion = await client.chat.completions.create({
    model: OPENAI_LLM_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 512,
  });

  return completion.choices?.[0]?.message?.content || completion.choices?.[0]?.text || '';
}

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('PART 1: Vector Index (in-memory)');
  console.log('='.repeat(80) + '\n');

  console.log(`Building embeddings for ${documents.length} documents (this may take a moment)...`);
  const index = await buildIndex(documents);
  console.log('✓ Built in-memory vector index');

  const query = 'How do I fix authentication issues after password reset?';
  console.log(`\nTest Query: '${query}'`);

  const retrieved = await retrieve(index, query, 3);
  console.log('\nTop documents:');
  retrieved.forEach((r, i) => {
    console.log(`\n${i + 1}. ${r.id}  Score: ${r.score.toFixed(4)}`);
    console.log(`   ${r.text.slice(0, 150)}...`);
  });

  console.log('\nSynthesizing answer with LLM...');
  const answer = await synthesizeAnswer(retrieved, query);
  console.log('\nAnswer:\n', answer);
}

main().catch((err) => {
  console.error('Error running vector-index:', err);
});
