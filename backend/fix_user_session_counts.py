import asyncio
import os
import sys

# Fix Windows PowerShell UTF-8 encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "placement_mission_control")

async def sync_user_session_stats():
    print("=" * 80)
    print("  🔄 SYNCING USER SESSION COUNTS & BEST SCORES IN MONGODB")
    print("=" * 80)

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    users = await db.users.find({}).to_list(length=100)
    print(f"Found {len(users)} user(s) in 'users' collection.\n")

    for user in users:
        uid_str = str(user["_id"])
        uname = user.get("name", "")
        uemail = user.get("email", "")

        # Find matching sessions by user_id OR student_name OR email
        query = {
            "$or": [
                {"user_id": uid_str},
                {"student_name": uname},
                {"student_name": uemail}
            ]
        }
        user_sessions = await db.sessions.find(query).to_list(length=1000)
        session_count = len(user_sessions)

        # Calculate best score across all evaluations
        best_score = 0.0
        for s in user_sessions:
            evals = s.get("evaluations", [])
            for e in evals:
                overall = e.get("evaluation", {}).get("overall_score", 0.0)
                if isinstance(overall, (int, float)) and overall > best_score:
                    best_score = float(overall)

        now_str = datetime.utcnow().isoformat()

        # Update user document in MongoDB users collection
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "total_sessions": session_count,
                "best_score": round(best_score * 10, 1) if best_score <= 10 else round(best_score, 1),
                "streak_days": max(1, session_count),
                "last_active": now_str
            }}
        )

        print(f"✅ User Updated: {uname} ({uemail})")
        print(f"   · Total Sessions: {session_count}")
        print(f"   · Best Score    : {best_score} / 10")
        print(f"   · Streak Days   : {max(1, session_count)}")

    print("\n" + "=" * 80)
    print("  🎉 MONGODB USER STATS SYNC COMPLETE! CHECK COMPASS NOW!")
    print("=" * 80)

    client.close()

if __name__ == "__main__":
    asyncio.run(sync_user_session_stats())
