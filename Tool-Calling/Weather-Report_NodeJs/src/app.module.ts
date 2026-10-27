import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenAiModule } from './openai/openai.module';
import { WeatherModule } from './weather/weather.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    OpenAiModule,
    WeatherModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
