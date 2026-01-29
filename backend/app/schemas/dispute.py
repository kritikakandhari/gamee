"""
Dispute request/response schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from uuid import UUID


class CreateDisputeRequest(BaseModel):
    """Create dispute request."""
    reason: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10, max_length=2000)


class AddEvidenceRequest(BaseModel):
    """Add evidence request."""
    file_url: str = Field(..., description="URL of uploaded evidence file")
    file_type: str = Field(..., description="File type (image, video, document)")
    description: Optional[str] = Field(None, max_length=500)


class ResolveDisputeRequest(BaseModel):
    """Resolve dispute request."""
    resolution: str = Field(..., description="PLAYER1_WINS, PLAYER2_WINS, SPLIT, REFUND_BOTH, NO_ACTION")
    resolution_notes: Optional[str] = Field(None, max_length=1000)


class DisputeEvidenceResponse(BaseModel):
    """Dispute evidence response."""
    id: UUID
    file_url: str
    file_type: str
    description: Optional[str]
    uploaded_at: str
    
    class Config:
        from_attributes = True


class DisputeResponse(BaseModel):
    """Dispute response."""
    id: UUID
    match_id: UUID
    created_by: UUID
    status: str
    reason: str
    description: str
    resolution: Optional[str]
    resolved_by: Optional[UUID]
    resolved_at: Optional[str]
    resolution_notes: Optional[str]
    created_at: str
    updated_at: str
    evidence: List[DisputeEvidenceResponse] = []
    
    class Config:
        from_attributes = True


class DisputeListResponse(BaseModel):
    """Dispute list response."""
    data: List[DisputeResponse]
    meta: dict = Field(default_factory=dict)
