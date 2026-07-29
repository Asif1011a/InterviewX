from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from db.mongo import get_db
from agents.jd_analyst import analyze_jd
from agents.readiness_predictor import predict_readiness
from agents.star_formatter import format_star
from agents.soft_skills import assess_soft_skills
from agents.devil_advocate import challenge_answer
from agents.ats_scorer import score_ats

router = APIRouter(prefix="/advanced", tags=["advanced-agents"])

class JDRequest(BaseModel):
    jd_text: str
    candidate_role: str

class STARRequest(BaseModel):
    question: str
    answer: str
    role: str

class DevilRequest(BaseModel):
    question: str
    answer: str
    role: str
    company: str = "General"

class ATSRequest(BaseModel):
    resume_text: str
    jd_text: str

@router.post("/jd-analyze")
async def jd_analyze(body: JDRequest):
    return await analyze_jd(body.jd_text, body.candidate_role)

@router.post("/readiness/{session_id}")
async def readiness(session_id: str):
    db = get_db()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(404, "Session not found")
    session["_id"] = str(session["_id"])
    result = await predict_readiness(session)
    await db.sessions.update_one({"_id": ObjectId(session_id)}, {"$set": {"readiness": result}})
    return result

@router.post("/star-format")
async def star_format(body: STARRequest):
    return await format_star(body.question, body.answer, body.role)

@router.post("/soft-skills/{session_id}")
async def soft_skills(session_id: str):
    db = get_db()
    session = await db.sessions.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(404, "Session not found")
    answers = [{"question": e.get("question",""), "answer": e.get("answer","")} for e in session.get("evaluations",[])]
    result = await assess_soft_skills(answers, session.get("target_role",""), session.get("company",""))
    await db.sessions.update_one({"_id": ObjectId(session_id)}, {"$set": {"soft_skills": result}})
    return result

@router.post("/devil-advocate")
async def devil_advocate(body: DevilRequest):
    return await challenge_answer(body.question, body.answer, body.role, body.company)

@router.post("/ats-score")
async def ats_score(body: ATSRequest):
    return await score_ats(body.resume_text, body.jd_text)
