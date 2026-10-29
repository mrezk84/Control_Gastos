# This module is kept for backward compatibility.
# All auth logic is now consolidated in utils.py

from .utils import (
    get_current_user,
    decode_supabase_token,
    bearer_scheme,
)
