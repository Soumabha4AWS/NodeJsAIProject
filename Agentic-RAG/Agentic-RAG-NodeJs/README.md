# Agentic RAG (Node.js)

Port of the Python Agentic-RAG demo to Node.js using LangChain.js primitives and OpenAI function calling. Tools operate over the same `synthetic_tickets.json`.

## Setup

- Requirements:
  - Node.js >= 18.17
  - An OpenAI API key with access to `gpt-4o-mini` and `text-embedding-3-small`.

- Install deps:

```bash
npm install
```

- Set environment:

```powershell
# PowerShell (Windows)
$env:OPENAI_API_KEY="YOUR_KEY_HERE"
# Optional model override
# $env:OPENAI_MODEL="gpt-4o-mini"
```

```bash
# bash/zsh
export OPENAI_API_KEY="YOUR_KEY_HERE"
# export OPENAI_MODEL="gpt-4o-mini"
```

## Run

```bash
npm run demo
```

The demo runs these scenarios:
- Simple troubleshooting query (uses SearchSimilarTickets)
- Specific ticket lookup (GetTicketByID)
- Category-based listing (SearchByCategory)
- Ticket statistics (GetTicketStatistics)
- Short conversational flow with memory

## Notes
- This port uses an in-memory vector index. If `OPENAI_API_KEY` is set, it uses OpenAI embeddings; otherwise it falls back to a lightweight local embedding for offline demo.
- If no `OPENAI_API_KEY` is present, the agent runs in an offline mode with simple rule-based tool routing (no LLM), so answers are direct tool outputs.
- The Python sample contained a hardcoded API key; this Node port uses `OPENAI_API_KEY` from env for safety.
- Tools mirror the Python behavior and return formatted strings for the agent to quote directly.