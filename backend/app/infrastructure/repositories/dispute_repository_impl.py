"""
Dispute repository implementation using SQLAlchemy.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from app.domain.entities.dispute import Dispute, DisputeEvidence, DisputeStatus
from app.domain.repositories.dispute_repository import DisputeRepository
from app.infrastructure.database.models.dispute import (
    Dispute as DisputeModel,
    DisputeEvidence as DisputeEvidenceModel,
    DisputeStatus as DisputeStatusEnum
)


class DisputeRepositoryImpl(DisputeRepository):
    """SQLAlchemy implementation of DisputeRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_domain_dispute(self, model: DisputeModel) -> Dispute:
        """Convert SQLAlchemy model to domain entity."""
        from app.domain.entities.dispute import DisputeResolution
        
        resolution = None
        if model.resolution:
            try:
                # Try to parse as DisputeResolution enum
                resolution = DisputeResolution(model.resolution)
            except (ValueError, AttributeError):
                # If it's a text field, try to match enum values
                resolution_str = str(model.resolution).upper()
                for res in DisputeResolution:
                    if res.value == resolution_str:
                        resolution = res
                        break
        
        return Dispute(
            id=model.id,
            match_id=model.match_id,
            created_by=model.created_by,
            status=DisputeStatus(model.status.value),
            reason=model.reason,
            description=model.description,
            resolution=resolution,
            resolved_by=model.resolved_by,
            resolved_at=model.resolved_at,
            resolution_notes=model.resolution_notes,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_domain_evidence(self, model: DisputeEvidenceModel) -> DisputeEvidence:
        """Convert SQLAlchemy model to domain entity."""
        return DisputeEvidence(
            id=model.id,
            dispute_id=model.dispute_id,
            uploaded_by=model.submitted_by,  # Map submitted_by to uploaded_by
            file_url=model.file_url or "",
            file_type=model.evidence_type or "FILE",  # Map evidence_type to file_type
            description=model.content,  # Map content to description
            uploaded_at=model.submitted_at  # Map submitted_at to uploaded_at
        )
    
    async def create_dispute(
        self,
        match_id: UUID,
        created_by: UUID,
        reason: str,
        description: str
    ) -> Dispute:
        """Create a new dispute."""
        dispute_model = DisputeModel(
            match_id=match_id,
            created_by=created_by,
            status=DisputeStatusEnum.PENDING,
            reason=reason,
            description=description
        )
        
        self.session.add(dispute_model)
        await self.session.commit()
        await self.session.refresh(dispute_model)
        
        return self._to_domain_dispute(dispute_model)
    
    async def get_dispute_by_id(self, dispute_id: UUID) -> Optional[Dispute]:
        """Get dispute by ID."""
        result = await self.session.execute(
            select(DisputeModel).where(DisputeModel.id == dispute_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_dispute(model) if model else None
    
    async def get_dispute_by_match_id(self, match_id: UUID) -> Optional[Dispute]:
        """Get dispute by match ID."""
        result = await self.session.execute(
            select(DisputeModel).where(DisputeModel.match_id == match_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_dispute(model) if model else None
    
    async def update_dispute(self, dispute: Dispute) -> Dispute:
        """Update dispute."""
        result = await self.session.execute(
            select(DisputeModel).where(DisputeModel.id == dispute.id)
        )
        model = result.scalar_one()
        
        model.status = DisputeStatusEnum(dispute.status.value)
        model.resolution = dispute.resolution.value if dispute.resolution else None
        model.resolved_by = dispute.resolved_by
        model.resolved_at = dispute.resolved_at
        # Note: For MVP, we store resolution notes in the resolution text field
        # In production, we'd have a separate resolution_notes field
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._to_domain_dispute(model)
    
    async def list_disputes(
        self,
        status: Optional[DisputeStatus] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> Tuple[List[Dispute], Optional[str]]:
        """List disputes with filtering."""
        query = select(DisputeModel)
        
        if status:
            query = query.where(DisputeModel.status == DisputeStatusEnum(status.value))
        
        if cursor:
            try:
                cursor_time = datetime.fromisoformat(cursor)
                query = query.where(DisputeModel.created_at < cursor_time)
            except ValueError:
                pass
        
        query = query.order_by(desc(DisputeModel.created_at)).limit(limit + 1)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        disputes = [self._to_domain_dispute(m) for m in models[:limit]]
        next_cursor = None
        
        if len(models) > limit:
            next_cursor = models[limit].created_at.isoformat()
        
        return disputes, next_cursor
    
    async def add_evidence(
        self,
        dispute_id: UUID,
        uploaded_by: UUID,
        file_url: str,
        file_type: str,
        description: Optional[str] = None
    ) -> DisputeEvidence:
        """Add evidence to dispute."""
        evidence_model = DisputeEvidenceModel(
            dispute_id=dispute_id,
            submitted_by=uploaded_by,  # Map uploaded_by to submitted_by
            file_url=file_url,
            evidence_type=file_type,  # Map file_type to evidence_type
            content=description  # Map description to content
        )
        
        self.session.add(evidence_model)
        await self.session.commit()
        await self.session.refresh(evidence_model)
        
        return self._to_domain_evidence(evidence_model)
    
    async def get_evidence(self, dispute_id: UUID) -> List[DisputeEvidence]:
        """Get all evidence for a dispute."""
        result = await self.session.execute(
            select(DisputeEvidenceModel)
            .where(DisputeEvidenceModel.dispute_id == dispute_id)
            .order_by(DisputeEvidenceModel.uploaded_at)
        )
        models = result.scalars().all()
        return [self._to_domain_evidence(m) for m in models]
