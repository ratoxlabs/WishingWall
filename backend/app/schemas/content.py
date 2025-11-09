from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.models.content import ContentType

class ContentCreate(BaseModel):
    wall_id: int
    content_type: ContentType
    text: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    author_name: Optional[str] = None

class ContentResponse(BaseModel):
    id: int
    wall_id: int
    contributor_id: int
    content_type: ContentType
    text: Optional[str]
    image_url: Optional[str]
    image_urls: Optional[List[str]]
    author_name: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

