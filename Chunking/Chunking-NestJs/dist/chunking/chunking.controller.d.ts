import { ChunkingService } from './chunking.service';
export declare class ChunkingController {
    private readonly chunkingService;
    constructor(chunkingService: ChunkingService);
    runDemo(): Promise<Record<string, unknown>>;
}
