from supabase import create_client, Client
from core.config import settings

def get_supabase_client() -> Client:
    """Returns a Supabase client instance."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

async def log_transcript(session_id: str, speaker: str, content: str, audio_url: str = None):
    """
    Asynchronously logs a conversation transcript to Supabase.
    speaker: 'USER' or 'AI'
    """
    supabase = get_supabase_client()
    data = {
        "session_id": session_id,
        "speaker": speaker,
        "content": content,
        "audio_url": audio_url
    }
    # Fire and forget (or handle async properly in production)
    response = supabase.table("transcripts").insert(data).execute()
    return response

async def get_scenario_prompt(scenario_id: str) -> dict:
    """Fetches the scenario details from Supabase to build the LLM prompt."""
    supabase = get_supabase_client()
    response = supabase.table("scenarios").select("*").eq("scenario_id", scenario_id).execute()
    if response.data:
        return response.data[0]
    return None
