from typing import Optional

from database import db


def build_jobs_query(
    city: Optional[str],
    industry: Optional[str],
    job_type: Optional[str],
    experience: Optional[str],
    salary_min: Optional[int],
    salary_max: Optional[int],
    search: Optional[str],
) -> dict:
    query: dict = {"active": True, "hiring_status": {"$ne": "stopped"}}
    if city:
        query["city"] = city
    if industry:
        query["industry"] = industry
    if job_type:
        query["job_type"] = job_type
    if experience:
        query["experience"] = experience
    if salary_min is not None:
        query["salary_max"] = {"$gte": salary_min}
    if salary_max is not None:
        query["salary_min"] = {"$lte": salary_max}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"industry": {"$regex": search, "$options": "i"}},
        ]
    return query


async def attach_contact_phones(jobs: list[dict]) -> list[dict]:
    if not jobs:
        return jobs
    biz_ids = list({j.get("posted_by_business_id") for j in jobs if j.get("posted_by_business_id")})
    if not biz_ids:
        return jobs
    businesses = await db.businesses.find(
        {"id": {"$in": biz_ids}},
        {"_id": 0, "id": 1, "phone": 1},
    ).to_list(len(biz_ids))
    phone_map = {b["id"]: b["phone"] for b in businesses if b.get("phone")}
    for job in jobs:
        biz_id = job.get("posted_by_business_id")
        if biz_id and phone_map.get(biz_id):
            job["contact_phone"] = phone_map[biz_id]
    return jobs
