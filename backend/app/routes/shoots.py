"""Rotas de clientes e sessões fotográficas."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.deps import get_current_user
from app.models import FotoClient, Shoot, User

router = APIRouter(tags=["shoots"])

# ── Schemas ───────────────────────────────────────────────────────────────────
class ClientIn(BaseModel):
    id: Optional[str] = None
    name: str; phone: str = ""; email: str = ""
    notes: Optional[str] = None; createdAt: float = 0

class ClientOut(ClientIn):
    model_config = {"from_attributes": True}

class ShootIn(BaseModel):
    id: Optional[str] = None
    clientId: Optional[str] = None
    title: str; isPersonal: bool = False
    packageType: Optional[str] = None
    date: str; time: str; location: str = ""
    makeupArtist: Optional[str] = None; makeupPrice: float = 0
    hairstylist: Optional[str] = None; hairstylistPrice: float = 0
    price: float = 0; deposit: float = 0
    paymentStatus: str = "Pendente"; status: str = "Agendado"
    notes: Optional[str] = None
    reminderMinutes: int = 0; reminderSent: bool = False

class ShootOut(ShootIn):
    model_config = {"from_attributes": True}

# ── Helpers ───────────────────────────────────────────────────────────────────
def _client_to_out(c: FotoClient) -> dict:
    return {"id": c.id, "name": c.name, "phone": c.phone, "email": c.email,
            "notes": c.notes, "createdAt": c.created_at}

def _shoot_to_out(s: Shoot) -> dict:
    return {"id": s.id, "clientId": s.client_id, "title": s.title,
            "isPersonal": s.is_personal, "packageType": s.package_type,
            "date": s.date, "time": s.time, "location": s.location,
            "makeupArtist": s.makeup_artist, "makeupPrice": s.makeup_price,
            "hairstylist": s.hairstylist, "hairstylistPrice": s.hairstylist_price,
            "price": s.price, "deposit": s.deposit,
            "paymentStatus": s.payment_status, "status": s.status,
            "notes": s.notes, "reminderMinutes": s.reminder_minutes,
            "reminderSent": s.reminder_sent}

# ── Clients ───────────────────────────────────────────────────────────────────
@router.get("/clients")
def list_clients(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    return [_client_to_out(c) for c in db.query(FotoClient).filter(FotoClient.tenant_id == cu.tenant_id).all()]

@router.put("/clients/{client_id}")
def save_client(client_id: str, payload: ClientIn, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    c = db.query(FotoClient).filter(FotoClient.id == client_id, FotoClient.tenant_id == cu.tenant_id).first()
    if not c:
        c = FotoClient(id=client_id, tenant_id=cu.tenant_id)
        db.add(c)
    c.name = payload.name; c.phone = payload.phone; c.email = payload.email
    c.notes = payload.notes; c.created_at = payload.createdAt
    db.commit(); return _client_to_out(c)

@router.delete("/clients/{client_id}", status_code=204)
def delete_client(client_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    c = db.query(FotoClient).filter(FotoClient.id == client_id, FotoClient.tenant_id == cu.tenant_id).first()
    if c: db.delete(c); db.commit()

# ── Shoots ────────────────────────────────────────────────────────────────────
@router.get("/shoots")
def list_shoots(db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    return [_shoot_to_out(s) for s in db.query(Shoot).filter(Shoot.tenant_id == cu.tenant_id).all()]

@router.put("/shoots/{shoot_id}")
def save_shoot(shoot_id: str, payload: ShootIn, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    s = db.query(Shoot).filter(Shoot.id == shoot_id, Shoot.tenant_id == cu.tenant_id).first()
    if not s:
        s = Shoot(id=shoot_id, tenant_id=cu.tenant_id)
        db.add(s)
    s.client_id = payload.clientId; s.title = payload.title
    s.is_personal = payload.isPersonal; s.package_type = payload.packageType
    s.date = payload.date; s.time = payload.time; s.location = payload.location
    s.makeup_artist = payload.makeupArtist; s.makeup_price = payload.makeupPrice
    s.hairstylist = payload.hairstylist; s.hairstylist_price = payload.hairstylistPrice
    s.price = payload.price; s.deposit = payload.deposit
    s.payment_status = payload.paymentStatus; s.status = payload.status
    s.notes = payload.notes; s.reminder_minutes = payload.reminderMinutes
    s.reminder_sent = payload.reminderSent
    db.commit(); return _shoot_to_out(s)

@router.delete("/shoots/{shoot_id}", status_code=204)
def delete_shoot(shoot_id: str, db: Session = Depends(get_db), cu: User = Depends(get_current_user)):
    s = db.query(Shoot).filter(Shoot.id == shoot_id, Shoot.tenant_id == cu.tenant_id).first()
    if s: db.delete(s); db.commit()
