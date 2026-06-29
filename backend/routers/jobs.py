from typing import Optional

from fastapi import APIRouter, HTTPException

from database import db
from schemas import Job, JobCreate, JobHiringStatusUpdate
from services.db_helpers import get_doc_or_404
from services.geocoding import search_places
from services.jobs import build_jobs_query

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.get("")
async def list_jobs(
    city: Optional[str] = None,
    industry: Optional[str] = None,
    skill: Optional[str] = None,
    job_type: Optional[str] = None,
    experience: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
):
    query = build_jobs_query(
        city, industry, job_type, experience, salary_min, salary_max, search
    )
    return await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)


@router.get("/{job_id}")
async def get_job(job_id: str):
    job = await get_doc_or_404("jobs", job_id, "Job not found")
    biz_id = job.get("posted_by_business_id")
    if biz_id:
        biz = await db.businesses.find_one({"id": biz_id}, {"_id": 0, "phone": 1})
        if biz and biz.get("phone"):
            job["contact_phone"] = biz["phone"]
    return job


@router.post("")
async def create_job(payload: JobCreate):
    if payload.salary_min < 0 or payload.salary_max < 0:
        raise HTTPException(status_code=400, detail="salary must be non-negative")
    if payload.salary_max < payload.salary_min:
        raise HTTPException(status_code=400, detail="salary_max must be >= salary_min")
    if payload.age_min is not None and payload.age_max is not None and payload.age_max < payload.age_min:
        raise HTTPException(status_code=400, detail="age_max must be >= age_min")
    data = payload.model_dump()
    if data.get("experience_band"):
        data["experience"] = data["experience_band"]
    if data.get("location_lat") is None and data.get("location_label"):
        hits = search_places(data["location_label"])
        if hits:
            top = hits[0]
            data["location_lat"] = top.get("location_lat")
            data["location_lng"] = top.get("location_lng")
            if not data.get("city"):
                data["city"] = top.get("city") or data.get("city")
    job = Job(**data)
    await db.jobs.insert_one(job.model_dump())
    return job.model_dump()


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    await db.jobs.update_one({"id": job_id}, {"$set": {"active": False, "hiring_status": "stopped"}})
    return {"success": True}


@router.patch("/{job_id}/hiring-status")
async def update_hiring_status(job_id: str, payload: JobHiringStatusUpdate):
    status = payload.hiring_status.strip().lower()
    if status not in ("active", "stopped"):
        raise HTTPException(status_code=400, detail="hiring_status must be active or stopped")
    result = await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"hiring_status": status, "active": status == "active"}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")
    return await get_doc_or_404("jobs", job_id, "Job not found")
