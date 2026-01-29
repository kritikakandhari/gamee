"""
Dispute domain entities.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from uuid import UUID
from enum import Enum


class DisputeStatus(str, Enum):
    """Dispute status enum."""
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"
    CLOSED = "CLOSED"


class DisputeResolution(str, Enum):
    """Dispute resolution enum."""
    PLAYER1_WINS = "PLAYER1_WINS"
    PLAYER2_WINS = "PLAYER2_WINS"
    SPLIT = "SPLIT"
    REFUND_BOTH = "REFUND_BOTH"
    NO_ACTION = "NO_ACTION"


@dataclass
class Dispute:
    """Dispute domain entity."""
    id: UUID
    match_id: UUID
    created_by: UUID
    status: DisputeStatus
    reason: str
    description: str
    resolution: Optional[DisputeResolution]
    resolved_by: Optional[UUID]
    resolved_at: Optional[datetime]
    resolution_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    def can_be_resolved(self) -> bool:
        """Check if dispute can be resolved."""
        return self.status in (DisputeStatus.PENDING, DisputeStatus.UNDER_REVIEW)
    
    def is_resolved(self) -> bool:
        """Check if dispute is resolved."""
        return self.status == DisputeStatus.RESOLVED


@dataclass
class DisputeEvidence:
    """Dispute evidence entity."""
    id: UUID
    dispute_id: UUID
    uploaded_by: UUID
    file_url: str
    file_type: str
    description: Optional[str]
    uploaded_at: datetime
