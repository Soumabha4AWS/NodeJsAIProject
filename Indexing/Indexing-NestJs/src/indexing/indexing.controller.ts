import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { IndexingService } from './indexing.service';
import { QueryDto } from './dto/query.dto';

@ApiTags('indexing')
@Controller('indexing')
export class IndexingController {
  constructor(private readonly indexingService: IndexingService) {}

  // ─── Documents ───────────────────────────────────────────────────────────────

  @Get('documents')
  @ApiOperation({
    summary: 'List all loaded documents',
    description: 'Returns all ticket documents loaded from synthetic_tickets.json (metadata + text preview).',
  })
  @ApiResponse({ status: 200, description: 'Array of documents with metadata' })
  getDocuments() {
    return this.indexingService.getDocuments();
  }

  // ─── Health ──────────────────────────────────────────────────────────────────

  @Get('health')
  @ApiOperation({ summary: 'Health check', description: 'Returns service status.' })
  @ApiResponse({ status: 200, description: '{ status: "ok" }' })
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  // ─── Vector ──────────────────────────────────────────────────────────────────

  @Post('vector')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vector index search',
    description:
      'Embeds documents and query using OpenAI embeddings, ranks by cosine similarity, ' +
      'then synthesizes an LLM answer from the top-K results.',
  })
  @ApiResponse({ status: 200, description: 'Ranked results with synthesized LLM answer' })
  queryVector(@Body() dto: QueryDto) {
    return this.indexingService.queryVector(dto);
  }

  // ─── Summary ─────────────────────────────────────────────────────────────────

  @Post('summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Summary index search',
    description:
      'Uses LlamaIndex SummaryIndex (tree_summarize mode) to answer queries. ' +
      'Requires the `llama-index` npm package.',
  })
  @ApiResponse({ status: 200, description: 'Summary index results' })
  querySummary(@Body() dto: QueryDto) {
    return this.indexingService.querySummary(dto);
  }

  // ─── Keyword ─────────────────────────────────────────────────────────────────

  @Post('keyword')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Keyword table index search',
    description:
      'Uses LlamaIndex KeywordTableIndex (LLM-extracted keywords) to answer queries. ' +
      'Requires the `llama-index` npm package.',
  })
  @ApiResponse({ status: 200, description: 'Keyword index results' })
  queryKeyword(@Body() dto: QueryDto) {
    return this.indexingService.queryKeyword(dto);
  }

  // ─── Hybrid ──────────────────────────────────────────────────────────────────

  @Post('hybrid')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hybrid retrieval (vector ∪ keyword)',
    description:
      'Combines vector retrieval and keyword retrieval results via union-fusion deduplication. ' +
      'Uses LlamaIndex when available, falls back to custom OpenAI vector + TF-keyword retrieval.',
  })
  @ApiResponse({ status: 200, description: 'Hybrid retrieval results' })
  queryHybrid(@Body() dto: QueryDto) {
    return this.indexingService.queryHybrid(dto);
  }
}
