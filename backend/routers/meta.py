from fastapi import APIRouter

from meta_catalog import (
    get_all_job_roles,
    get_grey_collar_skills,
    get_industries,
    get_industry_job_titles,
)

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/cities")
async def get_cities():
    return {
        "nearby": ["Bengaluru", "Mysuru", "Tumakuru", "Hassan"],
        "popular": ["Chennai", "Hyderabad", "Pune", "Mumbai", "Delhi", "Kolkata"],
    }


@router.get("/industries")
async def list_industries():
    return get_industries()


@router.get("/skills")
async def list_skills():
    """Job roles across all industries (used for worker/partner role pickers)."""
    return get_all_job_roles()


@router.get("/industry-job-titles")
async def list_industry_job_titles():
    return get_industry_job_titles()


@router.get("/grey-collar-skills")
async def list_grey_collar_skills():
    return get_grey_collar_skills()
