import { PROMPT } from './createPromptTemplate.js';
import { retriever } from './vectorRetrieverSetup.js';
import { llm } from './config.js';
import { RunnablePassthrough, RunnableSequence, RunnableLambda } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';

console.log('\n' + '='.repeat(80));
console.log('PART 5: Assembling RAG Chain (JS)');
console.log('='.repeat(80));

export function formatDocs(docs) {
  const parts = docs.map((d) => `---\n${d.pageContent}\n---`);
  console.log(`Formatted ${parts.length} documents:`);
  parts.slice(0, 3).forEach((p, i) => {
    console.log(`\nDocument #${i + 1}:\n${p.slice(0, 200)}...`);
  });
  return parts.join('\n');
}

export async function qaChainWithoutLcel(question) {
  const retrieved = await retriever.invoke(question);
  console.log(`\nRetrieved ${retrieved.length} documents for question: '${question}'`);
  const context = formatDocs(retrieved);
  const filled = await PROMPT.format({ context, question });
  const answer = await llm.invoke(filled);
  const parsed = await new StringOutputParser().parse(answer);
  return typeof parsed === 'string' ? parsed : String(parsed);
}

const _llmStage = RunnableLambda.from(async (input) => llm.invoke(input));

export const qaChainWithLcel = RunnableSequence.from([
  {
    context: retriever.pipe(formatDocs),
    question: new RunnablePassthrough(),
  },
  PROMPT,
  _llmStage,
  new StringOutputParser(),
]);

console.log('✓ RAG chain assembled:');
console.log('  Retriever → Context Injection → LLM → Answer');
console.log('\nThis is the complete RAG pipeline! Query in → Answer out');
