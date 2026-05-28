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
    gender: Optional[str] = None  # Male | Female | Other
    age: Optional[int] = None
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
    gender: Optional[str] = None
    age: Optional[int] = None
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
    # Multi-language content: { "hi": { "title": "...", "description": "...", "requirements": [...] }, ... }
    translations: dict = Field(default_factory=dict)
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
    fields = [
        "name", "gender", "age", "city", "industries", "skills",
        "experience", "expected_salary", "work_type",
    ]
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
# Translations for common job content keyed by English title.
JOB_TRANSLATIONS: dict = {
    "Mason": {
        "hi": {
            "title": "राजमिस्त्री",
            "description": "हमें आवासीय और वाणिज्यिक परियोजनाओं के लिए कुशल राजमिस्त्री चाहिए।",
            "requirements": ["राजमिस्त्री कार्य का अनुभव", "बुनियादी निर्देश पढ़ सकते हों", "मेहनती और समय के पाबंद"],
            "experience": "2-5 साल",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಮೇಸ್ತ್ರಿ",
            "description": "ವಸತಿ ಮತ್ತು ವಾಣಿಜ್ಯ ಯೋಜನೆಗಳಿಗೆ ಕೌಶಲ್ಯವುಳ್ಳ ಮೇಸ್ತ್ರಿಗಳು ಬೇಕು.",
            "requirements": ["ಮೇಸ್ತ್ರಿ ಕೆಲಸದ ಅನುಭವ", "ಮೂಲ ಸೂಚನೆಗಳನ್ನು ಓದಬಲ್ಲವರು", "ಕಠಿಣ ಪರಿಶ್ರಮಿ ಮತ್ತು ಸಮಯಪ್ರಜ್ಞೆಯುಳ್ಳವರು"],
            "experience": "2-5 ವರ್ಷ",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Helper": {
        "hi": {
            "title": "हेल्पर",
            "description": "चल रही निर्माण साइट के लिए मेहनती हेल्पर की आवश्यकता है।",
            "requirements": ["शारीरिक रूप से फिट", "बाहर काम करने को तैयार", "टीम के साथ काम कर सकें"],
            "experience": "नया",
            "job_type": "दैनिक मजदूरी",
        },
        "kn": {
            "title": "ಸಹಾಯಕ",
            "description": "ನಡೆಯುತ್ತಿರುವ ಕಟ್ಟಡ ಕಾಮಗಾರಿಗೆ ಪರಿಶ್ರಮಿ ಸಹಾಯಕರು ಬೇಕು.",
            "requirements": ["ದೈಹಿಕವಾಗಿ ಸದೃಢ", "ಹೊರಾಂಗಣದಲ್ಲಿ ಕೆಲಸಕ್ಕೆ ಸಿದ್ಧ", "ತಂಡದೊಂದಿಗೆ ಕೆಲಸ ಮಾಡಬಲ್ಲರು"],
            "experience": "ಹೊಸಬರು",
            "job_type": "ದೈನಂದಿನ ಕೂಲಿ",
        },
    },
    "Electrician": {
        "hi": {
            "title": "इलेक्ट्रीशियन",
            "description": "आवासीय और वाणिज्यिक वायरिंग कार्य के लिए प्रमाणित इलेक्ट्रीशियन चाहिए।",
            "requirements": ["आईटीआई इलेक्ट्रीशियन प्रमाणपत्र", "कम से कम 1 साल का अनुभव", "अपने औजार होने चाहिए"],
            "experience": "1-2 साल",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞ",
            "description": "ವಸತಿ ಮತ್ತು ವಾಣಿಜ್ಯ ವೈರಿಂಗ್ ಯೋಜನೆಗಳಿಗೆ ಪ್ರಮಾಣಪತ್ರ ಪಡೆದ ವಿದ್ಯುತ್ ತಂತ್ರಜ್ಞರು ಬೇಕು.",
            "requirements": ["ಐಟಿಐ ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಪ್ರಮಾಣಪತ್ರ", "ಕನಿಷ್ಠ 1 ವರ್ಷದ ಅನುಭವ", "ಸ್ವಂತ ಉಪಕರಣಗಳಿರಬೇಕು"],
            "experience": "1-2 ವರ್ಷ",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Steel Fixer": {
        "hi": {
            "title": "स्टील फिक्सर",
            "description": "ऊंची इमारतों के निर्माण के लिए अनुभवी स्टील फिक्सर की आवश्यकता है।",
            "requirements": ["3+ साल स्टील फिक्सिंग अनुभव", "सुरक्षा प्रमाणित", "स्थानांतरण के लिए तैयार"],
            "experience": "3-5 साल",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಸ್ಟೀಲ್ ಫಿಕ್ಸರ್",
            "description": "ಎತ್ತರದ ಕಟ್ಟಡ ನಿರ್ಮಾಣಕ್ಕಾಗಿ ಅನುಭವಿ ಸ್ಟೀಲ್ ಫಿಕ್ಸರ್‌ಗಳು ಬೇಕು.",
            "requirements": ["3+ ವರ್ಷಗಳ ಸ್ಟೀಲ್ ಫಿಕ್ಸಿಂಗ್ ಅನುಭವ", "ಸುರಕ್ಷತಾ ಪ್ರಮಾಣೀಕೃತ", "ಸ್ಥಳಾಂತರಕ್ಕೆ ಸಿದ್ಧ"],
            "experience": "3-5 ವರ್ಷ",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Painter": {
        "hi": {
            "title": "पेंटर",
            "description": "आंतरिक और बाहरी परियोजनाओं के लिए पेशेवर पेंटर।",
            "requirements": ["पेंटिंग का अनुभव", "अच्छी फिनिशिंग गुणवत्ता", "अपनी ब्रश किट होनी चाहिए"],
            "experience": "1-2 साल",
            "job_type": "अंशकालिक",
        },
        "kn": {
            "title": "ಬಣ್ಣಗಾರ",
            "description": "ಒಳಾಂಗಣ ಮತ್ತು ಹೊರಾಂಗಣ ಯೋಜನೆಗಳಿಗೆ ವೃತ್ತಿಪರ ಬಣ್ಣಗಾರರು.",
            "requirements": ["ಬಣ್ಣ ಬಳಿಯುವ ಅನುಭವ", "ಉತ್ತಮ ಫಿನಿಶ್ ಗುಣಮಟ್ಟ", "ಸ್ವಂತ ಬ್ರಷ್ ಕಿಟ್ ಇರಬೇಕು"],
            "experience": "1-2 ವರ್ಷ",
            "job_type": "ಭಾಗಶಃ ಸಮಯ",
        },
    },
    "Delivery Executive": {
        "hi": {
            "title": "डिलीवरी एक्जीक्यूटिव",
            "description": "शहर भर में दोपहिया वाहन डिलीवरी एक्जीक्यूटिव की आवश्यकता है।",
            "requirements": ["अपना दोपहिया वाहन", "वैध ड्राइविंग लाइसेंस", "स्मार्टफोन"],
            "experience": "नया",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಡೆಲಿವರಿ ಎಕ್ಸಿಕ್ಯೂಟಿವ್",
            "description": "ನಗರದಾದ್ಯಂತ ದ್ವಿಚಕ್ರ ವಾಹನ ಡೆಲಿವರಿ ಎಕ್ಸಿಕ್ಯೂಟಿವ್‌ಗಳು ಬೇಕು.",
            "requirements": ["ಸ್ವಂತ ದ್ವಿಚಕ್ರ ವಾಹನ", "ಮಾನ್ಯ ಚಾಲನಾ ಪರವಾನಗಿ", "ಸ್ಮಾರ್ಟ್‌ಫೋನ್"],
            "experience": "ಹೊಸಬರು",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Security Guard": {
        "hi": {
            "title": "सुरक्षा गार्ड",
            "description": "आवासीय परिसर के लिए रात और दिन की पाली में सुरक्षा गार्ड की आवश्यकता है।",
            "requirements": ["शारीरिक स्वस्थता", "समय का पाबंद", "हिंदी/कन्नड़ बोलने वाले"],
            "experience": "नया",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ",
            "description": "ವಸತಿ ಸಮುಚ್ಚಯಕ್ಕೆ ಹಗಲು ಮತ್ತು ರಾತ್ರಿ ಪಾಳಿಯ ಭದ್ರತಾ ಸಿಬ್ಬಂದಿ ಬೇಕು.",
            "requirements": ["ದೈಹಿಕ ಸದೃಢತೆ", "ಸಮಯಪ್ರಜ್ಞೆ", "ಹಿಂದಿ/ಕನ್ನಡ ಮಾತನಾಡುವವರು"],
            "experience": "ಹೊಸಬರು",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Plumber": {
        "hi": {
            "title": "प्लंबर",
            "description": "नई निर्माण साइटों और मरम्मत के लिए प्लंबर की आवश्यकता है।",
            "requirements": ["प्लंबिंग का अनुभव", "अपने औजार बेहतर", "स्थानीय भाषा में पारंगत"],
            "experience": "1-2 साल",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಪ್ಲಂಬರ್",
            "description": "ಹೊಸ ಕಟ್ಟಡ ಸ್ಥಳಗಳು ಮತ್ತು ರಿಪೇರಿಗಳಿಗೆ ಪ್ಲಂಬರ್‌ಗಳು ಬೇಕು.",
            "requirements": ["ಪ್ಲಂಬಿಂಗ್ ಅನುಭವ", "ಸ್ವಂತ ಉಪಕರಣಗಳಿದ್ದರೆ ಉತ್ತಮ", "ಸ್ಥಳೀಯ ಭಾಷೆಯಲ್ಲಿ ನಿರರ್ಗಳತೆ"],
            "experience": "1-2 ವರ್ಷ",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Factory Worker": {
        "hi": {
            "title": "फैक्ट्री वर्कर",
            "description": "विनिर्माण संयंत्र के लिए असेंबली लाइन ऑपरेटर की आवश्यकता है।",
            "requirements": ["न्यूनतम 10वीं पास", "शिफ्ट में काम के लिए तैयार", "टीम प्लेयर"],
            "experience": "नया",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಫ್ಯಾಕ್ಟರಿ ಕೆಲಸಗಾರ",
            "description": "ಉತ್ಪಾದನಾ ಘಟಕಕ್ಕೆ ಜೋಡಣಾ ಸಾಲಿನ ಆಪರೇಟರ್‌ಗಳು ಬೇಕು.",
            "requirements": ["ಕನಿಷ್ಠ 10ನೇ ತರಗತಿ ಉತ್ತೀರ್ಣ", "ಶಿಫ್ಟ್‌ಗಳಲ್ಲಿ ಕೆಲಸ ಮಾಡಲು ಸಿದ್ಧ", "ತಂಡದ ಆಟಗಾರ"],
            "experience": "ಹೊಸಬರು",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "AC Technician": {
        "hi": {
            "title": "एसी तकनीशियन",
            "description": "एसी स्थापना और मरम्मत तकनीशियन की आवश्यकता है।",
            "requirements": ["रेफ्रिजरेशन कोर्स", "2+ साल का अनुभव", "दोपहिया वाहन"],
            "experience": "2-5 साल",
            "job_type": "पूर्णकालिक",
        },
        "kn": {
            "title": "ಎಸಿ ತಂತ್ರಜ್ಞ",
            "description": "ಎಸಿ ಸ್ಥಾಪನೆ ಮತ್ತು ರಿಪೇರಿ ತಂತ್ರಜ್ಞರು ಬೇಕು.",
            "requirements": ["ರೆಫ್ರಿಜರೇಶನ್ ಕೋರ್ಸ್", "2+ ವರ್ಷಗಳ ಅನುಭವ", "ದ್ವಿಚಕ್ರ ವಾಹನ"],
            "experience": "2-5 ವರ್ಷ",
            "job_type": "ಪೂರ್ಣ ಸಮಯ",
        },
    },
    "Test Job - Carpenter": {
        "hi": {
            "title": "टेस्ट जॉब - बढ़ई",
            "description": "यह QA/डेमो उद्देश्यों के लिए बनाया गया एक टेस्ट जॉब है। एंड-टू-एंड फ्लो की जांच के लिए आवेदन करें।",
            "requirements": ["टेस्ट आवश्यकता 1", "टेस्ट आवश्यकता 2"],
            "experience": "1-2 साल",
            "job_type": "दैनिक मजदूरी",
        },
        "kn": {
            "title": "ಪರೀಕ್ಷಾ ಉದ್ಯೋಗ - ಬಡಗಿ",
            "description": "ಇದು QA/ಡೆಮೋ ಉದ್ದೇಶಗಳಿಗಾಗಿ ರಚಿಸಲಾದ ಪರೀಕ್ಷಾ ಉದ್ಯೋಗವಾಗಿದೆ. ಕೊನೆಯಿಂದ ಕೊನೆಯವರೆಗಿನ ಹರಿವನ್ನು ಪರಿಶೀಲಿಸಲು ಅರ್ಜಿ ಸಲ್ಲಿಸಿ.",
            "requirements": ["ಪರೀಕ್ಷಾ ಅವಶ್ಯಕತೆ 1", "ಪರೀಕ್ಷಾ ಅವಶ್ಯಕತೆ 2"],
            "experience": "1-2 ವರ್ಷ",
            "job_type": "ದೈನಂದಿನ ಕೂಲಿ",
        },
    },
}


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
            tr = JOB_TRANSLATIONS.get(j["title"], {})
            job = Job(**j, translations=tr)
            await db.jobs.insert_one(job.model_dump())
        logging.info("Seeded %d jobs", len(SEED_JOBS))
    else:
        # Backfill translations for any existing job that doesn't have them yet.
        updated = 0
        async for j in db.jobs.find({}, {"_id": 0, "id": 1, "title": 1, "translations": 1}):
            tr = JOB_TRANSLATIONS.get(j.get("title", ""), {})
            if tr and not j.get("translations"):
                await db.jobs.update_one({"id": j["id"]}, {"$set": {"translations": tr}})
                updated += 1
        if updated:
            logging.info("Backfilled translations for %d jobs", updated)

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
