#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${BOLD}==> $1${NC}"; }
success() { echo -e "${GREEN}    ✓ $1${NC}"; }
warn()    { echo -e "${YELLOW}    ! $1${NC}"; }
die()     { echo -e "${RED}    ✗ $1${NC}"; exit 1; }

# Resolve 'docker compose' (plugin) or 'docker-compose' (standalone)
docker_compose() {
  if docker compose version >/dev/null 2>&1; then
    docker compose "$@"
  elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose "$@"
  else
    die "Neither 'docker compose' nor 'docker-compose' found. Install Docker from https://docs.docker.com/get-docker/"
  fi
}

# ── 1. Check required tools ────────────────────────────────────────────────────

info "Checking required tools..."

command -v docker  >/dev/null 2>&1 || die "Docker not found. Install from https://docs.docker.com/get-docker/"
command -v python3 >/dev/null 2>&1 || die "Python 3 not found. Install from https://python.org"
command -v node    >/dev/null 2>&1 || die "Node.js not found. Install from https://nodejs.org"
command -v npm     >/dev/null 2>&1 || die "npm not found. Install Node.js from https://nodejs.org"

PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
PYTHON_MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
PYTHON_MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
if [[ "$PYTHON_MAJOR" -lt 3 ]] || { [[ "$PYTHON_MAJOR" -eq 3 ]] && [[ "$PYTHON_MINOR" -lt 11 ]]; }; then
  die "Python 3.11+ required, found $PYTHON_VERSION"
fi

success "docker, python $PYTHON_VERSION, node $(node -v)"

# ── 2. Install uv if missing ───────────────────────────────────────────────────

if ! command -v uv >/dev/null 2>&1; then
  info "Installing uv (Python package manager)..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  # shellcheck source=/dev/null
  source "$HOME/.cargo/env" 2>/dev/null || export PATH="$HOME/.local/bin:$PATH"
  command -v uv >/dev/null 2>&1 || die "uv install failed. Add ~/.local/bin to your PATH and re-run."
  success "uv installed"
else
  success "uv $(uv --version)"
fi

# ── 3. Backend dependencies ────────────────────────────────────────────────────

info "Installing backend dependencies..."
cd "$ROOT_DIR/backend"
uv sync
success "Backend dependencies installed"

# ── 4. Frontend dependencies ───────────────────────────────────────────────────

info "Installing frontend dependencies..."
cd "$ROOT_DIR/frontend"
npm install --silent
success "Frontend dependencies installed"

# ── 5. Environment file ────────────────────────────────────────────────────────

info "Setting up environment..."
cd "$ROOT_DIR"

if [[ -f ".env" ]]; then
  warn ".env already exists — skipping"
else
  cp .env.example .env

  # Auto-generate secrets so the app can start immediately
  JWT_SECRET=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
  FERNET_KEY=$(cd "$ROOT_DIR/backend" && uv run python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null || echo "")

  # Replace placeholder values in-place (works on both macOS and Linux)
  sed -i.bak "s|^JWT_SECRET_KEY=.*|JWT_SECRET_KEY=$JWT_SECRET|" .env

  if [[ -n "$FERNET_KEY" ]]; then
    sed -i.bak "s|^FIELD_ENCRYPTION_KEY=.*|FIELD_ENCRYPTION_KEY=$FERNET_KEY|" .env
  fi

  rm -f .env.bak
  success ".env created with auto-generated JWT_SECRET_KEY and FIELD_ENCRYPTION_KEY"

  echo ""
  echo -e "${YELLOW}  Still required in .env:${NC}"
  echo "    GOOGLE_CLIENT_ID    → https://console.cloud.google.com"
  echo "    ANTHROPIC_API_KEY   → https://console.anthropic.com"
fi

# ── Done ───────────────────────────────────────────────────────────────────────

echo ""
echo -e "${GREEN}${BOLD}Setup complete.${NC}"
echo ""
echo "  Next: fill in GOOGLE_CLIENT_ID and ANTHROPIC_API_KEY in .env"
echo "  Then: ./dev_start.sh"
echo ""
