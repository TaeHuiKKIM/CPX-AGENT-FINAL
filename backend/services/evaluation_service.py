import logging
import json
import asyncio
from core.exceptions import CPXException
from services.supabase_db import get_supabase_client
from services.llm_service import generate_content_with_model_fallback

logger = logging.getLogger(__name__)
MAX_EVALUATION_TRANSCRIPT_CHARS = 9000

FEVER_CHECKLIST_ITEMS = [
    {"id": 1, "domain": "병력 청취-주제 관련", "criterion": "발열이 시작된 시기와 지속 기간을 질문하였다."},
    {"id": 2, "domain": "병력 청취-주제 관련", "criterion": "발열의 양상, 직접 측정 여부, 측정 체온, 변화 양상, 간헐적/지속적 발열 시간대를 질문하였다."},
    {"id": 3, "domain": "병력 청취-주제 관련", "criterion": "주변에 비슷한 증상을 호소하는 사람이 있는지 확인하였다."},
    {"id": 4, "domain": "병력 청취-주제 관련", "criterion": "전신 증상인 오한, 체중 변화, 근육통, 식은땀을 질문하였다."},
    {"id": 5, "domain": "병력 청취-주제 관련", "criterion": "호흡기, 소화기, 비뇨기, 중추신경계, 피부 발진, 관절통 등 동반 증상을 질문하였다."},
    {"id": 6, "domain": "병력 청취-주제 관련", "criterion": "상부 호흡기 증상과 하부 호흡기 증상을 나누어 질문하였다."},
    {"id": 7, "domain": "병력 청취-주제 관련", "criterion": "탈수 증상인 목마름과 어지러움을 질문하였다."},
    {"id": 8, "domain": "병력 청취-주제 관련", "criterion": "발열 원인 질환의 중증도와 관련된 위험 요인을 확인하였다."},
    {"id": 9, "domain": "병력 청취-주제 관련", "criterion": "최근 여행력, 접촉력, 음식 복용을 질문하였다."},
    {"id": 10, "domain": "병력 청취-주제 관련", "criterion": "최근 야외 활동 또는 벌레 물림 여부를 질문하였다."},
    {"id": 11, "domain": "병력 청취-기본", "criterion": "과거력, 자가면역 질환, 악성 종양 등을 질문하였다."},
    {"id": 12, "domain": "병력 청취-기본", "criterion": "복용 약물, 해열제 사용 여부와 반응을 질문하였다."},
    {"id": 13, "domain": "병력 청취-기본", "criterion": "음주력과 흡연력을 질문하였다."},
    {"id": 14, "domain": "병력 청취-기본", "criterion": "가족력과 직업력을 질문하였다."},
    {"id": 15, "domain": "병력 청취-기본", "criterion": "현재 거주지와 근무 환경을 확인하였다."},
    {"id": 16, "domain": "신체 진찰", "criterion": "체온을 포함한 활력징후를 확인하였다."},
    {"id": 17, "domain": "신체 진찰", "criterion": "결막 및 공막의 이상을 관찰하였다."},
    {"id": 18, "domain": "신체 진찰", "criterion": "구강 탈수와 인후부 진찰을 시행하였다."},
    {"id": 19, "domain": "신체 진찰", "criterion": "경부 림프절을 촉진하였다."},
    {"id": 20, "domain": "신체 진찰", "criterion": "흉부를 시진-촉진-타진-청진 순서로 진찰하였다."},
    {"id": 21, "domain": "신체 진찰", "criterion": "복부를 시진-청진-타진-촉진 순서로 진찰하였다."},
    {"id": 22, "domain": "신체 진찰", "criterion": "전신 피부 소견과 탈수 소견을 확인하였다."},
    {"id": 23, "domain": "신체 진찰", "criterion": "관절염 의심 시 압통, 부종, 열감, 발적을 확인하였다."},
    {"id": 24, "domain": "신체 진찰", "criterion": "늑골척추각 압통을 확인하였다."},
    {"id": 25, "domain": "신체 진찰", "criterion": "수막 자극 징후를 확인하였다."},
    {"id": 26, "domain": "신체 진찰-공통", "criterion": "신체 진찰 전 물 또는 소독용 알코올로 손위생을 시행하였다."},
    {"id": 27, "domain": "신체 진찰-공통", "criterion": "신체 진찰 시 필요한 만큼만 옷이나 가운을 노출하였다."},
    {"id": 28, "domain": "신체 진찰-공통", "criterion": "시행할 신체 검진을 미리 설명하거나 진찰 결과를 설명하였다."},
    {"id": 29, "domain": "신체 진찰-공통", "criterion": "신체 진찰 과정에서 불편이 있었는지 점검하였다."},
    {"id": 30, "domain": "임상 술기", "criterion": "혈액배양을 위한 채혈에 대해 설명하고 시행하였다."},
    {"id": 31, "domain": "환자 교육", "criterion": "추정 진단에 대해 설명하였다."},
    {"id": 32, "domain": "환자 교육", "criterion": "법정 감염병의 종류를 알고 보고 가능함을 설명하였다."},
    {"id": 33, "domain": "환자 교육", "criterion": "향후 진단 계획을 설명하였다."},
    {"id": 34, "domain": "환자 교육", "criterion": "향후 치료 계획을 설명하였다."},
    {"id": 35, "domain": "환자 교육", "criterion": "응급 상황 및 감염병 예방을 교육하였다."},
    {"id": 36, "domain": "PPI", "criterion": "쉬운 용어, 개방형 질문, 1회 이상 요약을 사용하였다."},
    {"id": 37, "domain": "PPI", "criterion": "말을 끊지 않고 적절한 호응과 경청을 보였다."},
    {"id": 38, "domain": "PPI", "criterion": "눈맞춤, 거리, 자세, 목소리 크기와 속도가 적절하였다."},
    {"id": 39, "domain": "PPI", "criterion": "단정한 용모, 적절한 자기소개, 과도한 희망/경고를 피하는 신뢰감을 보였다."},
    {"id": 40, "domain": "PPI", "criterion": "적절한 공감 표현을 하고 사무적·반말조 태도를 피하였다."},
]

async def evaluate_transcript(transcripts: list, scenario_id: str, rubric_data: dict, pe_log: dict = None) -> dict:
    """
    Core function to evaluate a transcript against a rubric using Gemini 2.5 Flash.
    Returns the structured evaluation JSON.
    """
    logger.info(f"Generating AI Evaluation for scenario: {scenario_id}")
    
    # 1. Format transcripts into a single string for the prompt
    conversation_lines = []
    for msg in transcripts:
        # Support both {"speaker": "doctor", "text": "..."} and {"role": "user", "content": "..."}
        speaker = msg.get("speaker", msg.get("role", "unknown"))
        if speaker in ["doctor", "user"]:
            speaker_role = "의사(학생)"
        elif speaker == "system":
            speaker_role = "시스템(신체진찰 기록)"
        else:
            continue
        content = msg.get("text", msg.get("content", ""))
        if content:
            conversation_lines.append(f"{speaker_role}: {content}")
        
    conversation_text = "\n".join(conversation_lines)[-MAX_EVALUATION_TRANSCRIPT_CHARS:]
    checklist_text = "\n".join(f"{item['id']}. [{item['domain']}] {item['criterion']}" for item in FEVER_CHECKLIST_ITEMS)
    pe_log_text = json.dumps(pe_log, ensure_ascii=False) if pe_log else "신체진찰 로그 없음"
    
    system_instruction = f"""
    당신은 의과대학 실기시험(CPX)의 전문 평가 교수입니다.
    학생(의사)과 표준환자(AI) 간의 대화 기록(Transcript) 및 신체진찰 로그를 바탕으로 학생의 진료 역량을 평가하십시오.
    
    채점은 반드시 발열 CPX 공통 체크리스트 40개 항목으로만 진행합니다.
    - 각 항목은 Yes 또는 No만 가능합니다.
    - 부분점수와 항목별 가중치는 없습니다.
    - 최종 점수는 (Yes 개수 / 40) * 100 입니다.
    - 학생이 직접 질문/진찰/설명/교육한 경우에만 Yes입니다.
    - 환자가 먼저 말한 정보는 학생이 능동적으로 확인하지 않았다면 No입니다.
    - 시나리오별 루브릭은 참고 맥락일 뿐이며 총점 산식에 반영하지 않습니다.
    
    [시나리오 ID]
    {scenario_id}
    
    [공통 발열 Yes/No 체크리스트 40항목]
    {checklist_text}

    응답은 반드시 간결하게 작성하십시오.
    - items 전체 40개를 다시 쓰지 마십시오.
    - Yes로 판단한 항목 번호와 짧은 근거만 반환하십시오.
    - strengths, weaknesses, explainable_feedback은 각각 최대 3개만 반환하십시오.
    """
    
    prompt = f"""
    아래 대화 기록을 분석하여 지정된 JSON 스키마에 맞춰 평가 결과를 반환하십시오.
    채점은 매우 엄격하고 객관적으로 진행해야 하며, 총 40개 항목을 빠짐없이 반환해야 합니다.
    신체진찰 항목은 대화 중 시스템 메시지와 별도 신체진찰 로그를 함께 근거로 판단하십시오.
    
    [대화 기록]
    {conversation_text}

    [신체진찰 로그]
    {pe_log_text}
    """
    
    response_schema = {
        "type": "object",
        "properties": {
            "yes_items": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "integer"},
                        "evidence": {"type": "string", "description": "학생이 직접 수행한 짧은 근거"}
                    },
                    "required": ["id", "evidence"]
                },
                "description": "Yes 판정 항목만 반환"
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": "학생의 강점 (긍정적인 피드백) 2~3가지"
            },
            "weaknesses": {
                "type": "array",
                "items": {"type": "string"},
                "description": "학생의 약점 (개선점) 2~3가지"
            },
            "clinical_reasoning_flow": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "question": {"type": "string", "description": "루브릭 또는 문진상 확인했어야 할 핵심 질문 요약"},
                        "category": {"type": "string", "description": "병력(O,L,D,C,A,R,S), 과거력, 가족력, 공감 등 카테고리"},
                        "status": {"type": "string", "description": "'asked' (질문함) 또는 'missed' (놓침)"}
                    },
                    "required": ["question", "category", "status"]
                },
                "description": "임상 추론 흐름 검증 (주요 질문들의 달성 여부 분석)"
            },
            "explainable_feedback": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "topic": {"type": "string", "description": "피드백 주제 (예: 가족력 확인 누락, 공감 표현 우수)"},
                        "reason": {"type": "string", "description": "해당 질문을 해야 하는 의학적 이유 또는 칭찬 사유"}
                    },
                    "required": ["topic", "reason"]
                },
                "description": "상세한 교정 피드백"
            }
        },
        "required": ["yes_items", "strengths", "weaknesses", "clinical_reasoning_flow", "explainable_feedback"]
    }
    
    try:
        response = await generate_content_with_model_fallback(
            contents=[{"role": "user", "parts": [{"text": prompt}]}],
            config={
                "system_instruction": system_instruction,
                "response_mime_type": "application/json",
                "response_schema": response_schema,
                "temperature": 0.2,
            },
            max_retries=1,
        )
        
        result_json = json.loads(response.text)
        return normalize_checklist_result(result_json, pe_log)
    except Exception as e:
        logger.error(f"Gemini Evaluation Error: {e}")
        return build_empty_checklist_result(str(e), pe_log)

def normalize_checklist_result(result_json: dict, pe_log: dict = None) -> dict:
    if "yes_items" in result_json and "items" not in result_json:
        yes_by_id = {}
        for item in result_json.get("yes_items") or []:
            try:
                yes_by_id[int(item.get("id"))] = item.get("evidence", "")
            except (TypeError, ValueError):
                continue
        raw_items = [
            {
                **base,
                "result": "Yes" if base["id"] in yes_by_id else "No",
                "evidence": yes_by_id.get(base["id"], "")
            }
            for base in FEVER_CHECKLIST_ITEMS
        ]
    else:
        raw_items = result_json.get("items") or []

    item_by_id = {}
    for item in raw_items:
        try:
            item_by_id[int(item.get("id"))] = item
        except (TypeError, ValueError):
            continue

    normalized_items = []
    for base in FEVER_CHECKLIST_ITEMS:
        raw = item_by_id.get(base["id"], {})
        result = "Yes" if str(raw.get("result", "")).strip().lower() == "yes" else "No"
        normalized_items.append({
            **base,
            "result": result,
            "evidence": raw.get("evidence", "") if result == "Yes" else raw.get("evidence", "")
        })

    yes_count = sum(1 for item in normalized_items if item["result"] == "Yes")
    total_items = len(FEVER_CHECKLIST_ITEMS)
    total_score = round((yes_count / total_items) * 100, 1)
    missed_items = []
    raw_missed = {int(item.get("id")): item for item in result_json.get("missed_items", []) if str(item.get("id", "")).isdigit()}

    for item in normalized_items:
        if item["result"] == "No":
            raw = raw_missed.get(item["id"], {})
            missed_items.append({
                "id": item["id"],
                "domain": item["domain"],
                "criterion": item["criterion"],
                "why_it_matters": raw.get("why_it_matters", "발열 CPX에서 감염원, 중증도, 진찰 안전성 또는 환자 교육 완성도를 판단하는 데 필요합니다.")
            })

    result_json.update({
        "score_total": total_score,
        "yes_count": yes_count,
        "total_items": total_items,
        "scoring_mode": "fever_checklist_yes_no_100_no_weight",
        "items": normalized_items,
        "missed_items": missed_items,
        "total_score": total_score,
        "score_history_taking": domain_score(normalized_items, "병력"),
        "score_communication": domain_score(normalized_items, "PPI"),
        "score_education": domain_score(normalized_items, "환자 교육"),
        "score_physical_exam": domain_score(normalized_items, "신체 진찰"),
        "physical_exam_logs": pe_log
    })
    return result_json

def domain_score(items: list, domain_keyword: str) -> float:
    domain_items = [item for item in items if domain_keyword in item["domain"]]
    if not domain_items:
        return 0.0
    yes_count = sum(1 for item in domain_items if item["result"] == "Yes")
    return round((yes_count / len(domain_items)) * 100, 1)

def build_empty_checklist_result(error_message: str, pe_log: dict = None) -> dict:
    items = [{**item, "result": "No", "evidence": ""} for item in FEVER_CHECKLIST_ITEMS]
    return {
        "score_total": 0.0,
        "yes_count": 0,
        "total_items": len(FEVER_CHECKLIST_ITEMS),
        "scoring_mode": "fever_checklist_yes_no_100_no_weight",
        "items": items,
        "missed_items": [
            {
                "id": item["id"],
                "domain": item["domain"],
                "criterion": item["criterion"],
                "why_it_matters": "채점 중 오류가 발생해 수행 근거를 확인하지 못했습니다."
            }
            for item in FEVER_CHECKLIST_ITEMS
        ],
        "score_history_taking": 0.0,
        "score_communication": 0.0,
        "score_education": 0.0,
        "score_physical_exam": 0.0,
        "total_score": 0.0,
        "physical_exam_logs": pe_log,
        "strengths": ["채점 중 오류가 발생했습니다."],
        "weaknesses": [error_message],
        "clinical_reasoning_flow": [],
        "explainable_feedback": []
    }

def calculate_pe_score(pe_log: dict):
    # 8개 신체진찰 채점 축
    score = 100
    feedbacks = []
    
    if not pe_log.get("introDone"):
        score -= 10
        feedbacks.append("[신체진찰 - 개방형 확인] 진입 선언(개방형 환자 확인)이 누락되었습니다.")
        
    hyg = pe_log.get("hygEvents", [])
    if len(hyg) == 0:
        score -= 15
        feedbacks.append("[신체진찰 - 손소독] 손소독을 한 번도 수행하지 않았습니다.")
    elif len(hyg) < 2:
        score -= 5
        feedbacks.append("[신체진찰 - 손소독] 손소독 횟수가 부족합니다. (권장: 접촉 전/후)")
        
    if pe_log.get("usedTime", 0) > 40: # 과도한 시간 차감
        score -= 10
        feedbacks.append("[신체진찰 - 시간 관리] 진찰에 불필요한 과도한 시간을 소모했습니다.")
        
    timeline = pe_log.get("timeline", [])
    for ev in timeline:
        gates = ev.get("gates", [])
        if gates:
            for g in gates:
                if "손소독 누락" in g:
                    continue # 위에서 종합 평가
                score -= 5
                feedbacks.append(f"[신체진찰 - 절차 위반] {ev.get('label', '항목')} 수행 시: {g}")
                
        # 순서 위반 (청진 선행 위반 등)
        if ev.get("orderOk") is False:
            score -= 10
            feedbacks.append(f"[신체진찰 - 시행 순서] {ev.get('label', '항목')}: 복부 진찰 순서(시-청-타-촉)를 위반했습니다.")
            
    performed = pe_log.get("performed", {})
    if not performed:
        score -= 20
        feedbacks.append("[신체진찰 - 항목 적절성] 신체진찰 항목을 하나도 수행하지 않았습니다.")
        
    return max(0, score), feedbacks

async def evaluate_session(session_id: str, pe_log: dict = None):
    """
    Evaluates a DB-saved CPX session based on its transcripts and rubric.
    Generates explainable feedback and updates the feedback_results table.
    """
    logger.info(f"Starting DB evaluation for session: {session_id}")
    supabase = get_supabase_client()
    
    # 1. Fetch Transcripts and Session in parallel
    transcripts_task = asyncio.to_thread(
        supabase.table("transcripts").select("*").eq("session_id", session_id).order("timestamp", desc=False).execute
    )
    session_task = asyncio.to_thread(
        supabase.table("sessions").select("scenario_id").eq("session_id", session_id).execute
    )
    
    transcripts_resp, session_resp = await asyncio.gather(transcripts_task, session_task)
        
    if not transcripts_resp.data:
        raise CPXException("No transcripts found for this session.", status_code=404)
        
    if not session_resp.data:
        raise CPXException("Session not found.", status_code=404)
        
    scenario_id = session_resp.data[0]["scenario_id"]
    
    # 3. Fetch Rubric
    rubric_resp = await asyncio.to_thread(
        supabase.table("rubrics").select("*").eq("scenario_id", scenario_id).execute
    )
    rubric_data = rubric_resp.data[0] if rubric_resp.data else None
    
    # 4. Call LLM for Evaluation
    eval_result = await evaluate_transcript(transcripts_resp.data, scenario_id, rubric_data, pe_log)
    
    # 5. Insert / Update Feedback Results in Supabase
    feedback_data = {
        "session_id": session_id,
        "rubric_id": rubric_data["rubric_id"] if rubric_data else None,
        "score_history_taking": eval_result.get("score_history_taking"),
        "score_communication": eval_result.get("score_communication"),
        "score_education": eval_result.get("score_education"),
        "score_physical_exam": eval_result.get("score_physical_exam"),
        "physical_exam_logs": eval_result.get("physical_exam_logs"),
        "total_score": eval_result.get("total_score"),
        "strengths": eval_result.get("strengths"),
        "weaknesses": eval_result.get("weaknesses"),
        "clinical_reasoning_flow": eval_result.get("clinical_reasoning_flow"),
        "explainable_feedback": eval_result.get("explainable_feedback"),
    }
    
    existing = await asyncio.to_thread(
        supabase.table("feedback_results").select("result_id").eq("session_id", session_id).execute
    )
    
    if existing.data:
        res = await asyncio.to_thread(
            supabase.table("feedback_results").update(feedback_data).eq("session_id", session_id).execute
        )
    else:
        res = await asyncio.to_thread(
            supabase.table("feedback_results").insert(feedback_data).execute
        )
        
    logger.info(f"Evaluation completed for DB session: {session_id}")
    return res.data[0] if res.data else None
