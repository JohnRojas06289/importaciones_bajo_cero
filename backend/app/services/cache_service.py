# backend/app/services/cache_service.py
import redis
import json
import pickle
from typing import Any, Optional, Dict, List, Union
from datetime import datetime, timedelta
from ..config import settings
import logging

logger = logging.getLogger(__name__)

class CacheService:
    """Servicio de caché usando Redis"""
    
    def __init__(self):
        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5,
                socket_timeout=5,
                retry_on_timeout=True
            )
            # Test connection
            self.redis_client.ping()
            self.is_available = True
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Cache will be disabled.")
            self.redis_client = None
            self.is_available = False
    
    def get(self, key: str) -> Optional[str]:
        """Obtiene un valor del caché"""
        if not self.is_available:
            return None
        
        try:
            return self.redis_client.get(key)
        except Exception as e:
            logger.error(f"Cache get error for key {key}: {e}")
            return None
    
    def set(self, key: str, value: str, expire: Optional[int] = None) -> bool:
        """Establece un valor en el caché"""
        if not self.is_available:
            return False
        
        try:
            return self.redis_client.set(key, value, ex=expire)
        except Exception as e:
            logger.error(f"Cache set error for key {key}: {e}")
            return False
    
    def setex(self, key: str, expire: int, value: str) -> bool:
        """Establece un valor con expiración"""
        if not self.is_available:
            return False
        
        try:
            return self.redis_client.setex(key, expire, value)
        except Exception as e:
            logger.error(f"Cache setex error for key {key}: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Elimina una clave del caché"""
        if not self.is_available:
            return False
        
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            logger.error(f"Cache delete error for key {key}: {e}")
            return False
    
    def delete_pattern(self, pattern: str) -> int:
        """Elimina todas las claves que coincidan con un patrón"""
        if not self.is_available:
            return 0
        
        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                return self.redis_client.delete(*keys)
            return 0
        except Exception as e:
            logger.error(f"Cache delete pattern error for pattern {pattern}: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Verifica si una clave existe"""
        if not self.is_available:
            return False
        
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            logger.error(f"Cache exists error for key {key}: {e}")
            return False
    
    def expire(self, key: str, seconds: int) -> bool:
        """Establece tiempo de expiración para una clave"""
        if not self.is_available:
            return False
        
        try:
            return bool(self.redis_client.expire(key, seconds))
        except Exception as e:
            logger.error(f"Cache expire error for key {key}: {e}")
            return False
    
    def ttl(self, key: str) -> int:
        """Obtiene el tiempo de vida restante de una clave"""
        if not self.is_available:
            return -1
        
        try:
            return self.redis_client.ttl(key)
        except Exception as e:
            logger.error(f"Cache ttl error for key {key}: {e}")
            return -1
    
    def incr(self, key: str, amount: int = 1) -> Optional[int]:
        """Incrementa un valor numérico"""
        if not self.is_available:
            return None
        
        try:
            return self.redis_client.incr(key, amount)
        except Exception as e:
            logger.error(f"Cache incr error for key {key}: {e}")
            return None
    
    def decr(self, key: str, amount: int = 1) -> Optional[int]:
        """Decrementa un valor numérico"""
        if not self.is_available:
            return None
        
        try:
            return self.redis_client.decr(key, amount)
        except Exception as e:
            logger.error(f"Cache decr error for key {key}: {e}")
            return None
    
    # Métodos específicos para el negocio
    
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
    
    def cache_inventory_info(self, variant_id: int, info: Dict[str, Any], expire: int = 300) -> bool:
        """Cachea información de inventario"""
        key = f"inventory:{variant_id}"
        return self.setex(key, expire, json.dumps(info))
    
    def get_cached_inventory(self, variant_id: int) -> Optional[Dict[str, Any]]:
        """Obtiene información de inventario cacheada"""
        key = f"inventory:{variant_id}"
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
        # Crear clave única basada en query y filtros
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
    
    def cache_daily_stats(self, date: str, stats: Dict[str, Any]) -> bool:
        """Cachea estadísticas diarias"""
        key = f"daily_stats:{date}"
        # Las estadísticas diarias se cachean por 24 horas
        return self.setex(key, 86400, json.dumps(stats))
    
    def get_cached_daily_stats(self, date: str) -> Optional[Dict[str, Any]]:
        """Obtiene estadísticas diarias cacheadas"""
        key = f"daily_stats:{date}"
        cached = self.get(key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                self.delete(key)
        return None
    
    def invalidate_product_cache(self, variant_id: int) -> None:
        """Invalida caché relacionado con un producto"""
        patterns = [
            f"scan:*{variant_id}*",
            f"inventory:{variant_id}",
            f"search:*",  # Invalidar todas las búsquedas por simplicidad
            "daily_stats:*"
        ]
        
        for pattern in patterns:
            self.delete_pattern(pattern)
    
    def invalidate_inventory_cache(self, location_id: Optional[int] = None) -> None:
        """Invalida caché relacionado con inventario"""
        patterns = [
            "inventory:*",
            "search:*",
            "daily_stats:*",
            "low_stock_alerts"
        ]
        
        if location_id:
            patterns.append(f"location:{location_id}:*")
        
        for pattern in patterns:
            self.delete_pattern(pattern)
    
    def cache_low_stock_alerts(self, alerts: List[Dict[str, Any]], expire: int = 600) -> bool:
        """Cachea alertas de stock bajo"""
        key = "low_stock_alerts"
        data = {
            'alerts': alerts,
            'generated_at': datetime.now().isoformat(),
            'count': len(alerts)
        }
        return self.setex(key, expire, json.dumps(data))
    
    def get_cached_low_stock_alerts(self) -> Optional[Dict[str, Any]]:
        """Obtiene alertas de stock bajo cacheadas"""
        key = "low_stock_alerts"
        cached = self.get(key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                self.delete(key)
        return None
    
    def set_session_data(self, session_id: str, data: Dict[str, Any], expire: int = 3600) -> bool:
        """Establece datos de sesión"""
        key = f"session:{session_id}"
        return self.setex(key, expire, json.dumps(data))
    
    def get_session_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Obtiene datos de sesión"""
        key = f"session:{session_id}"
        cached = self.get(key)
        if cached:
            try:
                return json.loads(cached)
            except json.JSONDecodeError:
                self.delete(key)
        return None
    
    def delete_session(self, session_id: str) -> bool:
        """Elimina datos de sesión"""
        key = f"session:{session_id}"
        return self.delete(key)
    
    def cache_rate_limit(self, identifier: str, limit: int, window_seconds: int) -> bool:
        """Implementa rate limiting"""
        key = f"rate_limit:{identifier}"
        
        try:
            current = self.incr(key)
            if current == 1:
                self.expire(key, window_seconds)
            
            return current <= limit
        except Exception as e:
            logger.error(f"Rate limit error for {identifier}: {e}")
            return True  # En caso de error, permitir la operación
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas del caché"""
        if not self.is_available:
            return {'status': 'unavailable'}
        
        try:
            info = self.redis_client.info()
            return {
                'status': 'available',
                'connected_clients': info.get('connected_clients', 0),
                'used_memory': info.get('used_memory_human', '0B'),
                'total_commands_processed': info.get('total_commands_processed', 0),
                'keyspace_hits': info.get('keyspace_hits', 0),
                'keyspace_misses': info.get('keyspace_misses', 0),
                'hit_rate': self._calculate_hit_rate(info)
            }
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {'status': 'error', 'message': str(e)}
    
    def _calculate_hit_rate(self, info: Dict[str, Any]) -> float:
        """Calcula la tasa de aciertos del caché"""
        hits = info.get('keyspace_hits', 0)
        misses = info.get('keyspace_misses', 0)
        total = hits + misses
        
        if total == 0:
            return 0.0
        
        return round((hits / total) * 100, 2)
    
    def flush_all(self) -> bool:
        """Limpia todo el caché (usar con cuidado)"""
        if not self.is_available:
            return False
        
        try:
            return self.redis_client.flushdb()
        except Exception as e:
            logger.error(f"Error flushing cache: {e}")
            return False
    
    def health_check(self) -> Dict[str, Any]:
        """Verifica la salud del servicio de caché"""
        if not self.is_available:
            return {
                'status': 'unhealthy',
                'message': 'Redis connection not available'
            }
        
        try:
            # Test básico de ping
            self.redis_client.ping()
            
            # Test de escritura/lectura
            test_key = "health_check:test"
            test_value = "ok"
            
            self.set(test_key, test_value, 10)
            retrieved = self.get(test_key)
            self.delete(test_key)
            
            if retrieved == test_value:
                return {
                    'status': 'healthy',
                    'message': 'Cache service is working properly'
                }
            else:
                return {
                    'status': 'unhealthy',
                    'message': 'Cache read/write test failed'
                }
                
        except Exception as e:
            return {
                'status': 'unhealthy',
                'message': f'Cache health check failed: {e}'
            }