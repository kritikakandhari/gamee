"""
Admin and audit models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import INET
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
import uuid
import enum

from app.infrastructure.database.base import Base


class AdminActionType(str, enum.Enum):
    """Admin action type enum."""
    USER_SUSPEND = "USER_SUSPEND"
    USER_BAN = "USER_BAN"
    USER_UNSUSPEND = "USER_UNSUSPEND"
    DISPUTE_RESOLVE = "DISPUTE_RESOLVE"
    MATCH_RESOLVE = "MATCH_RESOLVE"
    PAYMENT_ADJUST = "PAYMENT_ADJUST"
    ROLE_ASSIGN = "ROLE_ASSIGN"
    ROLE_REVOKE = "ROLE_REVOKE"
    SYSTEM_CONFIG = "SYSTEM_CONFIG"


class AuditEventType(str, enum.Enum):
    """Audit event type enum."""
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_REGISTER = "USER_REGISTER"
    PASSWORD_CHANGE = "PASSWORD_CHANGE"
    MATCH_CREATE = "MATCH_CREATE"
    MATCH_ACCEPT = "MATCH_ACCEPT"
    MATCH_COMPLETE = "MATCH_COMPLETE"
    MATCH_CANCEL = "MATCH_CANCEL"
    PAYMENT_PROCESS = "PAYMENT_PROCESS"
    ESCROW_LOCK = "ESCROW_LOCK"
    ESCROW_RELEASE = "ESCROW_RELEASE"
    DISPUTE_CREATE = "DISPUTE_CREATE"
    DISPUTE_RESOLVE = "DISPUTE_RESOLVE"
    ADMIN_ACTION = "ADMIN_ACTION"


class AdminAction(Base):
    """Admin action log model."""
    __tablename__ = "admin_actions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    admin_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    action_type = Column(String(50), nullable=False, index=True)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    target_entity_type = Column(String(50), nullable=True)
    target_entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    description = Column(Text, nullable=False)
    extra_data = Column(JSONB, nullable=True)  # Renamed from 'metadata' (reserved in SQLAlchemy)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)


class AuditLog(Base):
    """System-wide audit log model (immutable)."""
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    event_type = Column(String(50), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    details = Column(JSONB, nullable=True)
    ip_address = Column(INET, nullable=True)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
