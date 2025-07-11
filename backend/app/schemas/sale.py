# backend/app/schemas/sale.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime
from decimal import Decimal

# Esquemas para items de venta
class SaleItemBase(BaseModel):
    variant_id: int
    quantity: int = Field(..., gt=0)
    unit_price: float = Field(..., gt=0)
    discount_amount: float = Field(0, ge=0)

class SaleItemCreate(SaleItemBase):
    pass

class SaleItemResponse(SaleItemBase):
    id: int
    unit_cost: float
    total_price: float
    product_name: str
    product_sku: str
    product_size: str
    product_color: str
    profit: float
    profit_margin: float

    class Config:
        from_attributes = True

# Esquemas para pagos
class PaymentBase(BaseModel):
    payment_method: str = Field(..., pattern=r'^(cash|card|transfer|check|other)$')
    amount: float = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=50)
    card_type: Optional[str] = Field(None, pattern=r'^(credit|debit)$')
    card_last_digits: Optional[str] = Field(None, pattern=r'^\d{4}$')
    authorization_code: Optional[str] = Field(None, max_length=20)
    bank_name: Optional[str] = Field(None, max_length=50)
    account_reference: Optional[str] = Field(None, max_length=50)

class PaymentCreate(PaymentBase):
    pass

class PaymentResponse(PaymentBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas para ventas
class SaleBase(BaseModel):
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[str] = Field(None, max_length=100)
    customer_document: Optional[str] = Field(None, max_length=20)
    discount_percentage: float = Field(0, ge=0, le=100)
    discount_amount: float = Field(0, ge=0)
    payment_method: str = Field(..., pattern=r'^(cash|card|transfer|mixed|other)$')
    notes: Optional[str] = Field(None, max_length=500)
    cashier_id: Optional[str] = Field(None, max_length=50)
    pos_terminal: Optional[str] = Field(None, max_length=20)

class SaleCreate(SaleBase):
    items: List[SaleItemCreate] = Field(..., min_items=1)
    payments: Optional[List[PaymentCreate]] = None

class SaleUpdate(BaseModel):
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, pattern=r'^(pending|completed|cancelled|refunded)$')

class SaleResponse(SaleBase):
    id: int
    sale_number: str
    subtotal: float
    tax_amount: float
    total_amount: float
    status: str
    payment_status: str
    items: List[SaleItemResponse] = []
    payments: List[PaymentResponse] = []
    total_items: int
    profit: float
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Esquemas para el proceso de venta (POS)
class CartItem(BaseModel):
    variant_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Optional[float] = None  # Se calculará automáticamente
    discount_amount: float = Field(0, ge=0)
    notes: Optional[str] = None

class Cart(BaseModel):
    items: List[CartItem] = []
    customer_info: Optional[Dict[str, str]] = None
    discount_percentage: float = Field(0, ge=0, le=100)
    discount_amount: float = Field(0, ge=0)
    notes: Optional[str] = None

class CartSummary(BaseModel):
    total_items: int
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    items_detail: List[Dict[str, Any]]

class QuickSaleRequest(BaseModel):
    """Para ventas rápidas con un solo producto"""
    variant_id: int
    quantity: int = Field(1, gt=0)
    payment_method: str = Field(..., pattern=r'^(cash|card|transfer)$')
    customer_phone: Optional[str] = None
    discount_amount: float = Field(0, ge=0)

class QuickSaleResponse(BaseModel):
    success: bool
    message: str
    sale: Optional[SaleResponse] = None
    receipt_data: Optional[Dict[str, Any]] = None

# Esquemas para búsquedas de ventas
class SaleSearchFilters(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    customer_phone: Optional[str] = None
    customer_name: Optional[str] = None
    cashier_id: Optional[str] = None
    payment_method: Optional[str] = None
    status: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
    sale_number: Optional[str] = None

class SaleSearchResult(BaseModel):
    id: int
    sale_number: str
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    total_amount: float
    total_items: int
    payment_method: str
    status: str
    cashier_id: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

class SaleSearchResponse(BaseModel):
    total_results: int
    results: List[SaleSearchResult]
    filters_applied: SaleSearchFilters
    summary: Dict[str, Any]

# Esquemas para devoluciones
class RefundItemBase(BaseModel):
    sale_item_id: int
    quantity_refunded: int = Field(..., gt=0)
    unit_refund_amount: float = Field(..., gt=0)
    condition: str = Field(..., pattern=r'^(good|damaged|defective)$')
    return_to_inventory: bool = True

class RefundItemCreate(RefundItemBase):
    pass

class RefundItemResponse(RefundItemBase):
    id: int
    total_refund_amount: float
    sale_item: SaleItemResponse

    class Config:
        from_attributes = True

class RefundBase(BaseModel):
    sale_id: int
    reason: str = Field(..., min_length=1, max_length=200)
    refund_method: str = Field(..., pattern=r'^(cash|card|store_credit|original_method)$')
    notes: Optional[str] = Field(None, max_length=500)
    processed_by: Optional[str] = Field(None, max_length=50)

class RefundCreate(RefundBase):
    items: List[RefundItemCreate] = Field(..., min_items=1)

class RefundResponse(RefundBase):
    id: int
    refund_number: str
    refund_amount: float
    status: str
    items: List[RefundItemResponse] = []
    sale: SaleResponse
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas para reportes de ventas
class SalesReportFilters(BaseModel):
    start_date: datetime
    end_date: datetime
    group_by: str = Field("day", pattern=r'^(hour|day|week|month)$')
    cashier_id: Optional[str] = None
    payment_method: Optional[str] = None
    product_category: Optional[str] = None

class SalesSummary(BaseModel):
    period: str
    total_sales: int
    total_amount: float
    total_profit: float
    total_items_sold: int
    average_sale_amount: float
    profit_margin: float

class PaymentMethodSummary(BaseModel):
    payment_method: str
    count: int
    total_amount: float
    percentage: float

class TopProduct(BaseModel):
    variant_id: int
    product_name: str
    sku: str
    size: str
    color: str
    quantity_sold: int
    revenue: float
    profit: float

class SalesReportResponse(BaseModel):
    filters: SalesReportFilters
    summary: SalesSummary
    daily_sales: List[Dict[str, Any]]
    payment_methods: List[PaymentMethodSummary]
    top_products: List[TopProduct]
    hourly_distribution: List[Dict[str, Any]]
    categories_performance: Dict[str, Dict[str, float]]

# Esquemas para métricas en tiempo real
class RealTimeMetrics(BaseModel):
    today_sales_count: int
    today_revenue: float
    today_profit: float
    current_hour_sales: int
    average_sale_amount: float
    pending_reservations: int
    low_stock_alerts: int
    active_cashiers: int
    last_updated: datetime

# Esquemas para recibos
class ReceiptData(BaseModel):
    store_info: Dict[str, Any]
    sale: SaleResponse
    qr_code: Optional[str] = None
    barcode: Optional[str] = None
    footer_message: Optional[str] = None

# Validators
@validator('customer_phone')
def validate_phone(cls, v):
    if v:
        import re
        # Validar formato de teléfono colombiano
        if not re.match(r'^(\+57)?[0-9]{10}$', v.replace(' ', '').replace('-', '')):
            raise ValueError('Invalid Colombian phone number format')
    return v

@validator('customer_email')
def validate_email(cls, v):
    if v:
        import re
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('Invalid email format')
    return v

@validator('customer_document')
def validate_document(cls, v):
    if v:
        # Validar cédula colombiana básica (solo dígitos)
        if not v.replace('.', '').replace(',', '').isdigit():
            raise ValueError('Document must contain only digits')
    return v

@validator('discount_percentage')
def validate_discount_percentage(cls, v, values):
    if v > 0 and values.get('discount_amount', 0) > 0:
        raise ValueError('Cannot have both percentage and amount discount')
    return v