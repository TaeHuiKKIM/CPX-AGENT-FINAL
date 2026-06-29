import asyncio
from core.config import settings

try:
    from supabase import create_client, Client
except ModuleNotFoundError:
    create_client = None
    Client = object

_supabase_client = None

def get_supabase_client() -> Client:
    """Returns a singleton Supabase client instance."""
    global _supabase_client
    if create_client is None:
        raise RuntimeError("Supabase Python package is not installed.")
    if _supabase_client is None:
        _supabase_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    return _supabase_client

async def log_transcript(session_id: str, speaker: str, content: str, audio_url: str = None):
    """
    Asynchronously logs a conversation transcript to Supabase.
    speaker: 'USER' or 'AI'
    """
    if session_id.startswith("test-session"):
        return None  # 로그인 없이 진행하는 로컬 테스트이므로 DB 생략

    supabase = get_supabase_client()
    data = {
        "session_id": session_id,
        "speaker": speaker,
        "content": content,
        "audio_url": audio_url
    }
    
    try:
        response = await asyncio.to_thread(supabase.table("transcripts").insert(data).execute)
        return response
    except Exception as e:
        print(f"Error logging transcript: {e}")
        return None

async def get_scenario_prompt(scenario_id: str) -> dict:
    """Fetches the scenario details from Supabase to build the LLM prompt."""
    if create_client is None:
        return None
    supabase = get_supabase_client()
    response = await asyncio.to_thread(supabase.table("scenarios").select("*").eq("scenario_id", scenario_id).execute)
    if response.data:
        return response.data[0]
    return None
