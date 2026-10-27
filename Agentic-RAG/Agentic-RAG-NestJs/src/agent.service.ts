import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { SupportTicketService } from './support-ticket.service';

type Message = OpenAI.Chat.ChatCompletionMessageParam;
type ToolCall = OpenAI.Chat.ChatCompletionMessageToolCall;

const SYSTEM_PROMPT = `You are an expert support desk assistant that helps troubleshoot technical issues.
You have access to a database of previous support tickets with their resolutions.
Always search for similar tickets for troubleshooting questions, reference ticket IDs, admit uncertainty, and be concise but thorough.
Before each tool call, provide a short public rationale in content using this exact prefix: "Decision: <one sentence explaining why this tool is needed>".`;

@Injectable()
export class AgentService {
  private readonly openai?: OpenAI;
  private readonly tools: OpenAI.Chat.ChatCompletionTool[];

  constructor(private readonly ticketService: SupportTicketService) {
    if (process.env.OPENAI_API_KEY) this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.tools = [
      { type: 'function', function: { name: 'SearchSimilarTickets', description: 'Search similar support tickets based on a problem description or question.', parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } } },
      { type: 'function', function: { name: 'GetTicketByID', description: 'Retrieve details of a specific ticket by ID such as TICK-001.', parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } } },
      { type: 'function', function: { name: 'SearchByCategory', description: 'Find all tickets in a category such as Authentication, Database, or Payment.', parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } } },
      { type: 'function', function: { name: 'GetTicketStatistics', description: 'Get total ticket count, category distribution, and priority breakdown.', parameters: { type: 'object', properties: { input: { type: 'string' } }, required: ['input'] } } },
    ];
  }

  async runAgent(query: string, maxIterations = 5): Promise<string> {
    const [, answer] = await this.runConversation([], query, maxIterations);
    return answer;
  }

  async runConversation(history: Message[], query: string, maxIterations = 5): Promise<[Message[], string]> {
    if (!this.openai) return [history, 'Set OPENAI_API_KEY to run the conversational agent.'];
    const messages: Message[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history, { role: 'user', content: query }];
    for (let iteration = 0; iteration < maxIterations; iteration += 1) {
      const response = await this.openai.chat.completions.create({ model: process.env.OPENAI_CHAT_MODEL ?? 'gpt-4o-mini', temperature: 0, messages, tools: this.tools });
      const assistant = response.choices[0]?.message;
      if (!assistant) break;
      messages.push(assistant);
      if (!assistant.tool_calls?.length) return [messages, assistant.content ?? ''];
      for (const call of assistant.tool_calls) {
        if (call.type !== 'function') continue;
        messages.push({ role: 'tool', tool_call_id: call.id, content: await this.executeTool(call) });
      }
    }
    return [messages, 'Maximum iterations reached. Could not complete the task.'];
  }

  private async executeTool(call: Extract<ToolCall, { type: 'function' }>): Promise<string> {
    const input = JSON.parse(call.function.arguments || '{}').input ?? '';
    switch (call.function.name) {
      case 'SearchSimilarTickets': return this.ticketService.searchSimilarTickets(input);
      case 'GetTicketByID': return this.ticketService.getTicketById(input);
      case 'SearchByCategory': return this.ticketService.searchByCategory(input);
      case 'GetTicketStatistics': return this.ticketService.getTicketStatistics();
      default: return `Error: Tool ${call.function.name} not found`;
    }
  }
}
