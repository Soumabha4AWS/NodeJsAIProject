import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { EmbeddingsService } from './embeddings.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { BatchQueryDto } from './dto/batch-query.dto';

@ApiTags('embeddings')
@Controller('embeddings')
export class EmbeddingsController {
  constructor(private readonly embeddingsService: EmbeddingsService) {}

  /**
   * GET /embeddings/info
   * Returns the current model configuration and cache status.
   */
  @Get('info')
  @ApiOperation({
    summary: 'Get model info',
    description: 'Returns the current OpenAI embedding model name, dimensions, and cache status.',
  })
  @ApiOkResponse({
    description: 'Model configuration and cache status.',
    schema: {
      example: {
        model: 'text-embedding-3-small',
        dimensions: 1536,
        cachedTickets: 50,
        cacheReady: true,
      },
    },
  })
  getModelInfo() {
    return this.embeddingsService.getModelInfo();
  }

  /**
   * POST /embeddings/search
   * Body: { "query": "...", "topK": 5 }
   *
   * Performs semantic search over all support tickets and returns
   * the top-K most similar results with their similarity scores.
   */
  @Post('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Semantic search',
    description:
      'Embeds the query and returns the top-K most semantically similar support tickets, ranked by cosine similarity.',
  })
  @ApiBody({ type: SearchQueryDto })
  @ApiOkResponse({
    description: 'Top-K ticket results with similarity scores.',
    schema: {
      example: {
        query: "Users can't login after changing password",
        topK: 5,
        results: [
          {
            ticket_id: 'TKT-001',
            title: 'Login issues after password reset',
            similarity: 0.9213,
          },
        ],
      },
    },
  })
  async search(
    @Body(new ValidationPipe({ transform: true })) dto: SearchQueryDto,
  ) {
    const results = await this.embeddingsService.search(dto.query, dto.topK);
    return {
      query: dto.query,
      topK: dto.topK ?? 5,
      results,
    };
  }

  /**
   * POST /embeddings/batch-search
   * Body: { "queries": ["...", "...", ...] }
   *
   * Runs each query through semantic search in parallel and returns
   * results keyed by the original query string.
   */
  @Post('batch-search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Batch semantic search',
    description:
      'Runs up to 20 queries in parallel and returns the best-matching ticket for each query, keyed by the query string.',
  })
  @ApiBody({ type: BatchQueryDto })
  @ApiOkResponse({
    description: 'Map of query → best-matching ticket results.',
    schema: {
      example: {
        queryCount: 2,
        results: {
          'Database is timing out': [{ ticket_id: 'TKT-012', similarity: 0.8841 }],
          'App crashes on iPhone': [{ ticket_id: 'TKT-034', similarity: 0.9102 }],
        },
      },
    },
  })
  async batchSearch(
    @Body(new ValidationPipe({ transform: true })) dto: BatchQueryDto,
  ) {
    const results = await this.embeddingsService.batchSearch(dto.queries);
    return {
      queryCount: dto.queries.length,
      results,
    };
  }

  /**
   * GET /embeddings/analysis
   * Query param: query (optional, defaults to a demo query)
   *
   * Generates a pairwise similarity matrix for the top-5 matches + 5
   * random tickets. Equivalent to the JSON file the original script exported.
   */
  @Get('analysis')
  @ApiOperation({
    summary: 'Similarity analysis',
    description:
      'Generates a pairwise cosine-similarity matrix for the top-5 matched tickets plus 5 random tickets. Useful for visualising ticket clusters.',
  })
  @ApiQuery({
    name: 'query',
    required: false,
    description: 'The search query to analyse. Defaults to a built-in demo query if omitted.',
    example: 'Payment gateway returning 500 errors',
  })
  @ApiOkResponse({
    description: 'Similarity matrix and per-ticket query similarity scores.',
    schema: {
      example: {
        query: "Users can't login after changing password",
        selected_indices: [0, 3, 7, 12, 19, 22, 31, 40, 44, 48],
        similarity_matrix: [[1, 0.82], [0.82, 1]],
        query_similarities: [0.92, 0.81],
      },
    },
  })
  async getAnalysis(@Query('query') query?: string) {
    return this.embeddingsService.getSimilarityAnalysis(query);
  }
}
