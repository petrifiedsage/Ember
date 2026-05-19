from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5433/ember"
    redis_url: str = "redis://localhost:6379/0"
    secret_key: str = "change-me"
    run_migrations_on_startup: bool = False
    environment: str = "development"
    frontend_url: str = "http://localhost:5173"
    cors_origins: str = "http://localhost:5173"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    refresh_token_expire_minutes: int = 10080
    smtp_host: str = "localhost"
    smtp_port: int = 1025
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "alerts@mailscope.local"
    encryption_key: str = ""
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins


settings = Settings()
