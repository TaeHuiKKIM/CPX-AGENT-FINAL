import json
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def upload_scenarios():
    with open("cases.json", "r", encoding="utf-8") as f:
        scenarios = json.load(f)
    
    for s in scenarios:
        data = {
            "title": s["title"],
            "department": s["department"],
            "difficulty": s["difficulty"],
            "patient_info": s["patient_info"]
        }
        response = supabase.table("scenarios").insert(data).execute()
        print(f"Uploaded: {s['title']}")

if __name__ == "__main__":
    upload_scenarios()
