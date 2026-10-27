import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import tickets from '../synthetic_tickets.json';
import { ChatMessageDto } from './rag.dto';

type Ticket = (typeof tickets)[number];

const NO_CONTEXT = "I don't have enough information in the ticket history to answer that question.";
const LOW_CONFIDENCE = "I don't have enough relevant information in the ticket history to answer that question confidently.";

const promptTemplate = `You are SupportDesk AI, a technical support assistant that helps engineers troubleshoot issues using historical support ticket data.

CRITICAL RULES:
1. Answer using ONLY information from the provided context.
2. If the question is broad or underspecified, provide the best matching known issue(s) from context and state any assumptions.
3. If context is partially relevant, still provide the most likely troubleshooting guidance from relevant tickets.
4. If the answer is truly not present in context, say "${NO_CONTEXT}"
5. DO NOT make up information or use external knowledge.
6. Always cite ticket IDs for every issue/resolution you mention.
7. If multiple tickets are relevant, summarize each briefly.

Context from support tickets:
{context}

Question: {question}

Helpful Answer (with ticket citations):`;

const conversationPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are SupportDesk AI. Answer using the ticket context below and the chat history.
Use chat history to resolve references like "that issue" or "that ticket".
For factual claims, prioritize the retrieved context.
If information is not available in context or history, say "${NO_CONTEXT}"
Always cite ticket IDs when available.

Context:
{context}`],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);

const condensePrompt = ChatPromptTemplate.fromMessages([
  ['system', 'Given the chat history and a follow-up question, rephrase the follow-up as a standalone question that includes all necessary context from the history. If the question is already standalone, return it unchanged. Output ONLY the rephrased question.'],
  new MessagesPlaceholder('chat_history'),
  ['human', '{question}'],
]);

@Injectable()
export class RagService implements OnModuleInit {
  private documents: Document[] = [];
  private documentVectors: number[][] = [];
  private readonly llm?: ChatOpenAI;
  private readonly embeddings?: OpenAIEmbeddings;
  private readonly ready: Promise<void>;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.llm = new ChatOpenAI({
        apiKey,
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        timeout: 300_000,
        maxRetries: 5,
      });
      this.embeddings = new OpenAIEmbeddings({
        apiKey,
        model: process.env.OPENAI_EMBEDDING_MODEL ?? 'text-embedding-3-small',
        timeout: 120_000,
        maxRetries: 5,
      });
    }
    this.ready = this.initializeIndex();
  }

  async onModuleInit() {
    await this.ready;
  }

  private async initializeIndex() {
    if (!this.embeddings) return;

    const documents = tickets.map((ticket: Ticket) => new Document({
      pageContent: this.ticketText(ticket),
      metadata: {
        ticket_id: ticket.ticket_id,
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        source: `Ticket ${ticket.ticket_id}`,
      },
    }));
    this.documents = documents;
    this.documentVectors = await this.embeddings.embedDocuments(documents.map((document) => document.pageContent));
  }

  private ticketText(ticket: Ticket) {
    return [`Ticket ID: ${ticket.ticket_id}`, `Title: ${ticket.title}`, `Category: ${ticket.category}`, `Priority: ${ticket.priority}`, `Date: ${ticket.created_date} to ${ticket.resolved_date}`, '', 'Problem Description:', ticket.description, '', 'Resolution:', ticket.resolution].join('\n');
  }

  private ensureConfigured() {
    if (this.documents.length === 0 || !this.llm || !this.embeddings) {
      throw new ServiceUnavailableException('Set OPENAI_API_KEY before using the RAG endpoints.');
    }
  }

  private async search(query: string, count: number) {
    const queryVector = await this.embeddings!.embedQuery(query);
    return this.documents
      .map((document, index) => ({ document, score: this.cosineSimilarity(queryVector, this.documentVectors[index]) }))
      .sort((left, right) => right.score - left.score)
      .slice(0, count);
  }

  private cosineSimilarity(left: number[], right: number[]) {
    const dot = left.reduce((sum, value, index) => sum + value * right[index], 0);
    const leftMagnitude = Math.sqrt(left.reduce((sum, value) => sum + value * value, 0));
    const rightMagnitude = Math.sqrt(right.reduce((sum, value) => sum + value * value, 0));
    return leftMagnitude && rightMagnitude ? dot / (leftMagnitude * rightMagnitude) : 0;
  }

  private formatDocs(documents: Document[]) {
    return documents.map((document) => `---\n${document.pageContent}\n---`).join('\n');
  }

  private sources(documents: Document[]) {
    return documents.map((document) => document.metadata);
  }

  async ask(question: string) {
    await this.ready;
    this.ensureConfigured();
    const documents = (await this.search(question, 3)).map(({ document }) => document);
    const prompt = await ChatPromptTemplate.fromTemplate(promptTemplate).format({
      context: this.formatDocs(documents),
      question,
    });
    const response = await this.llm!.invoke(prompt);
    return { answer: this.content(response.content), sources: this.sources(documents) };
  }

  async askWithValidation(question: string, minSimilarityScore = 0.5) {
    await this.ready;
    this.ensureConfigured();
    const scored = await this.search(question, 3);
    const bestScore = scored[0]?.score ?? 0;
    const documents = scored.map(({ document }) => document);
    if (bestScore < minSimilarityScore) {
      return { answer: LOW_CONFIDENCE, confidence: bestScore, sources: this.sources(documents) };
    }
    const result = await this.ask(question);
    return { ...result, confidence: bestScore };
  }

  async askWithHistory(question: string, history: ChatMessageDto[]) {
    await this.ready;
    this.ensureConfigured();
    const messages = this.toMessages(history);
    const standalone = history.length === 0
      ? question
      : this.content(await this.llm!.invoke(await condensePrompt.formatMessages({ question, chat_history: messages })));
    const documents = (await this.search(standalone, 3)).map(({ document }) => document);
    const response = await this.llm!.invoke(await conversationPrompt.formatMessages({
      context: this.formatDocs(documents),
      chat_history: messages,
      question,
    }));
    return { answer: this.content(response.content), rewrittenQuery: standalone, sources: this.sources(documents) };
  }

  private toMessages(history: ChatMessageDto[]): BaseMessage[] {
    return history.map((message) => message.role === 'human' ? new HumanMessage(message.content) : new AIMessage(message.content));
  }

  private content(content: unknown) {
    return typeof content === 'string' ? content : JSON.stringify(content);
  }
}
