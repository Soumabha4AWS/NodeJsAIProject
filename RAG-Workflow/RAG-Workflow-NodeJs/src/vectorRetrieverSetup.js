import { vectorStore } from './vectorDbSetup.js';

console.log('\n' + '='.repeat(80));
console.log('PART 2: Setting Up Retriever (JS)');
console.log('='.repeat(80));

export const retriever = vectorStore.asRetriever(3);

console.log('✓ Retriever configured:');
console.log('  - Search type: similarity');
console.log('  - Top-K results: 3');

const testQuery = "Users can't log in after changing passwords";
console.log(`\nTest query: '${testQuery}'`);
const retrievedDocs = await retriever.invoke(testQuery);

console.log(`\nRetrieved ${retrievedDocs.length} documents:`);
retrievedDocs.forEach((doc, i) => {
  console.log(`\n#${i + 1} - ${doc.metadata.ticket_id}: ${doc.metadata.title}`);
  console.log(`  Category: ${doc.metadata.category}`);
});
