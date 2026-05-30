from fastapi import APIRouter, Query

from database import db
from schemas import SavedJob, SavedJobCreate
from services.db_helpers import list_jobs_by_ids

router = APIRouter(prefix="/saved-jobs", tags=["saved-jobs"])


@router.post("")
async def save_job(payload: SavedJobCreate):
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
async def unsave_job(worker_id: str = Query(...), job_id: str = Query(...)):
    await db.saved_jobs.delete_one({"worker_id": worker_id, "job_id": job_id})
    return {"success": True}


@router.get("")
async def list_saved_jobs(worker_id: str = Query(...)):
    saved = await db.saved_jobs.find({"worker_id": worker_id}, {"_id": 0}).sort("saved_at", -1).to_list(100)
    job_ids = [item["job_id"] for item in saved]
    return await list_jobs_by_ids(job_ids)
