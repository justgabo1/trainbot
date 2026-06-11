# TrainBot — Setup Guide

## Folder structure
```
trainbot/
  frontend/   ← Next.js app
  backend/    ← Node.js + Express API
```

## 1. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

## 2. Set environment variables

Copy `.env.example` to `.env` in both folders and fill in your keys.

## 3. Run

```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Open http://localhost:3000
