"""
Match repository implementation using SQLAlchemy.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc
from sqlalchemy.orm import selectinload

from app.domain.entities.match import Match, MatchParticipant, MatchResult
from app.domain.repositories.match_repository import MatchRepository
from app.infrastructure.database.models.match import (
    Match as MatchModel,
    MatchParticipant as MatchParticipantModel,
    MatchResult as MatchResultModel
)
from app.core.config import settings


class MatchRepositoryImpl(MatchRepository):
    """SQLAlchemy implementation of MatchRepository."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    def _to_domain_match(self, model: MatchModel) -> Match:
        """Convert SQLAlchemy model to domain entity."""
        return Match(
            id=model.id,
            match_type=model.match_type,
            status=model.status,
            stake_cents=model.stake_cents,
            total_pot_cents=model.total_pot_cents,
            platform_fee_cents=model.platform_fee_cents,
            game_type=model.game_type,
            region=model.region,
            best_of=model.best_of,
            created_by=model.created_by,
            accepted_by=model.accepted_by,
            winner_id=model.winner_id,
            started_at=model.started_at,
            completed_at=model.completed_at,
            cancelled_at=model.cancelled_at,
            cancelled_by=model.cancelled_by,
            cancellation_reason=model.cancellation_reason,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    
    def _to_domain_participant(self, model: MatchParticipantModel) -> MatchParticipant:
        """Convert SQLAlchemy model to domain entity."""
        return MatchParticipant(
            id=model.id,
            match_id=model.match_id,
            user_id=model.user_id,
            team_number=model.team_number,
            joined_at=model.joined_at
        )
    
    def _to_domain_result(self, model: MatchResultModel) -> MatchResult:
        """Convert SQLAlchemy model to domain entity."""
        return MatchResult(
            id=model.id,
            match_id=model.match_id,
            game_number=model.game_number,
            winner_id=model.winner_id,
            reported_by=model.reported_by,
            reported_at=model.reported_at,
            verified=model.verified,
            verified_by=model.verified_by,
            verified_at=model.verified_at
        )
    
    async def create_match(
        self,
        match_type: str,
        stake_cents: int,
        created_by: UUID,
        game_type: Optional[str] = None,
        best_of: int = 3
    ) -> Match:
        """Create a new match."""
        # Calculate platform fee and total pot
        platform_fee_percent = settings.STRIPE_PLATFORM_FEE_PERCENT
        total_stake = stake_cents * 2  # Both players
        platform_fee_cents = int((total_stake * platform_fee_percent) / 100)
        total_pot_cents = total_stake - platform_fee_cents
        
        match_model = MatchModel(
            match_type=match_type,
            status="CREATED",
            stake_cents=stake_cents,
            total_pot_cents=total_pot_cents,
            platform_fee_cents=platform_fee_cents,
            game_type=game_type,
            region="US",
            best_of=best_of,
            created_by=created_by
        )
        
        self.session.add(match_model)
        await self.session.flush()
        
        # Add creator as participant
        participant = MatchParticipantModel(
            match_id=match_model.id,
            user_id=created_by,
            team_number=1
        )
        self.session.add(participant)
        
        await self.session.commit()
        await self.session.refresh(match_model)
        
        return self._to_domain_match(match_model)
    
    async def get_match_by_id(self, match_id: UUID) -> Optional[Match]:
        """Get match by ID."""
        result = await self.session.execute(
            select(MatchModel).where(MatchModel.id == match_id)
        )
        model = result.scalar_one_or_none()
        return self._to_domain_match(model) if model else None
    
    async def update_match(self, match: Match) -> Match:
        """Update match."""
        result = await self.session.execute(
            select(MatchModel).where(MatchModel.id == match.id)
        )
        model = result.scalar_one()
        
        model.status = match.status
        model.accepted_by = match.accepted_by
        model.winner_id = match.winner_id
        model.started_at = match.started_at
        model.completed_at = match.completed_at
        model.cancelled_at = match.cancelled_at
        model.cancelled_by = match.cancelled_by
        model.cancellation_reason = match.cancellation_reason
        
        await self.session.commit()
        await self.session.refresh(model)
        
        return self._to_domain_match(model)
    
    async def list_matches(
        self,
        status: Optional[str] = None,
        match_type: Optional[str] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> Tuple[List[Match], Optional[str]]:
        """List matches with filtering and pagination."""
        query = select(MatchModel)
        
        # Apply filters
        if status:
            query = query.where(MatchModel.status == status)
        if match_type:
            query = query.where(MatchModel.match_type == match_type)
        
        # Cursor-based pagination
        if cursor:
            try:
                cursor_time = datetime.fromisoformat(cursor)
                query = query.where(MatchModel.created_at < cursor_time)
            except ValueError:
                pass
        
        query = query.order_by(desc(MatchModel.created_at)).limit(limit + 1)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        matches = [self._to_domain_match(m) for m in models[:limit]]
        next_cursor = None
        
        if len(models) > limit:
            next_cursor = models[limit].created_at.isoformat()
        
        return matches, next_cursor
    
    async def get_user_matches(
        self,
        user_id: UUID,
        status: Optional[str] = None,
        limit: int = 20,
        cursor: Optional[str] = None
    ) -> Tuple[List[Match], Optional[str]]:
        """Get matches for a specific user."""
        query = select(MatchModel).where(
            or_(
                MatchModel.created_by == user_id,
                MatchModel.accepted_by == user_id
            )
        )
        
        if status:
            query = query.where(MatchModel.status == status)
        
        if cursor:
            try:
                cursor_time = datetime.fromisoformat(cursor)
                query = query.where(MatchModel.created_at < cursor_time)
            except ValueError:
                pass
        
        query = query.order_by(desc(MatchModel.created_at)).limit(limit + 1)
        
        result = await self.session.execute(query)
        models = result.scalars().all()
        
        matches = [self._to_domain_match(m) for m in models[:limit]]
        next_cursor = None
        
        if len(models) > limit:
            next_cursor = models[limit].created_at.isoformat()
        
        return matches, next_cursor
    
    async def add_participant(
        self,
        match_id: UUID,
        user_id: UUID,
        team_number: int
    ) -> MatchParticipant:
        """Add participant to match."""
        participant = MatchParticipantModel(
            match_id=match_id,
            user_id=user_id,
            team_number=team_number
        )
        
        self.session.add(participant)
        await self.session.commit()
        await self.session.refresh(participant)
        
        return self._to_domain_participant(participant)
    
    async def get_participants(self, match_id: UUID) -> List[MatchParticipant]:
        """Get all participants for a match."""
        result = await self.session.execute(
            select(MatchParticipantModel).where(MatchParticipantModel.match_id == match_id)
        )
        models = result.scalars().all()
        return [self._to_domain_participant(m) for m in models]
    
    async def create_match_result(
        self,
        match_id: UUID,
        game_number: int,
        winner_id: UUID,
        reported_by: UUID
    ) -> MatchResult:
        """Create a match result."""
        result_model = MatchResultModel(
            match_id=match_id,
            game_number=game_number,
            winner_id=winner_id,
            reported_by=reported_by
        )
        
        self.session.add(result_model)
        await self.session.commit()
        await self.session.refresh(result_model)
        
        return self._to_domain_result(result_model)
    
    async def get_match_results(self, match_id: UUID) -> List[MatchResult]:
        """Get all results for a match."""
        result = await self.session.execute(
            select(MatchResultModel)
            .where(MatchResultModel.match_id == match_id)
            .order_by(MatchResultModel.game_number)
        )
        models = result.scalars().all()
        return [self._to_domain_result(m) for m in models]
