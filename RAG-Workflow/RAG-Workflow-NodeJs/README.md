# RAG Workflow (Node.js)

Node.js port of the Python RAG demo using LangChain.js, OpenAI, and an in-memory vector store.

## Prerequisites
- Node.js 18+
- An OpenAI API key (`OPENAI_API_KEY`)

## Setup
1. Copy `.env.example` to `.env` and set your `OPENAI_API_KEY`.
2. Install dependencies:

```bash
npm install
```

## Demos
Run from the project root after installing deps:

```bash
# LCEL-based RAG chain
npm run demo:chain:lcel

# Baseline chain without LCEL
npm run demo:chain:basic

# Multi-turn conversation with query reformulation
npm run demo:multiturn

# RAG with relevance validation + fallback
npm run demo:validation
```

Notes:
- This port uses a lightweight in-memory vector store (no external DB required).
- If `OPENAI_API_KEY` is not set, demos fall back to local dummy embeddings and a placeholder LLM so they still run; real answers require a valid key.
- It loads `synthetic_tickets.json` and builds vectors on startup.
- Keep history short in multi-turn demos to avoid token bloat.