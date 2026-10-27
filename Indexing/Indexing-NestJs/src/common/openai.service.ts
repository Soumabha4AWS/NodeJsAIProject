import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService implements OnModuleInit {
  private readonly logger = new Logger(OpenAiService.name);
  private client: OpenAI;
  private embeddingModel: string;
  private llmModel: string;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get<string>('app.openaiApiKey');

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY is not set. API calls will fail. Set it in your .env file.',
      );
    }

    this.client = new OpenAI({ apiKey: apiKey || 'missing' });
    this.embeddingModel = this.configService.get<string>('app.openaiEmbeddingModel') || 'text-embedding-3-small';
    this.llmModel = this.configService.get<string>('app.openaiLlmModel') || 'gpt-4o-mini';

    this.logger.log(`OpenAI client initialized (embedding: ${this.embeddingModel}, llm: ${this.llmModel})`);
  }

  /**
   * Create an embedding vector for a given text.
   */
  async embedText(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.embeddingModel,
      input: text,
    });
    return response.data[0].embedding;
  }

  /**
   * Send a prompt to the LLM and return the text response.
   */
  async chatCompletion(prompt: string, maxTokens = 512): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.llmModel,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
    });
    return completion.choices?.[0]?.message?.content || '';
  }
}
