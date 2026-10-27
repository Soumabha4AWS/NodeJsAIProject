"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var ChunkingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkingService = exports.LangChainVectorStore = void 0;
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function tokenize(text) {
    return (text || '').toLowerCase().match(/[a-z0-9]+/g) || [];
}
function createEmbedding(text) {
    const tokens = tokenize(text);
    const counts = new Map();
    for (const token of tokens) {
        counts.set(token, (counts.get(token) || 0) + 1);
    }
    return counts;
}
function dotProduct(a, b) {
    let sum = 0;
    for (const [key, val] of a) {
        if (b.has(key))
            sum += val * b.get(key);
    }
    return sum;
}
function magnitude(vec) {
    let sum = 0;
    for (const value of vec.values())
        sum += value * value;
    return Math.sqrt(sum);
}
function cosineSimilarity(left, right) {
    const denom = magnitude(left) * magnitude(right);
    if (!denom)
        return 0;
    return dotProduct(left, right) / denom;
}
class LangChainVectorStore {
    items;
    constructor(documents) {
        this.items = documents.map((doc) => ({
            doc,
            embedding: createEmbedding(doc.pageContent),
        }));
    }
    similaritySearch(query, k = 3, filter = null) {
        const queryEmbedding = createEmbedding(query);
        const filtered = this.filterDocuments(filter);
        return filtered
            .map((item) => ({
            doc: item.doc,
            score: cosineSimilarity(queryEmbedding, item.embedding),
        }))
            .sort((a, b) => b.score - a.score)
            .slice(0, k)
            .map((item) => item.doc);
    }
    maxMarginalRelevanceSearch(query, k = 3, filter = null) {
        const queryEmbedding = createEmbedding(query);
        const filtered = this.filterDocuments(filter);
        const selected = [];
        const remaining = [...filtered];
        while (selected.length < Math.min(k, remaining.length)) {
            let bestIndex = -1;
            let bestScore = -Infinity;
            for (let i = 0; i < remaining.length; i++) {
                const candidate = remaining[i];
                const relevance = cosineSimilarity(queryEmbedding, candidate.embedding);
                let diversityPenalty = 0;
                for (const sel of selected) {
                    diversityPenalty = Math.max(diversityPenalty, cosineSimilarity(candidate.embedding, sel.embedding));
                }
                const score = relevance - 0.2 * diversityPenalty;
                if (score > bestScore) {
                    bestScore = score;
                    bestIndex = i;
                }
            }
            if (bestIndex === -1)
                break;
            selected.push(remaining.splice(bestIndex, 1)[0]);
        }
        return selected.map((item) => item.doc);
    }
    filterDocuments(filter) {
        if (!filter)
            return this.items;
        return this.items.filter((item) => Object.entries(filter).every(([key, value]) => item.doc.metadata[key] === value));
    }
}
exports.LangChainVectorStore = LangChainVectorStore;
let ChunkingService = ChunkingService_1 = class ChunkingService {
    logger = new common_1.Logger(ChunkingService_1.name);
    readTickets() {
        const filePath = path.join(__dirname, '..', '..', 'assets', 'synthetic_tickets.json');
        const raw = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(raw);
    }
    createDocument(ticket) {
        const fullText = [
            `Ticket ID: ${ticket.ticket_id}`,
            `Title: ${ticket.title}`,
            `Category: ${ticket.category}`,
            `Priority: ${ticket.priority}`,
            `Description: ${ticket.description}`,
            `Resolution: ${ticket.resolution}`,
        ]
            .join('\n')
            .trim();
        return {
            pageContent: fullText,
            metadata: {
                ticket_id: ticket.ticket_id,
                category: ticket.category,
                priority: ticket.priority,
            },
        };
    }
    createTextDocument(text, metadata = {}) {
        return { pageContent: text, metadata };
    }
    splitByFixedSize(text, chunkSize, chunkOverlap) {
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            const end = Math.min(text.length, start + chunkSize);
            chunks.push(text.slice(start, end));
            if (end >= text.length)
                break;
            start += chunkSize - chunkOverlap;
        }
        return chunks;
    }
    splitTextRecursive(text, separators, chunkSize, chunkOverlap) {
        const normalized = text.trim();
        if (!normalized)
            return [];
        for (const separator of separators) {
            const parts = normalized
                .split(separator)
                .map((p) => p.trim())
                .filter(Boolean);
            if (parts.length > 1) {
                const combined = [];
                for (const part of parts) {
                    if (part.length <= chunkSize) {
                        combined.push(part);
                    }
                    else {
                        combined.push(...this.splitTextRecursive(part, separators.slice(separators.indexOf(separator) + 1), chunkSize, chunkOverlap));
                    }
                }
                return combined;
            }
        }
        return this.splitByFixedSize(normalized, chunkSize, chunkOverlap);
    }
    splitMarkdown(text) {
        const lines = text.split(/\r?\n/);
        const chunks = [];
        let currentHeader = null;
        let currentContent = [];
        const flush = () => {
            if (!currentHeader && currentContent.length === 0)
                return;
            const content = currentContent.join('\n').trim();
            if (content) {
                chunks.push(this.createTextDocument(content, currentHeader ? { header: currentHeader } : {}));
            }
            currentContent = [];
        };
        for (const line of lines) {
            const match = line.match(/^(#{1,6})\s+(.*)$/);
            if (match) {
                flush();
                currentHeader = match[2].trim();
                currentContent.push(line);
            }
            else if (line.trim()) {
                currentContent.push(line);
            }
        }
        flush();
        return chunks;
    }
    splitHtml(text) {
        const chunks = [];
        const tagPattern = /<(h([1-3]))[^>]*>(.*?)<\/\1>/gi;
        let match;
        while ((match = tagPattern.exec(text)) !== null) {
            const headerLevel = match[2];
            const headerText = match[3].replace(/<[^>]+>/g, '').trim();
            const start = match.index + match[0].length;
            const nextMatch = tagPattern.exec(text);
            const end = nextMatch ? nextMatch.index : text.length;
            const block = text.slice(start, end).trim();
            chunks.push(this.createTextDocument(`${headerText}\n${block}`.trim(), {
                header: `${headerLevel}:${headerText}`,
            }));
            tagPattern.lastIndex = nextMatch ? nextMatch.index : text.length;
        }
        return chunks;
    }
    async runDemo() {
        const result = {};
        const tickets = this.readTickets();
        const documents = tickets.map((t) => this.createDocument(t));
        result['ticketsLoaded'] = tickets.length;
        result['documentsCreated'] = documents.length;
        const fixedChunks = documents.map((doc) => this.createTextDocument(this.splitByFixedSize(doc.pageContent, 200, 20).join('\n---\n'), doc.metadata));
        result['fixedChunks'] = {
            count: fixedChunks.length,
            sample: fixedChunks[0]?.pageContent.slice(0, 100),
        };
        const recursiveChunks = documents.map((doc) => this.createTextDocument(this.splitTextRecursive(doc.pageContent, ['\n\n', '\n', '. ', ' '], 300, 50).join('\n---\n'), doc.metadata));
        result['recursiveChunks'] = {
            count: recursiveChunks.length,
            sample: recursiveChunks[0]?.pageContent.slice(0, 100),
        };
        const demoParagraph = [
            'The Mars rover collected soil samples from the Jezero crater last week. Scientists believe these rocks may contain signs of ancient microbial life. NASA plans to retrieve these samples in a future mission.',
            "Grandma's apple pie recipe starts with peeling six large Granny Smith apples. Mix flour, sugar, and cinnamon for the filling. Roll the dough thin and crimp the edges carefully.",
            'The defendant was charged with breach of contract under Section 12. The plaintiff seeks damages of fifty thousand dollars plus legal fees. Both parties agreed to mediation before proceeding to trial.',
        ].join('\n\n');
        const semanticChunks = demoParagraph
            .split(/\n\s*\n/)
            .filter(Boolean)
            .map((content, index) => this.createTextDocument(content.trim(), { chunk_index: index + 1 }));
        result['semanticChunks'] = {
            count: semanticChunks.length,
            chunks: semanticChunks.map((c) => c.pageContent.slice(0, 80)),
        };
        const markdownDoc = `# Database Troubleshooting Guide\n\n## Connection Issues\n\n### Timeout Errors\nIf you encounter timeout errors, check the connection string and ensure the database server is reachable.\n\n### Authentication Failures\nVerify your credentials are correct.\n\n## Performance Problems\n\n### Slow Queries\nAnalyze query execution plans using EXPLAIN.\n`;
        const markdownChunks = this.splitMarkdown(markdownDoc);
        result['markdownChunks'] = {
            count: markdownChunks.length,
            sample: markdownChunks[0]?.pageContent.slice(0, 80),
            sampleMetadata: markdownChunks[0]?.metadata,
        };
        const htmlDoc = `<!DOCTYPE html><html><body><h1>Email Configuration Guide</h1><h2>SMTP Settings</h2><p>Configure your SMTP server settings in the admin panel.</p><h2>IMAP Configuration</h2><p>Set up IMAP to sync your emails across devices.</p></body></html>`;
        const htmlChunks = this.splitHtml(htmlDoc);
        result['htmlChunks'] = {
            count: htmlChunks.length,
            sample: htmlChunks[0]?.pageContent.slice(0, 80),
            sampleMetadata: htmlChunks[0]?.metadata,
        };
        result['wholeDocuments'] = { count: documents.length };
        const query = 'Authentication problems after password reset';
        const store = new LangChainVectorStore(documents);
        const similarityResults = store.similaritySearch(query, 3);
        result['similaritySearch'] = similarityResults.map((doc) => ({
            ticket_id: doc.metadata['ticket_id'],
            category: doc.metadata['category'],
        }));
        const mmrResults = store.maxMarginalRelevanceSearch(query, 3);
        result['mmrSearch'] = mmrResults.map((doc) => ({
            ticket_id: doc.metadata['ticket_id'],
            title: tickets.find((t) => t.ticket_id === doc.metadata['ticket_id'])?.title ||
                'Unknown',
        }));
        const filteredResults = store.similaritySearch(query, 3, {
            category: 'Authentication',
        });
        result['filteredByAuthentication'] = filteredResults.map((doc) => ({
            ticket_id: doc.metadata['ticket_id'],
            category: doc.metadata['category'],
            preview: doc.pageContent.slice(0, 100),
        }));
        const highPriorityResults = store.similaritySearch('Database performance issues', 3, { priority: 'High' });
        result['filteredByHighPriority'] = highPriorityResults.map((doc) => ({
            ticket_id: doc.metadata['ticket_id'],
            priority: doc.metadata['priority'],
        }));
        const stores = [
            ['Whole Documents', new LangChainVectorStore(documents)],
            ['Fixed Chunks', new LangChainVectorStore(fixedChunks)],
            ['Recursive Chunks', new LangChainVectorStore(recursiveChunks)],
        ];
        const testQuery = 'Database connection failures';
        result['strategyComparison'] = stores.map(([name, s]) => {
            const res = s.similaritySearch(testQuery, 1);
            return {
                strategy: name,
                topResult: res[0]?.pageContent.slice(0, 100),
                length: res[0]?.pageContent.length,
            };
        });
        this.logger.log('Demo completed successfully');
        return result;
    }
};
exports.ChunkingService = ChunkingService;
exports.ChunkingService = ChunkingService = ChunkingService_1 = __decorate([
    (0, common_1.Injectable)()
], ChunkingService);
//# sourceMappingURL=chunking.service.js.map