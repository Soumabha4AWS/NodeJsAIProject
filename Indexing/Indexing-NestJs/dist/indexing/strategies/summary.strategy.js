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
var SummaryStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SummaryStrategy = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("../../documents/documents.service");
let SummaryStrategy = SummaryStrategy_1 = class SummaryStrategy {
    constructor(documentsService) {
        this.documentsService = documentsService;
        this.logger = new common_1.Logger(SummaryStrategy_1.name);
    }
    async query(userQuery, topK) {
        const start = Date.now();
        let LlamaIndex;
        try {
            LlamaIndex = require('llama-index');
        }
        catch {
            this.logger.warn('The `llama-index` npm package is not installed. SummaryIndex strategy is unavailable. ' +
                'Run: npm install llama-index');
            return {
                strategy: 'summary',
                query: userQuery,
                topK,
                results: [],
                answer: 'SummaryIndex strategy requires the `llama-index` npm package. ' +
                    'Please install it with: npm install llama-index',
                durationMs: Date.now() - start,
            };
        }
        const { SummaryIndex } = LlamaIndex;
        const docs = this.documentsService.getAll();
        this.logger.log(`Building SummaryIndex for ${docs.length} documents (no embeddings)...`);
        const summaryIndex = await SummaryIndex.fromDocuments(docs);
        this.logger.log('✓ SummaryIndex created');
        const summaryQueryEngine = summaryIndex.asQueryEngine
            ? summaryIndex.asQueryEngine({ responseMode: 'tree_summarize' })
            : null;
        if (!summaryQueryEngine) {
            return {
                strategy: 'summary',
                query: userQuery,
                topK,
                results: [],
                answer: 'SummaryIndex created but .asQueryEngine() is not supported by this SDK version.',
                durationMs: Date.now() - start,
            };
        }
        const response = await summaryQueryEngine.query(userQuery);
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
            strategy: 'summary',
            query: userQuery,
            topK,
            results,
            answer: response.response || response.answer || '',
            durationMs: Date.now() - start,
        };
    }
};
exports.SummaryStrategy = SummaryStrategy;
exports.SummaryStrategy = SummaryStrategy = SummaryStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService])
], SummaryStrategy);
//# sourceMappingURL=summary.strategy.js.map