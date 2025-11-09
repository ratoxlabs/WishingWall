from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Contributor(Base):
    __tablename__ = "contributors"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False, index=True)
    wall_id = Column(Integer, ForeignKey("walls.id"), nullable=False)
    is_active = Column(Boolean, default=True)
    invite_token = Column(String, unique=True, index=True, nullable=False)
    invited_at = Column(DateTime(timezone=True), server_default=func.now())
    accepted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    wall = relationship("Wall", back_populates="contributors")
    contents = relationship("Content", back_populates="contributor", cascade="all, delete-orphan")

