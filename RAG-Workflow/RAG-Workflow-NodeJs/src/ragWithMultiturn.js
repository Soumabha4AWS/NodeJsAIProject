import { llm } from './config.js';
import { retriever } from './vectorRetrieverSetup.js';
import { formatDocs } from './createRagChain.js';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { RunnableLambda } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

console.log('\n' + '='.repeat(80));
console.log('PART 8: Conversation with History (Multi-Turn RAG, JS)');
console.log('='.repeat(80));

const condensePrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'Given the chat history and a follow-up question, rephrase the follow-up as a standalone question that includes all necessary context from the history. If the question is already standalone, return it unchanged.\n\nIMPORTANT: Output ONLY the rephrased question. Do NOT answer it. Do NOT include any explanation or additional text.',
  ],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);

const _llmStage = RunnableLambda.from(async (input) => llm.invoke(input));
const condenseChain = condensePrompt.pipe(_llmStage).pipe(new StringOutputParser());

const convPrompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    'You are SupportDesk AI. Answer using the ticket context below and the chat history.\n    Use chat history to resolve references like "that issue" or "that ticket".\n    For factual claims, prioritize the retrieved context.\n    If information is not available in context or history, say "I don\'t have that information."\n    Always cite ticket IDs when available.\n\nContext:\n{context}',
  ],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);

export async function askWithHistory(question, history) {
  let standalone = question;
  if (history && history.length > 0) {
    standalone = await condenseChain.invoke({ question, chat_history: history });
  }
  if (standalone !== question) {
    console.log(`         [Rewritten query → ${standalone}]`);
  }

  const context = formatDocs(await retriever.invoke(standalone));
  const answer = await convPrompt.pipe(_llmStage).pipe(new StringOutputParser()).invoke({
    context,
    chat_history: history,
    question,
  });

  history.push(new HumanMessage({ content: question }));
  history.push(new AIMessage({ content: answer }));
  return answer;
}
