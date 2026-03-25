from datetime import datetime

from pydantic import BaseModel, ConfigDict

# What API will send to frontend
class TrendPoint(BaseModel):
    created_at: datetime
    estimate: float
    low: float
    high: float

    model_config = ConfigDict(from_attributes=True)
