# backend/app/models/sale.py
from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Index, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import TimeStampedModel

class Sale(TimeStampedModel):
    """Modelo para ventas"""
    __tablename__ = "sales"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_number = Column(String(20), unique=True, nullable=False)  # "V-20240101-001"
    
    # Información del cliente (opcional para ventas rápidas)
    customer_name = Column(String(100), nullable=True)
    customer_phone = Column(String(20), nullable=True)
    customer_email = Column(String(100), nullable=True)
    customer_document = Column(String(20), nullable=True)  # Cédula/NIT
    
    # Totales
    subtotal = Column(Float, nullable=False, default=0)
    discount_amount = Column(Float, nullable=False, default=0)
    discount_percentage = Column(Float, nullable=False, default=0)
    tax_amount = Column(Float, nullable=False, default=0)
    total_amount = Column(Float, nullable=False)
    
    # Estado de la venta
    status = Column(String(20), default="completed")  # "pending", "completed", "cancelled", "refunded"
    payment_status = Column(String(20), default="paid")  # "pending", "paid", "partial", "refunded"
    
    # Método de pago
    payment_method = Column(String(20), nullable=False)  # "cash", "card", "transfer", "mixed"
    payment_details = Column(JSON, nullable=True)  # Detalles adicionales del pago
    
    # Información adicional
    notes = Column(String(500), nullable=True)
    cashier_id = Column(String(50), nullable=True)  # ID del vendedor
    pos_terminal = Column(String(20), nullable=True)  # Terminal de venta
    
    # Timestamps adicionales
    completed_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    refunded_at = Column(DateTime, nullable=True)
    
    # Relaciones
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="sale", cascade="all, delete-orphan")
    
    # Índices para reportes y búsquedas
    __table_args__ = (
        Index('idx_sale_date_status', 'created_at', 'status'),
        Index('idx_sale_number', 'sale_number'),
        Index('idx_customer_phone', 'customer_phone'),
        Index('idx_cashier_date', 'cashier_id', 'created_at'),
    )
    
    @property
    def total_items(self):
        """Total de artículos vendidos"""
        return sum(item.quantity for item in self.items)
    
    @property
    def profit(self):
        """Ganancia total de la venta"""
        return sum(item.profit for item in self.items)
    
    def __repr__(self):
        return f"<Sale(number='{self.sale_number}', total={self.total_amount})>"

class SaleItem(TimeStampedModel):
    """Modelo para items de venta"""
    __tablename__ = "sale_items"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=False)
    
    # Cantidades y precios
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)  # Precio al momento de la venta
    unit_cost = Column(Float, nullable=False)   # Costo al momento de la venta
    discount_amount = Column(Float, default=0)
    total_price = Column(Float, nullable=False)
    
    # Información del producto al momento de la venta (por si cambia después)
    product_name = Column(String(200), nullable=False)
    product_sku = Column(String(50), nullable=False)
    product_size = Column(String(10), nullable=False)
    product_color = Column(String(50), nullable=False)
    
    # Relaciones
    sale = relationship("Sale", back_populates="items")
    variant = relationship("ProductVariant")
    
    # Índices
    __table_args__ = (
        Index('idx_sale_items', 'sale_id'),
        Index('idx_variant_sales', 'variant_id', 'created_at'),
    )
    
    @property
    def profit(self):
        """Ganancia del item"""
        return (self.unit_price - self.unit_cost) * self.quantity - self.discount_amount
    
    @property
    def profit_margin(self):
        """Margen de ganancia en porcentaje"""
        if self.unit_cost > 0:
            return ((self.unit_price - self.unit_cost) / self.unit_cost) * 100
        return 0

class Payment(TimeStampedModel):
    """Modelo para pagos (para ventas con múltiples métodos de pago)"""
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    
    # Detalles del pago
    payment_method = Column(String(20), nullable=False)  # "cash", "card", "transfer"
    amount = Column(Float, nullable=False)
    reference = Column(String(50), nullable=True)  # Número de transacción, cheque, etc.
    
    # Para pagos con tarjeta
    card_type = Column(String(20), nullable=True)  # "credit", "debit"
    card_last_digits = Column(String(4), nullable=True)
    authorization_code = Column(String(20), nullable=True)
    
    # Para transferencias
    bank_name = Column(String(50), nullable=True)
    account_reference = Column(String(50), nullable=True)
    
    # Estado
    status = Column(String(20), default="completed")  # "pending", "completed", "failed", "refunded"
    
    # Relaciones
    sale = relationship("Sale", back_populates="payments")
    
    # Índices
    __table_args__ = (
        Index('idx_payment_sale', 'sale_id'),
        Index('idx_payment_method_date', 'payment_method', 'created_at'),
    )

class Refund(TimeStampedModel):
    """Modelo para devoluciones"""
    __tablename__ = "refunds"
    
    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    refund_number = Column(String(20), unique=True, nullable=False)
    
    # Detalles de la devolución
    reason = Column(String(200), nullable=False)
    refund_amount = Column(Float, nullable=False)
    refund_method = Column(String(20), nullable=False)  # "cash", "card", "store_credit"
    
    # Estado
    status = Column(String(20), default="completed")
    processed_by = Column(String(50), nullable=True)
    
    # Notas
    notes = Column(String(500), nullable=True)
    
    # Relaciones
    sale = relationship("Sale")
    items = relationship("RefundItem", back_populates="refund", cascade="all, delete-orphan")
    
    # Índices
    __table_args__ = (
        Index('idx_refund_sale', 'sale_id'),
        Index('idx_refund_date', 'created_at'),
    )

class RefundItem(TimeStampedModel):
    """Modelo para items devueltos"""
    __tablename__ = "refund_items"
    
    id = Column(Integer, primary_key=True, index=True)
    refund_id = Column(Integer, ForeignKey("refunds.id"), nullable=False)
    sale_item_id = Column(Integer, ForeignKey("sale_items.id"), nullable=False)
    
    # Cantidad devuelta
    quantity_refunded = Column(Integer, nullable=False)
    unit_refund_amount = Column(Float, nullable=False)
    total_refund_amount = Column(Float, nullable=False)
    
    # Estado del producto devuelto
    condition = Column(String(20), default="good")  # "good", "damaged", "defective"
    return_to_inventory = Column(Boolean, default=True)
    
    # Relaciones
    refund = relationship("Refund", back_populates="items")
    sale_item = relationship("SaleItem")
    
    # Índices
    __table_args__ = (
        Index('idx_refund_items', 'refund_id'),
        Index('idx_sale_item_refund', 'sale_item_id'),
    )