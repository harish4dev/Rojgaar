import csv
import io

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile

from database import db
from schemas import BulkUploadResult, CandidateCreate, CandidateOtpConfirm, Job, PartnerProfileUpdate
from services.db_helpers import get_doc_or_404
from services.partner_candidates import (
    confirm_pending_registration,
    send_employee_verification,
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
    """Partner submits employee details; OTP is sent to the employee via Twilio Verify."""
    validate_candidate_payload(payload)
    return await send_employee_verification(partner_id, payload)


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


async def _ensure_verified_partner(partner_id: str) -> dict:
    partner = await get_doc_or_404("partners", partner_id, "Partner not found")
    if not partner.get("profile_complete"):
        raise HTTPException(status_code=403, detail="Only verified partners can bulk upload")
    return partner


def _read_upload_rows(file: UploadFile) -> list[dict]:
    filename = (file.filename or "").lower()
    payload = file.file.read()
    if filename.endswith(".csv"):
        text = payload.decode("utf-8-sig")
        return list(csv.DictReader(io.StringIO(text)))
    if filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(payload))
        return df.fillna("").to_dict(orient="records")
    raise HTTPException(status_code=400, detail="Only .csv and .xlsx files are supported")


@router.post("/{partner_id}/bulk/candidates")
async def bulk_upload_candidates(partner_id: str, file: UploadFile = File(...)):
    await _ensure_verified_partner(partner_id)
    rows = _read_upload_rows(file)
    result = BulkUploadResult()
    for idx, row in enumerate(rows, start=1):
        try:
            payload = CandidateCreate(
                name=str(row.get("name", "")).strip(),
                employee_number=str(row.get("employee_number", "")).strip(),
                skill=str(row.get("skill", "")).strip(),
                experience=str(row.get("experience", "Fresher")).strip() or "Fresher",
                city=str(row.get("city", "")).strip(),
                gender=str(row.get("gender", "Any")).strip(),
                age=int(row.get("age", 18)),
                collar_type=str(row.get("collar_type", "Gray Collar")).strip(),
            )
            validate_candidate_payload(payload)
            candidate_doc = {
                **payload.model_dump(),
                "partner_id": partner_id,
                "phone_verified": True,
                "status": "Looking",
            }
            await db.partner_candidates.insert_one(candidate_doc)
            result.created += 1
        except Exception as exc:  # pylint: disable=broad-except
            result.failed += 1
            result.errors.append(f"Row {idx}: {str(exc)}")
    return result.model_dump()


@router.post("/{partner_id}/bulk/jobs")
async def bulk_upload_jobs(partner_id: str, file: UploadFile = File(...)):
    partner = await _ensure_verified_partner(partner_id)
    rows = _read_upload_rows(file)
    result = BulkUploadResult()
    for idx, row in enumerate(rows, start=1):
        try:
            salary_min = int(row.get("salary_min", 0))
            salary_max = int(row.get("salary_max", 0))
            if salary_max < salary_min:
                raise ValueError("salary_max must be >= salary_min")
            job = Job(
                title=str(row.get("title", "")).strip(),
                company=str(row.get("company", "")).strip() or partner.get("name", "Partner Network"),
                industry=str(row.get("industry", "")).strip(),
                city=str(row.get("city", "")).strip() or partner.get("city", ""),
                salary_min=salary_min,
                salary_max=salary_max,
                experience_band=str(row.get("experience_band", row.get("experience", "Fresher"))).strip() or "Fresher",
                experience=str(row.get("experience", "Fresher")).strip() or "Fresher",
                description=str(row.get("description", "")).strip(),
                posted_by_business_id=str(row.get("posted_by_business_id", "")).strip() or None,
            )
            await db.jobs.insert_one(job.model_dump())
            result.created += 1
        except Exception as exc:  # pylint: disable=broad-except
            result.failed += 1
            result.errors.append(f"Row {idx}: {str(exc)}")
    return result.model_dump()
