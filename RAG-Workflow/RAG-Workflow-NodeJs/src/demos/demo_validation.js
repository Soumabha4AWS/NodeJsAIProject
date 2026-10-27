import '../config.js';
import { ragWithValidation } from '../ragWithValidation.js';

console.log('\nTesting validation logic:');
console.log('\n1. Relevant query (should answer):');
await ragWithValidation('How to fix database connection timeouts?', 0.5).then((a) => console.log(a.slice(0, 500)));

console.log('\n2. Irrelevant query (should refuse):');
await ragWithValidation('What is the capital of France?', 0.5).then((a) => console.log(a));
