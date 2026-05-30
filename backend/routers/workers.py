from fastapi import APIRouter

from schemas import WorkerUpsert
from services.db_helpers import get_doc_or_404
from services.workers import compute_strength
from database import db

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("/{worker_id}")
async def get_worker(worker_id: str):
    worker = await get_doc_or_404("workers", worker_id, "Worker not found")
    worker["profile_strength"] = compute_strength(worker)
    return worker


@router.patch("/{worker_id}")
async def update_worker(worker_id: str, payload: WorkerUpsert):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None and k != "phone"}
    if not updates:
        return await get_doc_or_404("workers", worker_id, "Worker not found")

    await db.workers.update_one({"id": worker_id}, {"$set": updates})
    worker = await get_doc_or_404("workers", worker_id, "Worker not found")
    worker["profile_strength"] = compute_strength(worker)
    await db.workers.update_one(
        {"id": worker_id},
        {"$set": {"profile_strength": worker["profile_strength"]}},
    )
    return worker
