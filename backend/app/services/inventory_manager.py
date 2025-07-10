# backend/app/services/inventory_manager.py
from typing import Dict, List, Optional, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from ..models.inventory import Inventory, Location, InventoryMovement, Reservation
from ..models.product import ProductVariant, Product
from ..services.cache_service import CacheService
import json

class InventoryManager:
    """Gestión centralizada de inventario"""
    
    def __init__(self, db: Session):
        self.db = db
        self.cache = CacheService()
    
    def get_inventory_info(self, variant_id: int) -> Dict[str, Any]:
        """Obtiene información completa de inventario para una variante"""
        # Verificar caché primero
        cache_key = f"inventory_info:{variant_id}"
        cached = self.cache.get(cache_key)
        if cached:
            return json.loads(cached)
        
        # Consultar inventario por ubicaciones
        inventory_items = self.db.query(Inventory).filter(
            Inventory.variant_id == variant_id,
            Inventory.is_active == True
        ).join(Location).all()
        
        # Calcular totales
        total_stock = sum(item.quantity for item in inventory_items)
        total_reserved = sum(item.reserved_quantity for item in inventory_items)
        total_available = total_stock - total_reserved
        
        # Preparar información por ubicación
        locations = []
        for item in inventory_items:
            locations.append({
                'location_id': item.location_id,
                'location_name': item.location.name,
                'location_type': item.location.type,
                'section': item.location.section,
                'quantity': item.quantity,
                'reserved_quantity': item.reserved_quantity,
                'available_quantity': item.available_quantity,
                'needs_restock': item.needs_restock,
                'led_address': item.location.led_address,
                'is_visible_to_customer': item.location.is_visible_to_customer
            })
        
        result = {
            'variant_id': variant_id,
            'total_stock': total_stock,
            'total_reserved': total_reserved,
            'total_available': total_available,
            'locations': locations,
            'in_stock': total_available > 0,
            'low_stock_locations': [loc for loc in locations if loc['needs_restock']],
            'display_locations': [loc for loc in locations if loc['location_type'] == 'display' and loc['quantity'] > 0],
            'storage_locations': [loc for loc in locations if loc['location_type'] == 'storage' and loc['quantity'] > 0]
        }
        
        # Guardar en caché por 5 minutos
        self.cache.setex(cache_key, 300, json.dumps(result))
        return result
    
    def update_stock(self, variant_id: int, location_id: int, quantity_change: int,
                    movement_type: str, reference_id: Optional[int] = None,
                    reference_type: Optional[str] = None, reason: Optional[str] = None,
                    user_id: Optional[str] = None) -> bool:
        """Actualiza el stock y registra el movimiento"""
        try:
            # Obtener el item de inventario
            inventory_item = self.db.query(Inventory).filter(
                Inventory.variant_id == variant_id,
                Inventory.location_id == location_id,
                Inventory.is_active == True
            ).first()
            
            if not inventory_item:
                # Crear nuevo item de inventario si no existe
                inventory_item = Inventory(
                    variant_id=variant_id,
                    location_id=location_id,
                    quantity=0,
                    reserved_quantity=0
                )
                self.db.add(inventory_item)
                self.db.flush()
            
            # Validar que no vaya a quedar en negativo
            new_quantity = inventory_item.quantity + quantity_change
            if new_quantity < 0:
                raise ValueError(f"Insufficient stock. Current: {inventory_item.quantity}, Requested: {abs(quantity_change)}")
            
            # Actualizar la cantidad
            inventory_item.quantity = new_quantity
            
            # Registrar el movimiento
            movement = InventoryMovement(
                inventory_id=inventory_item.id,
                movement_type=movement_type,
                quantity_change=quantity_change,
                reference_id=reference_id,
                reference_type=reference_type,
                reason=reason,
                user_id=user_id
            )
            self.db.add(movement)
            
            # Limpiar caché
            self._clear_inventory_cache(variant_id)
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def reserve_stock(self, variant_id: int, location_id: int, quantity: int,
                     customer_info: Dict[str, str], duration_minutes: int = 30) -> int:
        """Reserva stock por tiempo limitado"""
        try:
            # Verificar disponibilidad
            inventory_item = self.db.query(Inventory).filter(
                Inventory.variant_id == variant_id,
                Inventory.location_id == location_id,
                Inventory.is_active == True
            ).first()
            
            if not inventory_item or inventory_item.available_quantity < quantity:
                raise ValueError("Insufficient available stock for reservation")
            
            # Crear la reserva
            expires_at = datetime.now() + timedelta(minutes=duration_minutes)
            reservation = Reservation(
                inventory_id=inventory_item.id,
                quantity=quantity,
                customer_name=customer_info.get('name'),
                customer_phone=customer_info.get('phone'),
                customer_email=customer_info.get('email'),
                expires_at=expires_at,
                status='active'
            )
            self.db.add(reservation)
            self.db.flush()
            
            # Actualizar cantidad reservada
            inventory_item.reserved_quantity += quantity
            
            # Limpiar caché
            self._clear_inventory_cache(variant_id)
            
            return reservation.id
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def release_reservation(self, reservation_id: int, complete_sale: bool = False) -> bool:
        """Libera una reserva"""
        try:
            reservation = self.db.query(Reservation).filter(
                Reservation.id == reservation_id,
                Reservation.status == 'active'
            ).first()
            
            if not reservation:
                return False
            
            # Actualizar cantidad reservada
            inventory_item = reservation.inventory_item
            inventory_item.reserved_quantity -= reservation.quantity
            
            # Actualizar estado de la reserva
            if complete_sale:
                reservation.status = 'completed'
                reservation.completed_at = datetime.now()
                # También actualizar el stock real
                inventory_item.quantity -= reservation.quantity
                
                # Registrar movimiento de venta
                movement = InventoryMovement(
                    inventory_id=inventory_item.id,
                    movement_type='sale',
                    quantity_change=-reservation.quantity,
                    reference_id=reservation_id,
                    reference_type='reservation',
                    reason='Sale from reservation'
                )
                self.db.add(movement)
            else:
                reservation.status = 'cancelled'
                reservation.cancelled_at = datetime.now()
            
            # Limpiar caché
            self._clear_inventory_cache(inventory_item.variant_id)
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def transfer_stock(self, variant_id: int, from_location_id: int, to_location_id: int,
                      quantity: int, reason: str, user_id: Optional[str] = None) -> bool:
        """Transfiere stock entre ubicaciones"""
        try:
            # Reducir stock en ubicación origen
            self.update_stock(
                variant_id=variant_id,
                location_id=from_location_id,
                quantity_change=-quantity,
                movement_type='transfer',
                reason=f"Transfer to location {to_location_id}: {reason}",
                user_id=user_id
            )
            
            # Aumentar stock en ubicación destino
            self.update_stock(
                variant_id=variant_id,
                location_id=to_location_id,
                quantity_change=quantity,
                movement_type='transfer',
                reason=f"Transfer from location {from_location_id}: {reason}",
                user_id=user_id
            )
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def adjust_stock(self, inventory_id: int, new_quantity: int, reason: str,
                    user_id: Optional[str] = None) -> bool:
        """Ajusta el stock a una cantidad específica"""
        try:
            inventory_item = self.db.query(Inventory).get(inventory_id)
            if not inventory_item:
                raise ValueError("Inventory item not found")
            
            current_quantity = inventory_item.quantity
            quantity_change = new_quantity - current_quantity
            
            if quantity_change == 0:
                return True
            
            # Actualizar cantidad
            inventory_item.quantity = new_quantity
            inventory_item.needs_recount = False
            
            # Registrar movimiento
            movement = InventoryMovement(
                inventory_id=inventory_id,
                movement_type='adjustment',
                quantity_change=quantity_change,
                reason=reason,
                user_id=user_id
            )
            self.db.add(movement)
            
            # Limpiar caché
            self._clear_inventory_cache(inventory_item.variant_id)
            
            return True
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def get_low_stock_alerts(self, location_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """Obtiene alertas de stock bajo"""
        query = self.db.query(Inventory).join(ProductVariant).join(Product).join(Location).filter(
            Inventory.quantity <= Inventory.min_stock,
            Inventory.is_active == True,
            ProductVariant.is_active == True
        )
        
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        low_stock_items = query.all()
        
        alerts = []
        for item in low_stock_items:
            alerts.append({
                'inventory_id': item.id,
                'variant_id': item.variant_id,
                'product_name': item.variant.product.name,
                'sku': item.variant.sku,
                'size': item.variant.size,
                'color': item.variant.color,
                'location_name': item.location.name,
                'current_quantity': item.quantity,
                'min_stock': item.min_stock,
                'recommended_order': max(item.max_stock - item.quantity, item.min_stock * 2),
                'alert_level': 'critical' if item.quantity == 0 else 'warning'
            })
        
        return alerts
    
    def get_movement_history(self, variant_id: Optional[int] = None,
                           location_id: Optional[int] = None,
                           start_date: Optional[datetime] = None,
                           end_date: Optional[datetime] = None,
                           movement_type: Optional[str] = None,
                           limit: int = 100) -> List[Dict[str, Any]]:
        """Obtiene historial de movimientos"""
        query = self.db.query(InventoryMovement).join(Inventory)
        
        if variant_id:
            query = query.filter(Inventory.variant_id == variant_id)
        
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        if start_date:
            query = query.filter(InventoryMovement.created_at >= start_date)
        
        if end_date:
            query = query.filter(InventoryMovement.created_at <= end_date)
        
        if movement_type:
            query = query.filter(InventoryMovement.movement_type == movement_type)
        
        movements = query.order_by(InventoryMovement.created_at.desc()).limit(limit).all()
        
        result = []
        for movement in movements:
            result.append({
                'id': movement.id,
                'movement_type': movement.movement_type,
                'quantity_change': movement.quantity_change,
                'reason': movement.reason,
                'user_id': movement.user_id,
                'created_at': movement.created_at,
                'variant_id': movement.inventory_item.variant_id,
                'location_id': movement.inventory_item.location_id,
                'reference_id': movement.reference_id,
                'reference_type': movement.reference_type
            })
        
        return result
    
    def cleanup_expired_reservations(self) -> int:
        """Limpia reservas expiradas automáticamente"""
        try:
            expired_reservations = self.db.query(Reservation).filter(
                Reservation.status == 'active',
                Reservation.expires_at <= datetime.now()
            ).all()
            
            count = 0
            for reservation in expired_reservations:
                # Liberar cantidad reservada
                inventory_item = reservation.inventory_item
                inventory_item.reserved_quantity -= reservation.quantity
                
                # Marcar como expirada
                reservation.status = 'expired'
                
                # Limpiar caché
                self._clear_inventory_cache(inventory_item.variant_id)
                
                count += 1
            
            if count > 0:
                self.db.commit()
            
            return count
            
        except Exception as e:
            self.db.rollback()
            raise e
    
    def get_stock_value_report(self, location_id: Optional[int] = None) -> Dict[str, Any]:
        """Genera reporte de valor de inventario"""
        query = self.db.query(
            func.sum(Inventory.quantity * ProductVariant.cost).label('total_cost_value'),
            func.sum(Inventory.quantity * ProductVariant.price).label('total_retail_value'),
            func.count(Inventory.id).label('total_items'),
            func.sum(Inventory.quantity).label('total_units')
        ).join(ProductVariant).filter(
            Inventory.is_active == True,
            ProductVariant.is_active == True
        )
        
        if location_id:
            query = query.filter(Inventory.location_id == location_id)
        
        result = query.first()
        
        return {
            'total_cost_value': float(result.total_cost_value or 0),
            'total_retail_value': float(result.total_retail_value or 0),
            'potential_profit': float((result.total_retail_value or 0) - (result.total_cost_value or 0)),
            'total_items': result.total_items or 0,
            'total_units': result.total_units or 0,
            'average_cost_per_unit': float((result.total_cost_value or 0) / (result.total_units or 1)),
            'average_price_per_unit': float((result.total_retail_value or 0) / (result.total_units or 1))
        }
    
    def _clear_inventory_cache(self, variant_id: int):
        """Limpia el caché relacionado con inventario"""
        cache_keys = [
            f"inventory_info:{variant_id}",
            f"scan:{variant_id}",
            "inventory_alerts",
            "inventory_summary"
        ]
        
        for key in cache_keys:
            self.cache.delete(key)
    
    def find_product_locations(self, variant_id: int, customer_visible_only: bool = True) -> List[Dict[str, Any]]:
        """Encuentra todas las ubicaciones donde está disponible un producto"""
        query = self.db.query(Inventory).join(Location).filter(
            Inventory.variant_id == variant_id,
            Inventory.quantity > 0,
            Inventory.is_active == True,
            Location.is_active == True
        )
        
        if customer_visible_only:
            query = query.filter(Location.is_visible_to_customer == True)
        
        inventory_items = query.all()
        
        locations = []
        for item in inventory_items:
            locations.append({
                'location_id': item.location_id,
                'location_name': item.location.name,
                'location_type': item.location.type,
                'section': item.location.section,
                'shelf_code': item.location.shelf_code,
                'available_quantity': item.available_quantity,
                'led_address': item.location.led_address,
                'led_enabled': item.location.led_enabled,
                'priority': 1 if item.location.type == 'display' else 2  # Display locations first
            })
        
        # Ordenar por prioridad (display primero) y luego por cantidad disponible
        locations.sort(key=lambda x: (x['priority'], -x['available_quantity']))
        
        return locations