# Baby Diagnostics

Mobile web app for NICU staff to scan baby diagnostic test strips with their phone camera. OpenCV color-matches pad readings to report pH, creatinine, and vitamin levels, with Claude AI chat to explain results.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.11, FastAPI (async), SQLAlchemy 2.0, asyncpg |
| Database | PostgreSQL 16 |
| Auth | Google Sign-In → app JWT (HS256) |
| CV | OpenCV 4.9+ headless, manual HSV calibration |
| AI Chat | Anthropic Claude Haiku, streaming via WebSocket |
| Deploy | AWS EC2, Docker Compose, Nginx, Let's Encrypt |

## Getting Started

**Prerequisites:** Docker, Python 3.11+, Node.js

1. Run the setup script (installs `uv`, backend + frontend deps, generates `.env`):
   ```bash
   ./setup.sh
   ```

2. Fill in the two external keys in `.env`:
   ```
   GOOGLE_CLIENT_ID=    # console.cloud.google.com
   ANTHROPIC_API_KEY=   # console.anthropic.com
   ```

3. Start everything:
   ```bash
   ./dev_start.sh
   ```
   This starts PostgreSQL (Docker), runs migrations, and launches backend (`:8000`) and frontend (`:5173`).

## How It Works

1. Staff sign in with Google on their phone
2. Point camera at a BabyBio test strip and capture
3. OpenCV detects the strip, segments the 4 color pads, and computes median HSV per pad
4. Each pad's color is matched against calibrated reference values in `backend/app/cv/calibration/default.yaml`
5. Results (pH, creatinine, vitamin A, vitamin D) are displayed with flagged values highlighted
6. Claude AI chat is available on each scan to explain what the results may indicate

> **Note:** The CV pipeline uses no ML — purely rule-based HSV color matching. This is intentional given limited labeled training data.

## Project Structure

```
baby-diagnostics/
├── backend/        # FastAPI app (routes → services → repositories → models)
│   └── app/
│       ├── api/    # Route handlers + dependencies
│       ├── cv/     # OpenCV pipeline + calibration YAML
│       ├── llm/    # Claude client + prompts
│       ├── db/     # SQLAlchemy models + session
│       └── ...
├── frontend/       # React SPA
│   └── src/
│       ├── pages/  # Login, Home, Capture, Results, Chat, Trends, Profile
│       ├── hooks/  # useCamera, useAnalysis, useWebSocket, useScans, ...
│       └── ...
├── docs/           # Architecture reference, DB schema, deployment config
└── dev_start.sh    # One-command dev startup
```

## Security Notes

- JWT stored in React ref only (not localStorage)
- Images never persisted — processed in memory, only SHA-256 hash saved
- PII (email) encrypted with Fernet (AES-256-GCM) before DB storage
- AI chat is explicitly constrained: no diagnoses, no treatment advice
