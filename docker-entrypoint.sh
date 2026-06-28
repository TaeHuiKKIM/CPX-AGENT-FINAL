#!/bin/sh
set -eu

python - <<'PY'
import json
import os
from pathlib import Path

dist = Path("/app/dist")
dist.mkdir(parents=True, exist_ok=True)

config = {
    "VITE_SUPABASE_URL": os.getenv("VITE_SUPABASE_URL") or os.getenv("SUPABASE_URL") or "",
    "VITE_SUPABASE_ANON_KEY": os.getenv("VITE_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_ANON_KEY") or "",
    "VITE_API_BASE_URL": os.getenv("VITE_API_BASE_URL") or "/api",
    "VITE_FASTAPI_BASE_URL": os.getenv("VITE_FASTAPI_BASE_URL") or "/api/v1",
    "VITE_FASTAPI_WS_URL": os.getenv("VITE_FASTAPI_WS_URL") or "",
}

(dist / "env.js").write_text(
    "window.__APP_CONFIG__ = " + json.dumps(config, ensure_ascii=False) + ";\n",
    encoding="utf-8",
)
PY

exec uvicorn main:app --app-dir /app/backend --host 0.0.0.0 --port "${PORT:-8000}"
