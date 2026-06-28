import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.llm_service import generate_new_scenario

router = APIRouter()
logger = logging.getLogger(__name__)

class ScenarioRequest(BaseModel):
    disease: str
    symptom: str

@router.post("/generate")
async def generate_scenario_api(req: ScenarioRequest):
    """
    Generates a new CPX scenario based on the provided disease and symptom.
    """
    try:
        scenario = await generate_new_scenario(disease=req.disease, symptom=req.symptom)
        return {"status": "success", "data": scenario}
    except Exception as e:
        logger.error(f"Error generating scenario: {str(e)}")
        raise HTTPException(status_code=500, detail="시나리오 생성 중 오류가 발생했습니다.")
