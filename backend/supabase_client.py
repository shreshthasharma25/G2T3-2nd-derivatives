import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from supabase import Client, create_client


# Load environment variables from backend/.env or root .env
_backend_dir = Path(__file__).resolve().parent
_root_dir = _backend_dir.parent

_env_backend = _backend_dir / ".env"
_env_root = _root_dir / ".env"

if _env_backend.exists():
    load_dotenv(dotenv_path=_env_backend)
elif _env_root.exists():
    load_dotenv(dotenv_path=_env_root)
else:
    load_dotenv()


# Read Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")

_client: Optional[Client] = None


# Create Supabase client using the server-side secret key
if SUPABASE_URL and SUPABASE_SECRET_KEY:
    try:
        _client = create_client(
            SUPABASE_URL,
            SUPABASE_SECRET_KEY
        )
    except Exception:
        _client = None


def get_supabase_client() -> Client:
    """Return the active Supabase client instance."""

    global _client

    if _client is not None:
        return _client

    url = os.getenv("SUPABASE_URL") or SUPABASE_URL
    key = os.getenv("SUPABASE_SECRET_KEY") or SUPABASE_SECRET_KEY

    if not url or not key:
        raise RuntimeError(
            "Supabase credentials not configured. "
            "Please define SUPABASE_URL and "
            "SUPABASE_SECRET_KEY in backend/.env"
        )

    _client = create_client(url, key)

    return _client