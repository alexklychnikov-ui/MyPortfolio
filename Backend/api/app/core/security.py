from fastapi import Header, HTTPException, status

from app.core.config import settings


def verify_internal_key(x_internal_api_key: str | None = Header(default=None)) -> None:
    if not settings.api_internal_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="API_INTERNAL_KEY is not configured",
        )
    if x_internal_api_key != settings.api_internal_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")
