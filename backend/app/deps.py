from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import decode_token
from app.models import Tenant, TenantModule, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = decode_token(token)
    except ValueError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = db.query(User).filter(User.id == int(payload["sub"]), User.active.is_(True)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Usuário não encontrado")
    if user.role != "super_admin":
        tenant = db.query(Tenant).filter(Tenant.id == user.tenant_id).first()
        if tenant and not tenant.active:
            raise HTTPException(status_code=402, detail="Assinatura suspensa. Entre em contato com o administrador.")
    return user

def require_super_admin(cu: User = Depends(get_current_user)) -> User:
    if cu.role != "super_admin":
        raise HTTPException(status_code=403, detail="Acesso restrito a super admin")
    return cu

def require_module(module_name: str):
    def _check(db: Session = Depends(get_db), cu: User = Depends(get_current_user)) -> User:
        if cu.role == "super_admin":
            return cu
        mod = db.query(TenantModule).filter(
            TenantModule.tenant_id == cu.tenant_id,
            TenantModule.module_name == module_name,
            TenantModule.enabled.is_(True),
        ).first()
        if not mod:
            raise HTTPException(status_code=403, detail=f"Módulo '{module_name}' não está ativo no seu plano.")
        return cu
    return _check
