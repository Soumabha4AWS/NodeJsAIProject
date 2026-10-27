import { IsString, IsNotEmpty } from 'class-validator';

export class WeatherQueryDto {
  @IsString()
  @IsNotEmpty()
  location: string;
}

export class WeatherReportDto {
  location: string;
  weather: string;
  summary: string;
}
