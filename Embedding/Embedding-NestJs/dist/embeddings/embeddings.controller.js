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
exports.EmbeddingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const embeddings_service_1 = require("./embeddings.service");
const search_query_dto_1 = require("./dto/search-query.dto");
const batch_query_dto_1 = require("./dto/batch-query.dto");
let EmbeddingsController = class EmbeddingsController {
    constructor(embeddingsService) {
        this.embeddingsService = embeddingsService;
    }
    getModelInfo() {
        return this.embeddingsService.getModelInfo();
    }
    async search(dto) {
        const results = await this.embeddingsService.search(dto.query, dto.topK);
        return {
            query: dto.query,
            topK: dto.topK ?? 5,
            results,
        };
    }
    async batchSearch(dto) {
        const results = await this.embeddingsService.batchSearch(dto.queries);
        return {
            queryCount: dto.queries.length,
            results,
        };
    }
    async getAnalysis(query) {
        return this.embeddingsService.getSimilarityAnalysis(query);
    }
};
exports.EmbeddingsController = EmbeddingsController;
__decorate([
    (0, common_1.Get)('info'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get model info',
        description: 'Returns the current OpenAI embedding model name, dimensions, and cache status.',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Model configuration and cache status.',
        schema: {
            example: {
                model: 'text-embedding-3-small',
                dimensions: 1536,
                cachedTickets: 50,
                cacheReady: true,
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], EmbeddingsController.prototype, "getModelInfo", null);
__decorate([
    (0, common_1.Post)('search'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Semantic search',
        description: 'Embeds the query and returns the top-K most semantically similar support tickets, ranked by cosine similarity.',
    }),
    (0, swagger_1.ApiBody)({ type: search_query_dto_1.SearchQueryDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Top-K ticket results with similarity scores.',
        schema: {
            example: {
                query: "Users can't login after changing password",
                topK: 5,
                results: [
                    {
                        ticket_id: 'TKT-001',
                        title: 'Login issues after password reset',
                        similarity: 0.9213,
                    },
                ],
            },
        },
    }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [search_query_dto_1.SearchQueryDto]),
    __metadata("design:returntype", Promise)
], EmbeddingsController.prototype, "search", null);
__decorate([
    (0, common_1.Post)('batch-search'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({
        summary: 'Batch semantic search',
        description: 'Runs up to 20 queries in parallel and returns the best-matching ticket for each query, keyed by the query string.',
    }),
    (0, swagger_1.ApiBody)({ type: batch_query_dto_1.BatchQueryDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Map of query → best-matching ticket results.',
        schema: {
            example: {
                queryCount: 2,
                results: {
                    'Database is timing out': [{ ticket_id: 'TKT-012', similarity: 0.8841 }],
                    'App crashes on iPhone': [{ ticket_id: 'TKT-034', similarity: 0.9102 }],
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [batch_query_dto_1.BatchQueryDto]),
    __metadata("design:returntype", Promise)
], EmbeddingsController.prototype, "batchSearch", null);
__decorate([
    (0, common_1.Get)('analysis'),
    (0, swagger_1.ApiOperation)({
        summary: 'Similarity analysis',
        description: 'Generates a pairwise cosine-similarity matrix for the top-5 matched tickets plus 5 random tickets. Useful for visualising ticket clusters.',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'query',
        required: false,
        description: 'The search query to analyse. Defaults to a built-in demo query if omitted.',
        example: 'Payment gateway returning 500 errors',
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Similarity matrix and per-ticket query similarity scores.',
        schema: {
            example: {
                query: "Users can't login after changing password",
                selected_indices: [0, 3, 7, 12, 19, 22, 31, 40, 44, 48],
                similarity_matrix: [[1, 0.82], [0.82, 1]],
                query_similarities: [0.92, 0.81],
            },
        },
    }),
    __param(0, (0, common_1.Query)('query')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmbeddingsController.prototype, "getAnalysis", null);
exports.EmbeddingsController = EmbeddingsController = __decorate([
    (0, swagger_1.ApiTags)('embeddings'),
    (0, common_1.Controller)('embeddings'),
    __metadata("design:paramtypes", [embeddings_service_1.EmbeddingsService])
], EmbeddingsController);
//# sourceMappingURL=embeddings.controller.js.map