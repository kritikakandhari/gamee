"""
Dispute endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from typing import Optional

from app.domain.repositories.dispute_repository import DisputeRepository
from app.domain.repositories.match_repository import MatchRepository
from app.domain.repositories.escrow_repository import EscrowRepository
from app.domain.repositories.wallet_repository import WalletRepository
from app.domain.services.dispute_service import DisputeService
from app.domain.services.escrow_service import EscrowService
from app.domain.services.wallet_service import WalletService
from app.infrastructure.repositories.dispute_repository_impl import DisputeRepositoryImpl
from app.infrastructure.repositories.match_repository_impl import MatchRepositoryImpl
from app.infrastructure.repositories.escrow_repository_impl import EscrowRepositoryImpl
from app.infrastructure.repositories.wallet_repository_impl import WalletRepositoryImpl
from app.infrastructure.database.session import get_db
from app.api.deps import get_current_user
from app.domain.entities.user import User
from app.domain.entities.dispute import DisputeResolution
from app.schemas.dispute import (
    CreateDisputeRequest,
    AddEvidenceRequest,
    ResolveDisputeRequest,
    DisputeResponse,
    DisputeListResponse,
    DisputeEvidenceResponse
)
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


async def get_dispute_repository(
    db: AsyncSession = Depends(get_db)
) -> DisputeRepository:
    """Dependency for dispute repository."""
    return DisputeRepositoryImpl(db)


async def get_match_repository_for_disputes(
    db: AsyncSession = Depends(get_db)
) -> MatchRepository:
    """Dependency for match repository."""
    return MatchRepositoryImpl(db)


async def get_escrow_service_for_disputes(
    db: AsyncSession = Depends(get_db)
) -> Optional[EscrowService]:
    """Dependency for escrow service."""
    escrow_repo = EscrowRepositoryImpl(db)
    wallet_repo = WalletRepositoryImpl(db)
    wallet_service = WalletService(wallet_repo)
    return EscrowService(escrow_repo, wallet_service)


async def get_dispute_service(
    dispute_repo: DisputeRepository = Depends(get_dispute_repository),
    match_repo: MatchRepository = Depends(get_match_repository_for_disputes),
    escrow_service: Optional[EscrowService] = Depends(get_escrow_service_for_disputes)
) -> DisputeService:
    """Dependency for dispute service."""
    return DisputeService(dispute_repo, match_repo, escrow_service)


def _dispute_to_response(dispute, evidence: list = None) -> DisputeResponse:
    """Convert domain dispute to response."""
    return DisputeResponse(
        id=dispute.id,
        match_id=dispute.match_id,
        created_by=dispute.created_by,
        status=dispute.status.value,
        reason=dispute.reason,
        description=dispute.description,
        resolution=dispute.resolution.value if dispute.resolution else None,
        resolved_by=dispute.resolved_by,
        resolved_at=dispute.resolved_at.isoformat() if dispute.resolved_at else None,
        resolution_notes=dispute.resolution_notes,
        created_at=dispute.created_at.isoformat(),
        updated_at=dispute.updated_at.isoformat(),
        evidence=[
            DisputeEvidenceResponse(
                id=e.id,
                file_url=e.file_url,
                file_type=e.file_type,
                description=e.description,
                uploaded_at=e.uploaded_at.isoformat()
            ) for e in (evidence or [])
        ]
    )


@router.post(
    "/matches/{match_id}",
    response_model=DisputeResponse,
    status_code=201,
    summary="Create a dispute for a match"
)
async def create_dispute(
    match_id: UUID,
    request: CreateDisputeRequest,
    current_user: User = Depends(get_current_user),
    dispute_service: DisputeService = Depends(get_dispute_service)
):
    """Create a dispute for a match."""
    dispute = await dispute_service.create_dispute(
        match_id=match_id,
        created_by=current_user.id,
        reason=request.reason,
        description=request.description
    )
    
    # Get evidence
    dispute_repo = await get_dispute_repository()
    evidence = await dispute_repo.get_evidence(dispute.id)
    
    return _dispute_to_response(dispute, evidence)


@router.get(
    "/{dispute_id}",
    response_model=DisputeResponse,
    summary="Get dispute details"
)
async def get_dispute(
    dispute_id: UUID,
    current_user: User = Depends(get_current_user),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository)
):
    """Get dispute details."""
    dispute = await dispute_repo.get_dispute_by_id(dispute_id)
    if not dispute:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Dispute", str(dispute_id))
    
    evidence = await dispute_repo.get_evidence(dispute_id)
    return _dispute_to_response(dispute, evidence)


@router.post(
    "/{dispute_id}/evidence",
    response_model=DisputeEvidenceResponse,
    status_code=201,
    summary="Add evidence to dispute"
)
async def add_evidence(
    dispute_id: UUID,
    request: AddEvidenceRequest,
    current_user: User = Depends(get_current_user),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository)
):
    """Add evidence to dispute."""
    # Verify dispute exists and user is participant
    dispute = await dispute_repo.get_dispute_by_id(dispute_id)
    if not dispute:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Dispute", str(dispute_id))
    
    evidence = await dispute_repo.add_evidence(
        dispute_id=dispute_id,
        uploaded_by=current_user.id,
        file_url=request.file_url,
        file_type=request.file_type,
        description=request.description
    )
    
    return DisputeEvidenceResponse(
        id=evidence.id,
        file_url=evidence.file_url,
        file_type=evidence.file_type,
        description=evidence.description,
        uploaded_at=evidence.uploaded_at.isoformat()
    )


@router.get(
    "",
    response_model=DisputeListResponse,
    summary="List disputes (admin)"
)
async def list_disputes(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository)
):
    """List disputes (admin only)."""
    # TODO: Check admin role
    
    from app.domain.entities.dispute import DisputeStatus
    
    status_enum = None
    if status:
        try:
            status_enum = DisputeStatus(status)
        except ValueError:
            pass
    
    disputes, next_cursor = await dispute_repo.list_disputes(
        status=status_enum,
        limit=limit,
        cursor=cursor
    )
    
    # Get evidence for each dispute
    dispute_responses = []
    for dispute in disputes:
        evidence = await dispute_repo.get_evidence(dispute.id)
        dispute_responses.append(_dispute_to_response(dispute, evidence))
    
    return DisputeListResponse(
        data=dispute_responses,
        meta={
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    )


@router.post(
    "/{dispute_id}/resolve",
    response_model=DisputeResponse,
    summary="Resolve dispute (admin only)"
)
async def resolve_dispute(
    dispute_id: UUID,
    request: ResolveDisputeRequest,
    current_user: User = Depends(get_current_user),
    dispute_service: DisputeService = Depends(get_dispute_service),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository)
):
    """Resolve dispute (admin only)."""
    # TODO: Check admin role
    
    try:
        resolution = DisputeResolution(request.resolution)
    except ValueError:
        from app.core.exceptions import ValidationError
        raise ValidationError(f"Invalid resolution: {request.resolution}", field="resolution")
    
    dispute = await dispute_service.resolve_dispute(
        dispute_id=dispute_id,
        resolved_by=current_user.id,
        resolution=resolution,
        resolution_notes=request.resolution_notes
    )
    
    evidence = await dispute_repo.get_evidence(dispute_id)
    return _dispute_to_response(dispute, evidence)
