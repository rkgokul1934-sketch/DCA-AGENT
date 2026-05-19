from typing import Any, Generic, TypeVar, Optional
# pyrefly: ignore [missing-import]
from pydantic import BaseModel

T = TypeVar("T")

class ResponseModel(BaseModel, Generic[T]):
    status: str = "success"
    message: Optional[str] = None
    data: Optional[T] = None
    meta: Optional[dict[str, Any]] = None

def create_response(data: Any = None, message: str = "Operation successful", meta: dict[str, Any] = None):
    return {
        "status": "success",
        "message": message,
        "data": data,
        "meta": meta
    }
