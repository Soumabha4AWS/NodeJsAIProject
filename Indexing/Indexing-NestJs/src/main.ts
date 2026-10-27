import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger / OpenAPI docs
  const config = new DocumentBuilder()
    .setTitle('Indexing NestJS API')
    .setDescription(
      'REST API exposing vector, summary, keyword, and hybrid indexing strategies over synthetic support tickets.',
    )
    .setVersion('1.0')
    .addTag('indexing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`\n🚀 Application is running on: http://localhost:${port}/api`);
  console.log(`📚 Swagger docs:              http://localhost:${port}/api/docs\n`);
}

bootstrap();
