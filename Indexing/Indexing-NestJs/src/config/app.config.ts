import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiEmbeddingModel: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small',
  openaiLlmModel: process.env.OPENAI_LLM_MODEL || 'gpt-4o-mini',
  port: parseInt(process.env.PORT || '3000', 10),
}));
