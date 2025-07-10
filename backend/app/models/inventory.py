# backend/app/models/inventory.py
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Index, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import TimeStampedModel

class Location(TimeStampedModel):
    """Modelo para ubicaciones físicas del inventario"""
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)  # "Exhibición Principal", "Bodega-A1"
    type = Column(String(50), nullable=False)   # "display", "storage", "reserve"
    section = Column(String(50))                # "Chaquetas Hombre", "Gorras"
    shelf_code = Column(String(20))             # "A1", "B2", "C3"
    is_visible_to_customer = Column(Boolean, default=True)
    description = Column(String(200))           # Descripción adicional
    
    # Para sistema de LEDs futuro
    led_address = Column(String(20), nullable=True)  # Dirección del LED
    led_enabled = Column(Boolean, default=False)
    
    # Configuración de alertas
    is_active = Column(Boolean, default=True)
    max_capacity = Column(Integer, default=100)
    
    # Relaciones
    inventory_items = relationship("Inventory", back_populates="location")
    
    def __repr__(self):
        return f"<Location(name='{self.name}', section='{self.section}')>"

class Inventory(TimeStampedModel):
    """Modelo para inventario por ubicación"""
    __tablename__ = "inventory"
    
    id = Column(Integer, primary_key=True, index=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    
    # Cantidades
    quantity = Column(Integer, default=0, nullable=False)
    reserved_quantity = Column(Integer, default=0)  # Apartados
    min_stock = Column(Integer, default=1)
    max_stock = Column(Integer, default=50)
    
    # Costos y precios
    cost_per_unit = Column(Float, nullable=True)
    last_purchase_price = Column(Float, nullable=True)
    last_purchase_date = Column(DateTime, nullable=True)
    
    # Estado
    is_active = Column(Boolean, default=True)
    needs_recount = Column(Boolean, default=False)
    
    # Relaciones
    variant = relationship("ProductVariant", back_populates="inventory")
    location = relationship("Location", back_populates="inventory_items")
    movements = relationship("InventoryMovement", back_populates="inventory_item")
    
    # Índices para búsquedas rápidas
    __table_args__ = (
        Index('idx_variant_location', 'variant_id', 'location_id'),
        Index('idx_location_quantity', 'location_id', 'quantity'),
        Index('idx_variant_active', 'variant_id', 'is_active'),
    )
    
    @property
    def available_quantity(self):
        """Cantidad disponible (total - reservado)"""
        return max(0, self.quantity - self.reserved_quantity)
    
    @property
    def needs_restock(self):
        """Indica si necesita reabastecimiento"""
        return self.quantity <= self.min_stock
    
    @property
    def is_overstocked(self):
        """Indica si está sobrecargado"""
        return self.quantity >= self.max_stock

class InventoryMovement(TimeStampedModel):
    """Modelo para movimientos de inventario"""
    __tablename__ = "inventory_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    movement_type = Column(String(20), nullable=False)  # "sale", "purchase", "transfer", "adjustment"
    quantity_change = Column(Integer, nullable=False)   # Positivo o negativo
    
    # Referencias
    reference_id = Column(Integer, nullable=True)       # ID de venta, compra, etc.
    reference_type = Column(String(20), nullable=True)  # "sale", "purchase", etc.
    
    # Detalles
    reason = Column(String(200))
    notes = Column(String(500))
    user_id = Column(String(50))  # ID del usuario que hizo el movimiento
    
    # Costos
    unit_cost = Column(Float, nullable=True)
    total_cost = Column(Float, nullable=True)
    
    # Relaciones
    inventory_item = relationship("Inventory", back_populates="movements")
    
    # Índices
    __table_args__ = (
        Index('idx_inventory_movement', 'inventory_id', 'created_at'),
        Index('idx_movement_type_date', 'movement_type', 'created_at'),
    )

class Reservation(TimeStampedModel):
    """Modelo para apartados/reservas"""
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    inventory_id = Column(Integer, ForeignKey("inventory.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    
    # Cliente
    customer_name = Column(String(100))
    customer_phone = Column(String(20))
    customer_email = Column(String(100), nullable=True)
    
    # Tiempos
    expires_at = Column(DateTime, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    
    # Estado
    status = Column(String(20), default="active")  # "active", "completed", "cancelled", "expired"
    notes = Column(String(500))
    
    # Relaciones
    inventory_item = relationship("Inventory")
    
    # Índices
    __table_args__ = (
        Index('idx_reservation_status_expires', 'status', 'expires_at'),
        Index('idx_inventory_reservation', 'inventory_id', 'status'),
    )