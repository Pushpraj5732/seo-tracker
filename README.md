# 🔍 SEO Tracker

Full-stack SEO analysis and keyword rank tracking platform powered by Google Gemini AI.

## Features

- AI-powered website SEO analysis with score breakdown
- Keyword rank tracking with daily automated checks
- Historical ranking trends and analytics
- JWT-based user authentication
- Responsive dark-themed dashboard

## Tech Stack

**Frontend:** React, TypeScript, Vite, Tailwind CSS  
**Backend:** Node.js, Express, MongoDB, Gemini AI, Cheerio  

## Setup

### Backend

```bash
cd server
npm install
cp .env.example .env   # Fill in your credentials
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env   # Set backend URL
npm run dev
```

## Environment Variables

**Server** (`server/.env`)

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `SERPER_API_KEY` | Serper.dev API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `PORT` | Server port (default: 5000) |

**Frontend** (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend API URL |

## License

[MIT](frontend/LICENSE.md)
