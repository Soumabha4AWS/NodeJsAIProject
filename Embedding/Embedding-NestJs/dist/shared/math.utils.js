"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dotProduct = dotProduct;
exports.vectorNorm = vectorNorm;
exports.cosineSimilarity = cosineSimilarity;
exports.topKIndices = topKIndices;
exports.sampleRandomIndices = sampleRandomIndices;
function dotProduct(a, b) {
    return a.reduce((sum, value, index) => sum + value * b[index], 0);
}
function vectorNorm(a) {
    return Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
}
function cosineSimilarity(a, b) {
    const numerator = dotProduct(a, b);
    const denominator = vectorNorm(a) * vectorNorm(b);
    return denominator === 0 ? 0 : numerator / denominator;
}
function topKIndices(values, k) {
    return values
        .map((value, index) => ({ value, index }))
        .sort((a, b) => b.value - a.value)
        .slice(0, k)
        .map((item) => item.index);
}
function sampleRandomIndices(count, total, exclude) {
    const available = Array.from({ length: total }, (_, i) => i).filter((index) => !exclude.includes(index));
    const selected = [];
    while (selected.length < Math.min(count, available.length)) {
        const randomIndex = Math.floor(Math.random() * available.length);
        selected.push(available.splice(randomIndex, 1)[0]);
    }
    return selected;
}
//# sourceMappingURL=math.utils.js.map