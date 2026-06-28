import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Supabase config
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://your-project-url.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "your-supabase-anon-key")
    
    # OpenAI config
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "your-openai-api-key")
    
    model_config = SettingsConfigDict(env_file=".env")

settings = Settings()
