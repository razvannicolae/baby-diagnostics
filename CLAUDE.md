# CLAUDE.md

## Project Overview

**Baby Diagnostics (BabyBio)** — Monorepo mobile web app for analyzing baby diagnostic test strips using computer vision. AI chat for result explanations. NICU workflow.

**Flow:** Phone → Google Sign-In → capture test strip photo → OpenCV analyzes colors → results displayed → AI chat for follow-up.

## Tech Stack

- **Frontend:** TypeScript, React 18, Vite, Tailwind CSS
- **Backend:** Python 3.11+, FastAPI (async), SQLAlchemy 2.0 (async) + Alembic, asyncpg
- **Database:** PostgreSQL 16 (UUID PKs, UTC timestamps)
- **Auth:** Google Sign-In → `google-auth` verification → app JWT (`python-jose`, HS256)
- **CV:** OpenCV 4.9+ headless — manual HSV calibration, NO ML models
- **LLM:** Anthropic Claude Haiku (`claude-haiku-4-5-20251001`), streaming via WebSocket
- **Deploy:** AWS EC2 (t3.medium), Docker Compose, Nginx, Let's Encrypt

## Architecture Rules

1. **Layered separation:** Routes (HTTP only) → Services (business logic) → Repositories (DB queries) → Models (data shapes: Pydantic for API, SQLAlchemy for DB)
2. **Async everywhere:** All DB calls via `asyncpg`, all external APIs async. Never block route handlers.
3. **Dependency injection:** Use FastAPI `Depends()` for DB sessions, auth, rate limiters.
4. **Fail gracefully:** try/except all external calls, return meaningful HTTP errors. Never expose stack traces.
5. **No module cross-imports:** Each package has a clear public interface.

## Key Design Decisions

- **No ML in CV pipeline.** All analysis uses OpenCV color matching against manually calibrated HSV reference values in `backend/app/cv/calibration/default.yaml`. This is deliberate — not enough labeled training data.
- **JWT in memory only.** Frontend stores app JWT in React ref, NOT localStorage (XSS risk).
- **Images never stored.** Processed in memory, only SHA-256 hash saved for audit.
- **Field encryption:** PII (email) encrypted with Fernet (AES-256-GCM) at app layer before DB storage.

## Security Rules

- CORS: Restrict to frontend domain only. Never `allow_origins=["*"]` in production.
- File uploads: Max 10MB, JPEG/PNG only. Validate MIME type AND magic bytes.
- Rate limiting: Per-user, per-endpoint (analysis: 10/min, chat: 30/min, auth: 5/min).
- Never log: JWT tokens, API keys, user emails, image data.
- SQL injection: SQLAlchemy parameterized queries only. No raw string formatting.
- XSS: Never use `dangerouslySetInnerHTML`. Set CSP headers.
- DB connection: Use `sslmode=require` even on same host.

## LLM Guardrails

The system prompt in `backend/app/llm/prompts.py` MUST enforce:
- Never diagnose. Only explain what results might indicate.
- Always recommend consulting a pediatrician.
- Refuse medication/dosing/treatment questions — direct to doctor.
- Under 200 words unless asked for detail. Temperature 0.3.

## API Surface

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/google` | None | Verify Google token → app JWT |
| GET | `/api/users/me` | JWT | User profile |
| CRUD | `/api/babies` | JWT | Baby profiles |
| POST | `/api/analyze` | JWT | Upload image → CV analysis → biomarker results |
| GET | `/api/scans`, `/api/scans/{id}` | JWT | Scan history |
| DELETE | `/api/scans/{id}` | JWT | Delete scan |
| GET | `/api/health` | None | Health check |
| WS | `/ws/chat/{scan_id}?token={jwt}` | JWT | Streaming LLM chat |

**WebSocket protocol:** Client sends `{"type":"message","content":"..."}`, server streams `{"type":"token","content":"..."}`, ends with `{"type":"done"}`.

**Analysis response shape:** `{scan_id, status, confidence, biomarkers: [{marker_name, value, numeric_value, category, is_flagged, reference_range}], created_at}`

## CV Pipeline Summary

1. Validate MIME + magic bytes → 2. Decode to numpy → 3. Resize (1920px max), white balance, BGR→HSV → 4. Contour detection for strip (3:1–5:1 aspect ratio) → 5. Perspective correct → 6. Segment 4 pads (geometry from calibration YAML) → 7. Sample center 60% of each pad, median HSV → 8. Weighted Euclidean distance (hue 2x weight) to reference gradient → 9. Return results with confidence scores.

**Biomarkers:** pH, creatinine, vitamin A, vitamin D.

## Frontend Routes

- `/login` — Google Sign-In
- `/` — Dashboard (scan history, baby selector)
- `/capture` — Camera capture
- `/results/:id` — Biomarker results display
- `/chat/:scanId` — AI chat

All routes except `/login` wrapped in `<ProtectedRoute>`.

## Coding Standards

- **Python:** PEP 8, `ruff`, type hints on all signatures, docstrings on public APIs.
- **TypeScript:** Strict mode, no `any`, interfaces for API shapes, `const` over `let`.
- **Commits:** Conventional (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- **Branches:** `main` (production), `develop` (integration), `feature/*`.
- **No secrets in code.** All sensitive values from env vars. `.env` in `.gitignore`.
- **No dead code.** No commented-out code — use version control.
- **DRY but practical.** Extract shared logic only when used 3+ times.

## Testing

```bash
pytest --asyncio-mode=auto              # Run all
pytest --cov=app --cov-report=html      # With coverage
```

Test with separate DB. `conftest.py` manages create/teardown. Mock auth for route tests.

## Implementation Phases

1. **Foundation:** DB models, Alembic migrations, FastAPI skeleton, health check, Docker Compose
2. **Auth:** JWT + encryption utils, Google token verification, protected route dependency
3. **CRUD:** Baby profiles, scan history endpoints
4. **CV:** Color matching, preprocessing, calibration YAML, analyzer, analysis endpoint
5. **LLM Chat:** System prompt, Anthropic client, WebSocket handler, conversation manager
6. **Security:** Rate limiters, field encryption, input validation, CORS, security headers
7. **Frontend:** Auth context, API client, camera capture, results display, chat UI, navigation
8. **Deploy:** Dockerfiles, Nginx config, EC2 setup, Certbot HTTPS
9. **Testing:** Unit (CV, security), integration (API), WebSocket tests, mobile polish

## Detailed Reference

For full code examples, DB schema SQL, Docker/Nginx configs, calibration YAML format, and dependency lists, see `docs/ARCHITECTURE.md`.
