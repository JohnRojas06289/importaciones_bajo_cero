# backend/crear_datos_almacen.py
import sys
import os
sys.path.append(os.path.dirname(__file__))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.base import Base
from app.models.product import Product, ProductVariant
from app.models.inventory import Location, Inventory
from datetime import datetime

# Crear todas las tablas
Base.metadata.create_all(bind=engine)

def crear_datos_almacen():
    """Crear datos específicos para el almacén de chaquetas y gorras"""
    db = SessionLocal()
    
    try:
        print("🏪 Creando datos para el almacén...")
        
        # 1. CREAR UBICACIONES
        print("📍 Creando ubicaciones...")
        
        ubicaciones = [
            {
                'name': 'Exhibición Principal',
                'type': 'display',
                'section': 'Frente del Local',
                'shelf_code': 'EXH-01',
                'is_visible_to_customer': True,
                'description': 'Exhibición principal visible al cliente',
                'max_capacity': 50,
                'led_enabled': True,
                'led_address': 'LED-001'
            },
            {
                'name': 'Exhibición Gorras',
                'type': 'display', 
                'section': 'Pared Izquierda',
                'shelf_code': 'EXH-02',
                'is_visible_to_customer': True,
                'description': 'Exhibidor de gorras en pared',
                'max_capacity': 30,
                'led_enabled': True,
                'led_address': 'LED-002'
            },
            {
                'name': 'Bodega Chaquetas',
                'type': 'storage',
                'section': 'Bodega Principal',
                'shelf_code': 'BOD-A1',
                'is_visible_to_customer': False,
                'description': 'Almacén de chaquetas empacadas',
                'max_capacity': 200,
                'led_enabled': True,
                'led_address': 'LED-003'
            },
            {
                'name': 'Bodega Gorras',
                'type': 'storage',
                'section': 'Bodega Principal',
                'shelf_code': 'BOD-A2', 
                'is_visible_to_customer': False,
                'description': 'Almacén de gorras empacadas',
                'max_capacity': 100,
                'led_enabled': True,
                'led_address': 'LED-004'
            },
            {
                'name': 'Apartados',
                'type': 'reserve',
                'section': 'Mostrador',
                'shelf_code': 'APT-01',
                'is_visible_to_customer': False,
                'description': 'Productos apartados por clientes',
                'max_capacity': 20,
                'led_enabled': False
            }
        ]
        
        for ubicacion_data in ubicaciones:
            ubicacion = Location(**ubicacion_data)
            db.add(ubicacion)
            print(f"  ✓ {ubicacion_data['name']}")
        
        db.commit()
        
        # 2. CREAR PRODUCTOS
        print("\n👕 Creando productos...")
        
        productos = [
            {
                'name': 'Chaqueta Denim Clásica',
                'category': 'Chaquetas',
                'category_code': 'CH',
                'internal_number': '001',
                'description': 'Chaqueta de denim resistente y cómoda',
                'brand': 'Urban Style',
                'material': 'Denim 100% Algodón',
                'gender': 'Unisex',
                'season': 'Todo el año',
                'base_price': 89000.0,
                'wholesale_price': 65000.0,
                'is_active': True
            },
            {
                'name': 'Chaqueta Bomber Negro',
                'category': 'Chaquetas', 
                'category_code': 'CH',
                'internal_number': '002',
                'description': 'Chaqueta bomber moderna y versátil',
                'brand': 'Street Fashion',
                'material': 'Poliéster Premium',
                'gender': 'Unisex',
                'season': 'Invierno',
                'base_price': 95000.0,
                'wholesale_price': 70000.0,
                'is_active': True
            },
            {
                'name': 'Gorra Snapback Classic',
                'category': 'Gorras',
                'category_code': 'GO', 
                'internal_number': '001',
                'description': 'Gorra snapback con ajuste posterior',
                'brand': 'Cap Pro',
                'material': 'Algodón y Poliéster',
                'gender': 'Unisex',
                'season': 'Todo el año',
                'base_price': 35000.0,
                'wholesale_price': 25000.0,
                'is_active': True
            },
            {
                'name': 'Gorra Trucker Vintage',
                'category': 'Gorras',
                'category_code': 'GO',
                'internal_number': '002', 
                'description': 'Gorra estilo trucker con malla posterior',
                'brand': 'Retro Caps',
                'material': 'Algodón y Malla',
                'gender': 'Unisex',
                'season': 'Verano',
                'base_price': 32000.0,
                'wholesale_price': 22000.0,
                'is_active': True
            }
        ]
        
        for producto_data in productos:
            producto = Product(**producto_data)
            db.add(producto)
            print(f"  ✓ {producto_data['name']}")
        
        db.commit()
        
        # 3. CREAR VARIANTES
        print("\n🎨 Creando variantes...")
        
        # Obtener productos creados
        productos_db = db.query(Product).all()
        productos_dict = {f"{p.category_code}-{p.internal_number}": p for p in productos_db}
        
        variantes = [
            # Chaqueta Denim - CH-001
            {
                'product_key': 'CH-001',
                'sku': 'CH001-S-NEG',
                'short_code': 'CH-001-S-NEG',
                'barcode': '1234567890123',
                'size': 'S', 'size_order': 1, 'color': 'Negro', 'color_code': 'NEG', 'color_hex': '#000000',
                'price': 89000.0, 'cost': 45000.0
            },
            {
                'product_key': 'CH-001',
                'sku': 'CH001-M-NEG', 
                'short_code': 'CH-001-M-NEG',
                'barcode': '1234567890124',
                'size': 'M', 'size_order': 2, 'color': 'Negro', 'color_code': 'NEG', 'color_hex': '#000000',
                'price': 89000.0, 'cost': 45000.0
            },
            {
                'product_key': 'CH-001',
                'sku': 'CH001-L-NEG',
                'short_code': 'CH-001-L-NEG', 
                'barcode': '1234567890125',
                'size': 'L', 'size_order': 3, 'color': 'Negro', 'color_code': 'NEG', 'color_hex': '#000000',
                'price': 89000.0, 'cost': 45000.0
            },
            {
                'product_key': 'CH-001',
                'sku': 'CH001-M-AZU',
                'short_code': 'CH-001-M-AZU',
                'barcode': '1234567890126', 
                'size': 'M', 'size_order': 2, 'color': 'Azul', 'color_code': 'AZU', 'color_hex': '#0066CC',
                'price': 89000.0, 'cost': 45000.0
            },
            
            # Chaqueta Bomber - CH-002
            {
                'product_key': 'CH-002',
                'sku': 'CH002-M-NEG',
                'short_code': 'CH-002-M-NEG',
                'barcode': '1234567890127',
                'size': 'M', 'size_order': 2, 'color': 'Negro', 'color_code': 'NEG', 'color_hex': '#000000',
                'price': 95000.0, 'cost': 50000.0
            },
            {
                'product_key': 'CH-002', 
                'sku': 'CH002-L-NEG',
                'short_code': 'CH-002-L-NEG',
                'barcode': '1234567890128',
                'size': 'L', 'size_order': 3, 'color': 'Negro', 'color_code': 'NEG', 'color_hex': '#000000',
                'price': 95000.0, 'cost': 50000.0
            },
            
            # Gorra Snapback - GO-001
            {
                'product_key': 'GO-001',
                'sku': 'GO001-U-NEG',
                'short_code': 'GO-001-U-NEG',
                'barcode': '1234567890129',
                'size': 'Única', 'size_order': 1, 'color': 'Negro', 'color_code': 'NEG', 'color_hex': '#000000',
                'price': 35000.0, 'cost': 18000.0
            },
            {
                'product_key': 'GO-001',
                'sku': 'GO001-U-BLA',
                'short_code': 'GO-001-U-BLA',
                'barcode': '1234567890130', 
                'size': 'Única', 'size_order': 1, 'color': 'Blanco', 'color_code': 'BLA', 'color_hex': '#FFFFFF',
                'price': 35000.0, 'cost': 18000.0
            },
            {
                'product_key': 'GO-001',
                'sku': 'GO001-U-ROJ',
                'short_code': 'GO-001-U-ROJ',
                'barcode': '1234567890131',
                'size': 'Única', 'size_order': 1, 'color': 'Rojo', 'color_code': 'ROJ', 'color_hex': '#CC0000',
                'price': 35000.0, 'cost': 18000.0
            },
            
            # Gorra Trucker - GO-002
            {
                'product_key': 'GO-002',
                'sku': 'GO002-U-AZU',
                'short_code': 'GO-002-U-AZU',
                'barcode': '1234567890132',
                'size': 'Única', 'size_order': 1, 'color': 'Azul', 'color_code': 'AZU', 'color_hex': '#0066CC',
                'price': 32000.0, 'cost': 16000.0
            },
            {
                'product_key': 'GO-002',
                'sku': 'GO002-U-VER',
                'short_code': 'GO-002-U-VER',
                'barcode': '1234567890133',
                'size': 'Única', 'size_order': 1, 'color': 'Verde', 'color_code': 'VER', 'color_hex': '#00CC00',
                'price': 32000.0, 'cost': 16000.0
            }
        ]
        
        for variante_data in variantes:
            product_key = variante_data.pop('product_key')
            producto = productos_dict[product_key]
            
            variante = ProductVariant(
                product_id=producto.id,
                **variante_data
            )
            db.add(variante)
            print(f"  ✓ {variante_data['sku']}")
        
        db.commit()
        
        # 4. CREAR INVENTARIO
        print("\n📦 Creando inventario...")
        
        # Obtener ubicaciones y variantes
        ubicaciones_db = db.query(Location).all()
        ubicaciones_dict = {u.name: u for u in ubicaciones_db}
        
        variantes_db = db.query(ProductVariant).all()
        
        # Crear inventario para cada variante
        for variante in variantes_db:
            categoria = variante.product.category
            
            if categoria == 'Chaquetas':
                # Inventario en exhibición
                inventario_display = Inventory(
                    variant_id=variante.id,
                    location_id=ubicaciones_dict['Exhibición Principal'].id,
                    quantity=3,  # 3 unidades en exhibición
                    min_stock=1,
                    max_stock=5,
                    cost_per_unit=variante.cost
                )
                db.add(inventario_display)
                
                # Inventario en bodega
                inventario_storage = Inventory(
                    variant_id=variante.id,
                    location_id=ubicaciones_dict['Bodega Chaquetas'].id,
                    quantity=15,  # 15 unidades en bodega
                    min_stock=5,
                    max_stock=30,
                    cost_per_unit=variante.cost
                )
                db.add(inventario_storage)
                
            elif categoria == 'Gorras':
                # Inventario en exhibición
                inventario_display = Inventory(
                    variant_id=variante.id,
                    location_id=ubicaciones_dict['Exhibición Gorras'].id,
                    quantity=5,  # 5 unidades en exhibición
                    min_stock=2,
                    max_stock=8,
                    cost_per_unit=variante.cost
                )
                db.add(inventario_display)
                
                # Inventario en bodega
                inventario_storage = Inventory(
                    variant_id=variante.id,
                    location_id=ubicaciones_dict['Bodega Gorras'].id,
                    quantity=20,  # 20 unidades en bodega
                    min_stock=8,
                    max_stock=40,
                    cost_per_unit=variante.cost
                )
                db.add(inventario_storage)
            
            print(f"  ✓ {variante.sku} - Stock creado")
        
        db.commit()
        
        print("\n🎉 ¡Datos del almacén creados exitosamente!")
        print("\n📊 Resumen:")
        print(f"  • {len(ubicaciones)} ubicaciones creadas")
        print(f"  • {len(productos)} productos creados") 
        print(f"  • {len(variantes)} variantes creadas")
        print(f"  • {len(variantes) * 2} registros de inventario creados")
        
        print("\n🔗 Enlaces:")
        print("  • Frontend: http://localhost:3000")
        print("  • API Docs: http://localhost:8000/docs")
        print("  • Health Check: http://localhost:8000/health")
        
        print("\n📋 Códigos cortos de ejemplo:")
        print("  • CH-001-M-NEG (Chaqueta Denim Mediana Negra)")
        print("  • GO-001-U-ROJ (Gorra Snapback Única Roja)")
        print("  • CH-002-L-NEG (Chaqueta Bomber Large Negra)")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    crear_datos_almacen()