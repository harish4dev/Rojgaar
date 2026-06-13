from datetime import datetime, timedelta, timezone
from typing import Any

from fastapi import HTTPException

from database import db
from meta_catalog import is_valid_industry, is_valid_job_role, normalize_industry_key
from schemas import CandidateCreate, PartnerCandidate, Worker, now_iso
from services.twilio_verify import check_verification, send_verification

PENDING_TTL_MINUTES = 15
GENDERS = {"Male", "Female", "Other"}
COLLAR_TYPES = {"Blue Collar", "Gray Collar"}


def validate_candidate_payload(payload: CandidateCreate) -> None:
    if payload.gender not in GENDERS:
        raise HTTPException(status_code=400, detail="gender must be Male, Female, or Other")
    if not (18 <= payload.age <= 70):
        raise HTTPException(status_code=400, detail="age must be between 18 and 70")
    if payload.collar_type not in COLLAR_TYPES:
        raise HTTPException(
            status_code=400,
            detail="collar_type must be Blue Collar or Gray Collar",
        )
    phone = payload.employee_number.strip()
    if not (phone.isdigit() and len(phone) == 10):
        raise HTTPException(status_code=400, detail="employee_number must be a 10-digit phone")
    industry = normalize_industry_key(payload.industry)
    if not is_valid_industry(industry):
        raise HTTPException(status_code=400, detail="Invalid industry")
    if not is_valid_job_role(industry, payload.skill):
        raise HTTPException(status_code=400, detail="Invalid job role for selected industry")


def _pending_key(partner_id: str, phone: str) -> dict[str, str]:
    return {"partner_id": partner_id, "employee_number": phone}


async def save_pending_registration(partner_id: str, payload: CandidateCreate) -> dict[str, Any]:
    validate_candidate_payload(payload)
    await get_doc_or_raise_partner(partner_id)
    phone = payload.employee_number.strip()
    existing = await db.partner_candidates.find_one(
        {"partner_id": partner_id, "employee_number": phone},
        {"_id": 0, "id": 1},
    )
    if existing:
        raise HTTPException(status_code=409, detail="This employee is already in your network")

    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=PENDING_TTL_MINUTES)).isoformat()
    doc = {
        **_pending_key(partner_id, phone),
        "payload": payload.model_dump(),
        "created_at": now_iso(),
        "expires_at": expires_at,
    }
    await db.partner_candidate_pending.update_one(
        _pending_key(partner_id, phone),
        {"$set": doc},
        upsert=True,
    )
    return doc


async def get_doc_or_raise_partner(partner_id: str) -> dict:
    from services.db_helpers import get_doc_or_404

    return await get_doc_or_404("partners", partner_id, "Partner not found")


async def send_employee_verification(partner_id: str, payload: CandidateCreate) -> dict[str, Any]:
    """Validate, store pending registration, and send OTP to employee phone."""
    await save_pending_registration(partner_id, payload)
    phone = payload.employee_number.strip()
    send_result = await send_verification(phone)
    return {
        "success": True,
        "message": send_result.get("message", "Verification code sent to employee."),
        "phone": phone,
        "dev_mode": send_result.get("dev_mode", False),
    }


async def confirm_pending_registration(
    partner_id: str,
    employee_number: str,
    otp: str,
) -> dict[str, Any]:
    phone = employee_number.strip()
    if not (phone.isdigit() and len(phone) == 10):
        raise HTTPException(status_code=400, detail="employee_number must be a 10-digit phone")

    await get_doc_or_raise_partner(partner_id)
    await check_verification(phone, otp)

    pending = await db.partner_candidate_pending.find_one(
        _pending_key(partner_id, phone),
        {"_id": 0},
    )
    if not pending:
        raise HTTPException(
            status_code=404,
            detail="No pending registration. Request OTP first.",
        )

    expires_at = pending.get("expires_at")
    if expires_at and expires_at < now_iso():
        await db.partner_candidate_pending.delete_one(_pending_key(partner_id, phone))
        raise HTTPException(status_code=410, detail="OTP session expired. Request a new OTP.")

    payload = CandidateCreate(**pending["payload"])
    industry = normalize_industry_key(payload.industry)
    candidate = PartnerCandidate(partner_id=partner_id, **payload.model_dump())
    await db.partner_candidates.insert_one(candidate.model_dump())

    worker_data = {
        "name": payload.name,
        "gender": payload.gender,
        "age": payload.age,
        "city": payload.city,
        "industries": [industry],
        "industry_preference": industry,
        "skills": [payload.skill],
        "preferred_job_title": payload.skill,
        "experience": payload.experience,
        "collar_type": payload.collar_type,
        "registered_by_partner_id": partner_id,
    }
    existing_worker = await db.workers.find_one({"phone": phone}, {"_id": 0})
    if existing_worker:
        await db.workers.update_one({"phone": phone}, {"$set": worker_data})
        worker = {**existing_worker, **worker_data}
    else:
        worker = Worker(phone=phone, **worker_data)
        await db.workers.insert_one(worker.model_dump())
        worker = worker.model_dump()

    await db.partner_candidate_pending.delete_one(_pending_key(partner_id, phone))

    return {
        "candidate": candidate.model_dump(),
        "worker_id": worker.get("id"),
    }
