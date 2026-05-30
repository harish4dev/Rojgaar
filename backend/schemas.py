import uuid
from datetime import datetime, timezone
from typing import List, Optional

from pydantic import BaseModel, Field, field_validator


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Worker(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    language: str = "en"
    city: Optional[str] = None
    industries: List[str] = Field(default_factory=list)
    skills: List[str] = Field(default_factory=list)
    experience: Optional[str] = None
    expected_salary: Optional[str] = None
    work_type: Optional[str] = None
    collar_type: Optional[str] = None
    registered_by_partner_id: Optional[str] = None
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
    collar_type: Optional[str] = None


class Business(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    phone: Optional[str] = None
    company: str = ""
    city: str = ""
    profile_complete: bool = False
    created_at: str = Field(default_factory=now_iso)


class BusinessProfileUpdate(BaseModel):
    name: str
    company: str
    city: str


class Partner(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str = ""
    phone: Optional[str] = None
    agent_type: str = "partner"
    city: str = ""
    profile_complete: bool = False
    created_at: str = Field(default_factory=now_iso)


class PartnerProfileUpdate(BaseModel):
    name: str
    city: str


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
    job_type: str = "Full Time"
    description: str = ""
    requirements: List[str] = Field(default_factory=list)
    rating: float = 4.2
    image_url: Optional[str] = None
    posted_by_business_id: Optional[str] = None
    active: bool = True
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
    requirements: List[str] = Field(default_factory=list)
    posted_by_business_id: Optional[str] = None


class Application(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    job_id: str
    status: str = "Pending"
    applied_at: str = Field(default_factory=now_iso)


class ApplicationCreate(BaseModel):
    worker_id: str
    job_id: str


class ApplicationStatusUpdate(BaseModel):
    status: str


class SavedJob(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    worker_id: str
    job_id: str
    saved_at: str = Field(default_factory=now_iso)


class SavedJobCreate(BaseModel):
    worker_id: str
    job_id: str


class PartnerCandidate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    partner_id: str
    name: str
    employee_number: str
    skill: str
    experience: str = "Fresher"
    city: str
    gender: str
    age: int
    collar_type: str
    phone_verified: bool = True
    status: str = "Looking"
    created_at: str = Field(default_factory=now_iso)


class CandidateCreate(BaseModel):
    name: str
    employee_number: str
    skill: str
    experience: str = "Fresher"
    city: str
    gender: str
    age: int
    collar_type: str

    @field_validator("employee_number")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) != 10:
            raise ValueError("employee_number must be a 10-digit phone")
        return digits


class CandidateOtpConfirm(BaseModel):
    employee_number: str
    otp: str

    @field_validator("employee_number")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        digits = "".join(c for c in v if c.isdigit())
        if len(digits) != 10:
            raise ValueError("employee_number must be a 10-digit phone")
        return digits


class OtpRequest(BaseModel):
    phone: str
    role: str = "worker"


class OtpVerify(BaseModel):
    phone: str
    otp: str
    role: str = "worker"
