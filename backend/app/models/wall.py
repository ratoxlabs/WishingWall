from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class Wall(Base):
    __tablename__ = "walls"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    unique_url = Column(String, unique=True, index=True, nullable=False)
    passcode = Column(String, nullable=False)
    is_public = Column(Boolean, default=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    admin = relationship("User", back_populates="walls")
    contributors = relationship("Contributor", back_populates="wall", cascade="all, delete-orphan")
    contents = relationship("Content", back_populates="wall", cascade="all, delete-orphan")

