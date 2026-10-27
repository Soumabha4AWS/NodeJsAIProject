const { documents } = require('./config');

let LlamaIndex;
try {
  LlamaIndex = require('llama-index');
} catch (err) {
  console.error('Please install the `llama-index` npm package and set OPENAI_API_KEY.');
  console.error('Run: npm install');
  process.exit(1);
}

const { KeywordTableIndex } = LlamaIndex;

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('PART 4: Keyword Table Index');
  console.log('='.repeat(80) + '\n');

  console.log('Building keyword index (may call LLM to extract keywords)...');
  const keywordIndex = await KeywordTableIndex.fromDocuments(documents);
  console.log('✓ Created keyword index');

  const keywordQueryEngine = keywordIndex.asQueryEngine ? keywordIndex.asQueryEngine() : null;

  const query = 'How do I fix authentication issues after password reset?';
  console.log(`\nTest Query: '${query}'`);

  if (!keywordQueryEngine) {
    console.log('Keyword index created. Call `.asQueryEngine()` if supported by your LlamaIndex JS SDK.');
    return;
  }

  const response = await keywordQueryEngine.query(query);

  console.log('\nKeyword Index Results:');
  console.log('Answer:', response.response || response.answer || 'No response property');
  console.log('\nSource Documents:');
  (response.source_nodes || response.sourceNodes || []).slice(0, 3).forEach((node, i) => {
    console.log(`\n${i + 1}. ${node.metadata?.ticket_id || 'Unknown'}`);
    console.log(`   ${String(node.text || node.content || '').slice(0, 150)}...`);
  });
}

main().catch((err) => {
  console.error('Error running keyword-index:', err);
});
