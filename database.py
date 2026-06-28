import os
from dotenv import load_dotenv
from supabase import create_client, Client

# .env 파일 로드
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase() -> Client:
    # Supabase 클라이언트 객체 생성 및 반환
    return create_client(SUPABASE_URL, SUPABASE_KEY)

# 싱글톤처럼 사용할 인스턴스
supabase_client = get_supabase()