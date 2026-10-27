import { VectorStore } from '@langchain/core/vectorstores';

function cosineSimilarity(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    const va = a[i] ?? 0;
    const vb = b[i] ?? 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export class SimpleMemoryVectorStore extends VectorStore {
  constructor(embeddings) {
    super(embeddings);
    this.docs = [];
    this.vectors = [];
  }

  _vectorstoreType() {
    return 'simple_memory';
  }

  async addDocuments(documents, options) {
    const texts = documents.map((d) => d.pageContent);
    const vectors = await this.embeddings.embedDocuments(texts, options);
    this.docs.push(...documents);
    this.vectors.push(...vectors);
  }

  async addVectors(vectors, documents) {
    this.vectors.push(...vectors);
    this.docs.push(...documents);
  }

  async similaritySearchVectorWithScore(queryVector, k = 4) {
    const scored = this.vectors.map((vec, idx) => {
      const sim = cosineSimilarity(vec, queryVector);
      const distance = 1 - sim; // 0(best) .. 2(worst) if sim in [-1,1]
      return [this.docs[idx], distance];
    });
    scored.sort((a, b) => a[1] - b[1]); // lower distance is better
    return scored.slice(0, k);
  }

  static async fromDocuments(documents, embeddings, dbConfig) {
    const store = new SimpleMemoryVectorStore(embeddings, dbConfig);
    await store.addDocuments(documents);
    return store;
  }
}
