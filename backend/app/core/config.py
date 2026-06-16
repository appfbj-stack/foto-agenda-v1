from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./fotoagenda.db"
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 dias
    HERMES_API_URL: str = ""
    HERMES_EMAIL: str = ""
    HERMES_PASSWORD: str = ""

    # Kairos Admin integration
    KAIROS_ADMIN_URL: str = ""        # e.g. https://admin.fbautomacao.space
    KAIROS_CLIENT_ID: str = ""        # UUID assigned in Kairos Admin
    APP_SLUG: str = "foto-agenda-pro" # must match slug registered in Kairos Admin

    class Config:
        env_file = ".env"

settings = Settings()
