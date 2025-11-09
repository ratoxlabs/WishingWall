from fastapi import APIRouter
from app.api.v1.endpoints import auth, walls, contributors, content

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(walls.router, prefix="/walls", tags=["walls"])
api_router.include_router(contributors.router, prefix="/contributors", tags=["contributors"])
api_router.include_router(content.router, prefix="/content", tags=["content"])

