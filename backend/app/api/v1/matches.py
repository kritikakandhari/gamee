"""
Match endpoints.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, Query, status
from typing import Optional

from app.domain.repositories.match_repository import MatchRepository
from app.domain.repositories.user_repository import UserRepository
from app.domain.repositories.ranking_repository import RankingRepository
from app.domain.repositories.escrow_repository import EscrowRepository
from app.domain.repositories.wallet_repository import WalletRepository
from app.domain.services.match_service import MatchService
from app.domain.services.escrow_service import EscrowService
from app.domain.services.wallet_service import WalletService
from app.api.deps import get_user_repository, get_current_user
from app.infrastructure.repositories.match_repository_impl import MatchRepositoryImpl
from app.infrastructure.repositories.ranking_repository_impl import RankingRepositoryImpl
from app.infrastructure.repositories.escrow_repository_impl import EscrowRepositoryImpl
from app.infrastructure.repositories.wallet_repository_impl import WalletRepositoryImpl
from app.infrastructure.database.session import get_db, AsyncSessionLocal
from app.schemas.match import (
    CreateMatchRequest,
    AcceptMatchRequest,
    StartMatchRequest,
    CompleteMatchRequest,
    CancelMatchRequest,
    MatchResponse,
    MatchListResponse,
    MatchParticipantResponse
)
from app.domain.entities.user import User
from app.domain.entities.match import Match
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter()


async def get_match_repository(
    db: AsyncSession = Depends(get_db)
) -> MatchRepository:
    """Dependency for match repository."""
    return MatchRepositoryImpl(db)


async def get_ranking_repository(
    db: AsyncSession = Depends(get_db)
) -> RankingRepository:
    """Dependency for ranking repository."""
    return RankingRepositoryImpl(db)


async def get_escrow_repository(
    db: AsyncSession = Depends(get_db)
) -> EscrowRepository:
    """Dependency for escrow repository."""
    return EscrowRepositoryImpl(db)


async def get_wallet_repository_for_matches(
    db: AsyncSession = Depends(get_db)
) -> WalletRepository:
    """Dependency for wallet repository."""
    return WalletRepositoryImpl(db)


async def get_escrow_service(
    escrow_repo: EscrowRepository = Depends(get_escrow_repository),
    wallet_repo: WalletRepository = Depends(get_wallet_repository_for_matches)
) -> EscrowService:
    """Dependency for escrow service."""
    wallet_service = WalletService(wallet_repo)
    return EscrowService(escrow_repo, wallet_service)


def get_match_service(
    match_repo: MatchRepository = Depends(get_match_repository),
    user_repo: UserRepository = Depends(get_user_repository),
    ranking_repo: RankingRepository = Depends(get_ranking_repository),
    escrow_service: EscrowService = Depends(get_escrow_service)
) -> MatchService:
    """Dependency for match service."""
    return MatchService(match_repo, user_repo, ranking_repo, escrow_service)


def _match_to_response(match: Match, participants: list = None) -> MatchResponse:
    """Convert domain match to response."""
    return MatchResponse(
        id=match.id,
        match_type=match.match_type,
        status=match.status,
        stake_cents=match.stake_cents,
        total_pot_cents=match.total_pot_cents,
        platform_fee_cents=match.platform_fee_cents,
        game_type=match.game_type,
        region=match.region,
        best_of=match.best_of,
        created_by=match.created_by,
        accepted_by=match.accepted_by,
        winner_id=match.winner_id,
        started_at=match.started_at.isoformat() if match.started_at else None,
        completed_at=match.completed_at.isoformat() if match.completed_at else None,
        cancelled_at=match.cancelled_at.isoformat() if match.cancelled_at else None,
        created_at=match.created_at.isoformat(),
        updated_at=match.updated_at.isoformat(),
        participants=[
            MatchParticipantResponse(
                id=p.id,
                user_id=p.user_id,
                team_number=p.team_number,
                joined_at=p.joined_at.isoformat()
            ) for p in (participants or [])
        ]
    )


@router.post(
    "",
    response_model=MatchResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new match"
)
async def create_match(
    request: CreateMatchRequest,
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Create a new match."""
    match = await match_service.create_match(
        match_type=request.match_type,
        stake_cents=request.stake_cents,
        created_by=current_user.id,
        game_type=request.game_type,
        best_of=request.best_of
    )
    
    # Get participants using match_repo from dependency
    participants = await match_repo.get_participants(match.id)
    
    return _match_to_response(match, participants)


@router.get(
    "",
    response_model=MatchListResponse,
    summary="List matches with filtering"
)
async def list_matches(
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    match_type: Optional[str] = Query(None, description="Filter by match type"),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """List matches with filtering."""
    matches, next_cursor = await match_repo.list_matches(
        status=status_filter,
        match_type=match_type,
        limit=limit,
        cursor=cursor
    )
    
    # Get participants for each match
    match_responses = []
    for match in matches:
        participants = await match_repo.get_participants(match.id)
        match_responses.append(_match_to_response(match, participants))
    
    return MatchListResponse(
        data=match_responses,
        meta={
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    )


@router.get(
    "/me",
    response_model=MatchListResponse,
    summary="Get current user's matches"
)
async def get_my_matches(
    status_filter: Optional[str] = Query(None, alias="status"),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Get current user's matches."""
    matches, next_cursor = await match_repo.get_user_matches(
        user_id=current_user.id,
        status=status_filter,
        limit=limit,
        cursor=cursor
    )
    
    # Get participants for each match
    match_responses = []
    for match in matches:
        participants = await match_repo.get_participants(match.id)
        match_responses.append(_match_to_response(match, participants))
    
    return MatchListResponse(
        data=match_responses,
        meta={
            "pagination": {
                "cursor": next_cursor,
                "has_more": next_cursor is not None
            }
        }
    )


@router.get(
    "/{match_id}",
    response_model=MatchResponse,
    summary="Get match details"
)
async def get_match(
    match_id: UUID,
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Get match details."""
    match = await match_repo.get_match_by_id(match_id)
    if not match:
        from app.core.exceptions import NotFoundError
        raise NotFoundError("Match", str(match_id))
    
    participants = await match_repo.get_participants(match_id)
    return _match_to_response(match, participants)


@router.post(
    "/{match_id}/accept",
    response_model=MatchResponse,
    summary="Accept a match (join as opponent)"
)
async def accept_match(
    match_id: UUID,
    request: AcceptMatchRequest,
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Accept a match (join as opponent)."""
    match = await match_service.accept_match(match_id, current_user.id)
    
    participants = await match_repo.get_participants(match_id)
    return _match_to_response(match, participants)


@router.post(
    "/{match_id}/start",
    response_model=MatchResponse,
    summary="Start a match (both players ready)"
)
async def start_match(
    match_id: UUID,
    request: StartMatchRequest,
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Start a match (both players ready)."""
    match = await match_service.start_match(match_id, current_user.id)
    
    participants = await match_repo.get_participants(match_id)
    return _match_to_response(match, participants)


@router.post(
    "/{match_id}/complete",
    response_model=MatchResponse,
    summary="Report match completion (winner)"
)
async def complete_match(
    match_id: UUID,
    request: CompleteMatchRequest,
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Report match completion (winner)."""
    winner_id = UUID(request.winner_id)
    game_results = [{"winner_id": gr.winner_id} for gr in request.game_results]
    
    match, results = await match_service.complete_match(
        match_id=match_id,
        winner_id=winner_id,
        game_results=game_results,
        reported_by=current_user.id
    )
    
    participants = await match_repo.get_participants(match_id)
    return _match_to_response(match, participants)


@router.post(
    "/{match_id}/cancel",
    response_model=MatchResponse,
    summary="Cancel a match"
)
async def cancel_match(
    match_id: UUID,
    request: CancelMatchRequest,
    current_user: User = Depends(get_current_user),
    match_service: MatchService = Depends(get_match_service),
    match_repo: MatchRepository = Depends(get_match_repository)
):
    """Cancel a match."""
    match = await match_service.cancel_match(
        match_id=match_id,
        user_id=current_user.id,
        reason=request.reason
    )
    
    participants = await match_repo.get_participants(match_id)
    return _match_to_response(match, participants)
