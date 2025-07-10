# backend/app/services/product_handler.py
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from ..models.product import Product, ProductVariant
from ..services.inventory_manager import InventoryManager

class ProductCodeHandler:
    """Manejador de códigos de productos"""
    
    def __init__(self, db: Session):
        self.db = db
        self.inventory_manager = InventoryManager(db)
        
        # Patrones para diferentes tipos de códigos
        self.patterns = {
            'barcode': re.compile(r'^(\d{8,13})$'),
            'shortcode': re.compile(r'^([A-Z]{2,3})-(\d{3})-([A-Z]{1,2})-([A-Z]{3,4})$')
        }
        
        # Mapeos de códigos cortos
        self.size_map = {
            'S': 'Small', 'M': 'Medium', 'L': 'Large',
            'XL': 'Extra Large', 'XXL': 'Extra Extra Large'
        }
        
        self.color_map = {
            'NEG': 'Negro', 'BLA': 'Blanco', 'AZU': 'Azul',
            'ROJ': 'Rojo', 'VER': 'Verde', 'GRI': 'Gris',
            'NAR': 'Naranja', 'AMA': 'Amarillo', 'MOR': 'Morado'
        }
    
    def process_code(self, code: str) -> Dict[str, Any]:
        """Procesa cualquier tipo de código"""
        code = code.strip().upper()
        code_type = self._identify_code_type(code)
        
        if code_type == 'barcode':
            return self._handle_barcode(code)
        elif code_type == 'shortcode':
            return self._handle_shortcode(code)
        else:
            return self._handle_flexible_search(code)
    
    def _identify_code_type(self, code: str) -> str:
        """Identifica el tipo de código"""
        if self.patterns['barcode'].match(code):
            return 'barcode'
        elif self.patterns['shortcode'].match(code):
            return 'shortcode'
        else:
            return 'flexible'
    
    def _handle_barcode(self, barcode: str) -> Dict[str, Any]:
        """Maneja búsqueda por código de barras"""
        variant = self.db.query(ProductVariant).filter(
            ProductVariant.barcode == barcode,
            ProductVariant.is_active == True
        ).first()
        
        if variant:
            return {
                'found': True,
                'type': 'barcode',
                'variant': variant,
                'inventory': self.inventory_manager.get_inventory_info(variant.id)
            }
        
        return {'found': False, 'type': 'barcode', 'code': barcode}
    
    def _handle_shortcode(self, code: str) -> Dict[str, Any]:
        """Maneja búsqueda por código corto"""
        match = self.patterns['shortcode'].match(code)
        if not match:
            return {'found': False, 'type': 'shortcode', 'code': code}
        
        category, number, size, color = match.groups()
        
        # Convertir códigos a valores completos
        size_full = self.size_map.get(size, size)
        color_full = self.color_map.get(color, color)
        
        # Buscar producto
        variant = self.db.query(ProductVariant).join(Product).filter(
            Product.category_code == category,
            Product.internal_number == number,
            ProductVariant.size == size_full,
            ProductVariant.color == color_full,
            ProductVariant.is_active == True
        ).first()
        
        if variant:
            return {
                'found': True,
                'type': 'shortcode',
                'variant': variant,
                'inventory': self.inventory_manager.get_inventory_info(variant.id)
            }
        
        # Si no se encuentra, buscar productos similares
        similar = self._find_similar_products(category, number)
        return {
            'found': False,
            'type': 'shortcode',
            'code': code,
            'suggestions': similar
        }
    
    def _handle_flexible_search(self, query: str) -> Dict[str, Any]:
        """Búsqueda flexible en múltiples campos"""
        results = self.db.query(ProductVariant).join(Product).filter(
            (ProductVariant.sku.ilike(f'%{query}%')) |
            (ProductVariant.short_code.ilike(f'%{query}%')) |
            (Product.name.ilike(f'%{query}%')),
            ProductVariant.is_active == True
        ).limit(10).all()
        
        return {
            'found': len(results) > 0,
            'type': 'flexible',
            'variants': results,
            'count': len(results)
        }
    
    def _find_similar_products(self, category: str, number: str) -> List[Dict]:
        """Encuentra productos similares"""
        variants = self.db.query(ProductVariant).join(Product).filter(
            Product.category_code == category,
            Product.internal_number == number,
            ProductVariant.is_active == True
        ).all()
        
        return [
            {
                'variant_id': v.id,
                'size': v.size,
                'color': v.color,
                'available': self.inventory_manager.get_inventory_info(v.id)['total_available']
            }
            for v in variants
        ]