import { IsArray, IsString, ArrayNotEmpty, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BatchQueryDto {
  @ApiProperty({
    description: 'Array of natural-language queries to search in parallel (max 20).',
    example: [
      'Database is timing out',
      'Payment not working for foreign customers',
      'App crashes on iPhone',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  queries: string[];
}
