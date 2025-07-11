# backend/app/api/reports.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from ..database import get_db
from ..services.sales_manager import SalesManager
from ..services.inventory_manager import InventoryManager
from ..services.cache_service import CacheService
from ..models.sale import Sale, SaleItem
from ..models.product import Product, ProductVariant
from ..models.inventory import Inventory, Location, InventoryMovement
from sqlalchemy import func, and_, or_, desc, asc
import json

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/dashboard")
async def get_dashboard_data(
    period_days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Datos para el dashboard principal"""
    try:
        cache = CacheService()
        cache_key = f"dashboard_data:{period_days}"
        
        # Verificar caché
        cached_data = cache.get(cache_key)
        if cached_data:
            return json.loads(cached_data)
        
        end_date = datetime.now()
        start_date = end_date - timedelta(days=period_days)
        
        # === MÉTRICAS DE VENTAS ===
        sales_query = db.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.status == 'completed'
        )
        
        sales = sales_query.all()
        total_sales = len(sales)
        total_revenue = sum(sale.total_amount for sale in sales)
        total_profit = sum(sale.profit for sale in sales)
        total_items_sold = sum(sale.total_items for sale in sales)
        
        avg_sale_amount = total_revenue / total_sales if total_sales > 0 else 0
        profit_margin = (total_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Comparación con período anterior
        prev_start = start_date - timedelta(days=period_days)
        prev_end = start_date
        
        prev_sales = db.query(Sale).filter(
            Sale.created_at >= prev_start,
            Sale.created_at < prev_end,
            Sale.status == 'completed'
        ).all()
        
        prev_revenue = sum(sale.total_amount for sale in prev_sales)
        revenue_change = ((total_revenue - prev_revenue) / prev_revenue * 100) if prev_revenue > 0 else 0
        
        # === PRODUCTOS MÁS VENDIDOS ===
        top_products_query = db.query(
            SaleItem.variant_id,
            ProductVariant.sku,
            Product.name.label('product_name'),
            ProductVariant.size,
            ProductVariant.color,
            func.sum(SaleItem.quantity).label('total_sold'),
            func.sum(SaleItem.total_price).label('total_revenue')
        ).join(Sale).join(ProductVariant).join(Product).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.status == 'completed'
        ).group_by(
            SaleItem.variant_id,
            ProductVariant.sku,
            Product.name,
            ProductVariant.size,
            ProductVariant.color
        ).order_by(desc('total_sold')).limit(10)
        
        top_products = []
        for item in top_products_query.all():
            top_products.append({
                'variant_id': item.variant_id,
                'sku': item.sku,
                'product_name': item.product_name,
                'size': item.size,
                'color': item.color,
                'quantity_sold': item.total_sold,
                'revenue': float(item.total_revenue)
            })
        
        # === VENTAS POR DÍA ===
        daily_sales = {}
        for i in range(period_days):
            date = (end_date - timedelta(days=i)).strftime('%Y-%m-%d')
            daily_sales[date] = {'sales': 0, 'revenue': 0}
        
        for sale in sales:
            date_key = sale.created_at.strftime('%Y-%m-%d')
            if date_key in daily_sales:
                daily_sales[date_key]['sales'] += 1
                daily_sales[date_key]['revenue'] += sale.total_amount
        
        # Convertir a lista ordenada
        daily_sales_list = []
        for date in sorted(daily_sales.keys()):
            daily_sales_list.append({
                'date': date,
                'sales_count': daily_sales[date]['sales'],
                'revenue': daily_sales[date]['revenue']
            })
        
        # === INVENTARIO ===
        inventory_manager = InventoryManager(db)
        stock_value = inventory_manager.get_stock_value_report()
        low_stock_alerts = inventory_manager.get_low_stock_alerts()
        
        total_products = db.query(Product).filter(Product.is_active == True).count()
        total_variants = db.query(ProductVariant).filter(ProductVariant.is_active == True).count()
        
        # === MÉTODOS DE PAGO ===
        payment_methods = {}
        for sale in sales:
            method = sale.payment_method
            if method not in payment_methods:
                payment_methods[method] = {'count': 0, 'amount': 0}
            payment_methods[method]['count'] += 1
            payment_methods[method]['amount'] += sale.total_amount
        
        # === VENTAS POR HORA ===
        hourly_sales = {}
        for hour in range(24):
            hourly_sales[f"{hour:02d}:00"] = 0
        
        for sale in sales:
            hour_key = f"{sale.created_at.hour:02d}:00"
            hourly_sales[hour_key] += 1
        
        hourly_sales_list = [
            {'hour': hour, 'sales': count}
            for hour, count in hourly_sales.items()
        ]
        
        dashboard_data = {
            'period_days': period_days,
            'generated_at': datetime.now().isoformat(),
            
            # Métricas principales
            'sales_metrics': {
                'total_sales': total_sales,
                'total_revenue': round(total_revenue, 2),
                'total_profit': round(total_profit, 2),
                'total_items_sold': total_items_sold,
                'avg_sale_amount': round(avg_sale_amount, 2),
                'profit_margin': round(profit_margin, 2),
                'revenue_change_percent': round(revenue_change, 2)
            },
            
            # Inventario
            'inventory_metrics': {
                'total_products': total_products,
                'total_variants': total_variants,
                'total_stock_value': round(stock_value['total_retail_value'], 2),
                'low_stock_alerts': len(low_stock_alerts),
                'out_of_stock_items': len([a for a in low_stock_alerts if a['current_quantity'] == 0])
            },
            
            # Gráficos y listas
            'top_products': top_products,
            'daily_sales': daily_sales_list,
            'payment_methods': payment_methods,
            'hourly_distribution': hourly_sales_list
        }
        
        # Cachear por 15 minutos
        cache.setex(cache_key, 900, json.dumps(dashboard_data, default=str))
        
        return dashboard_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dashboard data error: {str(e)}")

@router.get("/sales/summary")
async def get_sales_summary(
    start_date: datetime,
    end_date: datetime,
    group_by: str = Query("day", pattern=r'^(hour|day|week|month)$'),
    category: Optional[str] = None,
    cashier_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Resumen de ventas por período"""
    try:
        # Construir consulta base
        query = db.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.status == 'completed'
        )
        
        if cashier_id:
            query = query.filter(Sale.cashier_id == cashier_id)
        
        # Si se filtra por categoría, necesitamos unir con items
        if category:
            query = query.join(SaleItem).join(ProductVariant).join(Product).filter(
                Product.category.ilike(f'%{category}%')
            ).distinct()
        
        sales = query.all()
        
        # Agrupar datos
        grouped_data = {}
        
        for sale in sales:
            # Determinar la clave de agrupación
            if group_by == 'hour':
                key = sale.created_at.strftime('%Y-%m-%d %H:00')
            elif group_by == 'day':
                key = sale.created_at.strftime('%Y-%m-%d')
            elif group_by == 'week':
                # Primer día de la semana (lunes)
                monday = sale.created_at - timedelta(days=sale.created_at.weekday())
                key = monday.strftime('%Y-%m-%d')
            elif group_by == 'month':
                key = sale.created_at.strftime('%Y-%m')
            
            if key not in grouped_data:
                grouped_data[key] = {
                    'period': key,
                    'sales_count': 0,
                    'total_revenue': 0,
                    'total_profit': 0,
                    'total_items': 0,
                    'unique_customers': set()
                }
            
            grouped_data[key]['sales_count'] += 1
            grouped_data[key]['total_revenue'] += sale.total_amount
            grouped_data[key]['total_profit'] += sale.profit
            grouped_data[key]['total_items'] += sale.total_items
            
            if sale.customer_phone:
                grouped_data[key]['unique_customers'].add(sale.customer_phone)
        
        # Convertir sets a counts y formatear
        result = []
        for period_data in grouped_data.values():
            period_data['unique_customers'] = len(period_data['unique_customers'])
            period_data['avg_sale_amount'] = (
                period_data['total_revenue'] / period_data['sales_count']
                if period_data['sales_count'] > 0 else 0
            )
            result.append(period_data)
        
        # Ordenar por período
        result.sort(key=lambda x: x['period'])
        
        # Calcular totales
        totals = {
            'total_sales': sum(p['sales_count'] for p in result),
            'total_revenue': sum(p['total_revenue'] for p in result),
            'total_profit': sum(p['total_profit'] for p in result),
            'total_items': sum(p['total_items'] for p in result)
        }
        
        return {
            'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            'group_by': group_by,
            'filters': {
                'category': category,
                'cashier_id': cashier_id
            },
            'data': result,
            'totals': totals
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sales summary error: {str(e)}")

@router.get("/inventory/status")
async def get_inventory_status_report(
    location_id: Optional[int] = None,
    category: Optional[str] = None,
    low_stock_threshold: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Reporte de estado del inventario"""
    try:
        inventory_manager = InventoryManager(db)
        
        # Consulta base
        query = db.query(Inventory).join(ProductVariant).join(Product).join(Location).filter(
            Inventory.is_active == True,
            ProductVariant.is_active == True,
            Location.is_active == True
        )
        
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        
        inventory_items = query.all()
        
        # Calcular métricas
        total_items = len(inventory_items)
        total_units = sum(item.quantity for item in inventory_items)
        total_value = sum(item.quantity * item.variant.price for item in inventory_items)
        total_cost = sum(item.quantity * item.variant.cost for item in inventory_items)
        
        # Clasificar por estado
        in_stock = []
        low_stock = []
        out_of_stock = []
        overstocked = []
        
        for item in inventory_items:
            threshold = low_stock_threshold or item.min_stock
            
            if item.quantity == 0:
                out_of_stock.append(item)
            elif item.quantity <= threshold:
                low_stock.append(item)
            elif item.quantity >= item.max_stock:
                overstocked.append(item)
            else:
                in_stock.append(item)
        
        # Agrupar por categoría
        categories = {}
        for item in inventory_items:
            cat = item.variant.product.category
            if cat not in categories:
                categories[cat] = {
                    'category': cat,
                    'total_items': 0,
                    'total_units': 0,
                    'total_value': 0,
                    'low_stock_count': 0,
                    'out_of_stock_count': 0
                }
            
            categories[cat]['total_items'] += 1
            categories[cat]['total_units'] += item.quantity
            categories[cat]['total_value'] += item.quantity * item.variant.price
            
            if item.quantity == 0:
                categories[cat]['out_of_stock_count'] += 1
            elif item.quantity <= item.min_stock:
                categories[cat]['low_stock_count'] += 1
        
        # Agrupar por ubicación
        locations = {}
        for item in inventory_items:
            loc = item.location.name
            if loc not in locations:
                locations[loc] = {
                    'location': loc,
                    'location_type': item.location.type,
                    'total_items': 0,
                    'total_units': 0,
                    'total_value': 0,
                    'capacity_used': 0
                }
            
            locations[loc]['total_items'] += 1
            locations[loc]['total_units'] += item.quantity
            locations[loc]['total_value'] += item.quantity * item.variant.price
            
            if item.location.max_capacity > 0:
                locations[loc]['capacity_used'] = (
                    locations[loc]['total_items'] / item.location.max_capacity * 100
                )
        
        return {
            'generated_at': datetime.now().isoformat(),
            'filters': {
                'location_id': location_id,
                'category': category,
                'low_stock_threshold': low_stock_threshold
            },
            'summary': {
                'total_items': total_items,
                'total_units': total_units,
                'total_value': round(total_value, 2),
                'total_cost': round(total_cost, 2),
                'potential_profit': round(total_value - total_cost, 2),
                'avg_value_per_unit': round(total_value / total_units if total_units > 0 else 0, 2)
            },
            'status_breakdown': {
                'in_stock': len(in_stock),
                'low_stock': len(low_stock),
                'out_of_stock': len(out_of_stock),
                'overstocked': len(overstocked)
            },
            'by_category': list(categories.values()),
            'by_location': list(locations.values()),
            'alerts': {
                'low_stock_items': [
                    {
                        'variant_id': item.variant_id,
                        'product_name': item.variant.product.name,
                        'sku': item.variant.sku,
                        'size': item.variant.size,
                        'color': item.variant.color,
                        'location': item.location.name,
                        'current_stock': item.quantity,
                        'min_stock': item.min_stock,
                        'recommended_order': max(item.max_stock - item.quantity, item.min_stock * 2)
                    }
                    for item in low_stock
                ],
                'out_of_stock_items': [
                    {
                        'variant_id': item.variant_id,
                        'product_name': item.variant.product.name,
                        'sku': item.variant.sku,
                        'size': item.variant.size,
                        'color': item.variant.color,
                        'location': item.location.name,
                        'last_sale_date': None  # Se puede calcular si se necesita
                    }
                    for item in out_of_stock
                ]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inventory status error: {str(e)}")

@router.get("/products/performance")
async def get_product_performance_report(
    start_date: datetime,
    end_date: datetime,
    category: Optional[str] = None,
    top_n: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Reporte de rendimiento de productos"""
    try:
        # Consulta de ventas por producto
        query = db.query(
            SaleItem.variant_id,
            ProductVariant.sku,
            Product.name.label('product_name'),
            Product.category,
            ProductVariant.size,
            ProductVariant.color,
            ProductVariant.price,
            ProductVariant.cost,
            func.sum(SaleItem.quantity).label('total_sold'),
            func.sum(SaleItem.total_price).label('total_revenue'),
            func.sum(SaleItem.quantity * SaleItem.unit_cost).label('total_cost'),
            func.count(Sale.id).label('number_of_sales'),
            func.avg(SaleItem.quantity).label('avg_quantity_per_sale')
        ).join(Sale).join(ProductVariant).join(Product).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.status == 'completed'
        )
        
        if category:
            query = query.filter(Product.category.ilike(f'%{category}%'))
        
        results = query.group_by(
            SaleItem.variant_id,
            ProductVariant.sku,
            Product.name,
            Product.category,
            ProductVariant.size,
            ProductVariant.color,
            ProductVariant.price,
            ProductVariant.cost
        ).order_by(desc('total_sold')).limit(top_n).all()
        
        products_performance = []
        for result in results:
            total_profit = result.total_revenue - result.total_cost
            profit_margin = (total_profit / result.total_revenue * 100) if result.total_revenue > 0 else 0
            
            # Obtener stock actual
            inventory_manager = InventoryManager(db)
            inventory_info = inventory_manager.get_inventory_info(result.variant_id)
            
            products_performance.append({
                'variant_id': result.variant_id,
                'sku': result.sku,
                'product_name': result.product_name,
                'category': result.category,
                'size': result.size,
                'color': result.color,
                'current_price': float(result.price),
                'unit_cost': float(result.cost),
                'quantity_sold': result.total_sold,
                'total_revenue': float(result.total_revenue),
                'total_profit': float(total_profit),
                'profit_margin': round(profit_margin, 2),
                'number_of_sales': result.number_of_sales,
                'avg_quantity_per_sale': float(result.avg_quantity_per_sale),
                'current_stock': inventory_info['total_available'],
                'turn_rate': None  # Se puede calcular con datos históricos
            })
        
        # Calcular totales
        total_revenue = sum(p['total_revenue'] for p in products_performance)
        total_profit = sum(p['total_profit'] for p in products_performance)
        total_sold = sum(p['quantity_sold'] for p in products_performance)
        
        return {
            'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            'filters': {'category': category},
            'summary': {
                'total_products_analyzed': len(products_performance),
                'total_units_sold': total_sold,
                'total_revenue': round(total_revenue, 2),
                'total_profit': round(total_profit, 2),
                'avg_profit_margin': round((total_profit / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            'products': products_performance
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Product performance error: {str(e)}")

@router.get("/movements/history")
async def get_inventory_movements_report(
    start_date: datetime,
    end_date: datetime,
    movement_type: Optional[str] = None,
    location_id: Optional[int] = None,
    variant_id: Optional[int] = None,
    limit: int = Query(100, le=500),
    db: Session = Depends(get_db)
):
    """Reporte de movimientos de inventario"""
    try:
        inventory_manager = InventoryManager(db)
        
        movements = inventory_manager.get_movement_history(
            variant_id=variant_id,
            location_id=location_id,
            start_date=start_date,
            end_date=end_date,
            movement_type=movement_type,
            limit=limit
        )
        
        # Agrupar por tipo de movimiento
        movement_summary = {}
        for movement in movements:
            mov_type = movement['movement_type']
            if mov_type not in movement_summary:
                movement_summary[mov_type] = {
                    'type': mov_type,
                    'count': 0,
                    'total_quantity_in': 0,
                    'total_quantity_out': 0
                }
            
            movement_summary[mov_type]['count'] += 1
            if movement['quantity_change'] > 0:
                movement_summary[mov_type]['total_quantity_in'] += movement['quantity_change']
            else:
                movement_summary[mov_type]['total_quantity_out'] += abs(movement['quantity_change'])
        
        return {
            'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            'filters': {
                'movement_type': movement_type,
                'location_id': location_id,
                'variant_id': variant_id
            },
            'summary': {
                'total_movements': len(movements),
                'movement_types': len(movement_summary),
                'by_type': list(movement_summary.values())
            },
            'movements': movements
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Movements report error: {str(e)}")

@router.get("/export/sales")
async def export_sales_data(
    start_date: datetime,
    end_date: datetime,
    format: str = Query("json", pattern=r'^(json|csv)$'),
    db: Session = Depends(get_db)
):
    """Exportar datos de ventas"""
    try:
        # Obtener datos de ventas
        sales = db.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.status == 'completed'
        ).all()
        
        if format == "csv":
            # Generar CSV
            import io
            import csv
            from fastapi.responses import StreamingResponse
            
            output = io.StringIO()
            writer = csv.writer(output)
            
            # Headers
            writer.writerow([
                'Sale Number', 'Date', 'Customer Name', 'Customer Phone',
                'Total Amount', 'Payment Method', 'Items Count', 'Cashier'
            ])
            
            # Data rows
            for sale in sales:
                writer.writerow([
                    sale.sale_number,
                    sale.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    sale.customer_name or '',
                    sale.customer_phone or '',
                    sale.total_amount,
                    sale.payment_method,
                    sale.total_items,
                    sale.cashier_id or ''
                ])
            
            output.seek(0)
            
            return StreamingResponse(
                io.BytesIO(output.getvalue().encode()),
                media_type="text/csv",
                headers={"Content-Disposition": f"attachment; filename=sales_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.csv"}
            )
        
        else:
            # JSON format
            sales_data = []
            for sale in sales:
                sales_data.append({
                    'sale_number': sale.sale_number,
                    'date': sale.created_at.isoformat(),
                    'customer_name': sale.customer_name,
                    'customer_phone': sale.customer_phone,
                    'total_amount': sale.total_amount,
                    'payment_method': sale.payment_method,
                    'items_count': sale.total_items,
                    'cashier_id': sale.cashier_id,
                    'items': [
                        {
                            'product_name': item.product_name,
                            'sku': item.product_sku,
                            'size': item.product_size,
                            'color': item.product_color,
                            'quantity': item.quantity,
                            'unit_price': item.unit_price,
                            'total_price': item.total_price
                        }
                        for item in sale.items
                    ]
                })
            
            return {
                'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                'total_sales': len(sales_data),
                'exported_at': datetime.now().isoformat(),
                'data': sales_data
            }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export error: {str(e)}")