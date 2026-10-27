const { documents } = require('./config');

let LlamaIndex;
try {
  LlamaIndex = require('llama-index');
} catch (err) {
  console.error('Please install the `llama-index` npm package and set OPENAI_API_KEY.');
  console.error('Run: npm install');
  process.exit(1);
}

const { SummaryIndex } = LlamaIndex;

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('PART 2: Summary Index');
  console.log('='.repeat(80) + '\n');

  console.log('Building summary index (no embeddings)...');

  const summaryIndex = await SummaryIndex.fromDocuments(documents);
  console.log('✓ Created summary index');

  const summaryQueryEngine = summaryIndex.asQueryEngine ? summaryIndex.asQueryEngine({ responseMode: 'tree_summarize' }) : null;

  const query = 'How do I fix authentication issues after password reset?';
  console.log(`\nTest Query: '${query}'`);

  if (!summaryQueryEngine) {
    console.log('Summary index created. Call `.asQueryEngine()` if supported by your LlamaIndex JS SDK.');
    return;
  }

  const response = await summaryQueryEngine.query(query);

  console.log('\nSummary Index Results:');
  console.log('Answer:', response.response || response.answer || 'No response property');
  console.log('\nSource Documents:');
  (response.source_nodes || response.sourceNodes || []).slice(0, 3).forEach((node, i) => {
    console.log(`\n${i + 1}. ${node.metadata?.ticket_id || 'Unknown'}`);
    console.log(`   ${String(node.text || node.content || '').slice(0, 150)}...`);
  });
}

main().catch((err) => {
  console.error('Error running summary-index:', err);
});
