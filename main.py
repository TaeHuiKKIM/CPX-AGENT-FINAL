import json
from fastapi import FastAPI, HTTPException
from database import supabase_client

app = FastAPI()

@app.post("/seed-scenario")
def seed_fever_apn_scenario():
    try:
        # 1. 분리해둔 외부 JSON 파일을 읽어옵니다.
        with open("fever_data.json", "r", encoding="utf-8") as file:
            scenario_data = json.load(file)
            
        # 2. 읽어온 데이터를 그대로 Supabase DB에 밀어 넣습니다.
        response = supabase_client.table('scenarios').upsert(scenario_data).execute()
        
        return {"message": "DB 저장 성공!", "data": response.data}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))