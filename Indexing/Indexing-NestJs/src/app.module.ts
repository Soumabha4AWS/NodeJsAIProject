import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from './config/app.config';
import { DocumentsModule } from './documents/documents.module';
import { IndexingModule } from './indexing/indexing.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: '.env',
    }),
    DocumentsModule,
    IndexingModule,
  ],
})
export class AppModule {}
