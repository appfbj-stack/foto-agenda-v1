"""
Public endpoint that Kairos Admin uses to verify this app is online
and to confirm the license is being enforced.

Contract: GET /api/license/verify?client_id={UUID}&app_slug={slug}
Response: { "app": str, "slug": str, "client_id": str, "online": true }
"""
from fastapi import APIRouter, Query
from app.core.config import settings

router = APIRouter(prefix="/api/license", tags=["license"])


@router.get("/verify")
def license_verify(
    client_id: str = Query(...),
    app_slug: str = Query(...),
):
    return {
        "app": "FotoAgenda Pro",
        "slug": settings.APP_SLUG,
        "client_id": client_id,
        "online": True,
    }
