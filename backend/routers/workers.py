from fastapi import APIRouter, Depends

from schemas import WorkerUpsert
from services.db_helpers import get_doc_or_404
from services.salary_parse import parse_expected_salary
from services.workers import compute_strength
from database import db
from dependencies.worker_auth import require_worker_id

router = APIRouter(prefix="/workers", tags=["workers"])


@router.get("/{worker_id}")
async def get_worker(worker_id: str, _claims: dict = Depends(require_worker_id)):
    worker = await get_doc_or_404("workers", worker_id, "Worker not found")
    worker["profile_strength"] = compute_strength(worker)
    return worker


@router.patch("/{worker_id}")
async def update_worker(
    worker_id: str,
    payload: WorkerUpsert,
    _claims: dict = Depends(require_worker_id),
):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None and k != "phone"}
    if not updates:
        return await get_doc_or_404("workers", worker_id, "Worker not found")

    if "expected_salary" in updates:
        lo, hi = parse_expected_salary(updates.get("expected_salary"))
        updates["expected_salary_min"] = lo
        updates["expected_salary_max"] = hi

    await db.workers.update_one({"id": worker_id}, {"$set": updates})
    worker = await get_doc_or_404("workers", worker_id, "Worker not found")
    worker["profile_strength"] = compute_strength(worker)
    await db.workers.update_one(
        {"id": worker_id},
        {"$set": {"profile_strength": worker["profile_strength"]}},
    )
    return worker
