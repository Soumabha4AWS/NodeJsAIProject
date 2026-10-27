export interface IndexResult {
    id: string;
    score?: number;
    text: string;
    metadata: {
        ticket_id: string;
        category: string;
        priority: string;
        title: string;
    };
}
export interface QueryResponse {
    strategy: string;
    query: string;
    topK: number;
    results: IndexResult[];
    answer?: string;
    durationMs: number;
}
