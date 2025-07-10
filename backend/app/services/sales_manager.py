# backend/app/services/sales_manager.py
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc
from datetime import datetime, timedelta
from decimal import Decimal
from ..models.sale import Sale, SaleItem, Payment, Refund, RefundItem
from ..models.product import ProductVariant, Product
from ..models.inventory import Inventory, Location
from ..services.inventory_manager import InventoryManager
from ..services.cache_service import CacheService
import json

class SalesManager:
    """Gestión centralizada de ventas"""
    
    def __init__(self, db: Session):
        self.db = db
        self.inventory_manager = InventoryManager(db)
        self.cache = CacheService()
    
    def create_sale(self, sale_data: Dict[str, Any], items_data: List[Dict[str, Any]], 
                   payments_data: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Crea una nueva venta completa"""
        try:
            # Generar número de venta
            sale_number = self._generate_sale_number()
            
            # Validar stock disponible para todos los items
            stock_validation = self._validate_stock_availability(items_data)
            if not stock_validation['success']:
                return stock_validation
            
            # Crear la venta
            sale = Sale(
                sale_number=sale_number,
                customer_name=sale_data.get('customer_name'),
                customer_phone=sale_data.get('customer_phone'),
                customer_email=sale_data.get('customer_email'),
                customer_document=sale_data.get('customer_document'),
                discount_percentage=sale_data.get('discount_percentage', 0),
                discount_amount=sale_data.get('discount_amount', 0),
                payment_method=sale_data.get('payment_method', 'cash'),
                notes=sale_data.get('notes'),
                cashier_id=sale_data.get('cashier_id'),
                pos_terminal=sale_data.get('pos_terminal'),
                status='pending'
            )
            
            self.db.add(sale)
            self.db.flush()  # Para obtener el ID
            
            # Crear items de venta
            subtotal = 0
            total_cost = 0
            
            for item_data in items_data:
                variant = self.db.query(ProductVariant).get(item_data['variant_id'])
                if not variant:
                    raise ValueError(f"Product variant {item_data['variant_id']} not found")
                
                # Precio unitario (usar el actual del producto si no se especifica)
                unit_price = item_data.get('unit_price', variant.price)
                unit_cost = variant.cost
                quantity = item_data['quantity']
                discount_amount = item_data.get('discount_amount', 0)
                
                total_price = (unit_price * quantity) - discount_amount
                
                sale_item = SaleItem(
                    sale_id=sale.id,
                    variant_id=variant.id,
                    quantity=quantity,
                    unit_price=unit_price,
                    unit_cost=unit_cost,
                    discount_amount=discount_amount,
                    total_price=total_price,
                    product_name=variant.product.name,
                    product_sku=variant.sku,
                    product_size=variant.size,
                    product_color=variant.color
                )
                
                self.db.add(sale_item)
                subtotal += total_price
                total_cost += unit_cost * quantity
            
            # Calcular totales
            total_discount = sale.discount_amount
            if sale.discount_percentage > 0:
                total_discount += (subtotal * sale.discount_percentage / 100)
            
            tax_amount = 0  # Configurar según normativa colombiana si es necesario
            total_amount = subtotal - total_discount + tax_amount
            
            # Actualizar totales de la venta
            sale.subtotal = subtotal
            sale.discount_amount = total_discount
            sale.tax_amount = tax_amount
            sale.total_amount = total_amount
            
            # Procesar pagos
            if payments_data:
                total_paid = 0
                for payment_data in payments_data:
                    payment = Payment(
                        sale_id=sale.id,
                        payment_method=payment_data['payment_method'],
                        amount=payment_data['amount'],
                        reference=payment_data.get('reference'),
                        card_type=payment_data.get('card_type'),
                        card_last_digits=payment_data.get('card_last_digits'),
                        authorization_code=payment_data.get('authorization_code'),
                        bank_name=payment_data.get('bank_name'),
                        account_reference=payment_data.get('account_reference'),
                        status='completed'
                    )
                    self.db.add(payment)
                    total_paid += payment.amount
                
                # Verificar que el pago sea suficiente
                if total_paid < total_amount:
                    sale.payment_status = 'partial'
                elif total_paid >= total_amount:
                    sale.payment_status = 'paid'
            else:
                # Pago único del tipo especificado
                payment = Payment(
                    sale_id=sale.id,
                    payment_method=sale.payment_method,
                    amount=total_amount,
                    status='completed'
                )
                self.db.add(payment)
                sale.payment_status = 'paid'
            
            # Actualizar inventario
            self._update_inventory_for_sale(sale.id, items_data)
            
            # Marcar venta como completada
            sale.status = 'completed'
            sale.completed_at = datetime.now()
            
            self.db.commit()
            
            # Limpiar caché relacionado
            self._clear_sales_cache()
            
            return {
                'success': True,
                'sale_id': sale.id,
                'sale_number': sale.sale_number,
                'total_amount': total_amount,
                'message': 'Sale created successfully'
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                'success': False,
                'message': f'Error creating sale: {str(e)}'
            }
    
    def quick_sale(self, variant_id: int, quantity: int = 1, 
                  payment_method: str = 'cash', **kwargs) -> Dict[str, Any]:
        """Crea venta rápida de un solo producto"""
        variant = self.db.query(ProductVariant).get(variant_id)
        if not variant:
            return {
                'success': False,
                'message': 'Product not found'
            }
        
        sale_data = {
            'payment_method': payment_method,
            'customer_phone': kwargs.get('customer_phone'),
            'discount_amount': kwargs.get('discount_amount', 0),
            'cashier_id': kwargs.get('cashier_id'),
            'pos_terminal': kwargs.get('pos_terminal', 'tablet-1')
        }
        
        items_data = [{
            'variant_id': variant_id,
            'quantity': quantity,
            'unit_price': variant.price,
            'discount_amount': kwargs.get('discount_amount', 0)
        }]
        
        return self.create_sale(sale_data, items_data)
    
    def cancel_sale(self, sale_id: int, reason: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Cancela una venta y restaura el inventario"""
        try:
            sale = self.db.query(Sale).get(sale_id)
            if not sale:
                return {'success': False, 'message': 'Sale not found'}
            
            if sale.status == 'cancelled':
                return {'success': False, 'message': 'Sale already cancelled'}
            
            if sale.status == 'refunded':
                return {'success': False, 'message': 'Cannot cancel refunded sale'}
            
            # Restaurar inventario
            for item in sale.items:
                # Buscar la mejor ubicación para devolver el stock
                locations = self.inventory_manager.find_product_locations(
                    item.variant_id, customer_visible_only=False
                )
                
                if locations:
                    # Devolver a la primera ubicación disponible
                    location_id = locations[0]['location_id']
                else:
                    # Si no hay ubicaciones, usar una ubicación por defecto o crear una
                    default_location = self.db.query(Location).filter(
                        Location.type == 'storage'
                    ).first()
                    location_id = default_location.id if default_location else 1
                
                # Actualizar inventario
                self.inventory_manager.update_stock(
                    variant_id=item.variant_id,
                    location_id=location_id,
                    quantity_change=item.quantity,
                    movement_type='return',
                    reference_id=sale.id,
                    reference_type='sale_cancellation',
                    reason=f'Sale cancellation: {reason}',
                    user_id=user_id
                )
            
            # Actualizar estado de la venta
            sale.status = 'cancelled'
            sale.cancelled_at = datetime.now()
            if reason:
                sale.notes = f"{sale.notes or ''}\nCancelled: {reason}".strip()
            
            self.db.commit()
            
            # Limpiar caché
            self._clear_sales_cache()
            
            return {
                'success': True,
                'message': 'Sale cancelled successfully'
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                'success': False,
                'message': f'Error cancelling sale: {str(e)}'
            }
    
    def create_refund(self, refund_data: Dict[str, Any], 
                     refund_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Crea una devolución parcial o total"""
        try:
            sale = self.db.query(Sale).get(refund_data['sale_id'])
            if not sale:
                return {'success': False, 'message': 'Sale not found'}
            
            if sale.status not in ['completed']:
                return {'success': False, 'message': 'Can only refund completed sales'}
            
            # Generar número de devolución
            refund_number = self._generate_refund_number()
            
            # Crear devolución
            refund = Refund(
                sale_id=sale.id,
                refund_number=refund_number,
                reason=refund_data['reason'],
                refund_method=refund_data.get('refund_method', 'original_method'),
                notes=refund_data.get('notes'),
                processed_by=refund_data.get('processed_by'),
                status='completed'
            )
            
            self.db.add(refund)
            self.db.flush()
            
            # Procesar items devueltos
            total_refund_amount = 0
            
            for item_data in refund_items:
                sale_item = self.db.query(SaleItem).get(item_data['sale_item_id'])
                if not sale_item or sale_item.sale_id != sale.id:
                    raise ValueError(f"Invalid sale item {item_data['sale_item_id']}")
                
                quantity_refunded = item_data['quantity_refunded']
                if quantity_refunded > sale_item.quantity:
                    raise ValueError(f"Cannot refund more than sold quantity")
                
                unit_refund_amount = item_data.get('unit_refund_amount', sale_item.unit_price)
                total_item_refund = unit_refund_amount * quantity_refunded
                
                # Crear item de devolución
                refund_item = RefundItem(
                    refund_id=refund.id,
                    sale_item_id=sale_item.id,
                    quantity_refunded=quantity_refunded,
                    unit_refund_amount=unit_refund_amount,
                    total_refund_amount=total_item_refund,
                    condition=item_data.get('condition', 'good'),
                    return_to_inventory=item_data.get('return_to_inventory', True)
                )
                
                self.db.add(refund_item)
                total_refund_amount += total_item_refund
                
                # Restaurar inventario si está en buenas condiciones
                if refund_item.return_to_inventory:
                    # Buscar ubicación apropiada
                    locations = self.inventory_manager.find_product_locations(
                        sale_item.variant_id, customer_visible_only=False
                    )
                    
                    if locations:
                        location_id = locations[0]['location_id']
                    else:
                        # Ubicación por defecto
                        default_location = self.db.query(Location).filter(
                            Location.type == 'storage'
                        ).first()
                        location_id = default_location.id if default_location else 1
                    
                    self.inventory_manager.update_stock(
                        variant_id=sale_item.variant_id,
                        location_id=location_id,
                        quantity_change=quantity_refunded,
                        movement_type='return',
                        reference_id=refund.id,
                        reference_type='refund',
                        reason=f'Refund: {refund.reason}',
                        user_id=refund.processed_by
                    )
            
            # Actualizar total de devolución
            refund.refund_amount = total_refund_amount
            
            self.db.commit()
            
            # Limpiar caché
            self._clear_sales_cache()
            
            return {
                'success': True,
                'refund_id': refund.id,
                'refund_number': refund.refund_number,
                'refund_amount': total_refund_amount,
                'message': 'Refund processed successfully'
            }
            
        except Exception as e:
            self.db.rollback()
            return {
                'success': False,
                'message': f'Error processing refund: {str(e)}'
            }
    
    def get_daily_sales_summary(self, date: Optional[datetime] = None) -> Dict[str, Any]:
        """Obtiene resumen de ventas diarias"""
        if not date:
            date = datetime.now()
        
        date_str = date.strftime('%Y-%m-%d')
        
        # Verificar caché
        cached = self.cache.get_cached_daily_stats(date_str)
        if cached:
            return cached
        
        # Calcular estadísticas
        start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = start_date + timedelta(days=1)
        
        # Consulta base para ventas del día
        sales_query = self.db.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at < end_date,
            Sale.status == 'completed'
        )
        
        # Estadísticas básicas
        sales = sales_query.all()
        total_sales = len(sales)
        total_revenue = sum(sale.total_amount for sale in sales)
        total_items_sold = sum(sale.total_items for sale in sales)
        total_profit = sum(sale.profit for sale in sales)
        
        # Promedio por venta
        avg_sale_amount = total_revenue / total_sales if total_sales > 0 else 0
        
        # Ventas por hora
        hourly_sales = {}
        for hour in range(24):
            hourly_sales[f"{hour:02d}:00"] = 0
        
        for sale in sales:
            hour_key = f"{sale.created_at.hour:02d}:00"
            hourly_sales[hour_key] += sale.total_amount
        
        # Métodos de pago
        payment_methods = {}
        for sale in sales:
            method = sale.payment_method
            if method not in payment_methods:
                payment_methods[method] = {'count': 0, 'amount': 0}
            payment_methods[method]['count'] += 1
            payment_methods[method]['amount'] += sale.total_amount
        
        # Productos más vendidos
        product_sales = {}
        for sale in sales:
            for item in sale.items:
                key = f"{item.product_name} - {item.product_size} - {item.product_color}"
                if key not in product_sales:
                    product_sales[key] = {
                        'name': item.product_name,
                        'sku': item.product_sku,
                        'size': item.product_size,
                        'color': item.product_color,
                        'quantity': 0,
                        'revenue': 0
                    }
                product_sales[key]['quantity'] += item.quantity
                product_sales[key]['revenue'] += item.total_price
        
        # Ordenar productos por cantidad vendida
        top_products = sorted(
            product_sales.values(),
            key=lambda x: x['quantity'],
            reverse=True
        )[:10]
        
        summary = {
            'date': date_str,
            'total_sales': total_sales,
            'total_revenue': round(total_revenue, 2),
            'total_profit': round(total_profit, 2),
            'total_items_sold': total_items_sold,
            'avg_sale_amount': round(avg_sale_amount, 2),
            'profit_margin': round((total_profit / total_revenue * 100) if total_revenue > 0 else 0, 2),
            'hourly_sales': hourly_sales,
            'payment_methods': payment_methods,
            'top_products': top_products,
            'generated_at': datetime.now().isoformat()
        }
        
        # Cachear por 1 hora (o hasta el final del día si es el día actual)
        cache_expire = 3600
        if date.date() == datetime.now().date():
            # Para el día actual, cachear por menos tiempo
            cache_expire = 300  # 5 minutos
        
        self.cache.cache_daily_stats(date_str, summary)
        
        return summary
    
    def get_sales_report(self, start_date: datetime, end_date: datetime,
                        group_by: str = 'day', **filters) -> Dict[str, Any]:
        """Genera reporte de ventas personalizado"""
        
        # Consulta base
        query = self.db.query(Sale).filter(
            Sale.created_at >= start_date,
            Sale.created_at <= end_date,
            Sale.status == 'completed'
        )
        
        # Aplicar filtros adicionales
        if filters.get('cashier_id'):
            query = query.filter(Sale.cashier_id == filters['cashier_id'])
        
        if filters.get('payment_method'):
            query = query.filter(Sale.payment_method == filters['payment_method'])
        
        if filters.get('min_amount'):
            query = query.filter(Sale.total_amount >= filters['min_amount'])
        
        if filters.get('max_amount'):
            query = query.filter(Sale.total_amount <= filters['max_amount'])
        
        sales = query.all()
        
        # Agrupar datos según el parámetro group_by
        grouped_data = self._group_sales_data(sales, group_by)
        
        # Calcular métricas generales
        total_sales = len(sales)
        total_revenue = sum(sale.total_amount for sale in sales)
        total_profit = sum(sale.profit for sale in sales)
        total_items = sum(sale.total_items for sale in sales)
        
        return {
            'period': f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            'group_by': group_by,
            'summary': {
                'total_sales': total_sales,
                'total_revenue': round(total_revenue, 2),
                'total_profit': round(total_profit, 2),
                'total_items': total_items,
                'avg_sale_amount': round(total_revenue / total_sales if total_sales > 0 else 0, 2),
                'profit_margin': round((total_profit / total_revenue * 100) if total_revenue > 0 else 0, 2)
            },
            'grouped_data': grouped_data,
            'filters_applied': filters
        }
    
    def _validate_stock_availability(self, items_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Valida que hay stock suficiente para todos los items"""
        insufficient_stock = []
        
        for item_data in items_data:
            variant_id = item_data['variant_id']
            quantity_needed = item_data['quantity']
            
            inventory_info = self.inventory_manager.get_inventory_info(variant_id)
            
            if inventory_info['total_available'] < quantity_needed:
                variant = self.db.query(ProductVariant).get(variant_id)
                insufficient_stock.append({
                    'variant_id': variant_id,
                    'product_name': variant.product.name if variant else 'Unknown',
                    'sku': variant.sku if variant else 'Unknown',
                    'requested': quantity_needed,
                    'available': inventory_info['total_available']
                })
        
        if insufficient_stock:
            return {
                'success': False,
                'message': 'Insufficient stock for some items',
                'insufficient_items': insufficient_stock
            }
        
        return {'success': True}
    
    def _update_inventory_for_sale(self, sale_id: int, items_data: List[Dict[str, Any]]):
        """Actualiza el inventario después de una venta"""
        for item_data in items_data:
            variant_id = item_data['variant_id']
            quantity_sold = item_data['quantity']
            
            # Obtener ubicaciones con stock disponible
            locations = self.inventory_manager.find_product_locations(variant_id)
            
            remaining_to_deduct = quantity_sold
            
            # Deducir de las ubicaciones en orden de prioridad
            for location in locations:
                if remaining_to_deduct <= 0:
                    break
                
                location_id = location['location_id']
                available_in_location = location['available_quantity']
                
                # Calcular cuánto deducir de esta ubicación
                to_deduct = min(remaining_to_deduct, available_in_location)
                
                if to_deduct > 0:
                    self.inventory_manager.update_stock(
                        variant_id=variant_id,
                        location_id=location_id,
                        quantity_change=-to_deduct,
                        movement_type='sale',
                        reference_id=sale_id,
                        reference_type='sale',
                        reason='Sale transaction'
                    )
                    
                    remaining_to_deduct -= to_deduct
            
            if remaining_to_deduct > 0:
                raise ValueError(f"Could not fulfill complete quantity for variant {variant_id}")
    
    def _generate_sale_number(self) -> str:
        """Genera número único de venta"""
        today = datetime.now()
        date_prefix = today.strftime('%Y%m%d')
        
        # Contar ventas del día
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        count = self.db.query(Sale).filter(
            Sale.created_at >= start_of_day,
            Sale.created_at < end_of_day
        ).count()
        
        return f"V-{date_prefix}-{count + 1:04d}"
    
    def _generate_refund_number(self) -> str:
        """Genera número único de devolución"""
        today = datetime.now()
        date_prefix = today.strftime('%Y%m%d')
        
        # Contar devoluciones del día
        start_of_day = today.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        
        count = self.db.query(Refund).filter(
            Refund.created_at >= start_of_day,
            Refund.created_at < end_of_day
        ).count()
        
        return f"D-{date_prefix}-{count + 1:04d}"
    
    def _group_sales_data(self, sales: List[Sale], group_by: str) -> Dict[str, Any]:
        """Agrupa datos de ventas según el criterio especificado"""
        grouped = {}
        
        for sale in sales:
            if group_by == 'hour':
                key = sale.created_at.strftime('%Y-%m-%d %H:00')
            elif group_by == 'day':
                key = sale.created_at.strftime('%Y-%m-%d')
            elif group_by == 'week':
                # Obtener el lunes de la semana
                monday = sale.created_at - timedelta(days=sale.created_at.weekday())
                key = monday.strftime('%Y-%m-%d')
            elif group_by == 'month':
                key = sale.created_at.strftime('%Y-%m')
            else:
                key = sale.created_at.strftime('%Y-%m-%d')
            
            if key not in grouped:
                grouped[key] = {
                    'period': key,
                    'sales_count': 0,
                    'total_revenue': 0,
                    'total_profit': 0,
                    'total_items': 0
                }
            
            grouped[key]['sales_count'] += 1
            grouped[key]['total_revenue'] += sale.total_amount
            grouped[key]['total_profit'] += sale.profit
            grouped[key]['total_items'] += sale.total_items
        
        # Convertir a lista ordenada
        return sorted(grouped.values(), key=lambda x: x['period'])
    
    def _clear_sales_cache(self):
        """Limpia caché relacionado con ventas"""
        self.cache.delete_pattern("daily_stats:*")
        self.cache.delete_pattern("sales_report:*")
        self.cache.delete("current_metrics")