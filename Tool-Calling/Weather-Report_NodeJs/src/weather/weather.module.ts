import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { WeatherApiService } from './weather-api.service';
import { OpenAiModule } from '../openai/openai.module';

@Module({
  imports: [OpenAiModule],
  providers: [WeatherService, WeatherApiService],
  controllers: [WeatherController],
})
export class WeatherModule {}
