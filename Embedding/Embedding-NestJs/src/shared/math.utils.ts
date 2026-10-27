/**
 * Pure math utilities for vector similarity operations.
 * These are stateless helper functions extracted from the original app.js.
 */

/** Dot product of two equal-length numeric vectors. */
export function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

/** Euclidean (L2) norm of a vector. */
export function vectorNorm(a: number[]): number {
  return Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
}

/** Cosine similarity between two vectors. Returns 0 if either vector is zero. */
export function cosineSimilarity(a: number[], b: number[]): number {
  const numerator = dotProduct(a, b);
  const denominator = vectorNorm(a) * vectorNorm(b);
  return denominator === 0 ? 0 : numerator / denominator;
}

/**
 * Returns the indices of the top-K highest values in `values`, sorted descending.
 */
export function topKIndices(values: number[], k: number): number[] {
  return values
    .map((value, index) => ({ value, index }))
    .sort((a, b) => b.value - a.value)
    .slice(0, k)
    .map((item) => item.index);
}

/**
 * Samples `count` random indices from [0, total) excluding the given `exclude` set.
 */
export function sampleRandomIndices(
  count: number,
  total: number,
  exclude: number[],
): number[] {
  const available = Array.from({ length: total }, (_, i) => i).filter(
    (index) => !exclude.includes(index),
  );
  const selected: number[] = [];
  while (selected.length < Math.min(count, available.length)) {
    const randomIndex = Math.floor(Math.random() * available.length);
    selected.push(available.splice(randomIndex, 1)[0]);
  }
  return selected;
}
