"""
Dispute repository interface.
"""
from abc import ABC, abstractmethod
from typing import Optional, List, Tuple
from uuid import UUID

from app.domain.entities.dispute import Dispute, DisputeEvidence, DisputeStatus


class DisputeRepository(ABC):
    """Interface for dispute repository operations."""
    
    @abstractmethod
    async def create_dispute(
        self,
        match_id: UUID,
        created_by: UUID,
        reason: str,
        description: str
    ) -> Dispute:
        """Create a new dispute."""
        pass
    
    @abstractmethod
    async def get_dispute_by_id(self, dispute_id: UUID) -> Optional[Dispute]:
        """Get dispute by ID."""
        pass
    
    @abstractmethod
    async def get_dispute_by_match_id(self, match_id: UUID) -> Optional[Dispute]:
        """Get dispute by match ID."""
        pass
    
    @abstractmethod
    async def update_dispute(self, dispute: Dispute) -> Dispute:
        """Update dispute."""
        pass
    
    @abstractmethod
    async def list_disputes(
        self,
        status: Optional[DisputeStatus] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> Tuple[List[Dispute], Optional[str]]:
        """List disputes with filtering."""
        pass
    
    @abstractmethod
    async def add_evidence(
        self,
        dispute_id: UUID,
        uploaded_by: UUID,
        file_url: str,
        file_type: str,
        description: Optional[str] = None
    ) -> DisputeEvidence:
        """Add evidence to dispute."""
        pass
    
    @abstractmethod
    async def get_evidence(self, dispute_id: UUID) -> List[DisputeEvidence]:
        """Get all evidence for a dispute."""
        pass
