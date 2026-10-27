import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiProperty, ApiResponse, ApiTags } from '@nestjs/swagger';
import OpenAI from 'openai';
import { AgentService } from './agent.service';

class AgentQueryDto {
  @ApiProperty({ description: 'Question or troubleshooting request for the support agent.', example: 'How do I fix authentication problems after password reset?' })
  query!: string;

  @ApiProperty({ description: 'Maximum number of model/tool iterations.', example: 5, required: false, default: 5 })
  maxIterations?: number;
}

class ConversationDto extends AgentQueryDto {
  @ApiProperty({ description: 'Previous OpenAI-compatible conversation messages.', required: false, type: [Object], default: [] })
  history?: OpenAI.Chat.ChatCompletionMessageParam[];
}

@ApiTags('agent')
@Controller('agent')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post('query')
  @ApiOperation({ summary: 'Run a support-agent query' })
  @ApiBody({ type: AgentQueryDto })
  @ApiResponse({ status: 201, description: 'The assistant answer.' })
  query(@Body() body: AgentQueryDto) {
    return this.agentService.runAgent(body.query, body.maxIterations);
  }

  @Post('conversation')
  @ApiOperation({ summary: 'Continue a support-agent conversation' })
  @ApiBody({ type: ConversationDto })
  @ApiResponse({ status: 201, description: 'Updated message history and assistant answer.' })
  conversation(@Body() body: ConversationDto) {
    return this.agentService.runConversation(body.history ?? [], body.query, body.maxIterations);
  }
}
