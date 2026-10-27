"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Embedding NestJS API')
        .setDescription('REST API for OpenAI embedding-based semantic search over support tickets. ' +
        'Generate embeddings, run similarity searches, and analyse ticket clusters.')
        .setVersion('1.0.0')
        .addTag('tickets', 'CRUD operations on support tickets')
        .addTag('embeddings', 'Embedding generation and semantic search')
        .addServer(`http://localhost:${process.env.PORT ?? 3000}`, 'Local development server')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
            showRequestDuration: true,
        },
        customSiteTitle: 'Embedding API – Swagger UI',
    });
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
//# sourceMappingURL=main.js.map