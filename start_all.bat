@echo off
echo ========================================================
echo Starting SchemeWise Platform Services...
echo ========================================================

echo 1. Starting ML & RAG FastAPI Service on port 8000...
start "SchemeWise ML-Service (8000)" cmd /k "cd /d %~dp0\ml-service && .\venv\Scripts\activate && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

echo 2. Starting Spring Boot Backend on port 8080...
start "SchemeWise Backend (8080)" cmd /k "cd /d %~dp0\backend && .\mvnw.cmd spring-boot:run"

echo 3. Starting React Frontend on port 5173...
start "SchemeWise Frontend (5173)" cmd /k "cd /d %~dp0\frontend && npm run dev"

echo.
echo All SchemeWise services initiated!
echo Frontend: http://localhost:5173
echo Backend: http://localhost:8080
echo ML Service: http://localhost:8000
echo ========================================================
