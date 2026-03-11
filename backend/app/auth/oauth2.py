# This module is kept for backward compatibility.
# All auth logic is now consolidated in utils.py

from .utils import (
    create_access_token,
    get_current_user,
    verify_password,
    hash_password,
    authenticate_user,
    SECRET_KEY,
    ALGORITHM,
    oauth2_scheme,
)