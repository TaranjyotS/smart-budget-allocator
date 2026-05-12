from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import Base, engine, SessionLocal
from app.core.seed import seed_database
from app.api.routes_budget import router as budget_router
from app.api.routes_assets import router as assets_router
from app.api.routes_allocations import router as allocations_router
from app.api.routes_imports import router as imports_router
from app.api.routes_google_sheets import router as google_sheets_router

settings = get_settings()

Base.metadata.create_all(bind=engine)

db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(title=settings.app_name)

origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
allow_all_origins = "*" in origins or not origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else origins,
    allow_credentials=False if allow_all_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(budget_router)
app.include_router(assets_router)
app.include_router(allocations_router)
app.include_router(imports_router)
app.include_router(google_sheets_router)


@app.get("/")
def root():
    return {"message": "Smart Budget Allocator API is running"}
