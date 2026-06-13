import re
from typing import Any, Optional

WEIGHTS = {
    "location": 18,
    "skills": 22,
    "experience": 15,
    "salary": 12,
    "languages": 8,
    "industry": 10,
    "title": 5,
    "work_type": 10,
}

MIN_RECOMMENDATION_SCORE = 40

CORE_MATCH_REASONS = {"skills_match", "industry_match", "same_city", "preferred_title_match"}

EXPERIENCE_LEVEL = {
    "fresher": 0,
    "0-1 years": 1,
    "0–1 years": 1,
    "1-2 years": 2,
    "1-3 years": 2,
    "2-5 yrs": 3,
    "3-5 years": 3,
    "5+ years": 4,
    "5+ yrs": 4,
    "custom range": 2,
}


def _norm(value: str) -> str:
    return (value or "").strip().lower()


def _norm_industry(value: str) -> str:
    v = _norm(value)
    aliases = {
        "garments": "garments",
        "garment": "garments",
        "Garments": "garments",
        "factory": "manufacturing",
        "manufacturing": "manufacturing",
        "construction": "construction",
        "logistics": "logistics",
        "automobile": "automobile",
        "retail": "retail",
        "hospitality": "hospitality",
        "delivery": "logistics",
        "driver": "logistics",
        "electrician": "construction",
        "mechanic": "automobile",
    }
    return aliases.get(v, v)


def experience_level(value: Optional[str]) -> Optional[int]:
    if not value:
        return None
    key = _norm(value)
    if key in EXPERIENCE_LEVEL:
        return EXPERIENCE_LEVEL[key]
    if "fresher" in key:
        return 0
    if "5+" in key or "5 +" in key:
        return 4
    if "3" in key and "5" in key:
        return 3
    if "1" in key and ("2" in key or "3" in key):
        return 2
    return None


def _range_overlap(
    min_a: Optional[int],
    max_a: Optional[int],
    min_b: Optional[int],
    max_b: Optional[int],
) -> bool:
    if min_a is None or max_a is None or min_b is None or max_b is None:
        return False
    return max(min_a, min_b) <= min(max_a, max_b)


def _worker_industries(worker: dict[str, Any]) -> set[str]:
    industries = {_norm_industry(x) for x in worker.get("industries", []) if _norm(x)}
    pref = _norm_industry(worker.get("industry_preference") or "")
    if pref:
        industries.add(pref)
    return industries


def worker_has_job_preferences(worker: dict[str, Any]) -> bool:
    return bool(
        worker.get("skills")
        or worker.get("industries")
        or worker.get("industry_preference")
        or worker.get("preferred_job_title")
    )


def passes_relevance_filter(worker: dict[str, Any], job: dict[str, Any]) -> bool:
    """Hard filter: drop jobs clearly unrelated to the worker profile."""
    worker_inds = _worker_industries(worker)
    job_ind = _norm_industry(job.get("industry") or "")

    if worker_inds and job_ind and job_ind not in worker_inds:
        return False

    worker_skills = {_norm(s) for s in worker.get("skills", []) if _norm(s)}
    if worker_skills:
        job_text = _norm(
            " ".join(
                [
                    job.get("title", ""),
                    job.get("description", ""),
                    " ".join(job.get("requirements", []) or []),
                ]
            )
        )
        skill_hit = any(skill in job_text for skill in worker_skills)
        title_pref = _norm(worker.get("preferred_job_title") or "")
        title_hit = bool(title_pref and title_pref in _norm(job.get("title", "")))
        if not skill_hit and not title_hit:
            return False

    if not worker_has_job_preferences(worker):
        worker_city = _norm(worker.get("city") or "")
        job_city = _norm(job.get("city") or "")
        if worker_city and job_city and worker_city != job_city:
            return False

    return True


def is_strong_recommendation(score: int, reasons: list[str]) -> bool:
    if score < MIN_RECOMMENDATION_SCORE:
        return False
    if not set(reasons).intersection(CORE_MATCH_REASONS):
        return False
    return True


def _tokenize(text: str) -> set[str]:
    return {t for t in re.split(r"[^a-z0-9]+", _norm(text)) if len(t) >= 3}


def is_worker_eligible_for_job(worker: dict[str, Any], job: dict[str, Any]) -> bool:
    if not job.get("active", True):
        return False
    if job.get("hiring_status") == "stopped":
        return False
    if worker.get("availability_status") == "Not Available":
        return False

    pref = _norm(job.get("gender_preference") or "any")
    worker_gender = _norm(worker.get("gender") or "")
    if pref not in ("any", "") and worker_gender and worker_gender != pref:
        return False

    age = worker.get("age")
    age_min = job.get("age_min")
    age_max = job.get("age_max")
    if age is not None and age_min is not None and age < age_min:
        return False
    if age is not None and age_max is not None and age > age_max:
        return False

    worker_type = _norm(worker.get("work_type") or "")
    job_type = _norm(job.get("job_type") or "")
    if worker_type and worker_type not in ("any", "") and job_type and worker_type != job_type:
        return False

    return True


def score_worker_for_job(worker: dict[str, Any], job: dict[str, Any]) -> dict[str, Any]:
    reasons: list[str] = []
    score = 0

    if not is_worker_eligible_for_job(worker, job):
        return {"score": 0, "reasons": ["ineligible"]}

    if _norm(worker.get("city")) and _norm(worker.get("city")) == _norm(job.get("city")):
        score += WEIGHTS["location"]
        reasons.append("same_city")

    worker_skills = {_norm(s) for s in worker.get("skills", []) if _norm(s)}
    job_tokens = _tokenize(
        " ".join(
            [
                job.get("title", ""),
                job.get("description", ""),
                job.get("industry", ""),
                " ".join(job.get("requirements", []) or []),
            ]
        )
    )
    if worker_skills and job_tokens:
        matched = [s for s in worker_skills if s in job_tokens or any(s in t or t in s for t in job_tokens)]
        if matched:
            ratio = min(1.0, len(matched) / max(1, len(worker_skills)))
            skill_points = int(WEIGHTS["skills"] * ratio)
            score += skill_points
            reasons.append("skills_match")

    worker_exp = experience_level(worker.get("experience"))
    job_exp = experience_level(job.get("experience_band") or job.get("experience"))
    if worker_exp is not None and job_exp is not None:
        if worker_exp >= job_exp:
            score += WEIGHTS["experience"]
            reasons.append("experience_match")
        elif worker_exp == job_exp - 1:
            score += int(WEIGHTS["experience"] * 0.6)
            reasons.append("experience_close")

    worker_min = worker.get("expected_salary_min")
    worker_max = worker.get("expected_salary_max")
    if _range_overlap(worker_min, worker_max, job.get("salary_min"), job.get("salary_max")):
        score += WEIGHTS["salary"]
        reasons.append("salary_fit")
    elif job.get("salary_negotiable") and worker_min is not None:
        score += int(WEIGHTS["salary"] * 0.5)
        reasons.append("salary_negotiable")

    worker_langs = {_norm(x) for x in worker.get("languages_known", []) if _norm(x)}
    job_langs = {_norm(x) for x in job.get("preferred_languages", []) if _norm(x)}
    if worker_langs and job_langs and worker_langs.intersection(job_langs):
        score += WEIGHTS["languages"]
        reasons.append("language_match")

    worker_industry_pref = _norm_industry(worker.get("industry_preference") or "")
    worker_industries = {_norm_industry(x) for x in worker.get("industries", []) if _norm(x)}
    job_industry = _norm_industry(job.get("industry") or "")
    if job_industry and (worker_industry_pref == job_industry or job_industry in worker_industries):
        score += WEIGHTS["industry"]
        reasons.append("industry_match")

    preferred_title = _norm(worker.get("preferred_job_title") or "")
    job_title = _norm(job.get("title") or "")
    if preferred_title and (preferred_title in job_title or job_title in preferred_title):
        score += WEIGHTS["title"]
        reasons.append("preferred_title_match")

    worker_type = _norm(worker.get("work_type") or "")
    job_type = _norm(job.get("job_type") or "")
    if worker_type and worker_type not in ("any", "") and job_type and worker_type == job_type:
        score += WEIGHTS["work_type"]
        reasons.append("work_type_match")

    return {"score": min(100, max(0, score)), "reasons": reasons}


def public_worker_summary(worker: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": worker.get("id"),
        "name": worker.get("name"),
        "city": worker.get("city"),
        "skills": worker.get("skills", []),
        "experience": worker.get("experience"),
        "expected_salary": worker.get("expected_salary"),
        "work_type": worker.get("work_type"),
        "profile_strength": worker.get("profile_strength", 0),
        "industries": worker.get("industries", []),
    }
