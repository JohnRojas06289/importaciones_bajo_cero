# backend/app/models/product.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from .base import TimeStampedModel

class Product(TimeStampedModel):
    """Modelo para productos maestros"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)
    category_code = Column(String(10), nullable=False)
    internal_number = Column(String(10), nullable=False)
    description = Column(Text)
    brand = Column(String(100))
    base_price = Column(Float, nullable=False)
    
    # Relaciones
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_category_number', 'category_code', 'internal_number'),
    )

class ProductVariant(TimeStampedModel):
    """Modelo para variantes específicas"""
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    sku = Column(String(50), unique=True, nullable=False)
    barcode = Column(String(20), unique=True, nullable=True, index=True)
    short_code = Column(String(20), unique=True, nullable=True, index=True)
    
    size = Column(String(10), nullable=False)
    color = Column(String(50), nullable=False)
    color_code = Column(String(10), nullable=False)
    
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    
    is_active = Column(Boolean, default=True)
    
    # Relaciones
    product = relationship("Product", back_populates="variants")
    inventory = relationship("Inventory", back_populates="variant", cascade="all, delete-orphan")