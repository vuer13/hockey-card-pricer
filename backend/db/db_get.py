from sqlalchemy.orm import Session
from sqlalchemy import or_
from .models import Card, CardImage

def get_cards(db: Session, search_query: str = None, limit = 100):
    """Gets cards and front images from the database"""
    
    # Joins cards table with their front image s3_key
    query = db.query(Card, CardImage.s3_key).join(CardImage, Card.id == CardImage.card_info_id)
    
    # Filters front images only
    query = query.filter(CardImage.is_front == True)
    
    # Selects all cards if no search query is provided
    if search_query:
        search = f"%{search_query}%"
        query = query.filter(
            or_(
                Card.name.ilike(search), # Player name
                Card.card_series.ilike(search), # Card series search
                Card.team_name.ilike(search) # Team name
            )
        )
        
    return query.order_by(Card.created_at.desc()).limit(limit).all()