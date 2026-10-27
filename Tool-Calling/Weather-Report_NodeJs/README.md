# Weather Report Agent - NestJS

A NestJS-based Weather Report Agent that uses OpenAI's function calling to fetch real-time weather information.

## Features

- **OpenAI Integration**: Uses GPT-4o model with function calling capabilities
- **Weather API**: Integrates with RapidAPI Weather API for real-time weather data
- **NestJS Framework**: Built with NestJS for scalability and maintainability
- **Type Safety**: Full TypeScript support with DTOs and validation
- **REST API**: Exposes endpoints for weather queries

## Project Structure

```
src/
├── main.ts                 # Application entry point
├── app.module.ts          # Root module
├── openai/
│   ├── openai.service.ts  # OpenAI client service
│   └── openai.module.ts   # OpenAI module
└── weather/
    ├── weather.service.ts         # Weather agent logic
    ├── weather.controller.ts       # API endpoints
    ├── weather-api.service.ts      # Weather API integration
    ├── weather.module.ts           # Weather module
    └── dto/
        └── weather.dto.ts          # DTOs and type definitions
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Add your API keys:
   - `OPENAI_API_KEY`: Your OpenAI API key
   - `WEATHER_API_KEY`: Your RapidAPI weather API key
   - `WEATHER_API_HOST`: RapidAPI host (weather-api167.p.rapidapi.com)

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

## API Endpoints

### Get Weather Report
**GET** `/weather/report`

Query parameter:
```text
?location=London
```

Example request:
```bash
curl "http://localhost:3000/weather/report?location=London"
```

Response:
```json
{
  "location": "London",
  "weather": "fetch from result",
  "summary": "AI-generated weather report"
}
```

## How It Works

1. User sends a location query to the `/weather/report` endpoint
2. The WeatherService creates a conversation with OpenAI
3. OpenAI's GPT-4o model uses function calling to determine when to fetch weather data
4. When the model calls the `get_current_weather` function, the WeatherApiService fetches data from RapidAPI
5. The weather data is sent back to OpenAI for processing
6. OpenAI generates a summary of the weather report
7. The final summary is returned to the user

## Technology Stack

- **NestJS**: Progressive Node.js framework
- **TypeScript**: Type-safe JavaScript
- **OpenAI SDK**: Official OpenAI API client
- **Axios**: HTTP client for API requests
- **Class Validator**: Data validation
- **Class Transformer**: Object transformation

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
