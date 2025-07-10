# backend/app/schemas/inventory.py
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime

# Esquemas de ubicaciones
class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., regex=r'^(display|storage|reserve)$')
    section: Optional[str] = Field(None, max_length=50)
    shelf_code: Optional[str] = Field(None, max_length=20)
    is_visible_to_customer: bool = True
    description: Optional[str] = Field(None, max_length=200)
    led_address: Optional[str] = Field(None, max_length=20)
    led_enabled: bool = False
    is_active: bool = True
    max_capacity: int = Field(100, gt=0)

class LocationCreate(LocationBase):
    pass

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    section: Optional[str] = None
    shelf_code: Optional[str] = None
    is_visible_to_customer: Optional[bool] = None
    description: Optional[str] = None
    led_enabled: Optional[bool] = None
    is_active: Optional[bool] = None
    max_capacity: Optional[int] = None

class LocationResponse(LocationBase):
    id: int
    current_items: int = 0
    capacity_used_percentage: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquemas de inventario
class InventoryBase(BaseModel):
    variant_id: int
    location_id: int
    quantity: int = Field(..., ge=0)
    reserved_quantity: int = Field(0, ge=0)
    min_stock: int = Field(1, ge=0)
    max_stock: int = Field(50, gt=0)
    cost_per_unit: Optional[float] = Field(None, gt=0)
    is_active: bool = True

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    reserved_quantity: Optional[int] = Field(None, ge=0)
    min_stock: Optional[int] = Field(None, ge=0)
    max_stock: Optional[int] = Field(None, gt=0)
    cost_per_unit: Optional[float] = Field(None, gt=0)
    is_active: Optional[bool] = None

class InventoryResponse(InventoryBase):
    id: int
    available_quantity: int
    needs_restock: bool
    is_overstocked: bool
    location: LocationResponse
    variant: Dict[str, Any]  # Información básica de la variante
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquemas de movimientos de inventario
class InventoryMovementBase(BaseModel):
    inventory_id: int
    movement_type: str = Field(..., regex=r'^(sale|purchase|transfer|adjustment|return)$')
    quantity_change: int = Field(..., ne=0)  # No puede ser cero
    reference_id: Optional[int] = None
    reference_type: Optional[str] = None
    reason: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)
    user_id: Optional[str] = Field(None, max_length=50)
    unit_cost: Optional[float] = Field(None, gt=0)
    total_cost: Optional[float] = None

class InventoryMovementCreate(InventoryMovementBase):
    pass

class InventoryMovementResponse(InventoryMovementBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Esquemas de reservas/apartados
class ReservationBase(BaseModel):
    inventory_id: int
    quantity: int = Field(..., gt=0)
    customer_name: Optional[str] = Field(None, max_length=100)
    customer_phone: Optional[str] = Field(None, max_length=20)
    customer_email: Optional[str] = Field(None, max_length=100)
    expires_at: datetime
    notes: Optional[str] = Field(None, max_length=500)

class ReservationCreate(ReservationBase):
    pass

class ReservationUpdate(BaseModel):
    quantity: Optional[int] = Field(None, gt=0)
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    expires_at: Optional[datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = Field(None, regex=r'^(active|completed|cancelled|expired)$')

class ReservationResponse(ReservationBase):
    id: int
    status: str
    completed_at: Optional[datetime] = None
    cancelled_at: Optional[datetime] = None
    inventory_item: InventoryResponse
    time_remaining_minutes: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Esquemas para búsquedas de inventario
class InventorySearchFilters(BaseModel):
    location_id: Optional[int] = None
    location_type: Optional[str] = None
    section: Optional[str] = None
    variant_id: Optional[int] = None
    product_name: Optional[str] = None
    sku: Optional[str] = None
    low_stock_only: bool = False
    out_of_stock_only: bool = False
    overstocked_only: bool = False
    needs_recount: Optional[bool] = None
    is_active: bool = True

class InventorySearchResult(BaseModel):
    inventory_id: int
    variant_id: int
    product_name: str
    sku: str
    size: str
    color: str
    location_name: str
    location_type: str
    section: Optional[str] = None
    quantity: int
    reserved_quantity: int
    available_quantity: int
    min_stock: int
    max_stock: int
    needs_restock: bool
    is_overstocked: bool
    last_movement_date: Optional[datetime] = None

class InventorySearchResponse(BaseModel):
    total_results: int
    results: List[InventorySearchResult]
    filters_applied: InventorySearchFilters
    summary: Dict[str, Any]

# Esquemas para transferencias entre ubicaciones
class InventoryTransferRequest(BaseModel):
    variant_id: int
    from_location_id: int
    to_location_id: int
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)
    user_id: Optional[str] = None

class InventoryTransferResponse(BaseModel):
    success: bool
    message: str
    transfer_id: Optional[int] = None
    movements_created: List[InventoryMovementResponse] = []

# Esquemas para ajustes de inventario
class InventoryAdjustmentRequest(BaseModel):
    inventory_id: int
    new_quantity: int = Field(..., ge=0)
    reason: str = Field(..., min_length=1, max_length=200)
    notes: Optional[str] = Field(None, max_length=500)
    user_id: Optional[str] = None
    recount_verified: bool = False

class InventoryAdjustmentResponse(BaseModel):
    success: bool
    message: str
    old_quantity: int
    new_quantity: int
    quantity_change: int
    movement_id: int

# Esquemas para reportes de inventario
class LocationSummary(BaseModel):
    location_id: int
    location_name: str
    location_type: str
    total_items: int
    total_value: float
    items_needing_restock: int
    capacity_used: float

class InventoryReportResponse(BaseModel):
    total_products: int
    total_variants: int
    total_locations: int
    total_inventory_value: float
    low_stock_alerts: int
    out_of_stock_alerts: int
    overstocked_alerts: int
    locations_summary: List[LocationSummary]
    movement_summary: Dict[str, int]  # Movimientos por tipo en el período
    top_moving_products: List[Dict[str, Any]]

# Esquemas para alertas
class StockAlert(BaseModel):
    alert_type: str  # "low_stock", "out_of_stock", "overstocked"
    severity: str = Field(..., regex=r'^(low|medium|high|critical)$')
    inventory_id: int
    variant_id: int
    product_name: str
    sku: str
    location_name: str
    current_quantity: int
    threshold: int
    message: str
    created_at: datetime

class StockAlertsResponse(BaseModel):
    total_alerts: int
    critical_alerts: int
    high_priority_alerts: int
    alerts: List[StockAlert]

# Esquemas para sistema LED
class LEDControlRequest(BaseModel):
    location_ids: List[int]
    action: str = Field(..., regex=r'^(on|off|blink|pulse)$')
    duration_seconds: Optional[int] = Field(None, gt=0, le=300)
    color: Optional[str] = Field(None, regex=r'^(red|green|blue|yellow|white|purple)$')

class LEDControlResponse(BaseModel):
    success: bool
    message: str
    locations_controlled: List[int]
    action_performed: str

# Validators
@validator('expires_at')
def validate_expires_at(cls, v):
    if v <= datetime.now():
        raise ValueError('Expiration date must be in the future')
    return v

@validator('customer_phone')
def validate_phone(cls, v):
    if v:
        import re
        # Validar formato de teléfono colombiano
        if not re.match(r'^(\+57)?[0-9]{10}$', v.replace(' ', '').replace('-', '')):
            raise ValueError('Invalid Colombian phone number format')
    return v