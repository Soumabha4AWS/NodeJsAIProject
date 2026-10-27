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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingService = void 0;
const common_1 = require("@nestjs/common");
const documents_service_1 = require("../documents/documents.service");
const vector_strategy_1 = require("./strategies/vector.strategy");
const summary_strategy_1 = require("./strategies/summary.strategy");
const keyword_strategy_1 = require("./strategies/keyword.strategy");
const hybrid_strategy_1 = require("./strategies/hybrid.strategy");
let IndexingService = class IndexingService {
    constructor(documentsService, vectorStrategy, summaryStrategy, keywordStrategy, hybridStrategy) {
        this.documentsService = documentsService;
        this.vectorStrategy = vectorStrategy;
        this.summaryStrategy = summaryStrategy;
        this.keywordStrategy = keywordStrategy;
        this.hybridStrategy = hybridStrategy;
    }
    async queryVector(dto) {
        return this.vectorStrategy.query(dto.query, dto.topK ?? 3);
    }
    async querySummary(dto) {
        return this.summaryStrategy.query(dto.query, dto.topK ?? 3);
    }
    async queryKeyword(dto) {
        return this.keywordStrategy.query(dto.query, dto.topK ?? 3);
    }
    async queryHybrid(dto) {
        return this.hybridStrategy.query(dto.query, dto.topK ?? 3);
    }
    getDocuments() {
        return {
            count: this.documentsService.count(),
            documents: this.documentsService.getAll().map((d) => ({
                id: d.id,
                metadata: d.metadata,
                textPreview: d.text.slice(0, 200) + (d.text.length > 200 ? '...' : ''),
            })),
        };
    }
};
exports.IndexingService = IndexingService;
exports.IndexingService = IndexingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [documents_service_1.DocumentsService,
        vector_strategy_1.VectorStrategy,
        summary_strategy_1.SummaryStrategy,
        keyword_strategy_1.KeywordStrategy,
        hybrid_strategy_1.HybridStrategy])
], IndexingService);
//# sourceMappingURL=indexing.service.js.map