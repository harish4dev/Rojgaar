from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Rojgaar API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


class Worker(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: Optional[str] = None
    language: str = "en"
    city: Optional[str] = None
    industries: List[str] = []
    skills: List[str] = []
    experience: Optional[str] = None
    expected_salary: Optional[str] = None
    work_type: Optional[str] = None
    profile_strength: int = 0
    created_at: str = Field(default_factory=now_iso)


class WorkerUpsert(BaseModel):
    phone: Optional[str] = None
    name: Optional[str] = None
    language: Optional[str] = None
    city: Optional[str] = None
    industries: Optional[List[str]] = None
    skills: Optional[List[str]] = None
    experience: Optional[str] = None
    expected_salary: Optional[str] = None
    work_type: Optional[str] = None


class Business(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    company: str
    city: str
    created_at: str = Field(default_factory=now_iso)


class Partner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: Optional[str] = None
    agent_type: str = "partner"  # partner or agency
    city: str
    created_at: str = Field(default_factory=now_iso)


class Job(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    company: str
    industry: str
    city: str
    distance_km: float = 2.0
    salary_min: int
    salary_max: int
    experience: str = "Fresher"
    job_type: str = "Full Time"  # Full Time | Part Time | Daily Wage
    description: str = ""
    requirements: List[str] = []
    rating: float = 4.2
    image_url: Optional[str] = None
    posted_by_business_id: Optional[str] = None
    active: bool = True
    created_at: str = Field(default_factory=now_iso)


class JobCreate(BaseModel):
    title: str
    company: str = "My Company"
    industry: str
    city: str
    salary_min: int
    salary_max: int
    experience: str = "Fresher"
    job_type: str = "Full Time"
    description: str = ""
    requirements: List[str] = []
    posted_by_business_id: Optional[str] = None


class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    job_id: str
    status: str = "Pending"  # Pending | Contacted | Not Selected | Hired
    applied_at: str = Field(default_factory=now_iso)


class SavedJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    job_id: str
    saved_at: str = Field(default_factory=now_iso)


class PartnerCandidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    name: str
    skill: str
    experience: str = "Fresher"
    city: str
    status: str = "Looking"  # Looking | Matched | Placed
    created_at: str = Field(default_factory=now_iso)


class CandidateCreate(BaseModel):
    name: str
    skill: str
    experience: str = "Fresher"
    city: str


# ---------- Auth (mocked OTP) ----------
class OtpRequest(BaseModel):
    phone: str
    role: str = "worker"  # worker | business | partner


class OtpVerify(BaseModel):
    phone: str
    otp: str
    role: str = "worker"


@api_router.post("/auth/send-otp")
async def send_otp(payload: OtpRequest):
    # Mocked - always returns success. Any 4 digit OTP works.
    return {"success": True, "message": "OTP sent (mock). Any 4-digit code works.", "phone": payload.phone}


@api_router.post("/auth/verify-otp")
async def verify_otp(payload: OtpVerify):
    if not (payload.otp.isdigit() and len(payload.otp) == 4):
        raise HTTPException(status_code=400, detail="OTP must be 4 digits")
    role = payload.role
    if role == "worker":
        existing = await db.workers.find_one({"phone": payload.phone}, {"_id": 0})
        if not existing:
            worker = Worker(phone=payload.phone)
            await db.workers.insert_one(worker.model_dump())
            return {"success": True, "user": worker.model_dump(), "is_new": True}
        return {"success": True, "user": existing, "is_new": False}
    elif role == "business":
        existing = await db.businesses.find_one({"phone": payload.phone}, {"_id": 0})
        if not existing:
            business = Business(phone=payload.phone, name="New Business", company="My Company", city="Bengaluru")
            await db.businesses.insert_one(business.model_dump())
            return {"success": True, "user": business.model_dump(), "is_new": True}
        return {"success": True, "user": existing, "is_new": False}
    elif role == "partner":
        existing = await db.partners.find_one({"phone": payload.phone}, {"_id": 0})
        if not existing:
            partner = Partner(phone=payload.phone, name="New Partner", city="Bengaluru")
            await db.partners.insert_one(partner.model_dump())
            return {"success": True, "user": partner.model_dump(), "is_new": True}
        return {"success": True, "user": existing, "is_new": False}
    raise HTTPException(status_code=400, detail="Invalid role")


# ---------- Workers ----------
def compute_strength(w: dict) -> int:
    fields = ["name", "city", "industries", "skills", "experience", "expected_salary", "work_type"]
    filled = 0
    for f in fields:
        v = w.get(f)
        if v and (not isinstance(v, list) or len(v) > 0):
            filled += 1
    return int((filled / len(fields)) * 100)


@api_router.get("/workers/{worker_id}")
async def get_worker(worker_id: str):
    worker = await db.workers.find_one({"id": worker_id}, {"_id": 0})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    worker["profile_strength"] = compute_strength(worker)
    return worker


@api_router.patch("/workers/{worker_id}")
async def update_worker(worker_id: str, payload: WorkerUpsert):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None and k != "phone"}
    if not updates:
        worker = await db.workers.find_one({"id": worker_id}, {"_id": 0})
        if not worker:
            raise HTTPException(status_code=404, detail="Worker not found")
        return worker
    await db.workers.update_one({"id": worker_id}, {"$set": updates})
    worker = await db.workers.find_one({"id": worker_id}, {"_id": 0})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    worker["profile_strength"] = compute_strength(worker)
    await db.workers.update_one({"id": worker_id}, {"$set": {"profile_strength": worker["profile_strength"]}})
    return worker


# ---------- Jobs ----------
@api_router.get("/jobs")
async def list_jobs(
    city: Optional[str] = None,
    industry: Optional[str] = None,
    skill: Optional[str] = None,
    job_type: Optional[str] = None,
    experience: Optional[str] = None,
    salary_min: Optional[int] = None,
    salary_max: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = 50,
):
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
        query.setdefault("salary_min", {})
        if isinstance(query.get("salary_min"), dict):
            query["salary_min"]["$lte"] = salary_max
        else:
            query["salary_min"] = {"$lte": salary_max}
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"company": {"$regex": search, "$options": "i"}},
            {"industry": {"$regex": search, "$options": "i"}},
        ]
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return jobs


@api_router.get("/jobs/{job_id}")
async def get_job(job_id: str):
    job = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@api_router.post("/jobs")
async def create_job(payload: JobCreate):
    job = Job(**payload.model_dump())
    await db.jobs.insert_one(job.model_dump())
    return job.model_dump()


@api_router.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    await db.jobs.update_one({"id": job_id}, {"$set": {"active": False}})
    return {"success": True}


# ---------- Applications ----------
class ApplicationCreate(BaseModel):
    worker_id: str
    job_id: str


@api_router.post("/applications")
async def apply_to_job(payload: ApplicationCreate):
    existing = await db.applications.find_one(
        {"worker_id": payload.worker_id, "job_id": payload.job_id}, {"_id": 0}
    )
    if existing:
        return existing
    app_obj = Application(worker_id=payload.worker_id, job_id=payload.job_id)
    await db.applications.insert_one(app_obj.model_dump())
    return app_obj.model_dump()


@api_router.get("/applications")
async def list_applications(worker_id: str = Query(...)):
    apps = await db.applications.find({"worker_id": worker_id}, {"_id": 0}).sort("applied_at", -1).to_list(100)
    # join with jobs
    job_ids = [a["job_id"] for a in apps]
    jobs = await db.jobs.find({"id": {"$in": job_ids}}, {"_id": 0}).to_list(100)
    jobs_map = {j["id"]: j for j in jobs}
    for a in apps:
        a["job"] = jobs_map.get(a["job_id"])
    return apps


# ---------- Saved Jobs ----------
class SavedJobCreate(BaseModel):
    worker_id: str
    job_id: str


@api_router.post("/saved-jobs")
async def save_job(payload: SavedJobCreate):
    existing = await db.saved_jobs.find_one(
        {"worker_id": payload.worker_id, "job_id": payload.job_id}, {"_id": 0}
    )
    if existing:
        return existing
    sj = SavedJob(worker_id=payload.worker_id, job_id=payload.job_id)
    await db.saved_jobs.insert_one(sj.model_dump())
    return sj.model_dump()


@api_router.delete("/saved-jobs")
async def unsave_job(worker_id: str = Query(...), job_id: str = Query(...)):
    await db.saved_jobs.delete_one({"worker_id": worker_id, "job_id": job_id})
    return {"success": True}


@api_router.get("/saved-jobs")
async def list_saved_jobs(worker_id: str = Query(...)):
    saved = await db.saved_jobs.find({"worker_id": worker_id}, {"_id": 0}).sort("saved_at", -1).to_list(100)
    job_ids = [s["job_id"] for s in saved]
    jobs = await db.jobs.find({"id": {"$in": job_ids}}, {"_id": 0}).to_list(100)
    return jobs


# ---------- Business ----------
@api_router.get("/businesses/{business_id}")
async def get_business(business_id: str):
    b = await db.businesses.find_one({"id": business_id}, {"_id": 0})
    if not b:
        raise HTTPException(status_code=404, detail="Business not found")
    return b


@api_router.get("/businesses/{business_id}/stats")
async def business_stats(business_id: str):
    active_jobs = await db.jobs.count_documents({"posted_by_business_id": business_id, "active": True})
    job_ids = [j["id"] async for j in db.jobs.find({"posted_by_business_id": business_id}, {"_id": 0, "id": 1})]
    applications = await db.applications.count_documents({"job_id": {"$in": job_ids}}) if job_ids else 0
    hired = await db.applications.count_documents({"job_id": {"$in": job_ids}, "status": "Hired"}) if job_ids else 0
    return {
        "active_jobs": active_jobs,
        "applications": applications,
        "hired": hired,
        "profile_views": 360,
    }


@api_router.get("/businesses/{business_id}/jobs")
async def business_jobs(business_id: str):
    jobs = await db.jobs.find({"posted_by_business_id": business_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for j in jobs:
        j["applications_count"] = await db.applications.count_documents({"job_id": j["id"]})
    return jobs


# ---------- Partner ----------
@api_router.get("/partners/{partner_id}")
async def get_partner(partner_id: str):
    p = await db.partners.find_one({"id": partner_id}, {"_id": 0})
    if not p:
        raise HTTPException(status_code=404, detail="Partner not found")
    return p


@api_router.get("/partners/{partner_id}/stats")
async def partner_stats(partner_id: str):
    people_added = await db.partner_candidates.count_documents({"partner_id": partner_id})
    matched = await db.partner_candidates.count_documents({"partner_id": partner_id, "status": "Matched"})
    placed = await db.partner_candidates.count_documents({"partner_id": partner_id, "status": "Placed"})
    earnings = placed * 2000
    return {
        "people_added": people_added,
        "job_matches": matched,
        "placed": placed,
        "total_earnings": earnings,
    }


@api_router.get("/partners/{partner_id}/candidates")
async def partner_candidates(partner_id: str):
    candidates = await db.partner_candidates.find({"partner_id": partner_id}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return candidates


@api_router.post("/partners/{partner_id}/candidates")
async def add_partner_candidate(partner_id: str, payload: CandidateCreate):
    c = PartnerCandidate(partner_id=partner_id, **payload.model_dump())
    await db.partner_candidates.insert_one(c.model_dump())
    return c.model_dump()


# ---------- Meta ----------
@api_router.get("/meta/cities")
async def get_cities():
    return {
        "nearby": ["Bengaluru", "Mysuru", "Tumakuru", "Hassan"],
        "popular": ["Chennai", "Hyderabad", "Pune", "Mumbai", "Delhi", "Kolkata"],
    }


@api_router.get("/meta/industries")
async def get_industries():
    return [
        {"key": "construction", "label": "Construction", "icon": "construct"},
        {"key": "factory", "label": "Factory", "icon": "business"},
        {"key": "delivery", "label": "Delivery", "icon": "car"},
        {"key": "driver", "label": "Driver", "icon": "car-sport"},
        {"key": "electrician", "label": "Electrician", "icon": "flash"},
        {"key": "housekeeping", "label": "Housekeeping", "icon": "home"},
        {"key": "mechanic", "label": "Mechanic", "icon": "build"},
        {"key": "security", "label": "Security", "icon": "shield-checkmark"},
        {"key": "other", "label": "Other", "icon": "ellipsis-horizontal"},
    ]


@api_router.get("/meta/skills")
async def get_skills():
    return [
        "Mason", "Helper", "Painter", "Welder", "Plumber", "Carpenter",
        "Electrician", "Tiles Fitting", "Steel Fixer", "AC Technician",
        "Driver", "Security", "Cleaner", "Cook"
    ]


# ---------- Health ----------
@api_router.get("/")
async def root():
    return {"message": "Rojgaar API", "status": "ok"}


# ---------- Seed ----------
SEED_JOBS = [
    {
        "title": "Mason",
        "company": "Sharma Construction",
        "industry": "construction",
        "city": "Bengaluru",
        "distance_km": 2.0,
        "salary_min": 18000,
        "salary_max": 22000,
        "experience": "2-5 Yrs",
        "job_type": "Full Time",
        "description": "We are looking for skilled masons for residential and commercial projects.",
        "requirements": ["Masonry work experience", "Can read basic instructions", "Hard working and punctual"],
        "rating": 4.2,
        "image_url": "https://images.pexels.com/photos/4483865/pexels-photo-4483865.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "title": "Helper",
        "company": "BuildWell Infra",
        "industry": "construction",
        "city": "Bengaluru",
        "distance_km": 3.0,
        "salary_min": 14000,
        "salary_max": 16000,
        "experience": "Fresher",
        "job_type": "Daily Wage",
        "description": "Hardworking helpers needed for ongoing construction site.",
        "requirements": ["Physically fit", "Willing to work outdoors", "Team player"],
        "rating": 4.0,
        "image_url": "https://images.pexels.com/photos/4483865/pexels-photo-4483865.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "title": "Electrician",
        "company": "PowerTech Services",
        "industry": "electrician",
        "city": "Bengaluru",
        "distance_km": 5.0,
        "salary_min": 20000,
        "salary_max": 25000,
        "experience": "1-2 Years",
        "job_type": "Full Time",
        "description": "Certified electricians needed for residential and commercial wiring projects.",
        "requirements": ["ITI Electrician certificate", "Min 1 year experience", "Own tools preferred"],
        "rating": 4.5,
        "image_url": "https://images.pexels.com/photos/34054464/pexels-photo-34054464.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "title": "Steel Fixer",
        "company": "Mega Infra Projects",
        "industry": "construction",
        "city": "Bengaluru",
        "distance_km": 4.0,
        "salary_min": 22000,
        "salary_max": 26000,
        "experience": "3-5 Years",
        "job_type": "Full Time",
        "description": "Experienced steel fixers required for high-rise construction.",
        "requirements": ["3+ years steel fixing experience", "Safety certified", "Ready to relocate"],
        "rating": 4.3,
        "image_url": "https://images.pexels.com/photos/4483865/pexels-photo-4483865.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    },
    {
        "title": "Painter",
        "company": "ColorPlus Services",
        "industry": "construction",
        "city": "Bengaluru",
        "distance_km": 6.0,
        "salary_min": 16000,
        "salary_max": 20000,
        "experience": "1-2 Years",
        "job_type": "Part Time",
        "description": "Professional painters for interior and exterior projects.",
        "requirements": ["Painting experience", "Good finish quality", "Own brush kit"],
        "rating": 4.1,
        "image_url": None,
    },
    {
        "title": "Delivery Executive",
        "company": "Swift Logistics",
        "industry": "delivery",
        "city": "Bengaluru",
        "distance_km": 3.5,
        "salary_min": 18000,
        "salary_max": 24000,
        "experience": "Fresher",
        "job_type": "Full Time",
        "description": "Two-wheeler delivery executives needed across city.",
        "requirements": ["Own two-wheeler", "Valid driving license", "Smartphone"],
        "rating": 4.0,
        "image_url": None,
    },
    {
        "title": "Security Guard",
        "company": "Shield Security",
        "industry": "security",
        "city": "Mysuru",
        "distance_km": 1.5,
        "salary_min": 15000,
        "salary_max": 18000,
        "experience": "Fresher",
        "job_type": "Full Time",
        "description": "Night and day shift security guards required for residential complex.",
        "requirements": ["Physical fitness", "Punctuality", "Hindi/Kannada speaking"],
        "rating": 4.2,
        "image_url": None,
    },
    {
        "title": "Plumber",
        "company": "AquaFix Services",
        "industry": "construction",
        "city": "Chennai",
        "distance_km": 4.0,
        "salary_min": 17000,
        "salary_max": 22000,
        "experience": "1-2 Years",
        "job_type": "Full Time",
        "description": "Plumbers needed for new construction sites and repairs.",
        "requirements": ["Plumbing experience", "Own tools preferred", "Local language fluency"],
        "rating": 4.0,
        "image_url": None,
    },
    {
        "title": "Factory Worker",
        "company": "Reliance Manufacturing",
        "industry": "factory",
        "city": "Pune",
        "distance_km": 8.0,
        "salary_min": 16000,
        "salary_max": 20000,
        "experience": "Fresher",
        "job_type": "Full Time",
        "description": "Assembly line operators required for manufacturing plant.",
        "requirements": ["10th pass minimum", "Willing to do shifts", "Team player"],
        "rating": 4.1,
        "image_url": None,
    },
    {
        "title": "AC Technician",
        "company": "CoolBreeze India",
        "industry": "electrician",
        "city": "Hyderabad",
        "distance_km": 6.0,
        "salary_min": 22000,
        "salary_max": 28000,
        "experience": "2-5 Yrs",
        "job_type": "Full Time",
        "description": "AC installation and repair technicians needed.",
        "requirements": ["Refrigeration course", "2+ years experience", "Two-wheeler"],
        "rating": 4.4,
        "image_url": None,
    },
    # Test job marker - explicit
    {
        "title": "Test Job - Carpenter",
        "company": "Demo Workshop",
        "industry": "construction",
        "city": "Bengaluru",
        "distance_km": 1.0,
        "salary_min": 15000,
        "salary_max": 19000,
        "experience": "1-2 Years",
        "job_type": "Daily Wage",
        "description": "This is a test job created for QA / demo purposes. Apply to validate end-to-end flow.",
        "requirements": ["Test requirement 1", "Test requirement 2"],
        "rating": 4.0,
        "image_url": None,
    },
]


async def seed_data():
    count = await db.jobs.count_documents({})
    if count == 0:
        for j in SEED_JOBS:
            job = Job(**j)
            await db.jobs.insert_one(job.model_dump())
        logging.info("Seeded %d jobs", len(SEED_JOBS))

    # Seed demo business
    biz = await db.businesses.find_one({"phone": "9999999999"}, {"_id": 0})
    if not biz:
        b = Business(name="Ravi Sharma", phone="9999999999", company="Sharma Construction", city="Bengaluru")
        await db.businesses.insert_one(b.model_dump())
        # Mark some seeded jobs as posted by this business
        await db.jobs.update_many(
            {"company": "Sharma Construction"},
            {"$set": {"posted_by_business_id": b.id}},
        )

    # Seed demo partner
    p = await db.partners.find_one({"phone": "8888888888"}, {"_id": 0})
    if not p:
        partner = Partner(name="Ramesh Kumar", phone="8888888888", city="Bengaluru")
        await db.partners.insert_one(partner.model_dump())
        seed_candidates = [
            {"name": "Mahesh Kumar", "skill": "Mason", "experience": "2 Years", "city": "Bengaluru", "status": "Looking"},
            {"name": "Suresh R", "skill": "Helper", "experience": "1 Year", "city": "Tumakuru", "status": "Looking"},
            {"name": "Raju P", "skill": "Painter", "experience": "3 Years", "city": "Bengaluru", "status": "Matched"},
            {"name": "Prakash M", "skill": "Electrician", "experience": "2 Years", "city": "Mysuru", "status": "Placed"},
        ]
        for c in seed_candidates:
            cand = PartnerCandidate(partner_id=partner.id, **c)
            await db.partner_candidates.insert_one(cand.model_dump())


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def on_startup():
    await seed_data()


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
