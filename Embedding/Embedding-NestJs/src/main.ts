import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe so all DTOs are automatically validated
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Swagger / OpenAPI ──────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('Embedding NestJS API')
    .setDescription(
      'REST API for OpenAI embedding-based semantic search over support tickets. ' +
      'Generate embeddings, run similarity searches, and analyse ticket clusters.',
    )
    .setVersion('1.0.0')
    .addTag('tickets', 'CRUD operations on support tickets')
    .addTag('embeddings', 'Embedding generation and semantic search')
    .addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Local development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'list',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'Embedding API – Swagger UI',
  });
  // ──────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀 NestJS Embedding API is running on: http://localhost:${port}`);
  console.log(`\n📄 Swagger UI available at:  http://localhost:${port}/api/docs`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  http://localhost:${port}/tickets`);
  console.log(`  GET  http://localhost:${port}/embeddings/info`);
  console.log(`  POST http://localhost:${port}/embeddings/search`);
  console.log(`  POST http://localhost:${port}/embeddings/batch-search`);
  console.log(`  GET  http://localhost:${port}/embeddings/analysis`);
}

bootstrap();
