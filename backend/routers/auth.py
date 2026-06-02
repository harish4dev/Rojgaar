from fastapi import APIRouter, HTTPException

from schemas import OtpRequest, OtpVerify
from services.auth_users import resolve_user_after_otp
from services.phone import normalize_phone_digits
from services.twilio_verify import check_verification, send_verification

router = APIRouter(prefix="/auth", tags=["auth"])

VALID_ROLES = {"worker", "business", "partner"}


@router.post("/send-otp")
async def send_otp(payload: OtpRequest):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    phone = normalize_phone_digits(payload.phone)
    result = await send_verification(phone)
    return {**result, "phone": phone, "role": payload.role}


@router.post("/verify-otp")
async def verify_otp(payload: OtpVerify):
    if payload.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail="Invalid role")
    phone = normalize_phone_digits(payload.phone)
    await check_verification(phone, payload.otp)
    return await resolve_user_after_otp(phone, payload.role)
