"""
Authentication routes module.

Registration, login, OAuth (Google, Microsoft...) and password reset are handled
by Supabase Auth directly from the frontend. The backend only exposes the
current user's profile.
"""

from fastapi import APIRouter, Depends

from .. import schemas, models
from ..auth.utils import get_current_user

router = APIRouter(tags=["Authentication"])


@router.get("/me", response_model=schemas.User)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user)
):
    """
    Get current authenticated user information.

    Args:
        current_user: The authenticated user (injected by dependency)

    Returns:
        User: Current user information
    """
    return current_user
