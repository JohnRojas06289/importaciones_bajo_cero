# backend/app/schemas/product.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# Esquemas base
class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=50)
    category_code: str = Field(..., min_length=2, max_length=10)
    internal_number: str = Field(..., min_length=1, max_length=10)
    description: Optional[str] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    gender: Optional[str] = None
    season: Optional[str] = None
    base_price: float = Field(..., gt=0)
    wholesale_price: Optional[float] = None
    is_active: bool = True
    requires_size: bool = True
    requires_color: bool = True
    tags: Optional[List[str]] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    brand: Optional[str] = None
    material: Optional[str] = None
    gender: Optional[str] = None
    season: Optional[str] = None
    base_price: Optional[float] = None
    wholesale_price: Optional[float] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None

# Esquemas de variantes
class ProductVariantBase(BaseModel):
    product_id: int
    sku: str = Field(..., min_length=1, max_length=50)
    barcode: Optional[str] = Field(None, max_length=20)
    short_code: Optional[str] = Field(None, max_length=20)
    size: str = Field(..., min_length=1, max_length=10)
    size_order: int = 0
    color: str = Field(..., min_length=1, max_length=50)
    color_code: str = Field(..., min_length=1, max_length=10)
    color_hex: Optional[str] = Field(None, pattern=r'^#[0-9A-Fa-f]{6}$')
    price: float = Field(..., gt=0)
    cost: float = Field(..., gt=0)
    wholesale_price: Optional[float] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, Any]] = None
    is_active: bool = True
    is_featured: bool = False
    allow_backorder: bool = False
    min_sale_quantity: int = 1
    max_sale_quantity: int = 10

class ProductVariantCreate(ProductVariantBase):
    pass

class ProductVariantUpdate(BaseModel):
    sku: Optional[str] = None
    barcode: Optional[str] = None
    short_code: Optional[str] = None
    size: Optional[str] = None
    size_order: Optional[int] = None
    color: Optional[str] = None
    color_code: Optional[str] = None
    color_hex: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    wholesale_price: Optional[float] = None
    weight: Optional[float] = None
    dimensions: Optional[Dict[str, Any]] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None
    allow_backorder: Optional[bool] = None
    min_sale_quantity: Optional[int] = None
    max_sale_quantity: Optional[int] = None

# Esquemas de respuesta con información calculada
class InventoryInfo(BaseModel):
    location_id: int
    location_name: str
    location_type: str
    section: Optional[str] = None
    quantity: int
    reserved_quantity: int
    available_quantity: int
    needs_restock: bool

class ProductVariantResponse(ProductVariantBase):
    id: int
    full_name: str
    profit_margin: float
    total_stock: int
    available_stock: int
    inventory_locations: List[InventoryInfo] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProductResponse(ProductBase):
    id: int
    variants: List[ProductVariantResponse] = []
    total_variants: int = 0
    total_stock: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquemas para búsquedas y escaneos
class ScanInput(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    scan_type: Optional[str] = None  # "barcode", "shortcode", "manual"

class ProductSearchFilters(BaseModel):
    query: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    size: Optional[str] = None
    color: Optional[str] = None
    gender: Optional[str] = None
    season: Optional[str] = None
    in_stock: bool = True
    is_active: bool = True
    is_featured: Optional[bool] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    location_id: Optional[int] = None

class ProductSearchResult(BaseModel):
    variant_id: int
    product_name: str
    variant_name: str
    sku: str
    barcode: Optional[str] = None
    short_code: Optional[str] = None
    size: str
    color: str
    color_hex: Optional[str] = None
    price: float
    available_stock: int
    total_stock: int
    locations: List[InventoryInfo] = []
    is_featured: bool = False

class ProductScanResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    scan_type: str
    product: Optional[ProductSearchResult] = None
    suggestions: List[ProductSearchResult] = []
    alternatives: List[ProductSearchResult] = []

class QuickSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[ProductSearchResult]
    search_time_ms: float
    suggested_filters: Optional[Dict[str, List[str]]] = None

# Esquemas para códigos cortos
class ShortCodeComponents(BaseModel):
    category_code: str
    internal_number: str
    size_code: str
    color_code: str
    full_code: str

class ShortCodeValidation(BaseModel):
    is_valid: bool
    components: Optional[ShortCodeComponents] = None
    errors: List[str] = []
    suggestions: List[str] = []

# Esquemas para importación masiva
class ProductImportItem(BaseModel):
    name: str
    category: str
    category_code: str
    internal_number: str
    brand: Optional[str] = None
    base_price: float
    variants: List[Dict[str, Any]]  # Lista de variantes a crear

class ProductImportResponse(BaseModel):
    total_processed: int
    successful_imports: int
    failed_imports: int
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

# Esquemas para reportes rápidos
class ProductStatsResponse(BaseModel):
    total_products: int
    total_variants: int
    total_stock_value: float
    low_stock_items: int
    out_of_stock_items: int
    categories: Dict[str, int]
    top_selling_products: List[Dict[str, Any]]
    profit_margins: Dict[str, float]

# Validators
@validator('barcode')
def validate_barcode(cls, v):
    if v and not v.isdigit():
        raise ValueError('Barcode must contain only digits')
    return v

@validator('short_code')
def validate_short_code(cls, v):
    if v:
        import re
        pattern = r'^[A-Z]{2,3}-\d{3}-[A-Z]{1,2}-[A-Z]{3,4}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid short code format. Expected: CAT-NUM-SIZE-COLOR')
    return v