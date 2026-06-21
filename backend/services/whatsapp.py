import logging
import os
from typing import Optional

from services.phone import to_e164
from services.twilio_verify import is_twilio_configured

logger = logging.getLogger(__name__)


def _env(name: str) -> Optional[str]:
    value = os.environ.get(name, "").strip()
    return value or None


def is_whatsapp_enabled() -> bool:
    return bool(_env("TWILIO_WHATSAPP_FROM")) and is_twilio_configured()


def _twilio_client():
    from twilio.rest import Client

    account_sid = _env("TWILIO_ACCOUNT_SID")
    auth_token = _env("TWILIO_AUTH_TOKEN")
    if not account_sid or not auth_token:
        return None
    return Client(account_sid, auth_token)


async def send_whatsapp_message(phone: str, body: str) -> bool:
    dev_mode = os.environ.get("OTP_DEV_MODE", "").strip().lower() in ("1", "true", "yes")
    if dev_mode or not is_whatsapp_enabled():
        logger.info("WhatsApp dev/disabled mode for %s: %s", phone, body)
        return True
    client = _twilio_client()
    if not client:
        return False
    from_number = _env("TWILIO_WHATSAPP_FROM")
    if not from_number:
        return False
    try:
        to_number = f"whatsapp:{to_e164(phone)}"
        from_whatsapp = from_number if from_number.startswith("whatsapp:") else f"whatsapp:{from_number}"
        client.messages.create(
            from_=from_whatsapp,
            to=to_number,
            body=body,
        )
        return True
    except Exception:  # pylint: disable=broad-except
        logger.exception("WhatsApp send failed")
        return False


def application_status_message(status: str, job_title: str) -> str:
    return f"Update from Rojgaar: Your application for {job_title} is now {status}."
