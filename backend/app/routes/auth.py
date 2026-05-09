import re, uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.deps import get_current_user
from app.models import MODULES, Tenant, TenantModule, User

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterIn(BaseModel):
    name: str
    email: str
    password: str
    studio_name: str = ""

class LoginIn(BaseModel):
    email: str
    password: str

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserOut(BaseModel):
    id: int; name: str; email: str; role: str; tenant_id: int
    model_config = {"from_attributes": True}

class ModulesOut(BaseModel):
    hermes: bool = False
    financeiro: bool = False
    relatorios: bool = False
    calendario: bool = False

@router.post("/register", response_model=TokenOut, status_code=201)
def register(payload: RegisterIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")
    slug = re.sub(r"[^a-z0-9]", "-", payload.email.split("@")[0].lower())[:30]
    base = slug
    i = 1
    while db.query(Tenant).filter(Tenant.slug == slug).first():
        slug = f"{base}-{i}"; i += 1
    tenant = Tenant(name=payload.studio_name or payload.name, slug=slug)
    db.add(tenant); db.flush()
    for mod in MODULES:
        db.add(TenantModule(tenant_id=tenant.id, module_name=mod, enabled=False))
    user = User(tenant_id=tenant.id, email=payload.email,
                password_hash=hash_password(payload.password), name=payload.name, role="admin")
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return TokenOut(access_token=token)

@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email, User.active.is_(True)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    # Verifica se o tenant está ativo (bloqueio por inadimplência)
    if user.role != "super_admin":
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if not tenant or not tenant.active:
            raise HTTPException(
                status_code=403,
                detail="Conta suspensa. Entre em contato com o suporte."
            )

    return TokenOut(access_token=create_access_token({"sub": str(user.id)}))

@router.get("/me", response_model=UserOut)
def me(cu: User = Depends(get_current_user)):
    return cu

@router.get("/me/modules", response_model=ModulesOut)
def my_modules(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    if cu.role == "super_admin":
        return ModulesOut(**{m: True for m in MODULES})
    mods = db.query(TenantModule).filter(TenantModule.tenant_id == cu.tenant_id).all()
    data = {m.module_name: m.enabled for m in mods}
    return ModulesOut(**{m: data.get(m, False) for m in MODULES})
