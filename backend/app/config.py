from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    redis_url: str
    secret_key: str
    run_migrations_on_startup: bool = False
    environment: str = "development"
    frontend_url: str
    cors_origins: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    refresh_token_expire_minutes: int = 10080
    smtp_host: str
    smtp_port: int
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = "alerts@ember.local"
    encryption_key: str = ""

    # OAuth
    google_client_id: str | None = None
    google_client_secret: str | None = None
    github_client_id: str | None = None
    github_client_secret: str | None = None
    google_redirect_uri: str = ""

    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        origins = [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]
        if self.frontend_url and self.frontend_url not in origins:
            origins.append(self.frontend_url)
        return origins

    @property
    def ENCRYPTION_KEY(self) -> str:
        return self.encryption_key

    @property
    def GOOGLE_CLIENT_ID(self) -> str:
        return self.google_client_id

    @property
    def GOOGLE_CLIENT_SECRET(self) -> str:
        return self.google_client_secret

    @property
    def GOOGLE_REDIRECT_URI(self) -> str:
        return self.google_redirect_uri


settings = Settings()
