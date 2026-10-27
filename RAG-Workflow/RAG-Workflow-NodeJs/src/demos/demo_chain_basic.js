import '../config.js';
import { qaChainWithoutLcel } from '../createRagChain.js';

const testQueries = [
  'How do I fix authentication failures after password reset?',
  'What causes database connection timeouts?',
  'Why are emails not being delivered?',
  'How do I make the perfect pizza?',
];

for (const q of testQueries) {
  console.log('\n' + '='.repeat(80));
  console.log(`QUERY: ${q}`);
  console.log('='.repeat(80));
  try {
    const answer = await qaChainWithoutLcel(q);
    console.log('\n' + '-'.repeat(80));
    console.log('ANSWER:');
    console.log('-'.repeat(80));
    console.log(answer);
  } catch (err) {
    console.error('Error:', err?.message || err);
  }
}
