import uuid
from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func, expression
from .database import Base

class Card(Base):
    __tablename__ = 'card_info'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    card_series = Column(String, nullable=False)
    card_number = Column(String, nullable=False)
    card_type = Column(String, default='Base')
    team_name = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    saved = Column(Boolean, nullable=False, default=False, server_default=expression.false())
    
class CardImage(Base):
    __tablename__ = 'card_image'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey('card_info.id'), nullable=False)
    image_type = Column(String)  # e.g., 'front', 'back'
    s3_key = Column(String, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
class CardPrice(Base):
    __tablename__ = 'card_price'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    card_id = Column(UUID(as_uuid=True), ForeignKey('card_info.id'), nullable=False)
    estimate = Column(Float)
    low = Column(Float)
    high = Column(Float)
    num_sales = Column(Integer)
    confidence = Column(Float)
    created_at = Column(DateTime, server_default=func.now())