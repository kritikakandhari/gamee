"""
Match system models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import (
    Column, String, Integer, BigInteger, DateTime, ForeignKey,
    Text, CheckConstraint, JSON, Boolean
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid

from app.infrastructure.database.base import Base


class Match(Base):
    """Match record model."""
    __tablename__ = "matches"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    match_type = Column(String(20), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="CREATED", index=True)
    stake_cents = Column(Integer, nullable=False)
    total_pot_cents = Column(Integer, nullable=False)
    platform_fee_cents = Column(Integer, nullable=False)
    game_type = Column(String(50), nullable=True)
    region = Column(String(10), nullable=False, default="US")
    best_of = Column(Integer, nullable=False, default=3)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    accepted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    extra_data = Column(JSONB, nullable=True)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    participants = relationship("MatchParticipant", back_populates="match", lazy="selectin")
    results = relationship("MatchResult", back_populates="match", lazy="selectin")
    escrow = relationship("EscrowAccount", back_populates="match", uselist=False, lazy="selectin")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('CREATED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DISPUTED')",
            name="matches_status_check"
        ),
        CheckConstraint(
            "match_type IN ('QUICK_DUEL', 'RANKED', 'DIRECT_CHALLENGE')",
            name="matches_match_type_check"
        ),
        CheckConstraint("region = 'US'", name="matches_region_check"),
        CheckConstraint("stake_cents > 0", name="matches_stake_cents_check"),
        CheckConstraint("total_pot_cents > 0", name="matches_total_pot_cents_check"),
    )


class MatchParticipant(Base):
    """Match participant model."""
    __tablename__ = "match_participants"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_number = Column(Integer, nullable=False, default=1)
    joined_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    match = relationship("Match", back_populates="participants")
    
    __table_args__ = (
        CheckConstraint("team_number IN (1, 2)", name="match_participants_team_number_check"),
    )


class MatchResult(Base):
    """Individual game result within a match."""
    __tablename__ = "match_results"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    match_id = Column(UUID(as_uuid=True), ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    game_number = Column(Integer, nullable=False)
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    reported_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reported_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    verified = Column(Boolean, nullable=False, default=False)
    verified_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    extra_data = Column(JSONB, nullable=True)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    match = relationship("Match", back_populates="results")
    
    __table_args__ = (
        CheckConstraint("game_number > 0", name="match_results_game_number_check"),
    )
