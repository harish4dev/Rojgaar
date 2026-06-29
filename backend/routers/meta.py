from fastapi import APIRouter, HTTPException, Query

from meta_catalog import (
    get_all_job_roles,
    get_grey_collar_skills,
    get_industries,
    get_industry_job_titles,
)
from schemas import ReverseGeocodeRequest
from services.geocoding import reverse_geocode, search_places

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/cities")
async def get_cities():
    return {
        "nearby": ["Bengaluru", "Mysuru", "Tumakuru", "Hassan"],
        "popular": ["Chennai", "Hyderabad", "Pune", "Mumbai", "Delhi", "Kolkata"],
    }


@router.post("/reverse-geocode")
async def reverse_geocode_coords(payload: ReverseGeocodeRequest):
    result = reverse_geocode(payload.lat, payload.lng)
    if not result:
        raise HTTPException(status_code=404, detail="Could not resolve this location")
    return result


@router.get("/places/search")
async def places_search(q: str = Query(..., min_length=2, max_length=120)):
    return search_places(q)


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
