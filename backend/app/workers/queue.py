from arq.connections import RedisSettings
from app.config import settings

# Parse the standard redis:// URL into an arq RedisSettings object
# arq supports RedisSettings.from_dsn()
try:
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
except AttributeError:
    # Fallback for older arq versions if from_dsn isn't available
    from urllib.parse import urlparse
    parsed = urlparse(settings.redis_url)
    redis_settings = RedisSettings(
        host=parsed.hostname or 'localhost',
        port=parsed.port or 6379,
        database=int(parsed.path.lstrip('/')) if parsed.path else 0
    )
