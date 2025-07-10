# backend/app/api/sales.py
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..schemas.sale import (
    SaleCreate, SaleUpdate, SaleResponse,
    QuickSaleRequest, QuickSaleResponse,
    SaleSearchFilters, SaleSearchResponse,
    RefundCreate, RefundResponse,
    SalesReportFilters, SalesReportResponse,
    RealTimeMetrics, ReceiptData,
    CartItem, Cart, CartSummary
)
from ..services.sales_manager import SalesManager
from ..services.inventory_manager import InventoryManager
from ..services.cache_service import CacheService
from ..models.sale import Sale, SaleItem, Payment, Refund
from ..models.product import ProductVariant
from sqlalchemy import and_, or_, func, desc
import json

router = APIRouter(prefix="/sales", tags=["sales"])

# === VENTAS ===

@router.post("/", response_model=SaleResponse)
async def create_sale(
    sale_data: SaleCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Crear nueva venta completa"""
    try:
        sales_manager = SalesManager(db)
        
        # Preparar datos de la venta
        sale_dict = sale_data.dict(exclude={'items', 'payments'})
        items_data = [item.dict() for item in sale_data.items]
        payments_data = [payment.dict() for payment in sale_data.payments] if sale_data.payments else None
        
        # Crear la venta
        result = sales_manager.create_sale(sale_dict, items_data, payments_data)
        
        if result['success']:
            # Programar tareas en background (envío de recibo, etc.)
            background_tasks.add_task(_post_sale_tasks, result['sale_id'], db)
            
            # Obtener la venta creada para retornar
            sale = db.query(Sale).get(result['sale_id'])
            return sale
        else:
            raise HTTPException(status_code=400, detail=result['message'])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sale creation error: {str(e)}")

@router.post("/quick", response_model=QuickSaleResponse)
async def quick_sale(
    quick_sale_data: QuickSaleRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Venta rápida de un solo producto"""
    try:
        sales_manager = SalesManager(db)
        
        result = sales_manager.quick_sale(
            variant_id=quick_sale_data.variant_id,
            quantity=quick_sale_data.quantity,
            payment_method=quick_sale_data.payment_method,
            customer_phone=quick_sale_data.customer_phone,
            discount_amount=quick_sale_data.discount_amount
        )
        
        if result['success']:
            # Programar tareas en background
            background_tasks.add_task(_post_sale_tasks, result['sale_id'], db)
            
            # Obtener la venta para la respuesta
            sale = db.query(Sale).get(result['sale_id'])
            
            # Generar datos del recibo
            receipt_data = _generate_receipt_data(sale)
            
            return QuickSaleResponse(
                success=True,
                message="Sale completed successfully",
                sale=sale,
                receipt_data=receipt_data
            )
        else:
            return QuickSaleResponse(
                success=False,
                message=result['message']
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick sale error: {str(e)}")

@router.get("/search", response_model=SaleSearchResponse)
async def search_sales(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    customer_phone: Optional[str] = None,
    customer_name: Optional[str] = None,
    cashier_id: Optional[str] = None,
    payment_method: Optional[str] = None,
    status: Optional[str] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    sale_number: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Búsqueda avanzada de ventas"""
    try:
        query = db.query(Sale)
        
        # Aplicar filtros
        if start_date:
            query = query.filter(Sale.created_at >= start_date)
        
        if end_date:
            query = query.filter(Sale.created_at <= end_date)
        
        if customer_phone:
            query = query.filter(Sale.customer_phone.ilike(f'%{customer_phone}%'))
        
        if customer_name:
            query = query.filter(Sale.customer_name.ilike(f'%{customer_name}%'))
        
        if cashier_id:
            query = query.filter(Sale.cashier_id == cashier_id)
        
        if payment_method:
            query = query.filter(Sale.payment_method == payment_method)
        
        if status:
            query = query.filter(Sale.status == status)
        
        if min_amount:
            query = query.filter(Sale.total_amount >= min_amount)
        
        if max_amount:
            query = query.filter(Sale.total_amount <= max_amount)
        
        if sale_number:
            query = query.filter(Sale.sale_number.ilike(f'%{sale_number}%'))
        
        # Contar total
        total_count = query.count()
        
        # Obtener resultados paginados
        sales = query.order_by(desc(Sale.created_at)).offset(offset).limit(limit).all()
        
        # Formatear resultados
        results = []
        for sale in sales:
            results.append({
                'id': sale.id,
                'sale_number': sale.sale_number,
                'customer_name': sale.customer_name,
                'customer_phone': sale.customer_phone,
                'total_amount': sale.total_amount,
                'total_items': sale.total_items,
                'payment_method': sale.payment_method,
                'status': sale.status,
                'cashier_id': sale.cashier_id,
                'created_at': sale.created_at,
                'completed_at': sale.completed_at
            })
        
        # Calcular resumen
        summary = {
            'total_sales': total_count,
            'total_amount': sum(sale.total_amount for sale in sales),
            'average_amount': sum(sale.total_amount for sale in sales) / len(sales) if sales else 0,
            'total_items': sum(sale.total_items for sale in sales)
        }
        
        return SaleSearchResponse(
            total_results=total_count,
            results=results,
            filters_applied=SaleSearchFilters(
                start_date=start_date,
                end_date=end_date,
                customer_phone=customer_phone,
                customer_name=customer_name,
                cashier_id=cashier_id,
                payment_method=payment_method,
                status=status,
                min_amount=min_amount,
                max_amount=max_amount,
                sale_number=sale_number
            ),
            summary=summary
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sales search error: {str(e)}")

@router.get("/{sale_id}", response_model=SaleResponse)
async def get_sale(sale_id: int, db: Session = Depends(get_db)):
    """Obtener venta específica"""
    sale = db.query(Sale).get(sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    return sale

@router.put("/{sale_id}", response_model=SaleResponse)
async def update_sale(
    sale_id: int,
    sale_update: SaleUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar venta"""
    try:
        sale = db.query(Sale).get(sale_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        if sale.status in ['cancelled', 'refunded']:
            raise HTTPException(status_code=400, detail="Cannot update cancelled or refunded sale")
        
        update_data = sale_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(sale, field, value)
        
        db.commit()
        db.refresh(sale)
        
        return sale
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Sale update error: {str(e)}")

@router.post("/{sale_id}/cancel")
async def cancel_sale(
    sale_id: int,
    reason: str,
    user_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Cancelar venta"""
    try:
        sales_manager = SalesManager(db)
        
        result = sales_manager.cancel_sale(sale_id, reason, user_id)
        
        if result['success']:
            return {"success": True, "message": result['message']}
        else:
            raise HTTPException(status_code=400, detail=result['message'])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sale cancellation error: {str(e)}")

# === DEVOLUCIONES ===

@router.post("/refunds", response_model=RefundResponse)
async def create_refund(
    refund_data: RefundCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Crear devolución"""
    try:
        sales_manager = SalesManager(db)
        
        refund_dict = refund_data.dict(exclude={'items'})
        items_data = [item.dict() for item in refund_data.items]
        
        result = sales_manager.create_refund(refund_dict, items_data)
        
        if result['success']:
            # Programar tareas en background
            background_tasks.add_task(_post_refund_tasks, result['refund_id'], db)
            
            # Obtener la devolución creada
            refund = db.query(Refund).get(result['refund_id'])
            return refund
        else:
            raise HTTPException(status_code=400, detail=result['message'])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Refund creation error: {str(e)}")

@router.get("/refunds/{refund_id}", response_model=RefundResponse)
async def get_refund(refund_id: int, db: Session = Depends(get_db)):
    """Obtener devolución específica"""
    refund = db.query(Refund).get(refund_id)
    if not refund:
        raise HTTPException(status_code=404, detail="Refund not found")
    
    return refund

# === CARRITO DE COMPRAS ===

@router.post("/cart/validate")
async def validate_cart(cart: Cart, db: Session = Depends(get_db)):
    """Validar carrito antes de procesar venta"""
    try:
        inventory_manager = InventoryManager(db)
        
        total_items = 0
        subtotal = 0
        items_detail = []
        issues = []
        
        for cart_item in cart.items:
            # Obtener información del producto
            variant = db.query(ProductVariant).get(cart_item.variant_id)
            if not variant:
                issues.append(f"Product variant {cart_item.variant_id} not found")
                continue
            
            # Verificar disponibilidad
            inventory_info = inventory_manager.get_inventory_info(cart_item.variant_id)
            
            if inventory_info['total_available'] < cart_item.quantity:
                issues.append(f"Insufficient stock for {variant.full_name}. Available: {inventory_info['total_available']}, Requested: {cart_item.quantity}")
            
            # Calcular precios
            unit_price = cart_item.unit_price if cart_item.unit_price else variant.price
            line_total = (unit_price * cart_item.quantity) - cart_item.discount_amount
            
            items_detail.append({
                'variant_id': cart_item.variant_id,
                'product_name': variant.product.name,
                'variant_name': variant.full_name,
                'sku': variant.sku,
                'size': variant.size,
                'color': variant.color,
                'quantity': cart_item.quantity,
                'unit_price': unit_price,
                'discount_amount': cart_item.discount_amount,
                'line_total': line_total,
                'available_stock': inventory_info['total_available'],
                'is_available': inventory_info['total_available'] >= cart_item.quantity
            })
            
            total_items += cart_item.quantity
            subtotal += line_total
        
        # Aplicar descuentos globales
        discount_amount = cart.discount_amount
        if cart.discount_percentage > 0:
            discount_amount += (subtotal * cart.discount_percentage / 100)
        
        tax_amount = 0  # Configurar según normativa
        total_amount = subtotal - discount_amount + tax_amount
        
        summary = CartSummary(
            total_items=total_items,
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=tax_amount,
            total_amount=total_amount,
            items_detail=items_detail
        )
        
        return {
            'is_valid': len(issues) == 0,
            'issues': issues,
            'summary': summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cart validation error: {str(e)}")

# === REPORTES ===

@router.get("/reports/daily")
async def get_daily_sales_report(
    date: Optional[datetime] = None,
    db: Session = Depends(get_db)
):
    """Reporte de ventas diarias"""
    try:
        sales_manager = SalesManager(db)
        
        if not date:
            date = datetime.now()
        
        report = sales_manager.get_daily_sales_summary(date)
        
        return report
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Daily report error: {str(e)}")

@router.post("/reports/custom", response_model=SalesReportResponse)
async def get_custom_sales_report(
    report_filters: SalesReportFilters,
    db: Session = Depends(get_db)
):
    """Reporte personalizado de ventas"""
    try:
        sales_manager = SalesManager(db)
        
        report = sales_manager.get_sales_report(
            start_date=report_filters.start_date,
            end_date=report_filters.end_date,
            group_by=report_filters.group_by,
            cashier_id=report_filters.cashier_id,
            payment_method=report_filters.payment_method,
            product_category=report_filters.product_category
        )
        
        return SalesReportResponse(**report)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Custom report error: {str(e)}")

@router.get("/metrics/realtime", response_model=RealTimeMetrics)
async def get_realtime_metrics(db: Session = Depends(get_db)):
    """Métricas en tiempo real"""
    try:
        cache = CacheService()
        
        # Verificar caché
        cached_metrics = cache.get("realtime_metrics")
        if cached_metrics:
            return RealTimeMetrics(**json.loads(cached_metrics))
        
        # Calcular métricas
        today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)
        current_hour = datetime.now().replace(minute=0, second=0, microsecond=0)
        next_hour = current_hour + timedelta(hours=1)
        
        # Ventas de hoy
        today_sales = db.query(Sale).filter(
            Sale.created_at >= today,
            Sale.created_at < tomorrow,
            Sale.status == 'completed'
        ).all()
        
        # Ventas de la hora actual
        current_hour_sales = db.query(Sale).filter(
            Sale.created_at >= current_hour,
            Sale.created_at < next_hour,
            Sale.status == 'completed'
        ).count()
        
        # Reservas pendientes
        from ..models.inventory import Reservation
        pending_reservations = db.query(Reservation).filter(
            Reservation.status == 'active',
            Reservation.expires_at > datetime.now()
        ).count()
        
        # Alertas de stock bajo
        inventory_manager = InventoryManager(db)
        low_stock_alerts = len(inventory_manager.get_low_stock_alerts())
        
        # Calcular métricas
        today_revenue = sum(sale.total_amount for sale in today_sales)
        today_profit = sum(sale.profit for sale in today_sales)
        avg_sale_amount = today_revenue / len(today_sales) if today_sales else 0
        
        metrics = RealTimeMetrics(
            today_sales_count=len(today_sales),
            today_revenue=today_revenue,
            today_profit=today_profit,
            current_hour_sales=current_hour_sales,
            average_sale_amount=avg_sale_amount,
            pending_reservations=pending_reservations,
            low_stock_alerts=low_stock_alerts,
            active_cashiers=1,  # Se puede calcular dinámicamente
            last_updated=datetime.now()
        )
        
        # Cachear por 1 minuto
        cache.setex("realtime_metrics", 60, json.dumps(metrics.dict(), default=str))
        
        return metrics
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Metrics error: {str(e)}")

@router.get("/{sale_id}/receipt")
async def get_sale_receipt(sale_id: int, db: Session = Depends(get_db)):
    """Obtener datos para generar recibo"""
    try:
        sale = db.query(Sale).get(sale_id)
        if not sale:
            raise HTTPException(status_code=404, detail="Sale not found")
        
        receipt_data = _generate_receipt_data(sale)
        
        return receipt_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Receipt generation error: {str(e)}")

# === FUNCIONES AUXILIARES ===

def _generate_receipt_data(sale: Sale) -> dict:
    """Genera datos para el recibo"""
    store_info = {
        'name': 'Almacén de Ropa',
        'address': 'Centro de Bogotá, Colombia',
        'phone': '+57 1 234 5678',
        'email': 'ventas@almacenropa.com',
        'nit': '123.456.789-0'
    }
    
    return {
        'store_info': store_info,
        'sale': sale,
        'qr_code': f"SALE-{sale.sale_number}",  # Se puede generar QR real
        'barcode': sale.sale_number,
        'footer_message': '¡Gracias por su compra!'
    }

async def _post_sale_tasks(sale_id: int, db: Session):
    """Tareas posteriores a la venta"""
    # Aquí se pueden agregar tareas como:
    # - Envío de recibo por email
    # - Actualización de métricas
    # - Notificaciones push
    # - Sincronización con sistemas externos
    pass

async def _post_refund_tasks(refund_id: int, db: Session):
    """Tareas posteriores a la devolución"""
    # Aquí se pueden agregar tareas como:
    # - Notificaciones
    # - Actualización de métricas
    # - Registro en sistemas de auditoría
    pass