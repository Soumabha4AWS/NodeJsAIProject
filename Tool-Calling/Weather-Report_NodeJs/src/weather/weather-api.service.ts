import { Injectable, HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class WeatherApiService {
  private readonly apiKey: string | null | undefined;
  private readonly apiHost: string | null | undefined;
  private readonly baseUrl = 'https://weather-api167.p.rapidapi.com';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string | null>('WEATHER_API_KEY');
    this.apiHost = this.configService.get<string | null>('WEATHER_API_HOST');
  }

  async getCurrentWeather(location: string): Promise<string> {
    if (!this.apiKey || !this.apiHost) {
      throw new BadRequestException(
        'Weather API credentials are not configured. Please add WEATHER_API_KEY and WEATHER_API_HOST to your .env file.',
      );
    }

    try {
      console.log(`-> TOOL ACTIVATED: get_current_weather for ${location}...`);

      const response = await axios.get(
        `${this.baseUrl}/api/weather/forecast`,
        {
          params: {
            place: `${location},GB`,
            cnt: 3,
            units: 'standard',
            type: 'three_hour',
            mode: 'json',
            lang: 'en',
          },
          headers: {
            'x-rapidapi-key': this.apiKey,
            'x-rapidapi-host': this.apiHost,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      return JSON.stringify(response.data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching weather for ${location}:`, errorMessage);
      throw new HttpException(
        `Failed to fetch weather data: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
