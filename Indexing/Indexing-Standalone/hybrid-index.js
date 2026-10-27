const { documents } = require('./config');

let LlamaIndex;
try {
  LlamaIndex = require('llama-index');
} catch (err) {
  console.error('Please install the `llama-index` npm package and set OPENAI_API_KEY.');
  console.error('Run: npm install');
  process.exit(1);
}

const { VectorStoreIndex, KeywordTableIndex } = LlamaIndex;

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('PART 5: Hybrid Retrieval');
  console.log('='.repeat(80) + '\n');

  console.log('Building Vector + Keyword indexes for hybrid retrieval...');

  const vectorIndex = await VectorStoreIndex.fromDocuments(documents);
  const keywordIndex = await KeywordTableIndex.fromDocuments(documents);

  const query = 'How do I fix authentication issues after password reset?';
  console.log(`\nTest Query: '${query}'`);

  const vectorRetriever = vectorIndex.asRetriever ? vectorIndex.asRetriever({ similarityTopK: 5 }) : null;
  const keywordRetriever = keywordIndex.asRetriever ? keywordIndex.asRetriever() : null;

  const vectorNodes = vectorRetriever ? await vectorRetriever.retrieve(query) : [];
  const keywordNodes = keywordRetriever ? await keywordRetriever.retrieve(query) : [];

  // Simple fusion: union by ticket_id
  const seen = new Set();
  const hybridNodes = [];
  for (const node of [...(vectorNodes || []), ...(keywordNodes || [])]) {
    const id = node?.metadata?.ticket_id || node?.node_id || JSON.stringify(node);
    if (!seen.has(id)) {
      seen.add(id);
      hybridNodes.push(node);
    }
  }

  console.log('\nHybrid Retrieval Results (Combined-naive):');
  hybridNodes.slice(0, 3).forEach((node, i) => {
    console.log(`\n${i + 1}. ${node.metadata?.ticket_id || 'Unknown'}`);
    if (node.score) console.log(`   Score: ${node.score.toFixed(4)}`);
    console.log(`   ${String(node.text || node.content || '').slice(0, 150)}...`);
  });
}

main().catch((err) => {
  console.error('Error running hybrid-index:', err);
});
