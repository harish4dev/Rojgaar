from fastapi import APIRouter, HTTPException

from database import db
from schemas import Business, OtpRequest, OtpVerify, Partner, Worker
from services.auth_helpers import business_needs_profile, partner_needs_profile

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/send-otp")
async def send_otp(payload: OtpRequest):
    return {
        "success": True,
        "message": "OTP sent (mock). Any 4-digit code works.",
        "phone": payload.phone,
    }


@router.post("/verify-otp")
async def verify_otp(payload: OtpVerify):
    if not (payload.otp.isdigit() and len(payload.otp) == 4):
        raise HTTPException(status_code=400, detail="OTP must be 4 digits")

    role = payload.role
    if role == "worker":
        existing = await db.workers.find_one({"phone": payload.phone}, {"_id": 0})
        if not existing:
            worker = Worker(phone=payload.phone)
            await db.workers.insert_one(worker.model_dump())
            return {"success": True, "user": worker.model_dump(), "is_new": True}
        return {"success": True, "user": existing, "is_new": False}

    if role == "business":
        existing = await db.businesses.find_one({"phone": payload.phone}, {"_id": 0})
        if not existing:
            business = Business(phone=payload.phone)
            await db.businesses.insert_one(business.model_dump())
            user = business.model_dump()
            return {
                "success": True,
                "user": user,
                "is_new": True,
                "needs_profile": True,
            }
        return {
            "success": True,
            "user": existing,
            "is_new": False,
            "needs_profile": business_needs_profile(existing),
        }

    if role == "partner":
        existing = await db.partners.find_one({"phone": payload.phone}, {"_id": 0})
        if not existing:
            partner = Partner(phone=payload.phone)
            await db.partners.insert_one(partner.model_dump())
            user = partner.model_dump()
            return {
                "success": True,
                "user": user,
                "is_new": True,
                "needs_profile": True,
            }
        return {
            "success": True,
            "user": existing,
            "is_new": False,
            "needs_profile": partner_needs_profile(existing),
        }

    raise HTTPException(status_code=400, detail="Invalid role")
