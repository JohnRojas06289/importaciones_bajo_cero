# backend/app/api/products.py - VERSIÓN CORREGIDA
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..schemas.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    ScanInput, ProductScanResponse, QuickSearchResponse,
    ProductSearchFilters, ProductSearchResult, ShortCodeValidation
)
from ..services.product_handler import ProductCodeHandler
from ..services.inventory_manager import InventoryManager
from ..services.cache_service import CacheService
from ..models.product import Product, ProductVariant
from ..models.inventory import Inventory, Location
from sqlalchemy import or_, and_, func
import json
import time

router = APIRouter(prefix="/products", tags=["products"])

@router.post("/scan", response_model=ProductScanResponse)
async def scan_product(scan_input: ScanInput, db: Session = Depends(get_db)):
    """Escanear producto por código de barras o código corto"""
    start_time = time.time()
    
    try:
        cache = CacheService()
        handler = ProductCodeHandler(db)
        
        # Verificar caché primero
        cached_result = cache.get_cached_scan(scan_input.code)
        if cached_result:
            return cached_result
        
        # Procesar código
        result = handler.process_code(scan_input.code)
        
        if result['found']:
            if result['type'] == 'flexible' and result.get('count', 0) > 1:
                # Múltiples resultados
                response = ProductScanResponse(
                    success=True,
                    scan_type=result['type'],
                    suggestions=[
                        _format_variant_for_response(v, db) 
                        for v in result['variants'][:5]
                    ]
                )
            else:
                # Resultado único
                variant = result.get('variant') or result.get('variants', [None])[0]
                if variant:
                    product_result = _format_variant_for_response(variant, db)
                    response = ProductScanResponse(
                        success=True,
                        scan_type=result['type'],
                        product=product_result
                    )
                else:
                    response = ProductScanResponse(
                        success=False,
                        scan_type=result['type'],
                        message="Product data not found"
                    )
        else:
            # No encontrado
            suggestions = []
            if result.get('suggestions'):
                suggestions = [
                    _format_suggestion(s) for s in result['suggestions']
                ]
            
            response = ProductScanResponse(
                success=False,
                scan_type=result['type'],
                message="Product not found",
                suggestions=suggestions
            )
        
        # Guardar en caché por 5 minutos
        cache.cache_product_scan(scan_input.code, response.dict())
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan error: {str(e)}")

@router.get("/search", response_model=QuickSearchResponse)
async def search_products(
    query: Optional[str] = Query(None, min_length=1),
    category: Optional[str] = None,
    brand: Optional[str] = None,
    size: Optional[str] = None,
    color: Optional[str] = None,
    gender: Optional[str] = None,
    season: Optional[str] = None,
    in_stock: bool = True,
    is_active: bool = True,
    is_featured: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    location_id: Optional[int] = None,
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db)
):
    """Búsqueda avanzada de productos"""
    start_time = time.time()
    
    try:
        # Crear filtros
        filters = ProductSearchFilters(
            query=query,
            category=category,
            brand=brand,
            size=size,
            color=color,
            gender=gender,
            season=season,
            in_stock=in_stock,
            is_active=is_active,
            is_featured=is_featured,
            min_price=min_price,
            max_price=max_price,
            location_id=location_id
        )
        
        # Verificar caché
        cache = CacheService()
        cached_result = cache.get_cached_search(query or "", filters.dict())
        if cached_result:
            search_time = (time.time() - start_time) * 1000
            cached_result['search_time_ms'] = search_time
            return QuickSearchResponse(**cached_result)
        
        # Construir consulta
        query_builder = db.query(ProductVariant).join(Product)
        
        if in_stock:
            query_builder = query_builder.join(Inventory).filter(
                Inventory.quantity > 0,
                Inventory.is_active == True
            )
        
        if location_id:
            query_builder = query_builder.filter(Inventory.location_id == location_id)
        
        # Aplicar filtros
        if query:
            search_terms = query.strip().split()
            conditions = []
            for term in search_terms:
                term_condition = or_(
                    Product.name.ilike(f'%{term}%'),
                    ProductVariant.sku.ilike(f'%{term}%'),
                    ProductVariant.short_code.ilike(f'%{term}%'),
                    ProductVariant.barcode.ilike(f'%{term}%'),
                    Product.brand.ilike(f'%{term}%'),
                    ProductVariant.color.ilike(f'%{term}%'),
                    ProductVariant.size.ilike(f'%{term}%')
                )
                conditions.append(term_condition)
            
            if conditions:
                query_builder = query_builder.filter(and_(*conditions))
        
        if category:
            query_builder = query_builder.filter(Product.category.ilike(f'%{category}%'))
        
        if brand:
            query_builder = query_builder.filter(Product.brand.ilike(f'%{brand}%'))
        
        if size:
            query_builder = query_builder.filter(ProductVariant.size.ilike(f'%{size}%'))
        
        if color:
            query_builder = query_builder.filter(ProductVariant.color.ilike(f'%{color}%'))
        
        if gender:
            query_builder = query_builder.filter(Product.gender.ilike(f'%{gender}%'))
        
        if season:
            query_builder = query_builder.filter(Product.season.ilike(f'%{season}%'))
        
        if is_active:
            query_builder = query_builder.filter(
                ProductVariant.is_active == True,
                Product.is_active == True
            )
        
        if is_featured is not None:
            query_builder = query_builder.filter(ProductVariant.is_featured == is_featured)
        
        if min_price:
            query_builder = query_builder.filter(ProductVariant.price >= min_price)
        
        if max_price:
            query_builder = query_builder.filter(ProductVariant.price <= max_price)
        
        # Obtener resultados
        variants = query_builder.distinct().limit(limit).all()
        
        # Formatear resultados - AQUÍ ESTÁ LA CORRECCIÓN PRINCIPAL
        results = []
        for variant in variants:
            # Convertir el objeto a diccionario
            result_dict = _format_variant_for_response(variant, db)
            results.append(result_dict)
        
        # Generar filtros sugeridos basados en los resultados
        suggested_filters = _generate_suggested_filters(variants)
        
        search_time = (time.time() - start_time) * 1000
        
        response_data = {
            'query': query or "",
            'total_results': len(results),
            'results': results,
            'search_time_ms': round(search_time, 2),
            'suggested_filters': suggested_filters
        }
        
        # Cachear resultados por 3 minutos
        cache.cache_search_results(query or "", filters.dict(), results, 180)
        
        return QuickSearchResponse(**response_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@router.get("/quick-search/{search_term}")
async def ultra_fast_search(
    search_term: str,
    limit: int = Query(10, le=20),
    db: Session = Depends(get_db)
):
    """Búsqueda ultra rápida para autocompletado"""
    try:
        # Búsqueda optimizada en campos principales
        variants = db.query(ProductVariant).join(Product).filter(
            or_(
                ProductVariant.sku.ilike(f'{search_term}%'),
                ProductVariant.short_code.ilike(f'{search_term}%'),
                ProductVariant.barcode.ilike(f'{search_term}%'),
                Product.name.ilike(f'%{search_term}%')
            ),
            ProductVariant.is_active == True,
            Product.is_active == True
        ).limit(limit).all()
        
        results = []
        inventory_manager = InventoryManager(db)
        
        for variant in variants:
            inventory_info = inventory_manager.get_inventory_info(variant.id)
            
            results.append({
                'variant_id': variant.id,
                'product_name': variant.product.name,
                'sku': variant.sku,
                'short_code': variant.short_code,
                'barcode': variant.barcode,
                'size': variant.size,
                'color': variant.color,
                'price': float(variant.price),
                'available_stock': inventory_info['total_available'],
                'display_text': f"{variant.product.name} - {variant.size} - {variant.color}"
            })
        
        return {
            'term': search_term,
            'results': results,
            'count': len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quick search error: {str(e)}")

@router.get("/validate-code/{code}")
async def validate_short_code(code: str, db: Session = Depends(get_db)):
    """Valida formato de código corto"""
    try:
        handler = ProductCodeHandler(db)
        validation = handler.validate_short_code_format(code)
        
        return ShortCodeValidation(**validation)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Validation error: {str(e)}")

@router.get("/{variant_id}/locations")
async def get_product_locations(
    variant_id: int,
    customer_visible_only: bool = True,
    db: Session = Depends(get_db)
):
    """Obtiene todas las ubicaciones donde está disponible un producto"""
    try:
        inventory_manager = InventoryManager(db)
        locations = inventory_manager.find_product_locations(variant_id, customer_visible_only)
        
        if not locations:
            raise HTTPException(status_code=404, detail="Product not found in any location")
        
        return {
            'variant_id': variant_id,
            'total_locations': len(locations),
            'locations': locations
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location search error: {str(e)}")

@router.get("/{variant_id}/alternatives")
async def get_product_alternatives(
    variant_id: int,
    limit: int = Query(10, le=20),
    db: Session = Depends(get_db)
):
    """Obtiene productos alternativos/similares"""
    try:
        variant = db.query(ProductVariant).get(variant_id)
        if not variant:
            raise HTTPException(status_code=404, detail="Product variant not found")
        
        # Buscar variantes del mismo producto
        same_product_variants = db.query(ProductVariant).filter(
            ProductVariant.product_id == variant.product_id,
            ProductVariant.id != variant_id,
            ProductVariant.is_active == True
        ).all()
        
        # Buscar productos similares de la misma categoría
        similar_products = db.query(ProductVariant).join(Product).filter(
            Product.category == variant.product.category,
            Product.id != variant.product_id,
            ProductVariant.is_active == True,
            Product.is_active == True
        ).limit(limit).all()
        
        alternatives = []
        inventory_manager = InventoryManager(db)
        
        # Agregar variantes del mismo producto primero
        for alt_variant in same_product_variants:
            inventory_info = inventory_manager.get_inventory_info(alt_variant.id)
            
            alternatives.append({
                'variant_id': alt_variant.id,
                'product_name': alt_variant.product.name,
                'sku': alt_variant.sku,
                'size': alt_variant.size,
                'color': alt_variant.color,
                'price': float(alt_variant.price),
                'available_stock': inventory_info['total_available'],
                'similarity_reason': 'same_product',
                'priority': 1
            })
        
        # Agregar productos similares
        for alt_variant in similar_products:
            if len(alternatives) >= limit:
                break
                
            inventory_info = inventory_manager.get_inventory_info(alt_variant.id)
            
            alternatives.append({
                'variant_id': alt_variant.id,
                'product_name': alt_variant.product.name,
                'sku': alt_variant.sku,
                'size': alt_variant.size,
                'color': alt_variant.color,
                'price': float(alt_variant.price),
                'available_stock': inventory_info['total_available'],
                'similarity_reason': 'same_category',
                'priority': 2
            })
        
        # Ordenar por prioridad y disponibilidad
        alternatives.sort(key=lambda x: (x['priority'], -x['available_stock']))
        
        return {
            'original_variant_id': variant_id,
            'alternatives': alternatives[:limit],
            'total_found': len(alternatives)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alternatives search error: {str(e)}")

@router.post("/", response_model=ProductResponse)
async def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """Crear nuevo producto con variante e inventario inicial"""
    try:
        # Verificar que no exista un producto con el mismo código
        existing = db.query(Product).filter(
            Product.category_code == product.category_code,
            Product.internal_number == product.internal_number
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400, 
                detail="Product with this category code and internal number already exists"
            )
        
        # Usar una sola transacción para todo el proceso
        # Crear producto principal
        db_product = Product(**product.dict())
        db.add(db_product)
        db.flush()  # Flush para obtener el ID sin hacer commit
        
        # Crear variante por defecto automáticamente
        base_price = product.base_price if product.base_price and product.base_price > 0 else 10000
        wholesale_price = product.wholesale_price if product.wholesale_price and product.wholesale_price > 0 else base_price * 0.8
        
        default_variant = ProductVariant(
            product_id=db_product.id,
            sku=f"{product.category_code}-{product.internal_number}-DEFAULT",
            size="Único" if not product.requires_size else "M",
            color="Natural" if not product.requires_color else "Estándar",
            price=base_price,
            cost=base_price * 0.6,  # 60% del precio como costo
            wholesale_price=wholesale_price,
            is_active=True,
            min_sale_quantity=1,
            max_sale_quantity=999
        )
        db.add(default_variant)
        db.flush()  # Flush para obtener el ID de la variante
        
        # Buscar o crear ubicación por defecto
        default_location = db.query(Location).filter(
            Location.name == "Almacén Principal"
        ).first()
        
        if not default_location:
            default_location = Location(
                name="Almacén Principal",
                type="storage",
                is_active=True
            )
            db.add(default_location)
            db.flush()  # Flush para obtener el ID de la ubicación
        
        # Crear inventario inicial
        initial_inventory = Inventory(
            variant_id=default_variant.id,
            location_id=default_location.id,
            quantity=1,  # Stock inicial en 1 para que aparezca en búsquedas
            is_active=True
        )
        db.add(initial_inventory)
        
        # Commit final de toda la transacción
        db.commit()
        
        # Refrescar objetos
        db.refresh(db_product)
        db.refresh(default_variant)
        
        return db_product
        
    except HTTPException:
        # Re-lanzar HTTPExceptions tal como están
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"Error detallado en create_product: {str(e)}")  # Para debugging
        raise HTTPException(status_code=500, detail=f"Product creation error: {str(e)}")

@router.post("/{product_id}/variants", response_model=ProductVariantResponse)
async def create_product_variant(
    product_id: int,
    variant: ProductVariantCreate,
    db: Session = Depends(get_db)
):
    """Crear nueva variante de producto"""
    try:
        # Verificar que el producto existe
        product = db.query(Product).get(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Verificar unicidad de códigos
        if variant.sku:
            existing_sku = db.query(ProductVariant).filter(
                ProductVariant.sku == variant.sku
            ).first()
            if existing_sku:
                raise HTTPException(status_code=400, detail="SKU already exists")
        
        if variant.barcode:
            existing_barcode = db.query(ProductVariant).filter(
                ProductVariant.barcode == variant.barcode
            ).first()
            if existing_barcode:
                raise HTTPException(status_code=400, detail="Barcode already exists")
        
        if variant.short_code:
            existing_short = db.query(ProductVariant).filter(
                ProductVariant.short_code == variant.short_code
            ).first()
            if existing_short:
                raise HTTPException(status_code=400, detail="Short code already exists")
        
        # Crear variante
        variant_data = variant.dict()
        variant_data['product_id'] = product_id
        
        db_variant = ProductVariant(**variant_data)
        db.add(db_variant)
        db.commit()
        db.refresh(db_variant)
        
        return db_variant
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Variant creation error: {str(e)}")

# Funciones auxiliares - CORRECCIÓN PRINCIPAL AQUÍ
def _format_variant_for_response(variant: ProductVariant, db: Session) -> dict:
    """Formatea una variante para respuesta de API - RETORNA DICCIONARIO"""
    inventory_manager = InventoryManager(db)
    inventory_info = inventory_manager.get_inventory_info(variant.id)
    
    # Retornar diccionario plano en lugar de objeto Pydantic
    return {
        'variant_id': variant.id,
        'product_name': variant.product.name,
        'variant_name': f"{variant.product.name} - {variant.size} - {variant.color}",
        'sku': variant.sku,
        'barcode': variant.barcode,
        'short_code': variant.short_code,
        'size': variant.size,
        'color': variant.color,
        'color_hex': variant.color_hex,
        'price': float(variant.price),  # Convertir a float para evitar problemas de serialización
        'available_stock': inventory_info['total_available'],
        'total_stock': inventory_info['total_stock'],
        'locations': inventory_info['locations'],
        'is_featured': variant.is_featured
    }

def _format_suggestion(suggestion: dict) -> dict:
    """Formatea una sugerencia para respuesta - YA RETORNA DICCIONARIO"""
    return {
        'variant_id': suggestion.get('variant_id', 0),
        'product_name': suggestion.get('product_name', ''),
        'variant_name': f"{suggestion.get('product_name', '')} - {suggestion.get('size', '')} - {suggestion.get('color', '')}",
        'sku': suggestion.get('sku', ''),
        'size': suggestion.get('size', ''),
        'color': suggestion.get('color', ''),
        'price': float(suggestion.get('price', 0)),
        'available_stock': suggestion.get('available', 0),
        'total_stock': suggestion.get('available', 0),
        'locations': []
    }

def _generate_suggested_filters(variants: List[ProductVariant]) -> dict:
    """Genera filtros sugeridos basados en los resultados"""
    categories = set()
    brands = set()
    sizes = set()
    colors = set()
    
    for variant in variants:
        if variant.product.category:
            categories.add(variant.product.category)
        if variant.product.brand:
            brands.add(variant.product.brand)
        if variant.size:
            sizes.add(variant.size)
        if variant.color:
            colors.add(variant.color)
    
    return {
        'categories': sorted(list(categories)),
        'brands': sorted(list(brands)),
        'sizes': sorted(list(sizes)),
        'colors': sorted(list(colors))
    }