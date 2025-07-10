# backend/app/models/product.py
from sqlalchemy import Column, Integer, String, Float, Boolean, Text, ForeignKey, Index, JSON
from sqlalchemy.orm import relationship
from .base import TimeStampedModel

class Product(TimeStampedModel):
    """Modelo para productos maestros"""
    __tablename__ = "products"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    category = Column(String(50), nullable=False)  # "Chaquetas", "Gorras", "Accesorios"
    category_code = Column(String(10), nullable=False)  # "CH", "GO", "AC"
    internal_number = Column(String(10), nullable=False)  # "001", "002"
    
    # Información del producto
    description = Column(Text)
    brand = Column(String(100))
    material = Column(String(100))  # "Algodón", "Poliéster", etc.
    gender = Column(String(20))     # "Hombre", "Mujer", "Unisex"
    season = Column(String(20))     # "Invierno", "Verano", "Todo el año"
    
    # Precios base
    base_price = Column(Float, nullable=False)
    wholesale_price = Column(Float, nullable=True)
    
    # Configuración
    is_active = Column(Boolean, default=True)
    requires_size = Column(Boolean, default=True)   # Las gorras podrían no necesitar talla
    requires_color = Column(Boolean, default=True)
    
    # Metadatos adicionales
    tags = Column(JSON, nullable=True)  # ["nueva-colección", "oferta", etc.]
    supplier_info = Column(JSON, nullable=True)
    
    # Relaciones
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    
    # Índices para búsquedas rápidas
    __table_args__ = (
        Index('idx_category_number', 'category_code', 'internal_number'),
        Index('idx_category_active', 'category', 'is_active'),
        Index('idx_name_search', 'name'),
    )
    
    def __repr__(self):
        return f"<Product(name='{self.name}', category='{self.category}')>"

class ProductVariant(TimeStampedModel):
    """Modelo para variantes específicas (talla + color)"""
    __tablename__ = "product_variants"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    # Códigos únicos
    sku = Column(String(50), unique=True, nullable=False)  # SKU completo
    barcode = Column(String(20), unique=True, nullable=True, index=True)  # Código de barras
    short_code = Column(String(20), unique=True, nullable=True, index=True)  # CH-001-M-NEG
    
    # Características físicas
    size = Column(String(10), nullable=False)      # "S", "M", "L", etc.
    size_order = Column(Integer, default=0)        # Para ordenar tallas: XS=1, S=2, M=3, etc.
    color = Column(String(50), nullable=False)     # "Negro", "Blanco", etc.
    color_code = Column(String(10), nullable=False)  # "NEG", "BLA", etc.
    color_hex = Column(String(7), nullable=True)   # "#000000" para mostrar en UI
    
    # Precios específicos
    price = Column(Float, nullable=False)
    cost = Column(Float, nullable=False)
    wholesale_price = Column(Float, nullable=True)
    
    # Información adicional
    weight = Column(Float, nullable=True)  # En gramos
    dimensions = Column(JSON, nullable=True)  # {"length": 50, "width": 40, "height": 5}
    
    # Estado
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)  # Producto destacado
    discontinued = Column(Boolean, default=False)
    
    # Configuración de ventas
    allow_backorder = Column(Boolean, default=False)
    min_sale_quantity = Column(Integer, default=1)
    max_sale_quantity = Column(Integer, default=10)
    
    # Relaciones
    product = relationship("Product", back_populates="variants")
    inventory = relationship("Inventory", back_populates="variant", cascade="all, delete-orphan")
    
    # Índices optimizados para búsquedas frecuentes
    __table_args__ = (
        Index('idx_barcode_active', 'barcode', 'is_active'),
        Index('idx_shortcode_active', 'short_code', 'is_active'),
        Index('idx_product_size_color', 'product_id', 'size', 'color'),
        Index('idx_active_featured', 'is_active', 'is_featured'),
        Index('idx_sku_search', 'sku'),
    )
    
    @property
    def full_name(self):
        """Nombre completo del producto con variante"""
        return f"{self.product.name} - {self.size} - {self.color}"
    
    @property
    def profit_margin(self):
        """Margen de ganancia en porcentaje"""
        if self.cost > 0:
            return ((self.price - self.cost) / self.cost) * 100
        return 0
    
    @property
    def total_stock(self):
        """Stock total en todas las ubicaciones"""
        return sum(inv.quantity for inv in self.inventory if inv.is_active)
    
    @property
    def available_stock(self):
        """Stock disponible (no reservado)"""
        return sum(inv.available_quantity for inv in self.inventory if inv.is_active)
    
    def __repr__(self):
        return f"<ProductVariant(sku='{self.sku}', size='{self.size}', color='{self.color}')>"

class ProductImage(TimeStampedModel):
    """Modelo para imágenes de productos"""
    __tablename__ = "product_images"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)  # Opcional
    
    # Archivo
    filename = Column(String(200), nullable=False)
    original_filename = Column(String(200), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=True)
    
    # Tipo y orden
    image_type = Column(String(20), default="product")  # "product", "variant", "detail"
    display_order = Column(Integer, default=0)
    is_primary = Column(Boolean, default=False)
    
    # Metadatos
    alt_text = Column(String(200), nullable=True)
    
    # Relaciones
    product = relationship("Product")
    variant = relationship("ProductVariant")
    
    # Índices
    __table_args__ = (
        Index('idx_product_images', 'product_id', 'display_order'),
        Index('idx_variant_images', 'variant_id', 'is_primary'),
    )