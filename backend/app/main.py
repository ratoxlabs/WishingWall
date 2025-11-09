from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.security import HTTPBearer
from app.core.config import settings
from app.api.v1.api import api_router
import os

app = FastAPI(
    title="WishingWall API",
    description="API for WishingWall platform",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API router
app.include_router(api_router, prefix="/api/v1")

# Serve static files (uploaded images)
upload_dir = settings.UPLOAD_DIR
os.makedirs(upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_dir), name="uploads")

security = HTTPBearer()

@app.get("/")
async def root():
    return {"message": "WishingWall API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

