from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.user import User
from app.models.wall import Wall
from app.models.contributor import Contributor
from app.schemas.contributor import ContributorCreate, ContributorResponse, ContributorInvite
import secrets
import string
from app.core.email import send_contributor_invite

router = APIRouter()

def generate_invite_token() -> str:
    """Generate a secure invite token."""
    return secrets.token_urlsafe(32)

@router.post("/invite", response_model=ContributorResponse, status_code=status.HTTP_201_CREATED)
async def invite_contributor(
    invite_data: ContributorInvite,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Invite a contributor to a wall."""
    # Verify wall exists and user is admin
    wall = db.query(Wall).filter(Wall.id == invite_data.wall_id).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to invite contributors to this wall"
        )
    
    # Check if contributor already exists
    existing = db.query(Contributor).filter(
        Contributor.email == invite_data.email,
        Contributor.wall_id == invite_data.wall_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contributor already invited"
        )
    
    # Create contributor invite
    invite_token = generate_invite_token()
    contributor = Contributor(
        email=invite_data.email,
        wall_id=invite_data.wall_id,
        invite_token=invite_token
    )
    db.add(contributor)
    db.commit()
    db.refresh(contributor)
    
    # Send invite email
    try:
        await send_contributor_invite(
            email=invite_data.email,
            wall_title=wall.title,
            unique_url=wall.unique_url,
            passcode=wall.passcode,
            invite_token=invite_token
        )
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to send invite email: {e}")
    
    return ContributorResponse.model_validate(contributor)

@router.get("/wall/{wall_id}", response_model=list[ContributorResponse])
async def get_wall_contributors(
    wall_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all contributors for a wall."""
    wall = db.query(Wall).filter(Wall.id == wall_id).first()
    if not wall:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Wall not found"
        )
    if wall.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view contributors for this wall"
        )
    
    contributors = db.query(Contributor).filter(Contributor.wall_id == wall_id).all()
    return [ContributorResponse.model_validate(c) for c in contributors]

@router.delete("/{contributor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_contributor(
    contributor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a contributor from a wall."""
    contributor = db.query(Contributor).filter(Contributor.id == contributor_id).first()
    if not contributor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contributor not found"
        )
    
    wall = db.query(Wall).filter(Wall.id == contributor.wall_id).first()
    if wall.admin_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to remove this contributor"
        )
    
    db.delete(contributor)
    db.commit()
    return None

@router.get("/verify/{invite_token}", response_model=ContributorResponse)
async def verify_invite_token(
    invite_token: str,
    db: Session = Depends(get_db)
):
    """Verify an invite token and get contributor info."""
    contributor = db.query(Contributor).filter(Contributor.invite_token == invite_token).first()
    if not contributor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invalid invite token"
        )
    return ContributorResponse.model_validate(contributor)

