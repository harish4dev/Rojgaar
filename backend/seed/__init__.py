import logging

from database import db
from schemas import Business, Partner, PartnerCandidate
from seed.jobs import SEED_JOB_TITLES

logger = logging.getLogger(__name__)


async def cleanup_dummy_jobs() -> int:
    """Remove legacy demo/seed jobs from the database."""
    result = await db.jobs.delete_many({"title": {"$in": SEED_JOB_TITLES}})
    demo = await db.jobs.delete_many({"company": "Demo Workshop"})
    deleted = result.deleted_count + demo.deleted_count
    if deleted:
        logger.info("Removed %d dummy/seed jobs", deleted)
    return deleted


async def seed_data() -> None:
    await cleanup_dummy_jobs()

    # Backfill translations for any remaining real jobs
    from seed.translations import JOB_TRANSLATIONS

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
            industry="garments",
            profile_complete=True,
        )
        await db.businesses.insert_one(business.model_dump())

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
