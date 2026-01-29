"""
Custom exception classes for the application.
All exceptions follow a consistent structure for error handling.
"""
from typing import Any, Dict, Optional


class FGCMMatchException(Exception):
    """Base exception for all application exceptions."""
    
    def __init__(
        self,
        message: str,
        code: str,
        status_code: int = 500,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(FGCMMatchException):
    """Authentication-related errors."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="AUTH_ERROR",
            status_code=401,
            details=details
        )


class AuthorizationError(FGCMMatchException):
    """Authorization-related errors."""
    
    def __init__(self, message: str = "Insufficient permissions", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            details=details
        )


class NotFoundError(FGCMMatchException):
    """Resource not found errors."""
    
    def __init__(self, resource: str, resource_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        message = f"{resource} not found"
        if resource_id:
            message = f"{resource} with ID {resource_id} not found"
        
        super().__init__(
            message=message,
            code=f"{resource.upper()}_NOT_FOUND",
            status_code=404,
            details=details or {"resource": resource, "resource_id": resource_id}
        )


class ValidationError(FGCMMatchException):
    """Validation errors."""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="VALIDATION_ERROR",
            status_code=400,
            details=details or {"field": field}
        )


class BusinessLogicError(FGCMMatchException):
    """Business logic violation errors."""
    
    def __init__(self, message: str, code: str = "BUSINESS_LOGIC_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code=code,
            status_code=400,
            details=details
        )


class PaymentError(FGCMMatchException):
    """Payment processing errors."""
    
    def __init__(self, message: str, code: str = "PAYMENT_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code=code,
            status_code=402,  # Payment Required
            details=details
        )


class ConflictError(FGCMMatchException):
    """Resource conflict errors (e.g., duplicate, already exists)."""
    
    def __init__(self, message: str, code: str = "CONFLICT", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code=code,
            status_code=409,
            details=details
        )


class RateLimitError(FGCMMatchException):
    """Rate limiting errors."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            details=details
        )


class UnauthorizedError(FGCMMatchException):
    """Unauthorized access errors."""
    
    def __init__(self, message: str = "Unauthorized", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="UNAUTHORIZED",
            status_code=401,
            details=details
        )


class ForbiddenError(FGCMMatchException):
    """Forbidden access errors (403)."""
    
    def __init__(self, message: str = "Forbidden", details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            code="FORBIDDEN",
            status_code=403,
            details=details
        )
