# backend/scripts/init_database.py
import sys
from pathlib import Path

# Agregar el directorio padre al path para poder importar los módulos
sys.path.append(str(Path(__file__).parent.parent))

from app.database import engine, SessionLocal
from app.models.base import Base
from app.models.product import Product, ProductVariant, ProductImage
from app.models.inventory import Location, Inventory, InventoryMovement, Reservation
from app.models.sale import Sale, SaleItem, Payment, Refund, RefundItem
from sqlalchemy.orm import Session
from datetime import datetime
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    """Crear todas las tablas"""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Tables created successfully")

def create_default_locations(db: Session):
    """Crear ubicaciones por defecto"""
    logger.info("Creating default locations...")
    
    default_locations = [
        {
            'name': 'Exhibición Principal',
            'type': 'display',
            'section': 'Frente del Local',
            'shelf_code': 'EXH-01',
            'is_visible_to_customer': True,
            'description': 'Exhibición principal visible al cliente',
            'max_capacity': 50
        },
        {
            'name': 'Exhibición Gorras',
            'type': 'display',
            'section': 'Gorras',
            'shelf_code': 'EXH-02',
            'is_visible_to_customer': True,
            'description': 'Exhibición de gorras',
            'max_capacity': 30
        },
        {
            'name': 'Bodega Principal',
            'type': 'storage',
            'section': 'Almacén',
            'shelf_code': 'BOD-A1',
            'is_visible_to_customer': False,
            'description': 'Bodega principal para almacenar mercancía',
            'max_capacity': 200
        },
        {
            'name': 'Bodega Gorras',
            'type': 'storage',
            'section': 'Almacén',
            'shelf_code': 'BOD-A2',
            'is_visible_to_customer': False,
            'description': 'Bodega específica para gorras',
            'max_capacity': 100
        },
        {
            'name': 'Reservas',
            'type': 'reserve',
            'section': 'Apartados',
            'shelf_code': 'RES-01',
            'is_visible_to_customer': False,
            'description': 'Área para productos apartados',
            'max_capacity': 20
        }
    ]
    
    for location_data in default_locations:
        # Verificar si ya existe
        existing = db.query(Location).filter(Location.name == location_data['name']).first()
        if not existing:
            location = Location(**location_data)
            db.add(location)
            logger.info(f"✓ Created location: {location_data['name']}")
    
    db.commit()

def create_sample_products(db: Session):
    """Crear productos de ejemplo"""
    logger.info("Creating sample products...")
    
    # Productos de ejemplo
    sample_products = [
        {
            'name': 'Chaqueta Denim Clásica',
            'category': 'Chaquetas',
            'category_code': 'CH',
            'internal_number': '001',
            'description': 'Chaqueta de denim clásica para hombre y mujer',
            'brand': 'Urban Style',
            'material': 'Denim 100% Algodón',
            'gender': 'Unisex',
            'season': 'Todo el año',
            'base_price': 89000.0,
            'wholesale_price': 65000.0,
            'variants': [
                {
                    'sku': 'CH001-S-NEG',
                    'short_code': 'CH-001-S-NEG',
                    'size': 'S',
                    'size_order': 2,
                    'color': 'Negro',
                    'color_code': 'NEG',
                    'color_hex': '#000000',
                    'price': 89000.0,
                    'cost': 45000.0,
                    'barcode': '1234567890123'
                },
                {
                    'sku': 'CH001-M-NEG',
                    'short_code': 'CH-001-M-NEG',
                    'size': 'M',
                    'size_order': 3,
                    'color': 'Negro',
                    'color_code': 'NEG',
                    'color_hex': '#000000',
                    'price': 89000.0,
                    'cost': 45000.0,
                    'barcode': '1234567890124'
                },
                {
                    'sku': 'CH001-L-NEG',
                    'short_code': 'CH-001-L-NEG',
                    'size': 'L',
                    'size_order': 4,
                    'color': 'Negro',
                    'color_code': 'NEG',
                    'color_hex': '#000000',
                    'price': 89000.0,
                    'cost': 45000.0,
                    'barcode': '1234567890125'
                },
                {
                    'sku': 'CH001-M-AZU',
                    'short_code': 'CH-001-M-AZU',
                    'size': 'M',
                    'size_order': 3,
                    'color': 'Azul',
                    'color_code': 'AZU',
                    'color_hex': '#0066CC',
                    'price': 89000.0,
                    'cost': 45000.0,
                    'barcode': '1234567890126'
                }
            ]
        },
        {
            'name': 'Gorra Snapback Classic',
            'category': 'Gorras',
            'category_code': 'GO',
            'internal_number': '001',
            'description': 'Gorra snapback clásica con ajuste posterior',
            'brand': 'Street Cap',
            'material': 'Algodón y Poliéster',
            'gender': 'Unisex',
            'season': 'Todo el año',
            'base_price': 35000.0,
            'wholesale_price': 25000.0,
            'variants': [
                {
                    'sku': 'GO001-U-NEG',
                    'short_code': 'GO-001-U-NEG',
                    'size': 'Única',
                    'size_order': 1,
                    'color': 'Negro',
                    'color_code': 'NEG',
                    'color_hex': '#000000',
                    'price': 35000.0,
                    'cost': 18000.0,
                    'barcode': '1234567890127'
                },
                {
                    'sku': 'GO001-U-BLA',
                    'short_code': 'GO-001-U-BLA',
                    'size': 'Única',
                    'size_order': 1,
                    'color': 'Blanco',
                    'color_code': 'BLA',
                    'color_hex': '#FFFFFF',
                    'price': 35000.0,
                    'cost': 18000.0,
                    'barcode': '1234567890128'
                },
                {
                    'sku': 'GO001-U-ROJ',
                    'short_code': 'GO-001-U-ROJ',
                    'size': 'Única',
                    'size_order': 1,
                    'color': 'Rojo',
                    'color_code': 'ROJ',
                    'color_hex': '#CC0000',
                    'price': 35000.0,
                    'cost': 18000.0,
                    'barcode': '1234567890129'
                }
            ]
        }
    ]
    
    for product_data in sample_products:
        # Verificar si el producto ya existe
        existing = db.query(Product).filter(
            Product.category_code == product_data['category_code'],
            Product.internal_number == product_data['internal_number']
        ).first()
        
        if not existing:
            # Crear producto
            variants_data = product_data.pop('variants')
            product = Product(**product_data)
            db.add(product)
            db.flush()  # Para obtener el ID
            
            logger.info(f"✓ Created product: {product.name}")
            
            # Crear variantes
            for variant_data in variants_data:
                variant_data['product_id'] = product.id
                variant = ProductVariant(**variant_data)
                db.add(variant)
                logger.info(f"  ✓ Created variant: {variant.sku}")
    
    db.commit()

def create_sample_inventory(db: Session):
    """Crear inventario de ejemplo"""
    logger.info("Creating sample inventory...")
    
    # Obtener ubicaciones y variantes
    locations = db.query(Location).all()
    variants = db.query(ProductVariant).all()
    
    location_dict = {loc.name: loc.id for loc in locations}
    
    # Crear inventario para cada variante
    for variant in variants:
        # Inventario en exhibición
        if 'Gorra' in variant.product.name:
            display_location = location_dict.get('Exhibición Gorras')
            storage_location = location_dict.get('Bodega Gorras')
            display_qty = 5
            storage_qty = 15
        else:
            display_location = location_dict.get('Exhibición Principal')
            storage_location = location_dict.get('Bodega Principal')
            display_qty = 3
            storage_qty = 12
        
        # Crear inventario en exhibición
        if display_location:
            inventory_display = Inventory(
                variant_id=variant.id,
                location_id=display_location,
                quantity=display_qty,
                min_stock=2,
                max_stock=10,
                cost_per_unit=variant.cost
            )
            db.add(inventory_display)
        
        # Crear inventario en bodega
        if storage_location:
            inventory_storage = Inventory(
                variant_id=variant.id,
                location_id=storage_location,
                quantity=storage_qty,
                min_stock=5,
                max_stock=50,
                cost_per_unit=variant.cost
            )
            db.add(inventory_storage)
        
        logger.info(f"✓ Created inventory for: {variant.sku}")
    
    db.commit()

def main():
    """Función principal"""
    logger.info("🚀 Initializing database...")
    
    try:
        # Crear tablas
        create_tables()
        
        # Crear sesión de base de datos
        db = SessionLocal()
        
        try:
            # Crear datos por defecto
            create_default_locations(db)
            create_sample_products(db)
            create_sample_inventory(db)
            
            logger.info("✅ Database initialization completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ Error during data creation: {e}")
            db.rollback()
            raise
        
        finally:
            db.close()
    
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()