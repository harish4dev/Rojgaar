from fastapi import APIRouter, Depends

from database import db
from services.db_helpers import get_doc_or_404
from services.distance import attach_job_distances
from services.jobs import attach_contact_phones, build_jobs_query
from services.matching import (
    is_browse_recommendation,
    is_strong_recommendation,
    is_worker_eligible_for_job,
    passes_relevance_filter,
    public_worker_summary,
    score_worker_for_job,
)
from dependencies.worker_auth import require_worker_id

router = APIRouter(prefix="/recommendations", tags=["recommendations"])


def _score_jobs(worker: dict, jobs: list[dict], trend_counts: dict[str, int]) -> list[dict]:
    scored: list[dict] = []
    for job in jobs:
        if not passes_relevance_filter(worker, job):
            continue
        if not is_worker_eligible_for_job(worker, job):
            continue
        match = score_worker_for_job(worker, job)
        trend_bonus = min(10, trend_counts.get((job.get("industry") or "").strip().lower(), 0) * 2)
        final_score = min(100, match["score"] + trend_bonus)
        reasons = match["reasons"] + (["hiring_trend_match"] if trend_bonus else [])
        scored.append(
            {
                **job,
                "match_score": final_score,
                "match_reasons": reasons,
                "recommended": is_strong_recommendation(final_score, reasons),
            }
        )
    scored.sort(key=lambda x: (-x["match_score"], x.get("created_at", "")))
    return scored


@router.get("/workers/{worker_id}/jobs")
async def recommend_jobs_for_worker(
    worker_id: str,
    limit: int = 20,
    city: str | None = None,
    industry: str | None = None,
    job_type: str | None = None,
    experience: str | None = None,
    salary_min: int | None = None,
    salary_max: int | None = None,
    _claims: dict = Depends(require_worker_id),
):
    worker = await get_doc_or_404("workers", worker_id, "Worker not found")
    previous_apps = await db.applications.find(
        {"worker_id": worker_id}, {"_id": 0, "job_id": 1}
    ).to_list(500)
    previous_job_ids = {x["job_id"] for x in previous_apps}

    previous_jobs = []
    if previous_job_ids:
        previous_jobs = await db.jobs.find(
            {"id": {"$in": list(previous_job_ids)}}, {"_id": 0, "industry": 1}
        ).to_list(500)
    trend_counts: dict[str, int] = {}
    for prev in previous_jobs:
        industry_key = (prev.get("industry") or "").strip().lower()
        if industry_key:
            trend_counts[industry_key] = trend_counts.get(industry_key, 0) + 1

    query = build_jobs_query(city, industry, job_type, experience, salary_min, salary_max, None)
    if previous_job_ids:
        query["id"] = {"$nin": list(previous_job_ids)}

    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    scored = _score_jobs(worker, jobs, trend_counts)
    cap = max(1, min(limit, 100))

    strong = [j for j in scored if j.get("recommended")]
    if len(strong) >= cap // 2:
        result = strong[:cap]
    else:
        seen = {j["id"] for j in strong}
        browse = [
            j
            for j in scored
            if j["id"] not in seen and is_browse_recommendation(j["match_score"], j["match_reasons"])
        ]
        result = (strong + browse)[:cap]

    result = attach_job_distances(worker, result)
    return await attach_contact_phones(result)


@router.get("/jobs/{job_id}/candidates")
async def rank_candidates_for_job(job_id: str, limit: int = 50):
    job = await get_doc_or_404("jobs", job_id, "Job not found")
    workers = await db.workers.find(
        {"availability_status": {"$ne": "Not Available"}},
        {"_id": 0},
    ).to_list(500)
    ranked = []
    for worker in workers:
        if not passes_relevance_filter(worker, job):
            continue
        if not is_worker_eligible_for_job(worker, job):
            continue
        match = score_worker_for_job(worker, job)
        if not is_strong_recommendation(match["score"], match["reasons"]):
            continue
        ranked.append(
            {
                "worker": public_worker_summary(worker),
                "match_score": match["score"],
                "match_reasons": match["reasons"],
            }
        )
    ranked.sort(key=lambda x: (-x["match_score"], -(x["worker"].get("profile_strength") or 0)))
    return ranked[: max(1, min(limit, 200))]
