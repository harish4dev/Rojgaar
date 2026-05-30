from fastapi import APIRouter, HTTPException

from database import db
from schemas import BusinessProfileUpdate
from services.db_helpers import get_doc_or_404, list_jobs_by_ids, list_workers_by_ids

router = APIRouter(prefix="/businesses", tags=["businesses"])


@router.get("/{business_id}")
async def get_business(business_id: str):
    return await get_doc_or_404("businesses", business_id, "Business not found")


@router.patch("/{business_id}")
async def update_business(business_id: str, payload: BusinessProfileUpdate):
    name = payload.name.strip()
    company = payload.company.strip()
    city = payload.city.strip()
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="name is required")
    if len(company) < 2:
        raise HTTPException(status_code=400, detail="company is required")
    if len(city) < 2:
        raise HTTPException(status_code=400, detail="city is required")

    await get_doc_or_404("businesses", business_id, "Business not found")
    updates = {
        "name": name,
        "company": company,
        "city": city,
        "profile_complete": True,
    }
    await db.businesses.update_one({"id": business_id}, {"$set": updates})
    return await get_doc_or_404("businesses", business_id, "Business not found")


@router.get("/{business_id}/stats")
async def business_stats(business_id: str):
    active_jobs = await db.jobs.count_documents({"posted_by_business_id": business_id, "active": True})
    job_ids = [
        job["id"]
        async for job in db.jobs.find({"posted_by_business_id": business_id}, {"_id": 0, "id": 1})
    ]
    applications = await db.applications.count_documents({"job_id": {"$in": job_ids}}) if job_ids else 0
    hired = (
        await db.applications.count_documents({"job_id": {"$in": job_ids}, "status": {"$in": ["Hired", "Accepted"]}})
        if job_ids
        else 0
    )
    return {
        "active_jobs": active_jobs,
        "applications": applications,
        "hired": hired,
        "profile_views": 360,
    }


@router.get("/{business_id}/jobs")
async def business_jobs(business_id: str):
    jobs = await db.jobs.find({"posted_by_business_id": business_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for job in jobs:
        job["applications_count"] = await db.applications.count_documents({"job_id": job["id"]})
    return jobs


@router.get("/{business_id}/applications")
async def business_applications(business_id: str):
    await get_doc_or_404("businesses", business_id, "Business not found")
    job_ids = [
        job["id"]
        async for job in db.jobs.find({"posted_by_business_id": business_id}, {"_id": 0, "id": 1})
    ]
    if not job_ids:
        return []

    apps = await db.applications.find({"job_id": {"$in": job_ids}}, {"_id": 0}).sort("applied_at", -1).to_list(200)
    jobs = await list_jobs_by_ids(list({app["job_id"] for app in apps}))
    workers = await list_workers_by_ids(list({app["worker_id"] for app in apps}))
    jobs_map = {job["id"]: job for job in jobs}
    workers_map = {worker["id"]: worker for worker in workers}

    for app in apps:
        app["job"] = jobs_map.get(app["job_id"])
        app["worker"] = workers_map.get(app["worker_id"])
    return apps
