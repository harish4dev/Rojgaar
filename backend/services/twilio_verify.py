import logging
import os
from typing import Optional

from fastapi import HTTPException

from services.phone import to_e164

logger = logging.getLogger(__name__)

OTP_LENGTH = 4


def _env(name: str) -> Optional[str]:
    value = os.environ.get(name, "").strip()
    return value or None


def is_twilio_configured() -> bool:
    return all(
        (
            _env("TWILIO_ACCOUNT_SID"),
            _env("TWILIO_AUTH_TOKEN"),
            _env("TWILIO_VERIFY_SERVICE_SID"),
        )
    )


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


async def send_verification(phone: str) -> dict:
    """Send OTP via Twilio Verify (SMS)."""
    e164 = to_e164(phone)

    if is_dev_otp_mode():
        logger.info("OTP dev mode: skip Twilio send for %s", e164[-4:].rjust(len(e164), "*"))
        return {
            "success": True,
            "message": "OTP sent (development mode).",
            "phone": normalize_display_phone(phone),
            "dev_mode": True,
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
    """Validate OTP with Twilio Verify."""
    cleaned = validate_otp_code(code)
    e164 = to_e164(phone)

    if is_dev_otp_mode():
        logger.info("OTP dev mode: accept code for %s", e164[-4:].rjust(len(e164), "*"))
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
