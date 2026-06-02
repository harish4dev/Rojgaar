from typing import Optional

from fastapi import APIRouter

from database import db
from schemas import Job, JobCreate
from services.db_helpers import get_doc_or_404
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
    job = Job(**payload.model_dump())
    await db.jobs.insert_one(job.model_dump())
    return job.model_dump()


@router.delete("/{job_id}")
async def delete_job(job_id: str):
    await db.jobs.update_one({"id": job_id}, {"$set": {"active": False}})
    return {"success": True}
