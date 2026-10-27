import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TicketsModule } from './tickets/tickets.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';

@Module({
  imports: [
    // Load .env variables globally so all services can inject them via ConfigService
    ConfigModule.forRoot({ isGlobal: true }),
    TicketsModule,
    EmbeddingsModule,
  ],
})
export class AppModule {}
