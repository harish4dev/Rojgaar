from fastapi import APIRouter, HTTPException, Query
from pymongo import ReturnDocument

from database import db
from schemas import Application, ApplicationCreate, ApplicationStatusUpdate
from services.db_helpers import get_doc_or_404, list_jobs_by_ids

router = APIRouter(prefix="/applications", tags=["applications"])

ALLOWED_STATUSES = {"Pending", "Accepted", "Rejected", "Hired"}


@router.post("")
async def apply_to_job(payload: ApplicationCreate):
    existing = await db.applications.find_one(
        {"worker_id": payload.worker_id, "job_id": payload.job_id},
        {"_id": 0},
    )
    if existing:
        return existing
    application = Application(worker_id=payload.worker_id, job_id=payload.job_id)
    await db.applications.insert_one(application.model_dump())
    return application.model_dump()


@router.get("")
async def list_applications(worker_id: str = Query(...)):
    apps = await db.applications.find({"worker_id": worker_id}, {"_id": 0}).sort("applied_at", -1).to_list(100)
    job_ids = [app["job_id"] for app in apps]
    jobs = await list_jobs_by_ids(job_ids)
    jobs_map = {job["id"]: job for job in jobs}
    for app in apps:
        app["job"] = jobs_map.get(app["job_id"])
    return apps


@router.patch("/{application_id}")
async def update_application_status(application_id: str, payload: ApplicationStatusUpdate):
    if payload.status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of: {', '.join(sorted(ALLOWED_STATUSES))}")
    result = await db.applications.find_one_and_update(
        {"id": application_id},
        {"$set": {"status": payload.status}},
        projection={"_id": 0},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Application not found")
    return result
