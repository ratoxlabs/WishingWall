"""Rate limiting middleware for security."""
from fastapi import Request, HTTPException, status
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Tuple

# Simple in-memory rate limiter (use Redis in production)
_rate_limit_store: Dict[str, list] = defaultdict(list)

def check_rate_limit(
    request: Request,
    max_requests: int = 100,
    window_seconds: int = 60
) -> bool:
    """
    Check if request should be rate limited.
    Returns True if allowed, False if rate limited.
    """
    client_ip = request.client.host if request.client else "unknown"
    key = f"{client_ip}"
    
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)
    
    # Clean old entries
    _rate_limit_store[key] = [
        timestamp for timestamp in _rate_limit_store[key]
        if timestamp > window_start
    ]
    
    # Check limit
    if len(_rate_limit_store[key]) >= max_requests:
        return False
    
    # Add current request
    _rate_limit_store[key].append(now)
    return True

