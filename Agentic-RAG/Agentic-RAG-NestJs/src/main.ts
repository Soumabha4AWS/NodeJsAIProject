import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Agentic RAG Support Assistant')
    .setDescription('Tool-calling support assistant backed by historical support tickets.')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, swaggerDocument);
  SwaggerModule.setup('swagger-ui/index.html', app, swaggerDocument);
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
