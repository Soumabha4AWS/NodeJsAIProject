"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('app', () => ({
    openaiApiKey: process.env.OPENAI_API_KEY || '',
    openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
    openaiLlmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
    port: parseInt(process.env.PORT || '3000', 10),
}));
//# sourceMappingURL=app.config.js.map