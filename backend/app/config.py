from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    """Configuración central de la aplicación"""

    # Base de datos - SQLite
    database_url: str = "sqlite:///./inventario_ropa.db"
    database_test_url: str = "sqlite:///./inventario_test.db"

    # Redis
    redis_url: str = ""

    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    api_secret_key: str = "tu-clave-secreta-super-segura"

    # Aplicación
    environment: str = "development"
    debug: bool = True
    timezone: str = "America/Bogota"

    # Paginación
    default_pagination_limit: int = 50

    # Seguridad
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # CORS
    allowed_origins: list = ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.1.3:3000"]

    # Campos adicionales del .env
    log_level: str = "INFO"
    default_reservation_minutes: int = 30
    low_stock_threshold_percent: int = 20
    pos_terminal_id: str = "tablet-centro-bogota"
    auto_print_receipts: bool = False
    company_name: str = "Almacén Centro Bogotá"
    company_address: str = "Centro de Bogotá, Colombia"
    company_phone: str = "+57 1 234 5678"
    company_email: str = "ventas@almacenropa.com"

    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    """Obtener configuración cacheada"""
    return Settings()

# Instancia global de configuración
settings = get_settings()
