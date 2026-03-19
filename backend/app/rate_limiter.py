"""
Rate limiting middleware for API endpoints.

Implements a simple in-memory rate limiter using the sliding window algorithm.
For production, consider using Redis for distributed rate limiting.
"""

from fastapi import Request, HTTPException, status
from typing import Dict, Tuple
from time import time
from collections import defaultdict
from .config import get_settings

settings = get_settings()


class RateLimiter:
    """
    Simple in-memory rate limiter using sliding window.

    For production with multiple workers, use Redis-based rate limiting.
    """

    def __init__(self, requests: int = None, window_seconds: int = None):
        """
        Initialize rate limiter.

        Args:
            requests: Maximum number of requests allowed in the time window
            window_seconds: Time window in seconds
        """
        self.requests = requests or settings.rate_limit_requests
        self.window_seconds = window_seconds or settings.rate_limit_period_seconds
        # Structure: {identifier: [(timestamp, count), ...]}
        self._requests: Dict[str, list] = defaultdict(list)

    def _get_identifier(self, request: Request) -> str:
        """
        Get identifier for rate limiting.

        Uses authenticated user ID if available, otherwise uses IP address.
        """
        # Try to get user ID from request state (set by auth dependency)
        if hasattr(request.state, "user_id"):
            return f"user:{request.state.user_id}"

        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return f"ip:{forwarded.split(',')[0].strip()}"
        return f"ip:{request.client.host}"

    def _clean_old_requests(self, identifier: str, current_time: float) -> None:
        """Remove requests outside the time window."""
        window_start = current_time - self.window_seconds
        self._requests[identifier] = [
            (ts, count) for ts, count in self._requests[identifier]
            if ts > window_start
        ]

    def check_rate_limit(self, request: Request) -> None:
        """
        Check if request should be rate limited.

        Raises HTTPException if rate limit is exceeded.
        """
        identifier = self._get_identifier(request)
        current_time = time()

        # Clean old requests
        self._clean_old_requests(identifier, current_time)

        # Check if limit exceeded
        request_count = sum(count for _, count in self._requests[identifier])
        if request_count >= self.requests:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "error": "Rate limit exceeded",
                    "limit": self.requests,
                    "window_seconds": self.window_seconds,
                    "retry_after": int(self.window_seconds - (current_time - self._requests[identifier][0][0]))
                },
                headers={
                    "Retry-After": str(int(self.window_seconds - (current_time - self._requests[identifier][0][0])))
                }
            )

        # Add current request
        self._requests[identifier].append((current_time, 1))

    def reset(self, identifier: str = None) -> None:
        """
        Reset rate limit for identifier or all identifiers.

        Useful for testing or administrative purposes.
        """
        if identifier:
            self._requests.pop(identifier, None)
        else:
            self._requests.clear()


# Global rate limiter instances for different endpoints
auth_rate_limiter = RateLimiter(requests=5, window_seconds=60)  # 5 requests per minute for auth
standard_rate_limiter = RateLimiter(requests=30, window_seconds=60)  # 30 requests per minute standard


async def check_auth_rate_limit(request: Request) -> None:
    """Dependency to check auth rate limit."""
    auth_rate_limiter.check_rate_limit(request)


async def check_standard_rate_limit(request: Request) -> None:
    """Dependency to check standard rate limit."""
    standard_rate_limiter.check_rate_limit(request)
