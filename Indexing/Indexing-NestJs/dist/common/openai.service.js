"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OpenAiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
let OpenAiService = OpenAiService_1 = class OpenAiService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(OpenAiService_1.name);
    }
    onModuleInit() {
        const apiKey = this.configService.get('app.openaiApiKey');
        if (!apiKey) {
            this.logger.warn('OPENAI_API_KEY is not set. API calls will fail. Set it in your .env file.');
        }
        this.client = new openai_1.default({ apiKey: apiKey || 'missing' });
        this.embeddingModel = this.configService.get('app.openaiEmbeddingModel') || 'text-embedding-3-small';
        this.llmModel = this.configService.get('app.openaiLlmModel') || 'gpt-4o-mini';
        this.logger.log(`OpenAI client initialized (embedding: ${this.embeddingModel}, llm: ${this.llmModel})`);
    }
    async embedText(text) {
        const response = await this.client.embeddings.create({
            model: this.embeddingModel,
            input: text,
        });
        return response.data[0].embedding;
    }
    async chatCompletion(prompt, maxTokens = 512) {
        const completion = await this.client.chat.completions.create({
            model: this.llmModel,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: maxTokens,
        });
        return completion.choices?.[0]?.message?.content || '';
    }
};
exports.OpenAiService = OpenAiService;
exports.OpenAiService = OpenAiService = OpenAiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAiService);
//# sourceMappingURL=openai.service.js.map