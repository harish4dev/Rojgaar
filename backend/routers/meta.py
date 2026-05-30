from fastapi import APIRouter

router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/cities")
async def get_cities():
    return {
        "nearby": ["Bengaluru", "Mysuru", "Tumakuru", "Hassan"],
        "popular": ["Chennai", "Hyderabad", "Pune", "Mumbai", "Delhi", "Kolkata"],
    }


@router.get("/industries")
async def get_industries():
    return [
        {"key": "construction", "label": "Construction", "icon": "construct"},
        {"key": "Garments", "label": "Garments", "icon": "business"},
        {"key": "delivery", "label": "Delivery", "icon": "car"},
        {"key": "driver", "label": "Driver", "icon": "car-sport"},
        {"key": "electrician", "label": "Electrician", "icon": "flash"},
        {"key": "housekeeping", "label": "Housekeeping", "icon": "home"},
        {"key": "mechanic", "label": "Mechanic", "icon": "build"},
        {"key": "security", "label": "Security", "icon": "shield-checkmark"},
        {"key": "other", "label": "Other", "icon": "ellipsis-horizontal"},
    ]


@router.get("/skills")
async def get_skills():
    return [
        "Mason", "Helper", "Painter", "Welder", "Plumber", "Carpenter",
        "Electrician", "Tiles Fitting", "Steel Fixer", "AC Technician",
        "Driver", "Security", "Cleaner", "Cook",
    ]
