# Quick Start Guide - NestJS Weather Report Agent

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Environment
```bash
# Copy the template
cp .env.example .env

# Edit .env and add your API keys
# OPENAI_API_KEY=sk-proj-...
# WEATHER_API_KEY=...
# WEATHER_API_HOST=weather-api167.p.rapidapi.com
```

### Step 3: Run the Application

#### Option A: Run as Web Server (Recommended)
```bash
npm run start:dev
```
Then test with:
```bash
curl "http://localhost:3000/weather/report?location=London"
```

#### Option B: Run as CLI Script (Like Original Python)
```bash
npm run cli
```

### Step 4: Build for Production
```bash
npm run build
npm run start:prod
```

---

## 🐳 Docker Setup

```bash
# Build and run with Docker Compose
npm run docker:run

# Or manually:
npm run docker:build
docker run -p 3000:3000 --env-file .env weather-report-agent
```

---

## 📁 Project Structure

```
src/
├── main.ts                      # ← Entry point for web server
├── cli.ts                       # ← Entry point for CLI script
├── app.module.ts               # Root NestJS module
├── openai/
│   ├── openai.service.ts       # OpenAI client (replaces openAIConnect.py)
│   └── openai.module.ts
└── weather/
    ├── weather.service.ts      # Agent logic (replaces weatherReportModule.py)
    ├── weather.controller.ts    # API endpoints
    ├── weather-api.service.ts   # Weather API calls (replaces weatherReportFunc.py)
    ├── weather.module.ts
    └── dto/weather.dto.ts       # Type definitions
```

---

## 🔄 Python → NestJS Mapping

| Python | NestJS |
|--------|--------|
| `openAIConnect.py` | `openai.service.ts` |
| `weatherReportToolsSchema.py` | Tool schema in `weather.service.ts` |
| `weatherReportFunc.py` | `weather-api.service.ts` |
| `weatherReportModule.py` | `weather.service.ts` |
| `weatherReportMain.py` | `cli.ts` or `main.ts` |

---

## 📝 API Endpoint

**POST** `/weather/report`

**Request:**
```json
{
  "location": "London"
}
```

**Response:**
```json
{
  "location": "London",
  "weather": "fetch from result",
  "summary": "The weather in London is... [AI-generated text]"
}
```

---

## 🛠️ Useful Commands

```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Debug mode
npm run cli                # Run CLI script
npm run cli:dev            # CLI with file watching

# Building
npm run build              # Build for production
npm run start:prod         # Run production build

# Quality
npm run lint               # Fix linting issues
npm run format             # Format code

# Testing
npm run test               # Run tests
npm run test:watch        # Watch mode
npm run test:cov          # Coverage report

# Docker
npm run docker:build       # Build Docker image
npm run docker:run         # Run with Docker Compose
```

---

## ✨ Key Differences from Python Version

| Feature | Python | NestJS |
|---------|--------|--------|
| **Execution** | One-time run, exits | Persistent server/scriptable |
| **API** | CLI only | REST API + CLI |
| **Concurrency** | Single query | Multiple concurrent requests |
| **Type Safety** | None | Full TypeScript |
| **Scalability** | Limited | Enterprise-ready |
| **Deployment** | Script execution | Docker, Kubernetes, serverless |

---

## 🐛 Troubleshooting

**Port 3000 already in use?**
```bash
# Change in .env
PORT=3001
```

**API key errors?**
- Check `.env` file has correct values
- Verify keys aren't expired
- Test OpenAI key at platform.openai.com
- Test RapidAPI key at rapidapi.com

**Build errors?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📚 Documentation

- **Full Guide**: See [CONVERSION_GUIDE.md](CONVERSION_GUIDE.md)
- **Project Docs**: See [README.md](README.md)
- **NestJS Docs**: https://docs.nestjs.com/

---

**That's it! You're ready to go! 🚀**
