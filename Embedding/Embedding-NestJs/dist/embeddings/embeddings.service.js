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
var EmbeddingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("openai");
const tickets_service_1 = require("../tickets/tickets.service");
const math_utils_1 = require("../shared/math.utils");
let EmbeddingsService = EmbeddingsService_1 = class EmbeddingsService {
    constructor(configService, ticketsService) {
        this.configService = configService;
        this.ticketsService = ticketsService;
        this.logger = new common_1.Logger(EmbeddingsService_1.name);
        this.ticketEmbeddings = null;
        const apiKey = this.configService.get('OPENAI_API_KEY');
        if (!apiKey) {
            throw new Error('Missing OPENAI_API_KEY. Set it in your .env file.');
        }
        this.client = new openai_1.default({ apiKey });
        this.embeddingModel = this.configService.get('EMBEDDING_MODEL', 'text-embedding-3-small');
        this.embeddingDim = this.configService.get('EMBEDDING_DIM', 1536);
    }
    async onModuleInit() {
        this.logger.log(`Using OpenAI model: ${this.embeddingModel}`);
        this.logger.log(`Embedding dimension: ${this.embeddingDim}`);
    }
    async embedTexts(texts) {
        const response = await this.client.embeddings.create({
            model: this.embeddingModel,
            input: texts,
        });
        return response.data.map((item) => item.embedding);
    }
    async getTicketEmbeddings() {
        if (this.ticketEmbeddings) {
            return this.ticketEmbeddings;
        }
        const tickets = this.ticketsService.getAll();
        this.logger.log(`Computing embeddings for ${tickets.length} tickets (one-time, cached)...`);
        const texts = tickets.map((t) => `${t.title}. ${t.description}`);
        this.ticketEmbeddings = await this.embedTexts(texts);
        this.logger.log(`✓ Cached embeddings: [${this.ticketEmbeddings.length}, ${this.embeddingDim}]`);
        return this.ticketEmbeddings;
    }
    async search(query, topK = 5) {
        const tickets = this.ticketsService.getAll();
        const embeddings = await this.getTicketEmbeddings();
        const [queryEmbedding] = await this.embedTexts([query]);
        const similarities = embeddings.map((emb) => (0, math_utils_1.cosineSimilarity)(queryEmbedding, emb));
        const indices = (0, math_utils_1.topKIndices)(similarities, topK);
        return indices.map((idx, rank) => ({
            rank: rank + 1,
            ticket: tickets[idx],
            similarity: parseFloat(similarities[idx].toFixed(6)),
        }));
    }
    async batchSearch(queries) {
        const results = await Promise.all(queries.map(async (q) => ({ query: q, results: await this.search(q, 1) })));
        return Object.fromEntries(results.map((r) => [r.query, r.results]));
    }
    async getSimilarityAnalysis(query = "Users can't login after changing password") {
        const tickets = this.ticketsService.getAll();
        const embeddings = await this.getTicketEmbeddings();
        const [queryEmbedding] = await this.embedTexts([query]);
        const similarities = embeddings.map((emb) => (0, math_utils_1.cosineSimilarity)(queryEmbedding, emb));
        const topIndices = (0, math_utils_1.topKIndices)(similarities, 5);
        const selectedIndices = [
            ...topIndices,
            ...(0, math_utils_1.sampleRandomIndices)(5, tickets.length, topIndices),
        ];
        const similarityMatrix = selectedIndices.map((i) => selectedIndices.map((j) => (0, math_utils_1.cosineSimilarity)(embeddings[i], embeddings[j])));
        return {
            query,
            selected_indices: selectedIndices,
            similarity_matrix: similarityMatrix,
            query_similarities: selectedIndices.map((i) => parseFloat(similarities[i].toFixed(6))),
        };
    }
    getModelInfo() {
        return {
            model: this.embeddingModel,
            dimension: this.embeddingDim,
            ticketCount: this.ticketsService.getAll().length,
            embeddingsCached: this.ticketEmbeddings !== null,
        };
    }
};
exports.EmbeddingsService = EmbeddingsService;
exports.EmbeddingsService = EmbeddingsService = EmbeddingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        tickets_service_1.TicketsService])
], EmbeddingsService);
//# sourceMappingURL=embeddings.service.js.map