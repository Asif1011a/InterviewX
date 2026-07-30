from fastapi import APIRouter, HTTPException
from bson import ObjectId
from db.mongo import get_db
from agents.orchestrator import orchestrate
from agents.progress_agent import build_progress_history

router = APIRouter(prefix="/progress", tags=["progress"])

@router.get("/{session_id}/analytics")
async def get_analytics(session_id: str):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(404, "Invalid session ID format")
    db = get_db()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(404, "Session not found")

    outcome = await orchestrate("get_analytics", session)
    await db.sessions.update_one(
        {"_id": ObjectId(session_id)},
        {"$set": {"analytics": outcome["result"]}}
    )
    return outcome["result"]

@router.get("/student/{student_name}/history")
async def get_history(student_name: str):
    db = get_db()
    cursor = db.sessions.find(
        {"student_name": student_name},
        {"_id": 1, "target_role": 1, "analytics": 1, "created_at": 1}
    ).sort("created_at", -1).limit(500)
    sessions = await cursor.to_list(length=500)
    for s in sessions:
        s["_id"] = str(s["_id"])
    return build_progress_history(sessions)
