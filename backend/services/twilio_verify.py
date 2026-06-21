import logging
import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import HTTPException

from database import db
from services.phone import to_e164

logger = logging.getLogger(__name__)

OTP_LENGTH = 4
OTP_TTL_MINUTES = 10


def _env(name: str) -> Optional[str]:
    value = os.environ.get(name, "").strip()
    return value or None


def uses_android_sms_retriever() -> bool:
    """Custom SMS body with app hash for Google SMS Retriever (auto-fill on Android)."""
    return bool(_env("ANDROID_SMS_APP_HASH") and _env("TWILIO_SMS_FROM"))


def is_twilio_configured() -> bool:
    base = bool(_env("TWILIO_ACCOUNT_SID") and _env("TWILIO_AUTH_TOKEN"))
    if uses_android_sms_retriever():
        return base
    return base and bool(_env("TWILIO_VERIFY_SERVICE_SID"))


def is_dev_otp_mode() -> bool:
    """Use mock OTP when explicitly enabled or Twilio is not configured."""
    flag = os.environ.get("OTP_DEV_MODE", "").strip().lower()
    if flag in ("1", "true", "yes"):
        return True
    if flag in ("0", "false", "no"):
        return False
    return not is_twilio_configured()


def validate_otp_code(code: str) -> str:
    cleaned = (code or "").strip()
    if not cleaned.isdigit() or len(cleaned) != OTP_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"OTP must be {OTP_LENGTH} digits",
        )
    return cleaned


def _twilio_client():
    from twilio.rest import Client

    account_sid = _env("TWILIO_ACCOUNT_SID")
    auth_token = _env("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        raise HTTPException(
            status_code=503,
            detail="SMS verification is not configured on the server",
        )
    return Client(account_sid, auth_token)


def _verify_service_sid() -> str:
    sid = _env("TWILIO_VERIFY_SERVICE_SID")
    if not sid:
        raise HTTPException(
            status_code=503,
            detail="SMS verification is not configured on the server",
        )
    return sid


def _generate_otp() -> str:
    return f"{secrets.randbelow(10 ** OTP_LENGTH):0{OTP_LENGTH}d}"


async def _send_sms_with_hash(phone: str, code: str) -> None:
    app_hash = _env("ANDROID_SMS_APP_HASH")
    from_number = _env("TWILIO_SMS_FROM")
    if not app_hash or not from_number:
        raise HTTPException(status_code=503, detail="SMS autofill is not configured on the server")

    e164 = to_e164(phone)
    body = f"Your Rojgaar verification code is {code}\n\n{app_hash}"
    client = _twilio_client()
    try:
        client.messages.create(to=e164, from_=from_number, body=body)
    except Exception as exc:
        logger.exception("Twilio SMS send failed")
        raise HTTPException(
            status_code=502,
            detail="Could not send verification code. Try again shortly.",
        ) from exc


async def _store_otp(phone: str, code: str) -> None:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_TTL_MINUTES)
    await db.otp_codes.update_one(
        {"phone": phone},
        {"$set": {"code": code, "expires_at": expires_at}},
        upsert=True,
    )


async def _check_stored_otp(phone: str, code: str) -> None:
    doc = await db.otp_codes.find_one({"phone": phone}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    if doc.get("expires_at"):
        exp = doc["expires_at"]
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if exp < datetime.now(timezone.utc):
        await db.otp_codes.delete_one({"phone": phone})
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    if doc.get("code") != code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    await db.otp_codes.delete_one({"phone": phone})


async def send_verification(phone: str) -> dict:
    """Send OTP via Twilio Verify (SMS) or custom SMS with Android app hash."""
    e164 = to_e164(phone)
    digits = normalize_display_phone(phone)

    if is_dev_otp_mode():
        logger.info("OTP dev mode: skip Twilio send for %s", e164[-4:].rjust(len(e164), "*"))
        return {
            "success": True,
            "message": "OTP sent (development mode).",
            "phone": digits,
            "dev_mode": True,
        }

    if uses_android_sms_retriever():
        code = _generate_otp()
        await _store_otp(digits, code)
        await _send_sms_with_hash(digits, code)
        return {
            "success": True,
            "message": "Verification code sent via SMS.",
            "phone": digits,
            "dev_mode": False,
            "sms_autofill": True,
        }

    try:
        client = _twilio_client()
        verification = (
            client.verify.v2.services(_verify_service_sid())
            .verifications.create(to=e164, channel="sms")
        )
    except Exception as exc:
        logger.exception("Twilio Verify send failed")
        raise HTTPException(
            status_code=502,
            detail="Could not send verification code. Try again shortly.",
        ) from exc

    if verification.status not in ("pending", "approved"):
        raise HTTPException(status_code=502, detail="Could not send verification code")

    return {
        "success": True,
        "message": "Verification code sent via SMS.",
        "phone": normalize_display_phone(phone),
        "dev_mode": False,
    }


async def check_verification(phone: str, code: str) -> None:
    """Validate OTP with Twilio Verify or stored code (SMS Retriever mode)."""
    cleaned = validate_otp_code(code)
    digits = normalize_display_phone(phone)
    e164 = to_e164(phone)

    if is_dev_otp_mode():
        logger.info("OTP dev mode: accept code for %s", e164[-4:].rjust(len(e164), "*"))
        return

    if uses_android_sms_retriever():
        await _check_stored_otp(digits, cleaned)
        return

    try:
        client = _twilio_client()
        check = (
            client.verify.v2.services(_verify_service_sid())
            .verification_checks.create(to=e164, code=cleaned)
        )
    except Exception as exc:
        logger.exception("Twilio Verify check failed")
        raise HTTPException(status_code=502, detail="Could not verify code") from exc

    if check.status != "approved":
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")


def normalize_display_phone(phone: str) -> str:
    from services.phone import normalize_phone_digits

    return normalize_phone_digits(phone)
