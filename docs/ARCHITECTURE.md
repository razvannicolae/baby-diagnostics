# Architecture Reference

Detailed implementation reference for Baby Diagnostics. For high-level rules and decisions, see `/CLAUDE.md`.

## File Structure

```
baby-diagnostics/
├── CLAUDE.md
├── docker-compose.yml / docker-compose.dev.yml
├── nginx/
│   ├── nginx.conf                  # Production reverse proxy
│   └── nginx.dev.conf
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/versions/
│   ├── app/
│   │   ├── main.py                 # FastAPI app factory, middleware, lifespan
│   │   ├── config.py               # Pydantic Settings
│   │   ├── api/
│   │   │   ├── router.py           # Aggregates route modules
│   │   │   ├── dependencies.py     # get_db, get_current_user, rate_limiter
│   │   │   └── routes/             # auth, users, babies, analysis, scans, chat, health
│   │   ├── core/                   # security, rate_limiter, websocket, exceptions
│   │   ├── db/
│   │   │   ├── session.py          # Async engine + sessionmaker
│   │   │   ├── base.py             # Declarative base
│   │   │   └── models/             # user, baby, scan, biomarker, chat
│   │   ├── repositories/           # user_repo, baby_repo, scan_repo, chat_repo
│   │   ├── services/               # auth_service, diagnostic_service, chat_service
│   │   ├── cv/
│   │   │   ├── opencv_analyzer.py  # Full pipeline: detect → segment → extract → match
│   │   │   ├── color_matching.py   # HSV distance (hue weighted 2x, circular wraparound)
│   │   │   ├── preprocessing.py    # Resize, white balance, HSV conversion
│   │   │   └── calibration/
│   │   │       └── default.yaml    # Reference HSV values per biomarker concentration
│   │   ├── llm/                    # client, prompts, conversation
│   │   └── schemas/                # Pydantic: auth, user, baby, scan, chat
│   └── tests/
│       ├── conftest.py
│       ├── test_api/
│       ├── test_cv/
│       └── test_services/
├── frontend/
│   ├── Dockerfile
│   ├── src/
│   │   ├── App.tsx                 # Router + auth provider
│   │   ├── contexts/AuthContext.tsx # Google auth + JWT management
│   │   ├── hooks/                  # useAuth, useCamera, useAnalysis, useWebSocket, useScans
│   │   ├── services/               # api.ts (axios + JWT interceptor), websocket.ts
│   │   ├── pages/                  # Login, Home, Capture, Results, Chat
│   │   ├── components/             # ui/, camera/, analysis/, chat/, layout/
│   │   └── types/                  # auth, scan, chat
└── scripts/
    ├── extract-calibration-colors.py
    └── validate-calibration.py
```

## Database Schema

All tables: UUID PKs, UTC timestamps. PII encrypted at app layer.

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_encrypted BYTEA,
    display_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

CREATE TABLE babies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'normal',  -- 'normal', 'flagged', 'alert'
    confidence FLOAT NOT NULL,
    image_hash VARCHAR(64),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE biomarker_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    marker_name VARCHAR(50) NOT NULL,   -- 'ph', 'creatinine', 'vitamin_a', 'vitamin_d'
    value VARCHAR(50) NOT NULL,
    numeric_value FLOAT,
    category VARCHAR(20) NOT NULL,      -- 'normal', 'trace', 'low', 'moderate', 'high'
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    reference_range VARCHAR(100),
    UNIQUE(scan_id, marker_name)
);

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_id UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,          -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_babies_user_id ON babies(user_id);
CREATE INDEX idx_scans_baby_id ON scans(baby_id);
CREATE INDEX idx_scans_user_id_created ON scans(user_id, created_at DESC);
CREATE INDEX idx_biomarkers_scan_id ON biomarker_readings(scan_id);
CREATE INDEX idx_chat_scan_id ON chat_messages(scan_id, created_at ASC);
```

## SQLAlchemy Pattern

Use SQLAlchemy 2.0 declarative with `mapped_column()`. Relationships with `back_populates`. Cascade `all, delete-orphan` on parent relationships.

## DB Connection

Async engine via `asyncpg`. Pool: size=20, max_overflow=10, pre_ping=True, recycle=3600. Session yields with commit/rollback in `get_db`.

## Auth Flow

1. Frontend: Google Sign-In SDK → ID token
2. `POST /api/auth/google` → backend verifies via `google-auth` against Google public keys
3. Backend creates/updates user → issues app JWT (HS256, 60min expiry)
4. Frontend: JWT in `Authorization: Bearer` header on all requests
5. `get_current_user` dependency validates JWT, loads user from DB

## Calibration YAML Format

```yaml
strip_type: "babybio_v1"
pad_count: 4
pad_order: ["ph", "creatinine", "vitamin_a", "vitamin_d"]
pad_geometry:       # Normalized 0-1 coordinates relative to detected strip
  ph:           { x_start: 0.05, x_end: 0.22, y_start: 0.15, y_end: 0.85 }
  creatinine:   { x_start: 0.28, x_end: 0.47, y_start: 0.15, y_end: 0.85 }
  vitamin_a:    { x_start: 0.53, x_end: 0.72, y_start: 0.15, y_end: 0.85 }
  vitamin_d:    { x_start: 0.78, x_end: 0.95, y_start: 0.15, y_end: 0.85 }
reference_colors:   # HSV (OpenCV: H 0-179, S 0-255, V 0-255)
  ph:
    - { value: "5.0", category: "normal", hsv: [10, 200, 180] }
    - { value: "6.0", category: "normal", hsv: [25, 180, 200] }
    - { value: "7.0", category: "normal", hsv: [55, 150, 220] }
    - { value: "8.0", category: "elevated", hsv: [85, 180, 200] }
    - { value: "9.0", category: "high", hsv: [100, 200, 180] }
  # ... similar for creatinine, vitamin_a, vitamin_d
thresholds:
  high_confidence_max_distance: 25
  low_confidence_min_distance: 60
  reject_distance: 100
```

## Environment Variables

See `.env.example`. Key vars: `DATABASE_URL`, `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`, `ANTHROPIC_API_KEY`, `FIELD_ENCRYPTION_KEY`, `CALIBRATION_PATH`, `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, `VITE_WS_URL`.

## Backend Dependencies

FastAPI, uvicorn, python-multipart, websockets, SQLAlchemy[asyncio], asyncpg, alembic, google-auth, python-jose[cryptography], cryptography, opencv-python-headless, numpy, pillow, pyyaml, anthropic, pydantic, pydantic-settings. Dev: pytest, pytest-asyncio, httpx, ruff, coverage.

## Frontend Dependencies

react, react-dom, react-router-dom, @react-oauth/google, axios. Dev: typescript, vite, @vitejs/plugin-react, tailwindcss, vitest, @testing-library/react.

## Deployment

EC2 t3.medium, Ubuntu 22.04, Docker Compose. Nginx terminates TLS (Let's Encrypt/Certbot). Security headers: X-Frame-Options, X-Content-Type-Options, HSTS, CSP. HTTP→HTTPS redirect. WebSocket proxy at `/ws/`. Client max body 12MB.
