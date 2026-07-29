# AI Placement Mission Control

Multi-agent AI system for placement interview preparation.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB running locally (`mongod`)
- OpenAI API key

### Setup

1. **Backend**
```bash
cd backend
pip install -r requirements.txt
# Edit .env and add your OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
```

Or just run `start.bat` from the root.

### URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Agent Flow

```
Student → Setup → [ResumeAnalyst] → [Strategist] → [Interviewer]
       → [Evaluator + Coach] per answer → [PracticeGenerator] → [ProgressAgent] → Dashboard
```

## Environment Variables

**backend/.env**
```
OPENAI_API_KEY=sk-...
MONGODB_URL=mongodb://localhost:27017
DB_NAME=placement_mission_control
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
