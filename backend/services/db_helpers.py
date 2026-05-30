from typing import List

from fastapi import HTTPException

from database import db


async def get_doc_or_404(collection_name: str, identifier: str, not_found_message: str) -> dict:
    doc = await db[collection_name].find_one({"id": identifier}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=not_found_message)
    return doc


async def list_jobs_by_ids(job_ids: List[str]) -> List[dict]:
    if not job_ids:
        return []
    return await db.jobs.find({"id": {"$in": job_ids}}, {"_id": 0}).to_list(len(job_ids))


async def list_workers_by_ids(worker_ids: List[str]) -> List[dict]:
    if not worker_ids:
        return []
    return await db.workers.find({"id": {"$in": worker_ids}}, {"_id": 0}).to_list(len(worker_ids))

