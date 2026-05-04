"""Admin Master — super_admin only."""
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password
from app.deps import get_current_user, require_super_admin
from app.models import MODULES, HERMES_PLANS, HermesUsage, Tenant, TenantModule, User

router = APIRouter(prefix="/admin", tags=["admin"])

def _cur_month(): return datetime.now(timezone.utc).strftime("%Y-%m")

def _get_or_create_usage(db, tenant_id):
    u = db.query(HermesUsage).filter(HermesUsage.tenant_id == tenant_id).first()
    if not u:
        u = HermesUsage(tenant_id=tenant_id, plan="basico", messages_used=0, month=_cur_month())
        db.add(u); db.commit(); db.refresh(u)
    if u.month != _cur_month():
        u.messages_used = 0; u.month = _cur_month(); db.commit()
    return u

def _modules_map(db, tenant_id):
    mods = db.query(TenantModule).filter(TenantModule.tenant_id == tenant_id).all()
    return {m.module_name: m.enabled for m in mods}

def _ensure_modules(db, tenant_id):
    existing = {m.module_name for m in db.query(TenantModule).filter(TenantModule.tenant_id == tenant_id).all()}
    for mod in MODULES:
        if mod not in existing:
            db.add(TenantModule(tenant_id=tenant_id, module_name=mod, enabled=False))
    db.commit()

# ── Schemas ───────────────────────────────────────────────────────────────────
class TenantOut(BaseModel):
    id: int; name: str; slug: str; active: bool
    modules: dict = {}
    model_config = {"from_attributes": True}

class HermesPlanUpdate(BaseModel):
    plan: str

class HermesUsageOut(BaseModel):
    tenant_id: int; plan: str; plan_label: str
    messages_used: int; messages_limit: int; month: str; percent: float

class SuperAdminIn(BaseModel):
    name: str; email: str; password: str

# ── Endpoints ─────────────────────────────────────────────────────────────────
@router.get("/tenants", response_model=list[TenantOut])
def list_tenants(db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    tenants = db.query(Tenant).all()
    out = []
    for t in tenants:
        _ensure_modules(db, t.id)
        o = TenantOut(id=t.id, name=t.name, slug=t.slug, active=t.active, modules=_modules_map(db, t.id))
        out.append(o)
    return out

@router.patch("/tenants/{tenant_id}", response_model=TenantOut)
def update_tenant(tenant_id: int, payload: dict, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    t = db.query(Tenant).filter(Tenant.id == tenant_id).first()
    if not t: raise HTTPException(404, "Tenant não encontrado")
    if "active" in payload: t.active = payload["active"]
    if "name" in payload: t.name = payload["name"]
    db.commit()
    return TenantOut(id=t.id, name=t.name, slug=t.slug, active=t.active, modules=_modules_map(db, t.id))

@router.patch("/tenants/{tenant_id}/modules")
def toggle_module(tenant_id: int, payload: dict, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    module_name = payload.get("module_name"); enabled = payload.get("enabled", False)
    mod = db.query(TenantModule).filter(TenantModule.tenant_id == tenant_id, TenantModule.module_name == module_name).first()
    if not mod:
        mod = TenantModule(tenant_id=tenant_id, module_name=module_name, enabled=enabled)
        db.add(mod)
    else:
        mod.enabled = enabled
    db.commit()
    return _modules_map(db, tenant_id)

@router.get("/tenants/{tenant_id}/hermes-usage", response_model=HermesUsageOut)
def get_hermes_usage(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    u = _get_or_create_usage(db, tenant_id)
    plan = HERMES_PLANS.get(u.plan, HERMES_PLANS["basico"])
    return HermesUsageOut(tenant_id=tenant_id, plan=u.plan, plan_label=plan["label"],
        messages_used=u.messages_used, messages_limit=plan["messages"], month=u.month,
        percent=min(100.0, round(u.messages_used / plan["messages"] * 100, 1)))

@router.patch("/tenants/{tenant_id}/hermes-plan", response_model=HermesUsageOut)
def set_hermes_plan(tenant_id: int, payload: HermesPlanUpdate, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    if payload.plan not in HERMES_PLANS: raise HTTPException(400, "Plano inválido")
    u = _get_or_create_usage(db, tenant_id); u.plan = payload.plan; db.commit()
    plan = HERMES_PLANS[payload.plan]
    return HermesUsageOut(tenant_id=tenant_id, plan=u.plan, plan_label=plan["label"],
        messages_used=u.messages_used, messages_limit=plan["messages"], month=u.month,
        percent=min(100.0, round(u.messages_used / plan["messages"] * 100, 1)))

@router.post("/tenants/{tenant_id}/hermes-reset", response_model=HermesUsageOut)
def reset_hermes_usage(tenant_id: int, db: Session = Depends(get_db), _: User = Depends(require_super_admin)):
    u = _get_or_create_usage(db, tenant_id); u.messages_used = 0; u.month = _cur_month(); db.commit()
    plan = HERMES_PLANS.get(u.plan, HERMES_PLANS["basico"])
    return HermesUsageOut(tenant_id=tenant_id, plan=u.plan, plan_label=plan["label"],
        messages_used=0, messages_limit=plan["messages"], month=u.month, percent=0.0)

@router.post("/super-admin", status_code=201)
def create_super_admin(payload: SuperAdminIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.role == "super_admin").count() > 0:
        raise HTTPException(400, "Super admin já existe")
    t = Tenant(name="__admin__", slug="__admin__", active=True); db.add(t); db.flush()
    u = User(tenant_id=t.id, email=payload.email, password_hash=hash_password(payload.password),
             name=payload.name, role="super_admin")
    db.add(u); db.commit()
    return {"ok": True}
