import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [RagController],
  providers: [RagService],
})
export class AppModule {}
