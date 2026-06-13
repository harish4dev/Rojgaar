from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from database import db
from services.whatsapp import send_whatsapp_message

router = APIRouter(prefix="/notifications", tags=["notifications"])


class WhatsappNotificationRequest(BaseModel):
    worker_id: str
    event_type: str
    message: str | None = None


EVENT_TEMPLATES = {
    "new_matching_jobs": "New matching jobs are available for your profile on Rojgaar.",
    "application_status_updates": "Your application status was updated. Check the app for details.",
    "interview_schedules": "Interview scheduled. Please check your Rojgaar app for date and time.",
    "job_offer_notifications": "Congratulations! You have a new job offer on Rojgaar.",
    "hiring_updates": "There is a new hiring update for one of your applications.",
}


@router.post("/whatsapp")
async def send_whatsapp_notification(payload: WhatsappNotificationRequest):
    worker = await db.workers.find_one({"id": payload.worker_id}, {"_id": 0, "phone": 1})
    if not worker or not worker.get("phone"):
        raise HTTPException(status_code=404, detail="Worker phone not found")
    template = EVENT_TEMPLATES.get(payload.event_type)
    if not template and not payload.message:
        raise HTTPException(status_code=400, detail="Unknown event_type and message missing")
    sent = await send_whatsapp_message(worker["phone"], payload.message or template or "")
    return {"success": sent}
