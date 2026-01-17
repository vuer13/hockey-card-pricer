from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

# What API will send to frontend
class TrendPoint(BaseModel):
    created_at: datetime
    estimate: float
    low: float
    high: float

    class Config:
        from_attributes = True