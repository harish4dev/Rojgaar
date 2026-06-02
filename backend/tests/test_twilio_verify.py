import asyncio
import os

import pytest
from fastapi import HTTPException

from services.phone import normalize_phone_digits, to_e164
from services.twilio_verify import check_verification, is_dev_otp_mode, send_verification, validate_otp_code


def test_normalize_phone_digits():
    assert normalize_phone_digits("9876543210") == "9876543210"
    assert normalize_phone_digits("+919876543210") == "9876543210"
    assert normalize_phone_digits("919876543210") == "9876543210"


def test_to_e164():
    assert to_e164("9876543210") == "+919876543210"


def test_validate_otp_code():
    assert validate_otp_code("1234") == "1234"
    with pytest.raises(HTTPException):
        validate_otp_code("123456")
    with pytest.raises(HTTPException):
        validate_otp_code("12")
    with pytest.raises(HTTPException):
        validate_otp_code("abcd")


def test_dev_mode_send_and_check(monkeypatch):
    monkeypatch.setenv("OTP_DEV_MODE", "true")
    monkeypatch.delenv("TWILIO_ACCOUNT_SID", raising=False)
    assert is_dev_otp_mode()
    result = asyncio.run(send_verification("9876543210"))
    assert result["success"] is True
    assert result["dev_mode"] is True
    asyncio.run(check_verification("9876543210", "1234"))
