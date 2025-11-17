## **Sentiment Aura**

A full-stack real-time speech analysis app powered by Deepgram, OpenAI, and p5.js.

## **Features**

Live transcription using Deepgram WebSocket

Sentiment analysis + keyword extraction using OpenAI

Animated emotion-reactive background using p5.js

React frontend with Vite

Node.js backend for AI processing

## **Project Structure**

sentiment-aura/
│
├── backend/        # Node.js API (sentiment + keywords)
│   ├── server.js
│   └── package.json
│
├── frontend/       # React UI + audio streaming + p5.js aura
│   ├── src/
│   ├── public/
│   └── package.json
│
└── README.md

## **How to Run**

### Backend
cd backend
npm install
node server.js

### Create backend/.env:
OPENAI_API_KEY=your_key_here

### Frontend
cd frontend
npm install
npm run dev

## Create frontend/.env:
VITE_DEEPGRAM_KEY=your_key_here

Open the app:
👉 http://localhost:5173

## **Tech Stack**

Deepgram WebSocket (live transcription)

OpenAI API (sentiment + keywords)

React + Vite

p5.js animated background

Node.js backend

## .gitignore
### Make a .gitignore in project root and add:

node_modules
npm-debug.log
dist

.env
backend/.env
frontend/.env

.DS_Store
.vscode

## **Status**

Project complete and ready for GitHub.