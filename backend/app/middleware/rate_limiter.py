"""In-memory sliding window rate limiter."""

import time
from collections import deque

from app.core.exceptions import RateLimitError


class RateLimiter:
    """Sliding window rate limiter using per-key deques."""

    def __init__(self) -> None:
        self._windows: dict[str, deque[float]] = {}

    def check(self, key: str, limit: int, window: int = 60) -> None:
        """Check if a request is allowed. Raises RateLimitError if not."""
        now = time.monotonic()
        if key not in self._windows:
            self._windows[key] = deque()

        dq = self._windows[key]
        # Remove expired timestamps
        cutoff = now - window
        while dq and dq[0] < cutoff:
            dq.popleft()

        if len(dq) >= limit:
            raise RateLimitError(
                f"Rate limit exceeded. Max {limit} requests per {window}s."
            )

        dq.append(now)


# Global singleton
limiter = RateLimiter()
