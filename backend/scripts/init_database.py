# backend/scripts/init_database.py
import sys
from pathlib import Path

# Agregar el directorio padre al path para poder importar los módulos
sys.path.append(str(Path(__file__).parent.parent))

from app.database import engine, SessionLocal
from app.models.base import Base
from app.models.product import Product, ProductVariant
from app.models.inventory import Location, Inventory
from app.models.sale import Sale, SaleItem

# El resto del código permanece igual...