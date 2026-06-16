import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, SessionLocal
from app.core.security import hash_password
from app.models import Base, Tenant, User

Base.metadata.create_all(bind=engine)


def _seed_super_admin():
    email = os.getenv("ADMIN_EMAIL", "").strip()
    password = os.getenv("ADMIN_PASSWORD", "").strip()
    if not email or not password:
        return
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            if existing.role != "super_admin":
                existing.role = "super_admin"
                db.commit()
            return
        tenant = db.query(Tenant).filter(Tenant.slug == "__admin__").first()
        if not tenant:
            tenant = Tenant(name="__admin__", slug="__admin__", active=True)
            db.add(tenant)
            db.flush()
        user = User(
            tenant_id=tenant.id,
            email=email,
            password_hash=hash_password(password),
            name="Super Admin",
            role="super_admin",
            active=True,
        )
        db.add(user)
        db.commit()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    _seed_super_admin()
    yield


from app.routes import auth, admin, shoots, hermes, panel, license_check

app = FastAPI(title="FotoAgenda Pro API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://fotografia.fbautomacao.space",
        "http://fotografia.fbautomacao.space",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(shoots.router)
app.include_router(hermes.router)
app.include_router(panel.router)
app.include_router(license_check.router)


@app.get("/health")
def health():
    return {"status": "ok", "app": "FotoAgenda API"}
