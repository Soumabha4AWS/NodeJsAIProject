import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsPositive, IsString, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryDto {
  @ApiProperty({
    description: 'The search query to run against the index',
    example: 'How do I fix authentication issues after password reset?',
  })
  @IsString()
  @IsNotEmpty()
  query: string;

  @ApiPropertyOptional({
    description: 'Number of top results to return',
    default: 3,
    minimum: 1,
    maximum: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Max(20)
  topK?: number = 3;
}
