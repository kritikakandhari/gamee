"""
Match domain entities.
Represents match business logic, independent of infrastructure.
"""
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List
from uuid import UUID


@dataclass
class Match:
    """Match domain entity."""
    id: UUID
    match_type: str  # QUICK_DUEL, RANKED, DIRECT_CHALLENGE
    status: str  # CREATED, ACCEPTED, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED
    stake_cents: int
    total_pot_cents: int
    platform_fee_cents: int
    game_type: Optional[str]
    region: str
    best_of: int
    created_by: UUID
    accepted_by: Optional[UUID]
    winner_id: Optional[UUID]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    cancelled_at: Optional[datetime]
    cancelled_by: Optional[UUID]
    cancellation_reason: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    def can_be_accepted(self) -> bool:
        """Check if match can be accepted."""
        return self.status == "CREATED"
    
    def can_be_started(self) -> bool:
        """Check if match can be started."""
        return self.status == "ACCEPTED"
    
    def can_be_completed(self) -> bool:
        """Check if match can be completed."""
        return self.status == "IN_PROGRESS"
    
    def can_be_cancelled(self) -> bool:
        """Check if match can be cancelled."""
        return self.status in ("CREATED", "ACCEPTED")
    
    def is_participant(self, user_id: UUID) -> bool:
        """Check if user is a participant."""
        return user_id in (self.created_by, self.accepted_by)


@dataclass
class MatchParticipant:
    """Match participant entity."""
    id: UUID
    match_id: UUID
    user_id: UUID
    team_number: int
    joined_at: datetime


@dataclass
class MatchResult:
    """Individual game result within a match."""
    id: UUID
    match_id: UUID
    game_number: int
    winner_id: UUID
    reported_by: UUID
    reported_at: datetime
    verified: bool
    verified_by: Optional[UUID]
    verified_at: Optional[datetime]
