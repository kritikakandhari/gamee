"""
Dispute system models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, CheckConstraint, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
import enum

from app.infrastructure.database.base import Base


class DisputeStatus(str, enum.Enum):
    """Dispute status enum."""
    PENDING = "PENDING"
    UNDER_REVIEW = "UNDER_REVIEW"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class DisputeReason(str, enum.Enum):
    """Dispute reason enum."""
    CHEATING = "CHEATING"
    DISCONNECTION = "DISCONNECTION"
    HARASSMENT = "HARASSMENT"
    RULE_VIOLATION = "RULE_VIOLATION"
    PAYMENT_ISSUE = "PAYMENT_ISSUE"
    OTHER = "OTHER"


class Dispute(Base):
    """Dispute record model."""
    __tablename__ = "disputes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    match_id = Column(
        UUID(as_uuid=True),
        ForeignKey("matches.id", ondelete="RESTRICT"),
        unique=True,
        nullable=False,
        index=True
    )
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    against_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String(20), nullable=False, default="PENDING", index=True)
    reason = Column(String(20), nullable=False)
    description = Column(Text, nullable=False)
    resolution = Column(Text, nullable=True)
    resolved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    winner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    evidence = relationship("DisputeEvidence", back_populates="dispute", lazy="selectin")
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('PENDING', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED')",
            name="disputes_status_check"
        ),
        CheckConstraint(
            "reason IN ('CHEATING', 'DISCONNECTION', 'HARASSMENT', 'RULE_VIOLATION', 'PAYMENT_ISSUE', 'OTHER')",
            name="disputes_reason_check"
        ),
    )


class DisputeEvidence(Base):
    """Dispute evidence model."""
    __tablename__ = "dispute_evidence"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dispute_id = Column(
        UUID(as_uuid=True),
        ForeignKey("disputes.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    evidence_type = Column(String(20), nullable=False, default="TEXT")
    content = Column(Text, nullable=True)
    file_url = Column(Text, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    submitted_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    
    # Relationships
    dispute = relationship("Dispute", back_populates="evidence")
    
    __table_args__ = (
        CheckConstraint(
            "evidence_type IN ('TEXT', 'IMAGE', 'VIDEO', 'FILE')",
            name="dispute_evidence_type_check"
        ),
    )
