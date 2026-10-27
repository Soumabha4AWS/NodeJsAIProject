import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private client: OpenAI | null = null;
  private apiKey: string | null | undefined;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string | null>('OPENAI_API_KEY');
    if (this.apiKey) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  getClient(): OpenAI {
    if (!this.client) {
      throw new BadRequestException(
        'OPENAI_API_KEY is not configured. Please add it to your .env file.',
      );
    }
    return this.client;
  }
}
