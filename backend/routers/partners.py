from fastapi import APIRouter, HTTPException

from database import db
from schemas import CandidateCreate, CandidateOtpConfirm, PartnerProfileUpdate
from services.db_helpers import get_doc_or_404
from services.partner_candidates import (
    confirm_pending_registration,
    save_pending_registration,
    validate_candidate_payload,
)

router = APIRouter(prefix="/partners", tags=["partners"])


@router.get("/{partner_id}")
async def get_partner(partner_id: str):
    return await get_doc_or_404("partners", partner_id, "Partner not found")


@router.patch("/{partner_id}")
async def update_partner(partner_id: str, payload: PartnerProfileUpdate):
    name = payload.name.strip()
    city = payload.city.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="name is required")
    if len(city) < 2:
        raise HTTPException(status_code=400, detail="city is required")

    await get_doc_or_404("partners", partner_id, "Partner not found")
    updates = {"name": name, "city": city, "profile_complete": True}
    await db.partners.update_one({"id": partner_id}, {"$set": updates})
    return await get_doc_or_404("partners", partner_id, "Partner not found")


@router.get("/{partner_id}/stats")
async def partner_stats(partner_id: str):
    people_added = await db.partner_candidates.count_documents({"partner_id": partner_id})
    matched = await db.partner_candidates.count_documents({"partner_id": partner_id, "status": "Matched"})
    placed = await db.partner_candidates.count_documents({"partner_id": partner_id, "status": "Placed"})
    return {
        "people_added": people_added,
        "job_matches": matched,
        "placed": placed,
        "total_earnings": placed * 2000,
    }


@router.get("/{partner_id}/candidates")
async def partner_candidates(partner_id: str):
    return await db.partner_candidates.find({"partner_id": partner_id}, {"_id": 0}).sort("created_at", -1).to_list(200)


@router.post("/{partner_id}/candidates/request-otp")
async def request_partner_candidate_otp(partner_id: str, payload: CandidateCreate):
    """Partner submits employee details; OTP is sent to the employee phone (mock)."""
    validate_candidate_payload(payload)
    await save_pending_registration(partner_id, payload)
    return {
        "success": True,
        "message": "OTP sent to employee (mock). Any 4-digit code works.",
        "phone": payload.employee_number,
    }


@router.post("/{partner_id}/candidates/confirm")
async def confirm_partner_candidate(partner_id: str, payload: CandidateOtpConfirm):
    """Partner enters OTP received by the employee to complete registration."""
    result = await confirm_pending_registration(
        partner_id,
        payload.employee_number,
        payload.otp,
    )
    return {"success": True, **result}


@router.post("/{partner_id}/candidates")
async def add_partner_candidate(partner_id: str, payload: CandidateCreate):
    """Legacy direct add — requires OTP confirmation via /confirm instead."""
    raise HTTPException(
        status_code=400,
        detail="Use /candidates/request-otp then /candidates/confirm with employee OTP",
    )
