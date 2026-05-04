from datetime import datetime, timezone
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, Float, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

def utcnow(): return datetime.now(timezone.utc)

# ── Tenant ────────────────────────────────────────────────────────────────────
class Tenant(Base):
    __tablename__ = "tenants"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

# ── User ──────────────────────────────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(50), default="admin")  # super_admin | admin
    active: Mapped[bool] = mapped_column(Boolean, default=True)

# ── TenantModule ──────────────────────────────────────────────────────────────
MODULES = ["hermes", "financeiro", "relatorios", "calendario"]

class TenantModule(Base):
    __tablename__ = "tenant_modules"
    __table_args__ = (UniqueConstraint("tenant_id", "module_name"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    module_name: Mapped[str] = mapped_column(String(100))
    enabled: Mapped[bool] = mapped_column(Boolean, default=False)

# ── StudioSettings ────────────────────────────────────────────────────────────
class StudioSettings(Base):
    __tablename__ = "studio_settings"
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(255), default="Meu Estúdio")
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    logo_base64: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

# ── FotoClient ────────────────────────────────────────────────────────────────
class FotoClient(Base):
    __tablename__ = "foto_clients"
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50), default="")
    email: Mapped[str] = mapped_column(String(255), default="")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[float] = mapped_column(Float, default=0)

# ── Shoot (Sessão fotográfica) ────────────────────────────────────────────────
class Shoot(Base):
    __tablename__ = "shoots"
    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), index=True)
    client_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(255))
    is_personal: Mapped[bool] = mapped_column(Boolean, default=False)
    package_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date: Mapped[str] = mapped_column(String(10))   # YYYY-MM-DD
    time: Mapped[str] = mapped_column(String(5))    # HH:MM
    location: Mapped[str] = mapped_column(String(255), default="")
    makeup_artist: Mapped[str | None] = mapped_column(String(255), nullable=True)
    makeup_price: Mapped[float] = mapped_column(Float, default=0)
    hairstylist: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hairstylist_price: Mapped[float] = mapped_column(Float, default=0)
    price: Mapped[float] = mapped_column(Float, default=0)
    deposit: Mapped[float] = mapped_column(Float, default=0)
    payment_status: Mapped[str] = mapped_column(String(50), default="Pendente")
    status: Mapped[str] = mapped_column(String(50), default="Agendado")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    reminder_minutes: Mapped[int] = mapped_column(Integer, default=0)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

# ── HermesUsage ───────────────────────────────────────────────────────────────
HERMES_PLANS = {
    "teste":     {"messages": 100,    "max_chars": 300,  "label": "Teste"},
    "basico":    {"messages": 1000,   "max_chars": 400,  "label": "Básico"},
    "pro":       {"messages": 5000,   "max_chars": 800,  "label": "Pro"},
    "ilimitado": {"messages": 999999, "max_chars": 1500, "label": "Ilimitado"},
}

class HermesUsage(Base):
    __tablename__ = "hermes_usage"
    id: Mapped[int] = mapped_column(primary_key=True)
    tenant_id: Mapped[int] = mapped_column(ForeignKey("tenants.id"), unique=True, index=True)
    plan: Mapped[str] = mapped_column(String(50), default="basico")
    messages_used: Mapped[int] = mapped_column(Integer, default=0)
    month: Mapped[str] = mapped_column(String(7), default="")
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
