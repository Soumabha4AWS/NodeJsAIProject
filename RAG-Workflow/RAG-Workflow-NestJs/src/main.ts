import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SupportDesk RAG API')
    .setDescription('History-aware question answering over support tickets')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  // Serve Swagger UI at /swagger-ui (also works with /swagger-ui/index.html#)
  SwaggerModule.setup('swagger-ui', app, swaggerDocument);
  
  // Optional: keep old /api URL working by redirecting to the new path
  const httpAdapter = app.getHttpAdapter();
  if (httpAdapter && typeof (httpAdapter as any).get === 'function') {
    (httpAdapter as any).get('/api', (_req: any, res: any) => {
      res.redirect('/swagger-ui/index.html');
    });
  }
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
