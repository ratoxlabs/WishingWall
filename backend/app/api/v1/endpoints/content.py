from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.wall import Wall
from app.models.contributor import Contributor
from app.models.content import Content, ContentType
from app.schemas.content import ContentCreate, ContentResponse
from app.core.config import settings
from typing import Optional, List
import os
import aiofiles
import secrets
import string
from datetime import datetime

router = APIRouter()

def generate_filename(original_filename: str) -> str:
    """Generate a unique filename."""
    ext = original_filename.split('.')[-1] if '.' in original_filename else 'jpg'
    random_str = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(16))
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    return f"{timestamp}_{random_str}.{ext}"

async def save_upload_file(file: UploadFile) -> str:
    """Save uploaded file and return the URL."""
    # Create upload directory if it doesn't exist
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    
    # Validate file type
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_TYPES)}"
        )
    
    # Generate filename
    filename = generate_filename(file.filename)
    file_path = os.path.join(settings.UPLOAD_DIR, filename)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        content = await file.read()
        # Check file size
        if len(content) > settings.MAX_UPLOAD_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {settings.MAX_UPLOAD_SIZE / (1024*1024)}MB"
            )
        await f.write(content)
    
    # Return relative URL (in production, this would be a full URL)
    return f"/uploads/{filename}"

@router.post("", response_model=ContentResponse, status_code=status.HTTP_201_CREATED)
async def create_content(
    wall_id: int = Form(...),
    content_type: ContentType = Form(...),
    text: Optional[str] = Form(None),
    author_name: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    images: List[UploadFile] = File(default=[]),
    invite_token: Optional[str] = Form(None),
    wall_url: Optional[str] = Form(None),
    wall_passcode: Optional[str] = Form(None),
    contributor_email: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    """Create content on a wall (contributor endpoint).
    
    Supports two authentication methods:
    1. Invite token (existing method)
    2. Wall URL + passcode (new direct access method)
    """
    contributor = None
    wall = None
    
    # Method 1: Using invite token (existing flow)
    if invite_token:
        contributor = db.query(Contributor).filter(Contributor.invite_token == invite_token).first()
        if not contributor:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid invite token"
            )
        if not contributor.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Contributor access revoked"
            )
        wall = db.query(Wall).filter(Wall.id == contributor.wall_id).first()
    
    # Method 2: Using wall URL + passcode (new direct access flow)
    elif wall_url and wall_passcode:
        wall = db.query(Wall).filter(Wall.unique_url == wall_url).first()
        if not wall:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wall not found"
            )
        if wall.passcode != wall_passcode:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid passcode"
            )
        
        # Create or get contributor automatically
        # Use email if provided, otherwise use a placeholder
        email = contributor_email or f"guest_{datetime.utcnow().timestamp()}@wishingwall.local"
        
        # Check if contributor already exists for this email and wall
        contributor = db.query(Contributor).filter(
            Contributor.email == email,
            Contributor.wall_id == wall.id
        ).first()
        
        if not contributor:
            # Create new contributor automatically
            import secrets
            import string
            invite_token_new = secrets.token_urlsafe(32)
            contributor = Contributor(
                email=email,
                wall_id=wall.id,
                invite_token=invite_token_new,
                accepted_at=datetime.utcnow()
            )
            db.add(contributor)
            db.commit()
            db.refresh(contributor)
        elif not contributor.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Contributor access revoked"
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either invite_token or (wall_url + wall_passcode) must be provided"
        )
    
    # Verify wall exists and matches
    if not wall:
        wall = db.query(Wall).filter(Wall.id == wall_id).first()
        if not wall:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Wall not found"
            )
    
    if wall.id != wall_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Wall ID mismatch"
        )
    
    if wall.id != contributor.wall_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to post to this wall"
        )
    
    # Validate content type and required fields
    image_url = None
    image_urls = None
    
    # Handle single image types (backward compatibility)
    if content_type == ContentType.IMAGE or content_type == ContentType.TEXT_IMAGE:
        if not image:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Image is required for this content type"
            )
        image_url = await save_upload_file(image)
    
    # Handle multiple images types
    elif content_type == ContentType.IMAGES or content_type == ContentType.IMAGES_TEXT:
        if not images or len(images) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="At least one image is required for this content type"
            )
        if len(images) > 20:  # Limit to 20 images max
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 20 images allowed"
            )
        image_urls = []
        for img in images:
            url = await save_upload_file(img)
            image_urls.append(url)
    
    # Validate text requirements
    if content_type == ContentType.TEXT or content_type == ContentType.TEXT_IMAGE:
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text is required for this content type"
            )
    elif content_type == ContentType.IMAGES_TEXT:
        if not text:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text is required for images with text content type"
            )
    
    # Mark contributor as accepted if not already (for invite token flow)
    if not contributor.accepted_at:
        contributor.accepted_at = datetime.utcnow()
        db.commit()
    
    # Create content
    content = Content(
        wall_id=wall_id,
        contributor_id=contributor.id,
        content_type=content_type,
        text=text,
        image_url=image_url,
        image_urls=image_urls,
        author_name=author_name
    )
    db.add(content)
    db.commit()
    db.refresh(content)
    
    return ContentResponse.model_validate(content)

@router.get("/wall/{wall_id}", response_model=list[ContentResponse])
async def get_wall_contents(
    wall_id: int,
    db: Session = Depends(get_db)
):
    """Get all contents for a wall."""
    wall = db.query(Wall).filter(Wall.id == wall_id).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    
    contents = db.query(Content).filter(Content.wall_id == wall_id).order_by(Content.created_at.desc()).all()
    return [ContentResponse.model_validate(content) for content in contents]

@router.delete("/{content_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_content(
    content_id: int,
    invite_token: Optional[str] = None,
    wall_url: Optional[str] = None,
    wall_passcode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Delete content (contributor can delete their own content)."""
    contributor = None
    
    if invite_token:
        contributor = db.query(Contributor).filter(Contributor.invite_token == invite_token).first()
    elif wall_url and wall_passcode:
        wall = db.query(Wall).filter(Wall.unique_url == wall_url).first()
        if wall and wall.passcode == wall_passcode:
            # Find contributor by content
            content = db.query(Content).filter(Content.id == content_id).first()
            if content:
                contributor = db.query(Contributor).filter(Contributor.id == content.contributor_id).first()
    
    if not contributor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication"
        )
    
    content = db.query(Content).filter(Content.id == content_id).first()
    if not content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Content not found"
        )
    
    # Only allow deleting own content
    if content.contributor_id != contributor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this content"
        )
    
    # Delete image files if exist
    if content.image_url:
        file_path = content.image_url.lstrip('/')
        if os.path.exists(file_path):
            os.remove(file_path)
    
    if content.image_urls:
        for url in content.image_urls:
            file_path = url.lstrip('/')
            if os.path.exists(file_path):
                os.remove(file_path)
    
    db.delete(content)
    db.commit()
    return None

