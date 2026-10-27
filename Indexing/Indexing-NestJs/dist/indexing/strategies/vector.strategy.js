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
var VectorStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStrategy = void 0;
const common_1 = require("@nestjs/common");
const openai_service_1 = require("../../common/openai.service");
const documents_service_1 = require("../../documents/documents.service");
let VectorStrategy = VectorStrategy_1 = class VectorStrategy {
    constructor(openAiService, documentsService) {
        this.openAiService = openAiService;
        this.documentsService = documentsService;
        this.logger = new common_1.Logger(VectorStrategy_1.name);
    }
    dot(a, b) {
        return a.reduce((sum, val, i) => sum + val * b[i], 0);
    }
    magnitude(a) {
        return Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    }
    cosineSimilarity(a, b) {
        return this.dot(a, b) / (this.magnitude(a) * this.magnitude(b) + 1e-12);
    }
    async buildIndex(docs) {
        const index = [];
        for (const doc of docs) {
            const vector = await this.openAiService.embedText(doc.text);
            index.push({ id: doc.id, text: doc.text, metadata: doc.metadata, vector });
        }
        return index;
    }
    async retrieve(index, query, topK) {
        const queryVec = await this.openAiService.embedText(query);
        const scored = index.map((item) => ({
            ...item,
            score: this.cosineSimilarity(queryVec, item.vector),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    async synthesizeAnswer(retrieved, query) {
        const context = retrieved
            .map((r, i) => `Document ${i + 1} (ID: ${r.id}):\n${r.text}\n`)
            .join('\n');
        const prompt = [
            'You are a helpful assistant. Use the following documents to answer the query.',
            '',
            'Documents:',
            context,
            `Query: ${query}`,
            'Provide a concise answer and cite document IDs when appropriate.',
        ].join('\n');
        return this.openAiService.chatCompletion(prompt, 512);
    }
    async query(userQuery, topK) {
        const start = Date.now();
        const docs = this.documentsService.getAll();
        this.logger.log(`Building in-memory vector index for ${docs.length} documents...`);
        const index = await this.buildIndex(docs);
        this.logger.log('✓ Vector index built');
        const retrieved = await this.retrieve(index, userQuery, topK);
        const results = retrieved.map((r) => ({
            id: r.id,
            score: parseFloat(r.score.toFixed(4)),
            text: r.text,
            metadata: r.metadata,
        }));
        this.logger.log('Synthesizing answer with LLM...');
        const answer = await this.synthesizeAnswer(retrieved, userQuery);
        return {
            strategy: 'vector',
            query: userQuery,
            topK,
            results,
            answer,
            durationMs: Date.now() - start,
        };
    }
};
exports.VectorStrategy = VectorStrategy;
exports.VectorStrategy = VectorStrategy = VectorStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [openai_service_1.OpenAiService,
        documents_service_1.DocumentsService])
], VectorStrategy);
//# sourceMappingURL=vector.strategy.js.map