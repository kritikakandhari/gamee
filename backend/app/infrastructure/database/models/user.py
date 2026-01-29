"""
User authentication and authorization models.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid

from app.infrastructure.database.base import Base


class User(Base):
    """User account model."""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    email_verified = Column(Boolean, nullable=False, default=False)
    password_hash = Column(String(255), nullable=False)
    account_status = Column(
        String(20),
        nullable=False,
        default="ACTIVE",
        index=True
    )
    failed_login_attempts = Column(Integer, nullable=False, default=0)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    # Specify primaryjoin to avoid ambiguity (UserRole has multiple FKs to User)
    roles = relationship(
        "UserRole",
        primaryjoin="User.id == UserRole.user_id",
        back_populates="user",
        lazy="selectin"
    )
    profile = relationship("PlayerProfile", back_populates="user", uselist=False, lazy="selectin")
    wallet = relationship("Wallet", back_populates="user", uselist=False, lazy="selectin")
    
    __table_args__ = (
        CheckConstraint(
            "account_status IN ('ACTIVE', 'SUSPENDED', 'BANNED')",
            name="users_account_status_check"
        ),
    )


class Role(Base):
    """System role model (RBAC)."""
    __tablename__ = "roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_roles = relationship("UserRole", back_populates="role", lazy="selectin")
    
    __table_args__ = (
        CheckConstraint(
            "name IN ('PLAYER', 'ADMIN', 'MODERATOR')",
            name="roles_name_check"
        ),
    )


class UserRole(Base):
    """User-role assignment model (many-to-many)."""
    __tablename__ = "user_roles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_id = Column(UUID(as_uuid=True), ForeignKey("roles.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    revoked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="roles")
    role = relationship("Role", back_populates="user_roles")
    assigned_by_user = relationship("User", foreign_keys=[assigned_by], post_update=True)
    revoked_by_user = relationship("User", foreign_keys=[revoked_by], post_update=True)
