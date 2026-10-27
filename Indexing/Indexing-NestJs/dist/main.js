"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Indexing NestJS API')
        .setDescription('REST API exposing vector, summary, keyword, and hybrid indexing strategies over synthetic support tickets.')
        .setVersion('1.0')
        .addTag('indexing')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    console.log(`\n🚀 Application is running on: http://localhost:${port}/api`);
    console.log(`📚 Swagger docs:              http://localhost:${port}/api/docs\n`);
}
bootstrap();
//# sourceMappingURL=main.js.map