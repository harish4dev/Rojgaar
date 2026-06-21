from fastapi import Depends, Header, HTTPException
from jwt import ExpiredSignatureError, InvalidTokenError

from services.jwt_tokens import decode_token


async def get_worker_auth(authorization: str | None = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    token = authorization[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization")
    try:
        claims = decode_token(token)
    except ExpiredSignatureError as exc:
        raise HTTPException(status_code=401, detail="Session expired. Please sign in again.") from exc
    except InvalidTokenError as exc:
        raise HTTPException(status_code=401, detail="Invalid session. Please sign in again.") from exc
    if claims.get("role") != "worker" or not claims.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")
    return claims


def require_worker_id(worker_id: str, claims: dict = Depends(get_worker_auth)) -> dict:
    if claims["sub"] != worker_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return claims
