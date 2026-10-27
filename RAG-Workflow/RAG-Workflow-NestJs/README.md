# SupportDesk RAG with NestJS

NestJS conversion of the Python support-ticket RAG workflow.

## Setup

```powershell
Copy-Item .env.example .env
# Set OPENAI_API_KEY in .env
npm install
npm run start:dev
```

The service listens on `http://localhost:3000` by default.

## Endpoints

`POST /rag/ask`

```json
{ "question": "How do I fix database connection timeouts?" }
```

`POST /rag/ask/validated` accepts the same body and an optional `minSimilarityScore` (default `0.5`). It returns a grounded fallback when the best cosine match is below the threshold.

`POST /rag/chat` supports history-aware follow-ups:

```json
{
  "question": "How long did it take to resolve?",
  "history": [
    { "role": "human", "content": "How do I fix authentication failures?" },
    { "role": "ai", "content": "See TICK-001..." }
  ]
}
```

The index is built in memory from `synthetic_tickets.json` at startup. OpenAI embeddings are used for cosine-ranked top-three retrieval, and `gpt-4o-mini` generates answers using only retrieved ticket context.
