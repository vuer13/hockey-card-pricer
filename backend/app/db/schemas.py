from datetime import datetime

from pydantic import BaseModel


# What API will send to frontend
class TrendPoint(BaseModel):
    created_at: datetime
    estimate: float
    low: float
    high: float

    class Config:
        from_attributes = True
