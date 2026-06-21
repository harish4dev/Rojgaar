from fastapi import APIRouter

from routers import (
    applications,
    auth,
    businesses,
    health,
    jobs,
    meta,
    notifications,
    partners,
    recommendations,
    saved_jobs,
    workers,
)

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(workers.router)
api_router.include_router(jobs.router)
api_router.include_router(applications.router)
api_router.include_router(saved_jobs.router)
api_router.include_router(businesses.router)
api_router.include_router(partners.router)
api_router.include_router(meta.router)
api_router.include_router(recommendations.router)
api_router.include_router(notifications.router)
