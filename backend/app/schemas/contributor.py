from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ContributorCreate(BaseModel):
    email: EmailStr

class ContributorInvite(BaseModel):
    email: EmailStr
    wall_id: int

class ContributorResponse(BaseModel):
    id: int
    email: str
    wall_id: int
    is_active: bool
    invited_at: datetime
    accepted_at: Optional[datetime]
    
    class Config:
        from_attributes = True

