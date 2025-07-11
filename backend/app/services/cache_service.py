# backend/app/services/cache_service.py
import json
import time
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class CacheService:
    """Servicio de caché usando memoria local (sin Redis para desarrollo)"""
    
    def __init__(self):
        # Cache en memoria para desarrollo
        self._cache = {}
        self._expiry = {}
        self.is_available = True
        logger.info("Cache service initialized with memory storage")
    
    def get(self, key: str) -> Optional[str]:
        """Obtiene un valor del caché"""
        try:
            # Verificar si la clave ha expirado
            if key in self._expiry and time.time() > self._expiry[key]:
                self.delete(key)
                return None
            
            return self._cache.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        """Establece un valor en el caché"""
        try:
            self._cache[key] = value
            if expire:
                self._expiry[key] = time.time() + expire
            return True
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def setex(self, key: str, expire: int, value: str) -> bool:
        """Establece un valor con expiración"""
        return self.set(key, value, expire)
    
    def delete(self, key: str) -> bool:
        """Elimina una clave del caché"""
        try:
            self._cache.pop(key, None)
            self._expiry.pop(key, None)
            return True
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Elimina todas las claves que coincidan con un patrón"""
        try:
            import fnmatch
            pattern = pattern.replace('*', '*')
            
            keys_to_delete = []
            for key in self._cache.keys():
                if fnmatch.fnmatch(key, pattern):
                    keys_to_delete.append(key)
            
            for key in keys_to_delete:
                self.delete(key)
            
            return len(keys_to_delete)
        except Exception as e:
            logger.error(f"Cache delete pattern error for pattern {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Verifica si una clave existe"""
        return key in self._cache and (key not in self._expiry or time.time() <= self._expiry[key])
    
    def expire(self, key: str, seconds: int) -> bool:
        """Establece tiempo de expiración para una clave"""
        try:
            if key in self._cache:
                self._expiry[key] = time.time() + seconds
                return True
            return False
        except Exception as e:
            logger.error(f"Cache expire error for key {key}: {e}")
            return False
    
    def ttl(self, key: str) -> int:
        """Obtiene el tiempo de vida restante de una clave"""
        try:
            if key in self._expiry:
                remaining = self._expiry[key] - time.time()
                return int(remaining) if remaining > 0 else -1
            return -1
        except Exception as e:
            logger.error(f"Cache ttl error for key {key}: {e}")
            return -1
    
    def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementa un valor numérico"""
        try:
            current = int(self.get(key) or 0)
            new_value = current + amount
            self.set(key, str(new_value))
            return new_value
        except Exception as e:
            logger.error(f"Cache incr error for key {key}: {e}")
            return None
    
    def decr(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrementa un valor numérico"""
        return self.incr(key, -amount)
    
    # Métodos específicos del negocio
    def cache_product_scan(self, code: str, result: Dict[str, Any], expire: int = 300) -> bool:
        """Cachea resultado de escaneo de producto"""
        key = f"scan:{code}"
        return self.setex(key, expire, json.dumps(result))
    
    def get_cached_scan(self, code: str) -> Optional[Dict[str, Any]]:
        """Obtiene resultado de escaneo cacheado"""
        key = f"scan:{code}"
        cached = self.get(key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                self.delete(key)
        return None
    
    def cache_search_results(self, query: str, filters: Dict[str, Any], 
                           results: List[Dict[str, Any]], expire: int = 180) -> bool:
        """Cachea resultados de búsqueda"""
        filters_str = json.dumps(filters, sort_keys=True)
        key = f"search:{hash(query + filters_str)}"
        
        data = {
            'query': query,
            'filters': filters,
            'results': results,
            'cached_at': datetime.now().isoformat()
        }
        
        return self.setex(key, expire, json.dumps(data))
    
    def get_cached_search(self, query: str, filters: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Obtiene resultados de búsqueda cacheados"""
        filters_str = json.dumps(filters, sort_keys=True)
        key = f"search:{hash(query + filters_str)}"
        
        cached = self.get(key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                self.delete(key)
        return None
    
    def health_check(self) -> Dict[str, Any]:
        """Verifica la salud del servicio de caché"""
        return {
            'status': 'healthy',
            'message': 'Memory cache service is working properly',
            'keys_count': len(self._cache),
            'storage_type': 'memory'
        }