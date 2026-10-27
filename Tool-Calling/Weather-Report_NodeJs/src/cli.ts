import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { WeatherService } from './weather/weather.service';

async function runCli() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const configService = app.get(ConfigService);
  const weatherService = app.get(WeatherService);

  const userLocation = 'London';

  try {
    console.log('\n' + '='.repeat(80) + '\n');
    const result = await weatherService.getWeatherReport(
      `What is the weather of ${userLocation}`,
    );
    console.log('\n' + '='.repeat(80) + '\n');
    console.log('RESULT:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await app.close();
  }
}

runCli();
