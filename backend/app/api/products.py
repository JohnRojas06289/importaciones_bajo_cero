# backend/app/api/products.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.product import ProductSearch, ScanInput, ProductResponse
from ..services.product_handler import ProductCodeHandler
from ..services.cache_service import CacheService
import json

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/scan")
async def scan_product(
    scan_input: ScanInput, 
    db: Session = Depends(get_db)
):
    """Escanear producto por código"""
    # Verificar caché primero
    cache = CacheService()
    cache_key = f"scan:{scan_input.code}"
    cached_result = cache.get(cache_key)
    
    if cached_result:
        return json.loads(cached_result)
    
    # Procesar código
    handler = ProductCodeHandler(db)
    result = handler.process_code(scan_input.code)
    
    # Formatear respuesta
    if result['found']:
        variant = result.get('variant')
        inventory = result.get('inventory')
        
        response = {
            'success': True,
            'product': {
                'id': variant.id,
                'name': variant.product.name,
                'category': variant.product.category,
                'size': variant.size,
                'color': variant.color,
                'price': variant.price,
                'barcode': variant.barcode,
                'short_code': variant.short_code
            },
            'inventory': inventory,
            'scan_type': result['type']
        }
    else:
        response = {
            'success': False,
            'message': 'Producto no encontrado',
            'code': scan_input.code,
            'scan_type': result['type'],
            'suggestions': result.get('suggestions', [])
        }
    
    # Guardar en caché por 5 minutos
    cache.setex(cache_key, 300, json.dumps(response))
    
    return response

@router.get("/search")
async def search_products(
    query: Optional[str] = None,
    category: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    in_stock: bool = True,
    db: Session = Depends(get_db)
):
    """Búsqueda avanzada de productos"""
    # Implementación similar a la anterior
    # ...