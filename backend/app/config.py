# backend/app/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache
import os

class Settings(BaseSettings):
    """Configuración central de la aplicación"""
    # Base de datos
    database_url: str = "postgresql://user:password@localhost/inventario_ropa"
    database_test_url: str = ""
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    
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
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    """Obtener configuración cacheada"""
    return Settings()

# Instancia global de configuración
settings = get_settings()