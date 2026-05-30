from typing import Optional


def build_jobs_query(
    city: Optional[str],
    industry: Optional[str],
    job_type: Optional[str],
    salary_min: Optional[int],
    salary_max: Optional[int],
    search: Optional[str],
) -> dict:
    query: dict = {"active": True}
    if city:
        query["city"] = city
    if industry:
        query["industry"] = industry
    if job_type:
        query["job_type"] = job_type
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
