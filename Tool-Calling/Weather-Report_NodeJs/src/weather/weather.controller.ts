import { Controller, Get, Query } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherQueryDto, WeatherReportDto } from './dto/weather.dto';

@Controller('/')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}


  @Get('/')
  async dashboard(): Promise<{ message: string }> {
    return { message: 'Welcome to Weather Report Dashboard page' };
  }

  @Get('/weather')
  async getWeatherReport(@Query() query: WeatherQueryDto): Promise<WeatherReportDto> {
    const result = await this.weatherService.getWeatherReport(
      `What is the weather of ${query.location}`,
    );

    return {
      location: query.location,
      weather: 'fetch from result',
      summary: result,
    };
  }
}
