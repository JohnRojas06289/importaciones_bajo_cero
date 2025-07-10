# backend/app/models/base.py
from sqlalchemy import Column, DateTime
from sqlalchemy.sql import func
from ..database import Base

class TimeStampedModel(Base):
    """Modelo base con timestamps"""
    __abstract__ = True
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)