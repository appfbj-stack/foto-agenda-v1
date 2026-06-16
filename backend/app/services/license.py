"""
Kairos Admin license verification service.

Calls the Kairos Admin API to check whether the tenant's license
is active for this app. If KAIROS_ADMIN_URL or KAIROS_CLIENT_ID
are not configured, the check is skipped (allows local dev without
Kairos Admin running).
"""
import httpx
from app.core.config import settings


async def verify_license(client_id: str) -> dict:
    """
    Returns {"active": bool, "plan": str, "blocked": bool}.
    On any error or missing config, returns active=True so the app
    degrades gracefully when Kairos Admin is unreachable.
    """
    if not settings.KAIROS_ADMIN_URL or not settings.KAIROS_CLIENT_ID:
        return {"active": True, "plan": "unknown", "blocked": False}

    url = (
        f"{settings.KAIROS_ADMIN_URL.rstrip('/')}"
        f"/api/license/verify"
        f"?client_id={client_id}&app_slug={settings.APP_SLUG}"
    )
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "active": data.get("active", True),
                    "plan": data.get("plan", "unknown"),
                    "blocked": not data.get("active", True),
                }
    except Exception:
        pass

    # Kairos Admin unreachable — fail open
    return {"active": True, "plan": "unknown", "blocked": False}


async def check_tenant_license(tenant_slug: str) -> None:
    """
    Raises HTTPException 403 if the Kairos Admin license is blocked.
    Uses the tenant slug as client_id for the license lookup.
    """
    from fastapi import HTTPException

    result = await verify_license(tenant_slug)
    if result.get("blocked"):
        raise HTTPException(
            status_code=403,
            detail="Licença expirada ou suspensa. Entre em contato com o administrador.",
        )
