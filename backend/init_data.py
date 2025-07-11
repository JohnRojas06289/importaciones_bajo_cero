# init_data.py - Inicializar datos para el almacén de chaquetas y gorras
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
    """Crear datos iniciales para el almacén de chaquetas y gorras"""
    db = SessionLocal()
    try:
        # 1. Crear ubicaciones
        print("Creando ubicaciones...")
        ubicaciones = [
            Location(
                name="Exhibición Principal",
                type="display",
                section="General",
                description="Área principal de exhibición para clientes",
                is_visible_to_customer=True,
                is_active=True,
                max_capacity=50
            ),
            Location(
                name="Bodega",
                type="storage",
                section="Almacén",
                description="Almacén principal de productos",
                is_visible_to_customer=False,
                is_active=True,
                max_capacity=200
            ),
            Location(
                name="Reservados",
                type="reserve",
                section="Apartados",
                description="Productos reservados para clientes",
                is_visible_to_customer=False,
                is_active=True,
                max_capacity=30
            )
        ]
        
        for ubicacion in ubicaciones:
            db.add(ubicacion)
        db.commit()
        
        # Obtener las ubicaciones creadas
        exhibicion = db.query(Location).filter_by(name="Exhibición Principal").first()
        bodega = db.query(Location).filter_by(name="Bodega").first()
        
        # 2. Crear productos - CHAQUETAS
        print("Creando productos de chaquetas...")
        
        # Chaqueta de Cuero
        chaqueta_cuero = Product(
            name="Chaqueta de Cuero Premium",
            category="Chaquetas",
            category_code="CH",
            internal_number="001",
            description="Chaqueta de cuero genuino, perfecta para el clima frío. Limpiar en seco únicamente.",
            brand="ColdWear",
            material="Cuero genuino",
            gender="Unisex",
            season="Invierno",
            base_price=280000,
            wholesale_price=250000,
            is_active=True,
            requires_size=True,
            requires_color=True
        )
        db.add(chaqueta_cuero)
        db.commit()
        
        # Variantes de chaqueta de cuero
        variantes_cuero = [
            {"size": "S", "color": "Negro", "price": 280000, "cost": 200000, "stock_exhibicion": 2, "stock_bodega": 8},
            {"size": "M", "color": "Negro", "price": 280000, "cost": 200000, "stock_exhibicion": 3, "stock_bodega": 12},
            {"size": "L", "color": "Negro", "price": 280000, "cost": 200000, "stock_exhibicion": 2, "stock_bodega": 10},
            {"size": "XL", "color": "Negro", "price": 280000, "cost": 200000, "stock_exhibicion": 1, "stock_bodega": 6},
            {"size": "M", "color": "Marrón", "price": 285000, "cost": 205000, "stock_exhibicion": 2, "stock_bodega": 8},
            {"size": "L", "color": "Marrón", "price": 285000, "cost": 205000, "stock_exhibicion": 1, "stock_bodega": 5},
        ]
        
        for i, var in enumerate(variantes_cuero, 1):
            # Crear código de barras único
            barcode = f"CHQ{chaqueta_cuero.id:03d}{i:02d}CU"
            short_code = f"CU{i:02d}"
            sku = f"CH-001-{var['size']}-{var['color'][:3].upper()}"
            color_code = var['color'][:3].upper()
            
            variante = ProductVariant(
                product_id=chaqueta_cuero.id,
                sku=sku,
                barcode=barcode,
                short_code=short_code,
                size=var["size"],
                color=var["color"],
                color_code=color_code,
                price=var["price"],
                cost=var["cost"],
                is_active=True
            )
            db.add(variante)
            db.commit()
            
            # Agregar inventario en exhibición
            if var["stock_exhibicion"] > 0:
                inv_exhibicion = Inventory(
                    variant_id=variante.id,
                    location_id=exhibicion.id,
                    quantity=var["stock_exhibicion"],
                    reserved_quantity=0,
                    min_stock=1,
                    max_stock=5
                )
                db.add(inv_exhibicion)
            
            # Agregar inventario en bodega
            inv_bodega = Inventory(
                variant_id=variante.id,
                location_id=bodega.id,
                quantity=var["stock_bodega"],
                reserved_quantity=0,
                min_stock=5,
                max_stock=20
            )
            db.add(inv_bodega)
        
        # Chaqueta Deportiva
        chaqueta_deportiva = Product(
            name="Chaqueta Deportiva Térmica",
            category="Chaquetas",
            category_code="CH",
            internal_number="002",
            description="Chaqueta térmica ideal para deportes y actividades al aire libre. Lavable a máquina, agua fría.",
            brand="SportZone",
            material="Poliéster con forro térmico",
            gender="Unisex",
            season="Todo el año",
            base_price=150000,
            wholesale_price=130000,
            is_active=True,
            requires_size=True,
            requires_color=True
        )
        db.add(chaqueta_deportiva)
        db.commit()
        
        # Variantes de chaqueta deportiva
        variantes_deportiva = [
            {"size": "S", "color": "Azul", "price": 150000, "cost": 100000, "stock_exhibicion": 3, "stock_bodega": 15},
            {"size": "M", "color": "Azul", "price": 150000, "cost": 100000, "stock_exhibicion": 4, "stock_bodega": 20},
            {"size": "L", "color": "Azul", "price": 150000, "cost": 100000, "stock_exhibicion": 3, "stock_bodega": 18},
            {"size": "XL", "color": "Azul", "price": 150000, "cost": 100000, "stock_exhibicion": 2, "stock_bodega": 12},
            {"size": "S", "color": "Rojo", "price": 155000, "cost": 105000, "stock_exhibicion": 2, "stock_bodega": 10},
            {"size": "M", "color": "Rojo", "price": 155000, "cost": 105000, "stock_exhibicion": 3, "stock_bodega": 15},
            {"size": "L", "color": "Rojo", "price": 155000, "cost": 105000, "stock_exhibicion": 2, "stock_bodega": 12},
            {"size": "M", "color": "Verde", "price": 160000, "cost": 110000, "stock_exhibicion": 1, "stock_bodega": 8},
        ]
        
        for i, var in enumerate(variantes_deportiva, 1):
            barcode = f"CHQ{chaqueta_deportiva.id:03d}{i:02d}DP"
            short_code = f"DP{i:02d}"
            sku = f"CH-002-{var['size']}-{var['color'][:3].upper()}"
            color_code = var['color'][:3].upper()
            
            variante = ProductVariant(
                product_id=chaqueta_deportiva.id,
                sku=sku,
                barcode=barcode,
                short_code=short_code,
                size=var["size"],
                color=var["color"],
                color_code=color_code,
                price=var["price"],
                cost=var["cost"],
                is_active=True
            )
            db.add(variante)
            db.commit()
            
            # Inventario
            if var["stock_exhibicion"] > 0:
                inv_exhibicion = Inventory(
                    variant_id=variante.id,
                    location_id=exhibicion.id,
                    quantity=var["stock_exhibicion"],
                    reserved_quantity=0,
                    min_stock=2,
                    max_stock=8
                )
                db.add(inv_exhibicion)
            
            inv_bodega = Inventory(
                variant_id=variante.id,
                location_id=bodega.id,
                quantity=var["stock_bodega"],
                reserved_quantity=0,
                min_stock=8,
                max_stock=30
            )
            db.add(inv_bodega)
        
        # 3. Crear productos - GORRAS
        print("Creando productos de gorras...")
        
        # Gorra Deportiva
        gorra_deportiva = Product(
            name="Gorra Deportiva Ajustable",
            category="Gorras",
            category_code="GO",
            internal_number="001",
            description="Gorra deportiva con cierre ajustable, perfecta para actividades al aire libre. Lavable a mano, secar al aire.",
            brand="CapZone",
            material="Algodón y poliéster",
            gender="Unisex",
            season="Todo el año",
            base_price=45000,
            wholesale_price=35000,
            is_active=True,
            requires_size=False,
            requires_color=True
        )
        db.add(gorra_deportiva)
        db.commit()
        
        # Variantes de gorra deportiva
        variantes_gorra_deportiva = [
            {"size": "Única", "color": "Negro", "price": 45000, "cost": 25000, "stock_exhibicion": 8, "stock_bodega": 25},
            {"size": "Única", "color": "Blanco", "price": 45000, "cost": 25000, "stock_exhibicion": 6, "stock_bodega": 20},
            {"size": "Única", "color": "Azul", "price": 45000, "cost": 25000, "stock_exhibicion": 5, "stock_bodega": 18},
            {"size": "Única", "color": "Rojo", "price": 48000, "cost": 28000, "stock_exhibicion": 4, "stock_bodega": 15},
            {"size": "Única", "color": "Verde", "price": 48000, "cost": 28000, "stock_exhibicion": 3, "stock_bodega": 12},
        ]
        
        for i, var in enumerate(variantes_gorra_deportiva, 1):
            barcode = f"GOR{gorra_deportiva.id:03d}{i:02d}DP"
            short_code = f"GD{i:02d}"
            sku = f"GO-001-UNI-{var['color'][:3].upper()}"
            color_code = var['color'][:3].upper()
            
            variante = ProductVariant(
                product_id=gorra_deportiva.id,
                sku=sku,
                barcode=barcode,
                short_code=short_code,
                size=var["size"],
                color=var["color"],
                color_code=color_code,
                price=var["price"],
                cost=var["cost"],
                is_active=True
            )
            db.add(variante)
            db.commit()
            
            # Inventario
            inv_exhibicion = Inventory(
                variant_id=variante.id,
                location_id=exhibicion.id,
                quantity=var["stock_exhibicion"],
                reserved_quantity=0,
                min_stock=3,
                max_stock=15
            )
            db.add(inv_exhibicion)
            
            inv_bodega = Inventory(
                variant_id=variante.id,
                location_id=bodega.id,
                quantity=var["stock_bodega"],
                reserved_quantity=0,
                min_stock=10,
                max_stock=40
            )
            db.add(inv_bodega)
        
        # Gorra Premium
        gorra_premium = Product(
            name="Gorra Premium de Lana",
            category="Gorras",
            category_code="GO",
            internal_number="002",
            description="Gorra de lana de alta calidad para el clima frío. Limpiar en seco únicamente.",
            brand="WoolCap",
            material="Lana merino 100%",
            gender="Unisex",
            season="Invierno",
            base_price=85000,
            wholesale_price=70000,
            is_active=True,
            requires_size=False,
            requires_color=True
        )
        db.add(gorra_premium)
        db.commit()
        
        # Variantes de gorra premium
        variantes_gorra_premium = [
            {"size": "Única", "color": "Negro", "price": 85000, "cost": 55000, "stock_exhibicion": 3, "stock_bodega": 10},
            {"size": "Única", "color": "Gris", "price": 85000, "cost": 55000, "stock_exhibicion": 2, "stock_bodega": 8},
            {"size": "Única", "color": "Beige", "price": 90000, "cost": 60000, "stock_exhibicion": 2, "stock_bodega": 6},
            {"size": "Única", "color": "Azul Marino", "price": 90000, "cost": 60000, "stock_exhibicion": 1, "stock_bodega": 5},
        ]
        
        for i, var in enumerate(variantes_gorra_premium, 1):
            barcode = f"GOR{gorra_premium.id:03d}{i:02d}PR"
            short_code = f"GP{i:02d}"
            sku = f"GO-002-UNI-{var['color'][:3].upper()}"
            color_code = var['color'][:3].upper()
            
            variante = ProductVariant(
                product_id=gorra_premium.id,
                sku=sku,
                barcode=barcode,
                short_code=short_code,
                size=var["size"],
                color=var["color"],
                color_code=color_code,
                price=var["price"],
                cost=var["cost"],
                is_active=True
            )
            db.add(variante)
            db.commit()
            
            # Inventario
            if var["stock_exhibicion"] > 0:
                inv_exhibicion = Inventory(
                    variant_id=variante.id,
                    location_id=exhibicion.id,
                    quantity=var["stock_exhibicion"],
                    reserved_quantity=0,
                    min_stock=1,
                    max_stock=5
                )
                db.add(inv_exhibicion)
            
            inv_bodega = Inventory(
                variant_id=variante.id,
                location_id=bodega.id,
                quantity=var["stock_bodega"],
                reserved_quantity=0,
                min_stock=3,
                max_stock=15
            )
            db.add(inv_bodega)
        
        db.commit()
        print("✅ Datos del almacén creados exitosamente!")
        print(f"   - {len(ubicaciones)} ubicaciones")
        print(f"   - 4 productos base")
        print(f"   - {len(variantes_cuero) + len(variantes_deportiva) + len(variantes_gorra_deportiva) + len(variantes_gorra_premium)} variantes de productos")
        print(f"   - Inventario completo distribuido entre exhibición y bodega")
        
    except Exception as e:
        print(f"❌ Error al crear datos: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    crear_datos_almacen()
