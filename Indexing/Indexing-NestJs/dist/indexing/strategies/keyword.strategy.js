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
var KeywordStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeywordStrategy = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("../../documents/documents.service");
let KeywordStrategy = KeywordStrategy_1 = class KeywordStrategy {
    constructor(documentsService) {
        this.documentsService = documentsService;
        this.logger = new common_1.Logger(KeywordStrategy_1.name);
    }
    async query(userQuery, topK) {
        const start = Date.now();
        let LlamaIndex;
        try {
            LlamaIndex = require('llama-index');
        }
        catch {
            this.logger.warn('The `llama-index` npm package is not installed. KeywordTableIndex strategy is unavailable. ' +
                'Run: npm install llama-index');
            return {
                strategy: 'keyword',
                query: userQuery,
                topK,
                results: [],
                answer: 'KeywordTableIndex strategy requires the `llama-index` npm package. ' +
                    'Please install it with: npm install llama-index',
                durationMs: Date.now() - start,
            };
        }
        const { KeywordTableIndex } = LlamaIndex;
        const docs = this.documentsService.getAll();
        this.logger.log(`Building KeywordTableIndex (may call LLM to extract keywords) for ${docs.length} documents...`);
        const keywordIndex = await KeywordTableIndex.fromDocuments(docs);
        this.logger.log('✓ KeywordTableIndex created');
        const keywordQueryEngine = keywordIndex.asQueryEngine
            ? keywordIndex.asQueryEngine()
            : null;
        if (!keywordQueryEngine) {
            return {
                strategy: 'keyword',
                query: userQuery,
                topK,
                results: [],
                answer: 'KeywordTableIndex created but .asQueryEngine() is not supported by this SDK version.',
                durationMs: Date.now() - start,
            };
        }
        const response = await keywordQueryEngine.query(userQuery);
        const sourceNodes = (response.source_nodes || response.sourceNodes || []).slice(0, topK);
        const results = sourceNodes.map((node) => ({
            id: node.metadata?.ticket_id || node.node_id || 'unknown',
            score: node.score,
            text: String(node.text || node.content || ''),
            metadata: {
                ticket_id: node.metadata?.ticket_id || 'unknown',
                category: node.metadata?.category || '',
                priority: node.metadata?.priority || '',
                title: node.metadata?.title || '',
            },
        }));
        return {
            strategy: 'keyword',
            query: userQuery,
            topK,
            results,
            answer: response.response || response.answer || '',
            durationMs: Date.now() - start,
        };
    }
};
exports.KeywordStrategy = KeywordStrategy;
exports.KeywordStrategy = KeywordStrategy = KeywordStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], KeywordStrategy);
//# sourceMappingURL=keyword.strategy.js.map