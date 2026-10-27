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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const indexing_service_1 = require("./indexing.service");
const query_dto_1 = require("./dto/query.dto");
let IndexingController = class IndexingController {
    constructor(indexingService) {
        this.indexingService = indexingService;
    }
    getDocuments() {
        return this.indexingService.getDocuments();
    }
    health() {
        return { status: 'ok', timestamp: new Date().toISOString() };
    }
    queryVector(dto) {
        return this.indexingService.queryVector(dto);
    }
    querySummary(dto) {
        return this.indexingService.querySummary(dto);
    }
    queryKeyword(dto) {
        return this.indexingService.queryKeyword(dto);
    }
    queryHybrid(dto) {
        return this.indexingService.queryHybrid(dto);
    }
};
exports.IndexingController = IndexingController;
__decorate([
    (0, common_1.Get)('documents'),
    (0, swagger_1.ApiOperation)({
        summary: 'List all loaded documents',
        description: 'Returns all ticket documents loaded from synthetic_tickets.json (metadata + text preview).',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Array of documents with metadata' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IndexingController.prototype, "getDocuments", null);
__decorate([
    (0, common_1.Get)('health'),
    (0, swagger_1.ApiOperation)({ summary: 'Health check', description: 'Returns service status.' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: '{ status: "ok" }' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], IndexingController.prototype, "health", null);
__decorate([
    (0, common_1.Post)('vector'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Vector index search',
        description: 'Embeds documents and query using OpenAI embeddings, ranks by cosine similarity, ' +
            'then synthesizes an LLM answer from the top-K results.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Ranked results with synthesized LLM answer' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], IndexingController.prototype, "queryVector", null);
__decorate([
    (0, common_1.Post)('summary'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Summary index search',
        description: 'Uses LlamaIndex SummaryIndex (tree_summarize mode) to answer queries. ' +
            'Requires the `llama-index` npm package.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Summary index results' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], IndexingController.prototype, "querySummary", null);
__decorate([
    (0, common_1.Post)('keyword'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Keyword table index search',
        description: 'Uses LlamaIndex KeywordTableIndex (LLM-extracted keywords) to answer queries. ' +
            'Requires the `llama-index` npm package.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Keyword index results' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], IndexingController.prototype, "queryKeyword", null);
__decorate([
    (0, common_1.Post)('hybrid'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Hybrid retrieval (vector ∪ keyword)',
        description: 'Combines vector retrieval and keyword retrieval results via union-fusion deduplication. ' +
            'Uses LlamaIndex when available, falls back to custom OpenAI vector + TF-keyword retrieval.',
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Hybrid retrieval results' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_dto_1.QueryDto]),
    __metadata("design:returntype", void 0)
], IndexingController.prototype, "queryHybrid", null);
exports.IndexingController = IndexingController = __decorate([
    (0, swagger_1.ApiTags)('indexing'),
    (0, common_1.Controller)('indexing'),
    __metadata("design:paramtypes", [indexing_service_1.IndexingService])
], IndexingController);
//# sourceMappingURL=indexing.controller.js.map