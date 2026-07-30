import asyncio
import json
import os
import sys

# Fix Windows PowerShell encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "placement_mission_control")

async def view_database_records(show_full=False):
    print("=" * 85)
    print(f"  🍃 MONGODB DATABASE STORAGE INSPECTOR — {DB_NAME.upper()}")
    print("=" * 85)
    print(f"📍 Database Location : {MONGODB_URL}")
    print(f"📍 Database Name     : {DB_NAME}")
    print("-" * 85)

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    # Get collection names
    collections = await db.list_collection_names()
    print(f"\n📂 Active Collections in MongoDB: {collections}")

    # Inspect sessions collection
    if "sessions" in collections:
        total_sessions = await db.sessions.count_documents({})
        print(f"📊 Total Saved Interview Sessions in DB: {total_sessions}")
        
        cursor = db.sessions.find({}).sort("created_at", -1).limit(5)
        sessions = await cursor.to_list(length=5)
        
        print("\n--- 🕒 Recent Stored Sessions for Candidate Jayanth S S ---")
        for i, s in enumerate(sessions, 1):
            sid = str(s.get("_id"))
            name = s.get("student_name", "Jayanth S S")
            role = s.get("target_role", "Software Engineer")
            company = s.get("company", "General")
            evals_count = len(s.get("evaluations", []))
            created = s.get("created_at", "N/A")

            print(f"\n[{i}] Session Document ID : {sid}")
            print(f"    Candidate Name      : {name}")
            print(f"    Target Role & Company: {role} @ {company}")
            print(f"    Evaluations Recorded : {evals_count} Answer(s) Evaluated")
            print(f"    Created Timestamp   : {created}")

        if show_full and len(sessions) > 0:
            print("\n" + "=" * 85)
            print("  📄 RAW MONGODB JSON DOCUMENT RECORD (LATEST SESSION)")
            print("=" * 85)
            latest = sessions[0]
            latest["_id"] = str(latest["_id"])
            print(json.dumps(latest, indent=2, default=str))

    # Inspect users collection
    if "users" in collections:
        total_users = await db.users.count_documents({})
        print(f"\n👤 Registered Users Collection Count: {total_users}")

    print("\n" + "=" * 85)
    print("  ✅ MONGODB STORAGE DEMONSTRATION COMPLETE")
    print("=" * 85)

    client.close()

if __name__ == "__main__":
    show_full = "--full" in sys.argv
    asyncio.run(view_database_records(show_full))
