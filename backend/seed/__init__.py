import logging

from database import db
from schemas import Business, Job, Partner, PartnerCandidate
from seed.jobs import SEED_JOBS
from seed.translations import JOB_TRANSLATIONS

logger = logging.getLogger(__name__)


async def seed_data() -> None:
    count = await db.jobs.count_documents({})
    if count == 0:
        for job_data in SEED_JOBS:
            translations = JOB_TRANSLATIONS.get(job_data["title"], {})
            job = Job(**job_data, translations=translations)
            await db.jobs.insert_one(job.model_dump())
        logger.info("Seeded %d jobs", len(SEED_JOBS))
    else:
        updated = 0
        async for job in db.jobs.find({}, {"_id": 0, "id": 1, "title": 1, "translations": 1}):
            translations = JOB_TRANSLATIONS.get(job.get("title", ""), {})
            if translations and not job.get("translations"):
                await db.jobs.update_one({"id": job["id"]}, {"$set": {"translations": translations}})
                updated += 1
        if updated:
            logger.info("Backfilled translations for %d jobs", updated)

    biz = await db.businesses.find_one({"phone": "9999999999"}, {"_id": 0})
    if not biz:
        business = Business(
            name="Ravi Sharma",
            phone="9999999999",
            company="Sharma Construction",
            city="Bengaluru",
            profile_complete=True,
        )
        await db.businesses.insert_one(business.model_dump())
        await db.jobs.update_many(
            {"company": "Sharma Construction"},
            {"$set": {"posted_by_business_id": business.id}},
        )

    partner_doc = await db.partners.find_one({"phone": "8888888888"}, {"_id": 0})
    if not partner_doc:
        partner = Partner(
            name="Ramesh Kumar",
            phone="8888888888",
            city="Bengaluru",
            profile_complete=True,
        )
        await db.partners.insert_one(partner.model_dump())
        seed_candidates = [
            {"name": "Mahesh Kumar", "employee_number": "9876500001", "skill": "Mason", "experience": "2 Years", "city": "Bengaluru", "gender": "Male", "age": 28, "collar_type": "Blue Collar", "status": "Looking"},
            {"name": "Suresh R", "employee_number": "9876500002", "skill": "Helper", "experience": "1 Year", "city": "Tumakuru", "gender": "Male", "age": 24, "collar_type": "Blue Collar", "status": "Looking"},
            {"name": "Raju P", "employee_number": "9876500003", "skill": "Painter", "experience": "3 Years", "city": "Bengaluru", "gender": "Male", "age": 32, "collar_type": "Blue Collar", "status": "Matched"},
            {"name": "Prakash M", "employee_number": "9876500004", "skill": "Electrician", "experience": "2 Years", "city": "Mysuru", "gender": "Male", "age": 30, "collar_type": "Gray Collar", "status": "Placed"},
        ]
        for candidate in seed_candidates:
            record = PartnerCandidate(partner_id=partner.id, **candidate)
            await db.partner_candidates.insert_one(record.model_dump())
