import { Controller, Get } from '@nestjs/common';
import { ChunkingService } from './chunking.service';

@Controller('demo')
export class ChunkingController {
  constructor(private readonly chunkingService: ChunkingService) {}

  @Get()
  async runDemo(): Promise<Record<string, unknown>> {
    return this.chunkingService.runDemo();
  }
}
