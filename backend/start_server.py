#!/usr/bin/env python3
"""
Script simple para iniciar el servidor backend
"""
import os
import sys

# Añadir el directorio actual al Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    from app.main import app
    import uvicorn
    
    print("🚀 Iniciando servidor backend...")
    print("📍 URL: http://localhost:8002")
    print("📖 Documentación: http://localhost:8002/docs")
    print("🛑 Para detener: Ctrl+C")
    
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8002,  # Cambiado a puerto 8002
        reload=False,  # Deshabilitamos reload para evitar problemas
        log_level="info"
    )
    
except ImportError as e:
    print(f"❌ Error de importación: {e}")
    print("🔍 Verificando estructura del proyecto...")
    print(f"📁 Directorio actual: {current_dir}")
    print(f"🐍 Python path: {sys.path}")
    
except Exception as e:
    print(f"❌ Error al iniciar servidor: {e}")
