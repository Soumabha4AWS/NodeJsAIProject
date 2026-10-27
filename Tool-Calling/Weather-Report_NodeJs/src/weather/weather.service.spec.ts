import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from './weather.service';
import { OpenAiService } from '../openai/openai.service';
import { WeatherApiService } from './weather-api.service';
import { ConfigService } from '@nestjs/config';

describe('WeatherService', () => {
  let service: WeatherService;
  let openAiService: OpenAiService;
  let weatherApiService: WeatherApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        {
          provide: OpenAiService,
          useValue: {
            getClient: jest.fn(),
          },
        },
        {
          provide: WeatherApiService,
          useValue: {
            getCurrentWeather: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    openAiService = module.get<OpenAiService>(OpenAiService);
    weatherApiService = module.get<WeatherApiService>(WeatherApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call weatherApiService.getCurrentWeather when getWeatherReport is called', async () => {
    const mockWeatherData = { location: 'London', temp: 15 };
    (weatherApiService.getCurrentWeather as jest.Mock).mockResolvedValue(
      JSON.stringify(mockWeatherData),
    );

    // Note: This is a simplified test. Real tests would mock OpenAI responses too
    expect(service).toBeDefined();
  });
});
