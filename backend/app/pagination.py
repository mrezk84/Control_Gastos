"""
Pagination utilities for API responses.

Provides consistent pagination across all endpoints.
"""

from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field
from fastapi import Query

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response structure."""

    items: List[T] = Field(description="List of items for the current page")
    total: int = Field(description="Total number of items across all pages")
    page: int = Field(description="Current page number (1-indexed)")
    page_size: int = Field(description="Number of items per page")
    total_pages: int = Field(description="Total number of pages")

    class Config:
        arbitrary_types_allowed = True


class PaginationParams(BaseModel):
    """Pagination parameters for requests."""

    page: int = Field(1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(20, ge=1, le=100, description="Items per page (max 100)")

    @classmethod
    def from_query(
        cls,
        page: int = Query(1, ge=1, description="Page number (1-indexed)"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page (max 100)")
    ) -> "PaginationParams":
        """Create pagination params from query parameters."""
        return cls(page=page, page_size=page_size)

    @property
    def offset(self) -> int:
        """Calculate offset for database query."""
        return (self.page - 1) * self.page_size

    @property
    def limit(self) -> int:
        """Get limit for database query."""
        return self.page_size


def paginate(items: List[T], total: int, params: PaginationParams) -> PaginatedResponse:
    """
    Create a paginated response.

    Args:
        items: List of items for the current page
        total: Total number of items across all pages
        params: Pagination parameters

    Returns:
        PaginatedResponse with items and metadata
    """
    total_pages = (total + params.page_size - 1) // params.page_size if total > 0 else 0

    return PaginatedResponse(
        items=items,
        total=total,
        page=params.page,
        page_size=params.page_size,
        total_pages=total_pages
    )
