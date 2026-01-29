"""
Ranking system model.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, Integer, BigInteger, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.infrastructure.database.base import Base


class Ranking(Base):
    """Player ranking and statistics."""
    __tablename__ = "rankings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
        index=True
    )
    rating = Column(Integer, nullable=False, default=1500, index=True)
    peak_rating = Column(Integer, nullable=False, default=1500)
    wins = Column(Integer, nullable=False, default=0)
    losses = Column(Integer, nullable=False, default=0)
    draws = Column(Integer, nullable=False, default=0)
    win_streak = Column(Integer, nullable=False, default=0)
    best_win_streak = Column(Integer, nullable=False, default=0)
    total_matches = Column(Integer, nullable=False, default=0)
    total_earnings_cents = Column(BigInteger, nullable=False, default=0)
    season_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    last_match_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        CheckConstraint("rating >= 0", name="rankings_rating_check"),
        CheckConstraint("wins >= 0", name="rankings_wins_check"),
        CheckConstraint("losses >= 0", name="rankings_losses_check"),
    )
