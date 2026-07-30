from fastapi import APIRouter, HTTPException
from bson import ObjectId
from datetime import datetime
from db.mongo import get_db
from typing import Optional
from models.schemas import SessionCreate, AnswerSubmit, FollowUpQuestion
from agents.orchestrator import orchestrate

router = APIRouter(prefix="/session", tags=["session"])

def parse_oid(session_id: str) -> ObjectId:
    if not ObjectId.is_valid(session_id):
        raise HTTPException(404, "Invalid session ID format")
    return ObjectId(session_id)

@router.post("/create")
async def create_session(body: SessionCreate, user_id: Optional[str] = None):
    db = get_db()
    doc = {
        **body.model_dump(),
        "user_id": user_id or None,
        "stage": "init",
        "resume_analysis": None,
        "gap_matrix": None,
        "interview_plan": None,
        "company_intel": None,
        "evaluations": [],
        "practice_drills": None,
        "analytics": None,
        "benchmark": None,
        "learning_path": None,
        "report": None,
        "motivation": None,
        "created_at": datetime.utcnow().isoformat()
    }
    result = await db.sessions.insert_one(doc)
    
    # Automatically update total_sessions & last_active in MongoDB users collection
    try:
        if user_id and ObjectId.is_valid(user_id):
            await db.users.update_one(
                {"_id": ObjectId(user_id)},
                {"$inc": {"total_sessions": 1}, "$set": {"last_active": datetime.utcnow().isoformat()}}
            )
        elif body.student_name:
            await db.users.update_one(
                {"$or": [{"name": body.student_name}, {"email": body.student_name}]},
                {"$inc": {"total_sessions": 1}, "$set": {"last_active": datetime.utcnow().isoformat()}}
            )
    except Exception:
        pass

    return {"session_id": str(result.inserted_id)}

@router.post("/{session_id}/analyze")
async def analyze(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    outcome = await orchestrate("analyze_resume", session)
    result = outcome["result"]
    await db.sessions.update_one(
        {"_id": oid},
        {"$set": {
            "resume_analysis": result["resume_analysis"],
            "gap_matrix": result["gap_matrix"],
            "stage": outcome["next_stage"]
        }}
    )
    return outcome

@router.post("/{session_id}/plan")
async def plan(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    outcome = await orchestrate("create_plan", session)
    result = outcome["result"]
    await db.sessions.update_one(
        {"_id": oid},
        {"$set": {
            "interview_plan": result["interview_plan"],
            "company_intel": result["company_intel"],
            "stage": outcome["next_stage"]
        }}
    )
    return outcome

@router.post("/{session_id}/followup")
async def followup(session_id: str, body: FollowUpQuestion):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    outcome = await orchestrate("generate_followup", session, {
        "question": body.question,
        "answer": body.answer
    })
    return outcome["result"]

@router.post("/{session_id}/benchmark")
async def benchmark(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    outcome = await orchestrate("benchmark", session)
    await db.sessions.update_one(
        {"_id": oid},
        {"$set": {"benchmark": outcome["result"]}}
    )
    return outcome["result"]

@router.post("/{session_id}/learning-path")
async def learning_path(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    outcome = await orchestrate("generate_learning_path", session)
    await db.sessions.update_one(
        {"_id": oid},
        {"$set": {"learning_path": outcome["result"]}}
    )
    return outcome["result"]

@router.post("/{session_id}/report")
async def report(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    session["_id"] = str(session["_id"])
    outcome = await orchestrate("write_report", session)
    await db.sessions.update_one(
        {"_id": oid},
        {"$set": {"report": outcome["result"]}}
    )
    return outcome["result"]

@router.post("/{session_id}/motivate")
async def motivate(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    outcome = await orchestrate("motivate", session)
    await db.sessions.update_one(
        {"_id": oid},
        {"$set": {"motivation": outcome["result"]}}
    )
    return outcome["result"]

@router.get("/{session_id}")
async def get_session(session_id: str):
    oid = parse_oid(session_id)
    db = get_db()
    session = await db.sessions.find_one({"_id": oid})
    if not session:
        raise HTTPException(404, "Session not found")
    session["_id"] = str(session["_id"])
    return session
