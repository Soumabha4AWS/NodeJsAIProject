import { Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatMessageDto {
  @ApiProperty({ enum: ['human', 'ai'], example: 'human' })
  @IsIn(['human', 'ai'])
  role!: 'human' | 'ai';

  @ApiProperty({ example: 'How do I fix authentication failures?' })
  @IsString()
  content!: string;
}

export class AskDto {
  @ApiProperty({ example: 'How do I fix database connection timeouts?' })
  @IsString()
  question!: string;

  @ApiPropertyOptional({ minimum: 0, default: 0.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSimilarityScore?: number;
}

export class HistoryAskDto extends AskDto {
  @ApiProperty({ type: [ChatMessageDto], example: [{ role: 'human', content: 'How do I fix authentication failures?' }] })
  @IsArray()
  @Type(() => ChatMessageDto)
  history!: ChatMessageDto[];
}
