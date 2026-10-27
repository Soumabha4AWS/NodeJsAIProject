# Indexing NestJS API

A **NestJS REST API** exposing four indexing strategies over synthetic support tickets, converted from the original standalone Node.js scripts.

---

## Architecture

```
src/
├── main.ts                          # Bootstrap (port 3000, /api prefix, Swagger)
├── app.module.ts                    # Root module
├── config/
│   └── app.config.ts                # Typed config from environment variables
├── common/
│   ├── common.module.ts             # Exports OpenAiService
│   └── openai.service.ts            # Shared OpenAI client (embedText, chatCompletion)
├── documents/
│   ├── documents.module.ts
│   ├── documents.service.ts         # Loads synthetic_tickets.json on startup
│   └── ticket-document.interface.ts
├── indexing/
│   ├── indexing.module.ts
│   ├── indexing.service.ts          # Orchestrates all strategies
│   ├── indexing.controller.ts       # REST endpoints
│   ├── dto/
│   │   └── query.dto.ts             # { query: string, topK?: number }
│   ├── interfaces/
│   │   └── query-response.interface.ts
│   └── strategies/
│       ├── vector.strategy.ts       # OpenAI embeddings + cosine similarity
│       ├── summary.strategy.ts      # LlamaIndex SummaryIndex
│       ├── keyword.strategy.ts      # LlamaIndex KeywordTableIndex
│       └── hybrid.strategy.ts       # Union of vector + keyword
└── data/
    └── synthetic_tickets.json       # Source data (20 support tickets)
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy and edit the `.env` file:

```env
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
OPENAI_LLM_MODEL=gpt-4o-mini
PORT=3000
```

### 3. Run in development mode

```bash
npm run start:dev
```

### 4. Open Swagger docs

```
http://localhost:3000/api/docs
```

---

## REST API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Application health check |
| `GET` | `/api/indexing/health` | Indexing module health check |
| `GET` | `/api/indexing/documents` | List all loaded ticket documents |
| `POST` | `/api/indexing/vector` | Vector search (OpenAI embeddings + cosine sim) |
| `POST` | `/api/indexing/summary` | Summary index query (LlamaIndex) |
| `POST` | `/api/indexing/keyword` | Keyword table index query (LlamaIndex) |
| `POST` | `/api/indexing/hybrid` | Hybrid retrieval (vector ∪ keyword) |

### Request body (POST endpoints)

```json
{
  "query": "How do I fix authentication issues after password reset?",
  "topK": 3
}
```

### Example response

```json
{
  "strategy": "vector",
  "query": "How do I fix authentication issues after password reset?",
  "topK": 3,
  "results": [
    {
      "id": "TICK-001",
      "score": 0.9142,
      "text": "Ticket ID: TICK-001\nTitle: Users unable to log in after password reset\n...",
      "metadata": {
        "ticket_id": "TICK-001",
        "category": "Authentication",
        "priority": "High",
        "title": "Users unable to log in after password reset"
      }
    }
  ],
  "answer": "Based on Document TICK-001, the authentication issue after password reset...",
  "durationMs": 2341
}
```

---

## Strategy Notes

| Strategy | Package Required | Fallback |
|----------|-----------------|---------|
| **Vector** | `openai` ✅ (included) | — Always works |
| **Summary** | `llama-index` (optional) | Returns informative error message |
| **Keyword** | `llama-index` (optional) | Returns informative error message |
| **Hybrid** | `llama-index` (optional) | Custom vector + TF-keyword union |

To enable Summary and Keyword strategies: `npm install llama-index`

---

## Build for Production

```bash
npm run build
npm run start:prod
```

---

## Legacy Scripts (Reference)

The original standalone scripts are kept as reference:

```bash
# These still work as before (CommonJS)
node vector-index.js
node summary-index.js
node keyword-index.js
node hybrid-index.js
```
