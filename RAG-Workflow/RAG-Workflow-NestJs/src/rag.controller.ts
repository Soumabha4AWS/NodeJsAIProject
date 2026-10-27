import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AskDto, HistoryAskDto } from './rag.dto';
import { RagService } from './rag.service';

@Controller('rag')
@ApiTags('RAG')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Answer a question using retrieved ticket context' })
  @ApiBody({ type: AskDto })
  ask(@Body() body: AskDto) {
    return this.ragService.ask(body.question);
  }

  @Post('ask/validated')
  @ApiOperation({ summary: 'Answer only when the best ticket match passes the confidence threshold' })
  @ApiBody({ type: AskDto })
  askWithValidation(@Body() body: AskDto) {
    return this.ragService.askWithValidation(body.question, body.minSimilarityScore);
  }

  @Post('chat')
  @ApiOperation({ summary: 'Answer a question with history-aware query reformulation' })
  @ApiBody({ type: HistoryAskDto })
  chat(@Body() body: HistoryAskDto) {
    return this.ragService.askWithHistory(body.question, body.history);
  }
}
