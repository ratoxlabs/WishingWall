from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class ContentType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"
    TEXT_IMAGE = "text_image"
    IMAGES = "images"  # Multiple images with left-right navigation
    IMAGES_TEXT = "images_text"  # Multiple images with text (truncated)

class Content(Base):
    __tablename__ = "contents"
    
    id = Column(Integer, primary_key=True, index=True)
    wall_id = Column(Integer, ForeignKey("walls.id"), nullable=False)
    contributor_id = Column(Integer, ForeignKey("contributors.id"), nullable=False)
    content_type = Column(Enum(ContentType), nullable=False)
    text = Column(Text, nullable=True)
    image_url = Column(String, nullable=True)  # For backward compatibility (single image)
    image_urls = Column(JSON, nullable=True)  # Array of image URLs for multiple images
    author_name = Column(String, nullable=True)  # Optional name override
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    wall = relationship("Wall", back_populates="contents")
    contributor = relationship("Contributor", back_populates="contents")

