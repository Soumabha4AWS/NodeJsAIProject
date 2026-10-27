import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChunkingModule } from './chunking/chunking.module';

@Module({
  imports: [ChunkingModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
