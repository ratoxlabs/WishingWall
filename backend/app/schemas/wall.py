from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.content import ContentResponse

class WallCreate(BaseModel):
    title: str
    description: Optional[str] = None

class WallUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class WallResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    unique_url: str
    passcode: str
    is_public: bool
    admin_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class WallPublicResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    unique_url: str
    is_public: bool
    contents: List[ContentResponse] = []
    
    class Config:
        from_attributes = True

