import re

from fastapi import HTTPException

_INDIAN_MOBILE = re.compile(r"^[6-9]\d{9}$")


def normalize_phone_digits(phone: str) -> str:
    """Return 10-digit Indian mobile number (no country code)."""
    digits = re.sub(r"\D", "", phone or "")
    if len(digits) == 12 and digits.startswith("91"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]
    if not _INDIAN_MOBILE.match(digits):
        raise HTTPException(
            status_code=400,
            detail="Phone must be a valid 10-digit Indian mobile number",
        )
    return digits


def to_e164(phone: str) -> str:
    return f"+91{normalize_phone_digits(phone)}"
