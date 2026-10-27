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
var HybridStrategy_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HybridStrategy = void 0;
const common_1 = require("@nestjs/common");
const openai_service_1 = require("../../common/openai.service");
const documents_service_1 = require("../../documents/documents.service");
let HybridStrategy = HybridStrategy_1 = class HybridStrategy {
    constructor(openAiService, documentsService) {
        this.openAiService = openAiService;
        this.documentsService = documentsService;
        this.logger = new common_1.Logger(HybridStrategy_1.name);
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
    async vectorRetrieve(docs, query, topK) {
        const vectors = await Promise.all(docs.map((d) => this.openAiService.embedText(d.text)));
        const queryVec = await this.openAiService.embedText(query);
        const scored = docs.map((doc, i) => ({
            id: doc.id,
            text: doc.text,
            metadata: doc.metadata,
            score: this.cosineSimilarity(queryVec, vectors[i]),
        }));
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter(Boolean);
    }
    keywordRetrieve(docs, query, topK) {
        const queryTokens = new Set(this.tokenize(query));
        const scored = docs.map((doc) => {
            const docTokens = this.tokenize(doc.text);
            const matchCount = docTokens.filter((t) => queryTokens.has(t)).length;
            const score = matchCount / (docTokens.length + 1);
            return { id: doc.id, text: doc.text, metadata: doc.metadata, score };
        });
        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, topK);
    }
    async llamaIndexHybrid(docs, query, topK) {
        let LlamaIndex;
        try {
            LlamaIndex = require('llama-index');
        }
        catch {
            return null;
        }
        const { VectorStoreIndex, KeywordTableIndex } = LlamaIndex;
        this.logger.log('Building LlamaIndex Vector + Keyword indexes...');
        const [vectorIndex, keywordIndex] = await Promise.all([
            VectorStoreIndex.fromDocuments(docs),
            KeywordTableIndex.fromDocuments(docs),
        ]);
        const vectorRetriever = vectorIndex.asRetriever
            ? vectorIndex.asRetriever({ similarityTopK: topK + 2 })
            : null;
        const keywordRetriever = keywordIndex.asRetriever
            ? keywordIndex.asRetriever()
            : null;
        const [vectorNodes, keywordNodes] = await Promise.all([
            vectorRetriever ? vectorRetriever.retrieve(query) : [],
            keywordRetriever ? keywordRetriever.retrieve(query) : [],
        ]);
        const seen = new Set();
        const hybridNodes = [];
        for (const node of [...(vectorNodes || []), ...(keywordNodes || [])]) {
            const id = node?.metadata?.ticket_id || node?.node_id || JSON.stringify(node);
            if (!seen.has(id)) {
                seen.add(id);
                hybridNodes.push(node);
            }
        }
        return hybridNodes.slice(0, topK).map((node) => ({
            id: node.metadata?.ticket_id || node.node_id || 'unknown',
            text: String(node.text || node.content || ''),
            metadata: {
                ticket_id: node.metadata?.ticket_id || 'unknown',
                category: node.metadata?.category || '',
                priority: node.metadata?.priority || '',
                title: node.metadata?.title || '',
            },
            score: node.score,
        }));
    }
    async query(userQuery, topK) {
        const start = Date.now();
        const docs = this.documentsService.getAll();
        const llamaResults = await this.llamaIndexHybrid(docs, userQuery, topK);
        let results;
        if (llamaResults) {
            this.logger.log('✓ Hybrid retrieval via LlamaIndex');
            results = llamaResults.map((r) => ({
                id: r.id,
                score: r.score ? parseFloat(r.score.toFixed(4)) : undefined,
                text: r.text,
                metadata: r.metadata,
            }));
        }
        else {
            this.logger.log('LlamaIndex not available — using custom vector + keyword fusion fallback');
            const [vectorHits, keywordHits] = await Promise.all([
                this.vectorRetrieve(docs, userQuery, topK + 2),
                Promise.resolve(this.keywordRetrieve(docs, userQuery, topK + 2)),
            ]);
            const seen = new Set();
            const merged = [];
            for (const item of [...vectorHits, ...keywordHits]) {
                if (!seen.has(item.id)) {
                    seen.add(item.id);
                    merged.push(item);
                }
            }
            results = merged.slice(0, topK).map((r) => ({
                id: r.id,
                score: parseFloat(r.score.toFixed(4)),
                text: r.text,
                metadata: r.metadata,
            }));
        }
        return {
            strategy: 'hybrid',
            query: userQuery,
            topK,
            results,
            durationMs: Date.now() - start,
        };
    }
};
exports.HybridStrategy = HybridStrategy;
exports.HybridStrategy = HybridStrategy = HybridStrategy_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [openai_service_1.OpenAiService,
        documents_service_1.DocumentsService])
], HybridStrategy);
//# sourceMappingURL=hybrid.strategy.js.map