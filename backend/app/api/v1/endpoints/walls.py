from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.models.wall import Wall
from app.schemas.wall import WallCreate, WallUpdate, WallResponse, WallPublicResponse
from app.schemas.content import ContentResponse
import secrets
import string

router = APIRouter()

def generate_unique_url() -> str:
    """Generate a unique URL slug for a wall."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(12))

def generate_passcode() -> str:
    """Generate a 6-digit passcode."""
    return ''.join(secrets.choice(string.digits) for _ in range(6))

@router.post("", response_model=WallResponse, status_code=status.HTTP_201_CREATED)
async def create_wall(
    wall_data: WallCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new wall."""
    # Generate unique URL and passcode
    unique_url = generate_unique_url()
    passcode = generate_passcode()
    
    # Ensure URL is unique
    while db.query(Wall).filter(Wall.unique_url == unique_url).first():
        unique_url = generate_unique_url()
    
    wall = Wall(
        title=wall_data.title,
        description=wall_data.description,
        unique_url=unique_url,
        passcode=passcode,
        admin_id=current_user.id
    )
    db.add(wall)
    db.commit()
    db.refresh(wall)
    
    return WallResponse.model_validate(wall)

@router.get("", response_model=list[WallResponse])
async def get_my_walls(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all walls created by the current user."""
    walls = db.query(Wall).filter(Wall.admin_id == current_user.id).all()
    return [WallResponse.model_validate(wall) for wall in walls]

@router.get("/{wall_id}", response_model=WallResponse)
async def get_wall(
    wall_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific wall by ID (admin only)."""
    wall = db.query(Wall).filter(Wall.id == wall_id).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this wall"
        )
    return WallResponse.model_validate(wall)

@router.put("/{wall_id}", response_model=WallResponse)
async def update_wall(
    wall_id: int,
    wall_data: WallUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a wall."""
    wall = db.query(Wall).filter(Wall.id == wall_id).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this wall"
        )
    
    if wall_data.title is not None:
        wall.title = wall_data.title
    if wall_data.description is not None:
        wall.description = wall_data.description
    if wall_data.is_public is not None:
        wall.is_public = wall_data.is_public
    
    db.commit()
    db.refresh(wall)
    return WallResponse.model_validate(wall)

@router.delete("/{wall_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_wall(
    wall_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a wall."""
    wall = db.query(Wall).filter(Wall.id == wall_id).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this wall"
        )
    
    db.delete(wall)
    db.commit()
    return None

@router.get("/public/{unique_url}", response_model=WallPublicResponse)
async def get_public_wall(
    unique_url: str,
    passcode: str,
    db: Session = Depends(get_db)
):
    """Get a public wall by unique URL and passcode."""
    wall = db.query(Wall).filter(Wall.unique_url == unique_url).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.passcode != passcode:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid passcode"
        )
    
    # Get all contents for this wall
    contents = wall.contents
    contents_data = [ContentResponse.model_validate(content) for content in contents]
    
    response = WallPublicResponse.model_validate(wall)
    response.contents = contents_data
    return response

@router.get("/verify/{unique_url}", response_model=WallResponse)
async def verify_wall_access(
    unique_url: str,
    passcode: str,
    db: Session = Depends(get_db)
):
    """Verify wall access for contributor page (URL + passcode)."""
    wall = db.query(Wall).filter(Wall.unique_url == unique_url).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.passcode != passcode:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid passcode"
        )
    return WallResponse.model_validate(wall)

