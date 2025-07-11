# backend/app/api/inventory.py
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..schemas.inventory import (
    LocationCreate, LocationUpdate, LocationResponse,
    InventoryCreate, InventoryUpdate, InventoryResponse,
    InventoryMovementCreate, InventoryMovementResponse,
    ReservationCreate, ReservationUpdate, ReservationResponse,
    InventorySearchFilters, InventorySearchResponse,
    InventoryTransferRequest, InventoryTransferResponse,
    InventoryAdjustmentRequest, InventoryAdjustmentResponse,
    InventoryReportResponse, StockAlertsResponse,
    LEDControlRequest, LEDControlResponse
)
from ..services.inventory_manager import InventoryManager
from ..services.cache_service import CacheService
from ..models.inventory import Location, Inventory, InventoryMovement, Reservation
from ..models.product import ProductVariant, Product
from sqlalchemy import and_, or_, func

router = APIRouter(prefix="/inventory", tags=["inventory"])

# === UBICACIONES ===

@router.post("/locations", response_model=LocationResponse)
async def create_location(location: LocationCreate, db: Session = Depends(get_db)):
    """Crear nueva ubicación"""
    try:
        # Verificar que no exista una ubicación con el mismo nombre
        existing = db.query(Location).filter(Location.name == location.name).first()
        if existing:
            raise HTTPException(status_code=400, detail="Location with this name already exists")
        
        db_location = Location(**location.dict())
        db.add(db_location)
        db.commit()
        db.refresh(db_location)
        
        return db_location
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Location creation error: {str(e)}")

@router.get("/locations", response_model=List[LocationResponse])
async def get_locations(
    location_type: Optional[str] = None,
    section: Optional[str] = None,
    is_active: bool = True,
    db: Session = Depends(get_db)
):
    """Obtener lista de ubicaciones"""
    query = db.query(Location)
    
    if location_type:
        query = query.filter(Location.type == location_type)
    
    if section:
        query = query.filter(Location.section.ilike(f'%{section}%'))
    
    if is_active is not None:
        query = query.filter(Location.is_active == is_active)
    
    locations = query.order_by(Location.type, Location.name).all()
    
    # Agregar información adicional
    for location in locations:
        location.current_items = db.query(Inventory).filter(
            Inventory.location_id == location.id,
            Inventory.quantity > 0,
            Inventory.is_active == True
        ).count()
        
        if location.max_capacity > 0:
            location.capacity_used_percentage = (location.current_items / location.max_capacity) * 100
    
    return locations

@router.get("/locations/{location_id}", response_model=LocationResponse)
async def get_location(location_id: int, db: Session = Depends(get_db)):
    """Obtener ubicación específica"""
    location = db.query(Location).get(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Agregar información de uso
    location.current_items = db.query(Inventory).filter(
        Inventory.location_id == location_id,
        Inventory.quantity > 0,
        Inventory.is_active == True
    ).count()
    
    if location.max_capacity > 0:
        location.capacity_used_percentage = (location.current_items / location.max_capacity) * 100
    
    return location

@router.put("/locations/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: int, 
    location_update: LocationUpdate, 
    db: Session = Depends(get_db)
):
    """Actualizar ubicación"""
    try:
        location = db.query(Location).get(location_id)
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        
        update_data = location_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(location, field, value)
        
        db.commit()
        db.refresh(location)
        
        return location
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Location update error: {str(e)}")

# === INVENTARIO ===

@router.get("/search", response_model=InventorySearchResponse)
async def search_inventory(
    location_id: Optional[int] = None,
    location_type: Optional[str] = None,
    section: Optional[str] = None,
    variant_id: Optional[int] = None,
    product_name: Optional[str] = None,
    sku: Optional[str] = None,
    low_stock_only: bool = False,
    out_of_stock_only: bool = False,
    overstocked_only: bool = False,
    needs_recount: Optional[bool] = None,
    is_active: bool = True,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Búsqueda avanzada de inventario"""
    try:
        query = db.query(Inventory).join(ProductVariant).join(Product).join(Location)
        
        # Aplicar filtros
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        if location_type:
            query = query.filter(Location.type == location_type)
        
        if section:
            query = query.filter(Location.section.ilike(f'%{section}%'))
        
        if variant_id:
            query = query.filter(Inventory.variant_id == variant_id)
        
        if product_name:
            query = query.filter(Product.name.ilike(f'%{product_name}%'))
        
        if sku:
            query = query.filter(ProductVariant.sku.ilike(f'%{sku}%'))
        
        if low_stock_only:
            query = query.filter(Inventory.quantity <= Inventory.min_stock)
        
        if out_of_stock_only:
            query = query.filter(Inventory.quantity == 0)
        
        if overstocked_only:
            query = query.filter(Inventory.quantity >= Inventory.max_stock)
        
        if needs_recount is not None:
            query = query.filter(Inventory.needs_recount == needs_recount)
        
        if is_active:
            query = query.filter(
                Inventory.is_active == True,
                ProductVariant.is_active == True,
                Location.is_active == True
            )
        
        # Contar total
        total_count = query.count()
        
        # Obtener resultados paginados
        inventory_items = query.offset(offset).limit(limit).all()
        
        # Formatear resultados
        results = []
        for item in inventory_items:
            results.append({
                'inventory_id': item.id,
                'variant_id': item.variant_id,
                'product_name': item.variant.product.name,
                'sku': item.variant.sku,
                'size': item.variant.size,
                'color': item.variant.color,
                'location_name': item.location.name,
                'location_type': item.location.type,
                'section': item.location.section,
                'quantity': item.quantity,
                'reserved_quantity': item.reserved_quantity,
                'available_quantity': item.available_quantity,
                'min_stock': item.min_stock,
                'max_stock': item.max_stock,
                'needs_restock': item.needs_restock,
                'is_overstocked': item.is_overstocked,
                'last_movement_date': None  # Se puede calcular si es necesario
            })
        
        # Resumen
        summary = {
            'total_items': total_count,
            'total_value': sum(item.quantity * item.variant.price for item in inventory_items),
            'low_stock_count': sum(1 for item in inventory_items if item.needs_restock),
            'out_of_stock_count': sum(1 for item in inventory_items if item.quantity == 0),
            'overstocked_count': sum(1 for item in inventory_items if item.is_overstocked)
        }
        
        return InventorySearchResponse(
            total_results=total_count,
            results=results,
            filters_applied=InventorySearchFilters(
                location_id=location_id,
                location_type=location_type,
                section=section,
                variant_id=variant_id,
                product_name=product_name,
                sku=sku,
                low_stock_only=low_stock_only,
                out_of_stock_only=out_of_stock_only,
                overstocked_only=overstocked_only,
                needs_recount=needs_recount,
                is_active=is_active
            ),
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory search error: {str(e)}")

@router.get("/alerts", response_model=StockAlertsResponse)
async def get_stock_alerts(
    location_id: Optional[int] = None,
    severity: Optional[str] = Query(None, pattern=r'^(low|medium|high|critical)$'),
    db: Session = Depends(get_db)
):
    """Obtener alertas de stock"""
    try:
        cache = CacheService()
        cache_key = f"stock_alerts:{location_id or 'all'}:{severity or 'all'}"
        
        # Verificar caché
        cached_alerts = cache.get(cache_key)
        if cached_alerts:
            return StockAlertsResponse(**json.loads(cached_alerts))
        
        # Obtener alertas del servicio
        inventory_manager = InventoryManager(db)
        alerts_data = inventory_manager.get_low_stock_alerts(location_id)
        
        alerts = []
        critical_count = 0
        high_priority_count = 0
        
        for alert_data in alerts_data:
            alert_level = alert_data['alert_level']
            if alert_level == 'critical':
                critical_count += 1
            elif alert_level in ['warning', 'high']:
                high_priority_count += 1
            
            # Filtrar por severidad si se especifica
            if severity and alert_level != severity:
                continue
            
            alert = {
                'alert_type': 'low_stock' if alert_data['current_quantity'] > 0 else 'out_of_stock',
                'severity': alert_level,
                'inventory_id': alert_data['inventory_id'],
                'variant_id': alert_data['variant_id'],
                'product_name': alert_data['product_name'],
                'sku': alert_data['sku'],
                'location_name': alert_data['location_name'],
                'current_quantity': alert_data['current_quantity'],
                'threshold': alert_data['min_stock'],
                'message': f"Stock bajo: {alert_data['current_quantity']} unidades (mínimo: {alert_data['min_stock']})",
                'created_at': datetime.now()
            }
            alerts.append(alert)
        
        response = StockAlertsResponse(
            total_alerts=len(alerts),
            critical_alerts=critical_count,
            high_priority_alerts=high_priority_count,
            alerts=alerts
        )
        
        # Cachear por 10 minutos
        cache.setex(cache_key, 600, json.dumps(response.dict(), default=str))
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alerts error: {str(e)}")

@router.post("/transfer", response_model=InventoryTransferResponse)
async def transfer_inventory(
    transfer_request: InventoryTransferRequest,
    db: Session = Depends(get_db)
):
    """Transferir inventario entre ubicaciones"""
    try:
        inventory_manager = InventoryManager(db)
        
        success = inventory_manager.transfer_stock(
            variant_id=transfer_request.variant_id,
            from_location_id=transfer_request.from_location_id,
            to_location_id=transfer_request.to_location_id,
            quantity=transfer_request.quantity,
            reason=transfer_request.reason,
            user_id=transfer_request.user_id
        )
        
        if success:
            db.commit()
            return InventoryTransferResponse(
                success=True,
                message="Transfer completed successfully",
                movements_created=[]  # Se pueden agregar los detalles si se necesita
            )
        else:
            return InventoryTransferResponse(
                success=False,
                message="Transfer failed"
            )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Transfer error: {str(e)}")

@router.post("/adjust", response_model=InventoryAdjustmentResponse)
async def adjust_inventory(
    adjustment_request: InventoryAdjustmentRequest,
    db: Session = Depends(get_db)
):
    """Ajustar cantidad de inventario"""
    try:
        inventory_manager = InventoryManager(db)
        
        # Obtener cantidad actual
        inventory_item = db.query(Inventory).get(adjustment_request.inventory_id)
        if not inventory_item:
            raise HTTPException(status_code=404, detail="Inventory item not found")
        
        old_quantity = inventory_item.quantity
        
        success = inventory_manager.adjust_stock(
            inventory_id=adjustment_request.inventory_id,
            new_quantity=adjustment_request.new_quantity,
            reason=adjustment_request.reason,
            user_id=adjustment_request.user_id
        )
        
        if success:
            db.commit()
            return InventoryAdjustmentResponse(
                success=True,
                message="Adjustment completed successfully",
                old_quantity=old_quantity,
                new_quantity=adjustment_request.new_quantity,
                quantity_change=adjustment_request.new_quantity - old_quantity,
                movement_id=0  # Se puede obtener el ID real si se necesita
            )
        else:
            return InventoryAdjustmentResponse(
                success=False,
                message="Adjustment failed",
                old_quantity=old_quantity,
                new_quantity=old_quantity,
                quantity_change=0,
                movement_id=0
            )
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Adjustment error: {str(e)}")

# === RESERVAS ===

@router.post("/reservations", response_model=ReservationResponse)
async def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva reserva"""
    try:
        inventory_manager = InventoryManager(db)
        
        customer_info = {
            'name': reservation.customer_name,
            'phone': reservation.customer_phone,
            'email': reservation.customer_email
        }
        
        # Calcular duración en minutos
        duration_minutes = int((reservation.expires_at - datetime.now()).total_seconds() / 60)
        
        reservation_id = inventory_manager.reserve_stock(
            variant_id=None,  # Se necesita obtener del inventory_id
            location_id=None,  # Se necesita obtener del inventory_id
            quantity=reservation.quantity,
            customer_info=customer_info,
            duration_minutes=duration_minutes
        )
        
        if reservation_id:
            db.commit()
            # Obtener la reserva creada
            created_reservation = db.query(Reservation).get(reservation_id)
            return created_reservation
        else:
            raise HTTPException(status_code=400, detail="Could not create reservation")
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Reservation error: {str(e)}")

@router.get("/reservations/active")
async def get_active_reservations(db: Session = Depends(get_db)):
    """Obtener reservas activas"""
    reservations = db.query(Reservation).filter(
        Reservation.status == 'active',
        Reservation.expires_at > datetime.now()
    ).all()
    
    return reservations

@router.post("/reservations/{reservation_id}/complete")
async def complete_reservation(reservation_id: int, db: Session = Depends(get_db)):
    """Completar reserva (convertir en venta)"""
    try:
        inventory_manager = InventoryManager(db)
        
        success = inventory_manager.release_reservation(reservation_id, complete_sale=True)
        
        if success:
            db.commit()
            return {"success": True, "message": "Reservation completed"}
        else:
            return {"success": False, "message": "Could not complete reservation"}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Complete reservation error: {str(e)}")

@router.post("/reservations/{reservation_id}/cancel")
async def cancel_reservation(reservation_id: int, db: Session = Depends(get_db)):
    """Cancelar reserva"""
    try:
        inventory_manager = InventoryManager(db)
        
        success = inventory_manager.release_reservation(reservation_id, complete_sale=False)
        
        if success:
            db.commit()
            return {"success": True, "message": "Reservation cancelled"}
        else:
            return {"success": False, "message": "Could not cancel reservation"}
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Cancel reservation error: {str(e)}")

# === SISTEMA LED ===

@router.post("/led/control", response_model=LEDControlResponse)
async def control_leds(
    led_request: LEDControlRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Controlar sistema LED de ubicaciones"""
    try:
        # Verificar que las ubicaciones existen y tienen LED habilitado
        locations = db.query(Location).filter(
            Location.id.in_(led_request.location_ids),
            Location.led_enabled == True,
            Location.led_address.isnot(None)
        ).all()
        
        if not locations:
            return LEDControlResponse(
                success=False,
                message="No LED-enabled locations found",
                locations_controlled=[],
                action_performed=""
            )
        
        # Aquí se implementaría la comunicación con el hardware LED
        # Por ahora simulamos la operación
        background_tasks.add_task(_send_led_commands, locations, led_request)
        
        return LEDControlResponse(
            success=True,
            message=f"LED control sent to {len(locations)} locations",
            locations_controlled=[loc.id for loc in locations],
            action_performed=led_request.action
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LED control error: {str(e)}")

@router.get("/report")
async def get_inventory_report(
    location_id: Optional[int] = None,
    include_movements: bool = False,
    db: Session = Depends(get_db)
):
    """Generar reporte completo de inventario"""
    try:
        inventory_manager = InventoryManager(db)
        
        # Obtener valor total del inventario
        stock_value = inventory_manager.get_stock_value_report(location_id)
        
        # Obtener alertas
        alerts = inventory_manager.get_low_stock_alerts(location_id)
        
        # Obtener resumen por ubicaciones
        locations_query = db.query(Location)
        if location_id:
            locations_query = locations_query.filter(Location.id == location_id)
        
        locations = locations_query.filter(Location.is_active == True).all()
        
        locations_summary = []
        for location in locations:
            location_items = db.query(Inventory).filter(
                Inventory.location_id == location.id,
                Inventory.is_active == True
            ).all()
            
            total_items = len(location_items)
            total_value = sum(item.quantity * item.variant.price for item in location_items)
            items_needing_restock = sum(1 for item in location_items if item.needs_restock)
            
            locations_summary.append({
                'location_id': location.id,
                'location_name': location.name,
                'location_type': location.type,
                'total_items': total_items,
                'total_value': total_value,
                'items_needing_restock': items_needing_restock,
                'capacity_used': (total_items / location.max_capacity * 100) if location.max_capacity > 0 else 0
            })
        
        report = {
            'generated_at': datetime.now().isoformat(),
            'total_products': db.query(Product).filter(Product.is_active == True).count(),
            'total_variants': db.query(ProductVariant).filter(ProductVariant.is_active == True).count(),
            'total_locations': len(locations),
            'total_inventory_value': stock_value['total_retail_value'],
            'low_stock_alerts': len([a for a in alerts if a['alert_level'] == 'warning']),
            'out_of_stock_alerts': len([a for a in alerts if a['alert_level'] == 'critical']),
            'overstocked_alerts': 0,  # Se puede calcular si se necesita
            'locations_summary': locations_summary,
            'movement_summary': {},  # Se puede agregar si se necesita
            'top_moving_products': []  # Se puede agregar si se necesita
        }
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation error: {str(e)}")

# Función auxiliar para controlar LEDs (se ejecuta en background)
async def _send_led_commands(locations, led_request):
    """Envía comandos a los LEDs (función simulada)"""
    import asyncio
    
    # Aquí se implementaría la comunicación real con Arduino/ESP32
    # Por ejemplo, usando HTTP requests, MQTT, o serial communication
    
    for location in locations:
        # Simular envío de comando
        print(f"Sending LED command to {location.led_address}: {led_request.action}")
        await asyncio.sleep(0.1)  # Simular delay de comunicación
        
    # Si hay duración especificada, programar apagado automático
    if led_request.duration_seconds:
        await asyncio.sleep(led_request.duration_seconds)
        for location in locations:
            print(f"Turning off LED at {location.led_address}")
            await asyncio.sleep(0.1)