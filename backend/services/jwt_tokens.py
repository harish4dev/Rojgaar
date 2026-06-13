import os
from datetime import datetime, timedelta, timezone

import jwt

SECRET = os.getenv("JWT_SECRET", "rojgaar-dev-secret-change-in-production")
ALGORITHM = "HS256"
WORKER_TOKEN_DAYS = int(os.getenv("WORKER_TOKEN_DAYS", "30"))


def create_worker_token(worker_id: str, phone: str) -> str:
    payload = {
        "sub": worker_id,
        "phone": phone,
        "role": "worker",
        "exp": datetime.now(timezone.utc) + timedelta(days=WORKER_TOKEN_DAYS),
    }
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    return jwt.decode(token, SECRET, algorithms=[ALGORITHM])
