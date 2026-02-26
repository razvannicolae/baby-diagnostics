cd /Users/razvannicolae/Code/baby-diagnostics
docker compose -f docker-compose.dev.yml up db -d

cd backend
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

cd frontend
npm run dev 