# Indexing (Node.js port)

This repository contains a Node.js port of the LlamaIndex Python examples from the original project.

Quick start:

1. Install dependencies:

```bash
npm install
```

2. Set your OpenAI API key (export or set in environment):

Windows PowerShell:

```powershell
$env:OPENAI_API_KEY = "sk-..."
```

3. Run an example, e.g. vector index:

```bash
npm run vector
```

Notes:
- This port assumes a JavaScript `llama-index` package is available. The exact JS SDK API may differ from the Python SDK. Adjust calls in the scripts if needed to match the installed SDK.
- The example scripts are lightweight ports that mirror the original logic: `vector-index.js`, `summary-index.js`, `keyword-index.js`, and `hybrid-index.js`.
