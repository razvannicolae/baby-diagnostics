#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Resolve 'docker compose' (plugin) or 'docker-compose' (standalone)
docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    echo "Error: neither 'docker compose' nor 'docker-compose' found." >&2; exit 1
  fi
}

echo "==> Starting PostgreSQL..."
docker_compose -f "$ROOT_DIR/docker-compose.dev.yml" up db -d

echo "==> Waiting for database to be ready..."
until docker_compose -f "$ROOT_DIR/docker-compose.dev.yml" exec db pg_isready -U babybio -q 2>/dev/null; do
  sleep 1
done

echo "==> Running migrations..."
cd "$ROOT_DIR/backend"
uv run alembic upgrade head

echo "==> Starting backend (port 8000)..."
uv run uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

echo "==> Starting frontend (port 5173)..."
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

cleanup() {
  echo ""
  echo "==> Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "==> Stopped."
}
trap cleanup INT TERM

echo ""
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  Press Ctrl+C to stop all services"
echo ""

wait
