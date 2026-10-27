import { embedding, documents } from './config.js';
import { SimpleMemoryVectorStore } from './simpleMemoryVectorStore.js';

console.log('\n' + '='.repeat(80));
console.log('PART 1: Vector DB SetUp Pipeline (JS)');
console.log('='.repeat(80));

console.log('\nBuilding in-memory vector store...');

export const vectorStore = await SimpleMemoryVectorStore.fromDocuments(documents, embedding);

console.log('✓ Vector store created (in-memory)');
