# run_server.py - Script para ejecutar el servidor backend
import sys
import os
sys.path.append(os.path.dirname(__file__))

if __name__ == "__main__":
    import uvicorn
    from app.main import app
    
    print("🚀 Iniciando servidor backend...")
    print("📍 URL: http://localhost:8002")
    print("📖 Documentación: http://localhost:8002/docs")
    print("🛑 Para detener: Ctrl+C")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        reload=False
    )
