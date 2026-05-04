from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine
from app.models import Base
from app.routes import auth, admin, shoots, hermes

Base.metadata.create_all(bind=engine)

app = FastAPI(title="FotoAgenda API", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(shoots.router)
app.include_router(hermes.router)

@app.get("/health")
def health(): return {"status": "ok"}
