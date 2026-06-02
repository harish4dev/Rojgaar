from fastapi import HTTPException

from database import db
from schemas import Business, Partner, Worker
from services.auth_helpers import business_needs_profile, partner_needs_profile
from services.phone import normalize_phone_digits


async def resolve_user_after_otp(phone: str, role: str) -> dict:
    """Create or load user record after OTP has been verified."""
    digits = normalize_phone_digits(phone)

    if role == "worker":
        existing = await db.workers.find_one({"phone": digits}, {"_id": 0})
        if not existing:
            worker = Worker(phone=digits)
            await db.workers.insert_one(worker.model_dump())
            return {"success": True, "user": worker.model_dump(), "is_new": True}
        return {"success": True, "user": existing, "is_new": False}

    if role == "business":
        existing = await db.businesses.find_one({"phone": digits}, {"_id": 0})
        if not existing:
            business = Business(phone=digits)
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
        existing = await db.partners.find_one({"phone": digits}, {"_id": 0})
        if not existing:
            partner = Partner(phone=digits)
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
