@echo off
echo Starting AI Placement Mission Control...

echo.
echo [1/2] Starting FastAPI backend...
start "Backend" cmd /k "cd backend && pip install -r requirements.txt && uvicorn main:app --reload --port 8000"

timeout /t 3

echo [2/2] Starting Next.js frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo API Docs: http://localhost:8000/docs
