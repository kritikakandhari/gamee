"""
Match request/response schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from uuid import UUID


class CreateMatchRequest(BaseModel):
    """Create match request."""
    match_type: str = Field(..., description="QUICK_DUEL, RANKED, or DIRECT_CHALLENGE")
    stake_cents: int = Field(..., ge=100, le=100000, description="Stake in cents ($1.00 - $1000.00)")
    game_type: Optional[str] = None
    best_of: int = Field(default=3, ge=1, le=7, description="Best of N games (must be odd)")
    
    @validator("best_of")
    def validate_best_of(cls, v):
        """Ensure best_of is odd."""
        if v % 2 == 0:
            raise ValueError("best_of must be an odd number")
        return v
    
    @validator("match_type")
    def validate_match_type(cls, v):
        """Validate match type."""
        if v not in ("QUICK_DUEL", "RANKED", "DIRECT_CHALLENGE"):
            raise ValueError("Invalid match type")
        return v


class AcceptMatchRequest(BaseModel):
    """Accept match request."""
    pass


class StartMatchRequest(BaseModel):
    """Start match request."""
    pass


class GameResultRequest(BaseModel):
    """Individual game result."""
    game_number: int
    winner_id: str


class CompleteMatchRequest(BaseModel):
    """Complete match request."""
    winner_id: str
    game_results: List[GameResultRequest]
    
    @validator("game_results")
    def validate_game_results(cls, v):
        """Validate game results."""
        if not v:
            raise ValueError("At least one game result required")
        return v


class CancelMatchRequest(BaseModel):
    """Cancel match request."""
    reason: Optional[str] = None


class MatchParticipantResponse(BaseModel):
    """Match participant response."""
    id: UUID
    user_id: UUID
    team_number: int
    joined_at: str
    
    class Config:
        from_attributes = True


class MatchResponse(BaseModel):
    """Match response."""
    id: UUID
    match_type: str
    status: str
    stake_cents: int
    total_pot_cents: int
    platform_fee_cents: int
    game_type: Optional[str]
    region: str
    best_of: int
    created_by: UUID
    accepted_by: Optional[UUID]
    winner_id: Optional[UUID]
    started_at: Optional[str]
    completed_at: Optional[str]
    cancelled_at: Optional[str]
    created_at: str
    updated_at: str
    participants: List[MatchParticipantResponse] = []
    
    class Config:
        from_attributes = True


class MatchListResponse(BaseModel):
    """Match list response."""
    data: List[MatchResponse]
    meta: dict = Field(default_factory=dict)
