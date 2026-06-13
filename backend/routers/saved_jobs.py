from fastapi import APIRouter, Depends, HTTPException, Query

from database import db
from schemas import SavedJob, SavedJobCreate
from services.db_helpers import list_jobs_by_ids
from services.jobs import attach_contact_phones
from dependencies.worker_auth import get_worker_auth, require_worker_id

router = APIRouter(prefix="/saved-jobs", tags=["saved-jobs"])


@router.post("")
async def save_job(payload: SavedJobCreate, claims: dict = Depends(get_worker_auth)):
    if payload.worker_id != claims["sub"]:
        raise HTTPException(status_code=403, detail="Forbidden")
    existing = await db.saved_jobs.find_one(
        {"worker_id": payload.worker_id, "job_id": payload.job_id},
        {"_id": 0},
    )
    if existing:
        return existing
    saved = SavedJob(worker_id=payload.worker_id, job_id=payload.job_id)
    await db.saved_jobs.insert_one(saved.model_dump())
    return saved.model_dump()


@router.delete("")
async def unsave_job(
    worker_id: str = Query(...),
    job_id: str = Query(...),
    _claims: dict = Depends(require_worker_id),
):
    await db.saved_jobs.delete_one({"worker_id": worker_id, "job_id": job_id})
    return {"success": True}


@router.get("")
async def list_saved_jobs(worker_id: str = Query(...), _claims: dict = Depends(require_worker_id)):
    saved = await db.saved_jobs.find({"worker_id": worker_id}, {"_id": 0}).sort("saved_at", -1).to_list(100)
    job_ids = [item["job_id"] for item in saved]
    jobs = await attach_contact_phones(await list_jobs_by_ids(job_ids))
    return jobs
