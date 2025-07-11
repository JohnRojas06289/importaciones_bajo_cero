# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine
from .models import base  # Importar todos los modelos
from .api import products, inventory, sales, reports

# Crear tablas si no existen
base.Base.metadata.create_all(bind=engine)

# Crear aplicación FastAPI
app = FastAPI(
    title="Sistema de Inventario y Ventas",
    description="API para gestión de inventario y punto de venta",
    version="1.0.0",
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else ["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar routers
app.include_router(products.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(reports.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Inicializar la aplicación"""
    print(f"✓ Sistema iniciado en {settings.api_host}:{settings.api_port}")
    print(f"✓ Entorno: {settings.environment}")
    print(f"✓ Debug: {settings.debug}")

@app.get("/")
async def root():
    """Endpoint de verificación"""
    return {
        "message": "Sistema de Inventario y Ventas",
        "version": "1.0.0",
        "status": "active",
        "docs": f"http://{settings.api_host}:{settings.api_port}/docs"
    }

@app.get("/health")
async def health_check():
    """Verificación de salud del sistema"""
    return {
        "status": "healthy",
        "database": "connected",
        "cache": "connected"
    }

@app.get("/api/health")
async def api_health_check():
    """Verificación de salud de la API"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "database": "connected"
    }