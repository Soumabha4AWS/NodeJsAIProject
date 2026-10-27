import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { DocumentsModule } from '../documents/documents.module';
import { IndexingController } from './indexing.controller';
import { IndexingService } from './indexing.service';
import { VectorStrategy } from './strategies/vector.strategy';
import { SummaryStrategy } from './strategies/summary.strategy';
import { KeywordStrategy } from './strategies/keyword.strategy';
import { HybridStrategy } from './strategies/hybrid.strategy';

@Module({
  imports: [CommonModule, DocumentsModule],
  controllers: [IndexingController],
  providers: [
    IndexingService,
    VectorStrategy,
    SummaryStrategy,
    KeywordStrategy,
    HybridStrategy,
  ],
})
export class IndexingModule {}
