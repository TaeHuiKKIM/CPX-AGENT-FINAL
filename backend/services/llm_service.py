import logging
# from openai import AsyncOpenAI
# from core.config import settings

logger = logging.getLogger(__name__)

# client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def generate_ai_reply(scenario_info: dict, conversation_history: list, mode: str) -> dict:
    """
    Generates a reply mimicking the standardized patient based on the prompt.
    Returns a dict with 'text' and optional 'tutor_guide' (if mode is LEARNING).
    (Placeholder for actual LLM call)
    """
    logger.info(f"Generating AI reply for mode: {mode}")
    
    # [TO-DO] Replace with actual OpenAI ChatCompletion logic
    # System Prompt Construction: Combine strict rules + scenario_info['patient_info']
    
    reply_text = "네, 아버지가 고혈압 약을 드시고 계십니다."
    tutor_guide = "다음에는 소화기 관련 증상을 확인해 보세요." if mode == 'LEARNING' else None
    
    return {
        "text": reply_text,
        "tutor_guide": tutor_guide
    }
