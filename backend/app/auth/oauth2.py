# This module is kept for backward compatibility.
# All auth logic is now consolidated in utils.py

from .utils import (
    get_current_user,
    create_access_token,
    hash_password,
    verify_password,
    oauth2_scheme,
)
