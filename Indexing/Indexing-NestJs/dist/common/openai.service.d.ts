import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class OpenAiService implements OnModuleInit {
    private readonly configService;
    private readonly logger;
    private client;
    private embeddingModel;
    private llmModel;
    constructor(configService: ConfigService);
    onModuleInit(): void;
    embedText(text: string): Promise<number[]>;
    chatCompletion(prompt: string, maxTokens?: number): Promise<string>;
}
