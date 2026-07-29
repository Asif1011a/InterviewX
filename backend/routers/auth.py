from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel
from jose import jwt, JWTError
from db.mongo import get_db
import os, hashlib, secrets

SECRET_KEY = os.getenv("JWT_SECRET", "mission_control_super_secret_key_2024")
ALGORITHM  = "HS256"
EXPIRY_HOURS = 168  # 7 days

bearerScheme = HTTPBearer(auto_error=False)
router = APIRouter(prefix="/auth", tags=["auth"])

# ── Password helpers (no passlib/bcrypt — uses SHA-256 + salt) ────────────────
def _hash_password(password: str) -> str:
    salt = secrets.token_hex(32)
    h = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${h}"

def _verify_password(password: str, stored: str) -> bool:
    try:
        salt, h = stored.split("$", 1)
        return secrets.compare_digest(hashlib.sha256((salt + password).encode()).hexdigest(), h)
    except Exception:
        return False

# ── JWT helpers ────────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str, name: str) -> str:
    payload = {
        "sub": user_id, "email": email, "name": name,
        "exp": datetime.utcnow() + timedelta(hours=EXPIRY_HOURS)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(401, "Invalid or expired token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if not credentials:
        raise HTTPException(401, "Not authenticated")
    return decode_token(credentials.credentials)

# ── Schemas ────────────────────────────────────────────────────────────────────
class SignupBody(BaseModel):
    name: str
    email: str
    password: str

class LoginBody(BaseModel):
    email: str
    password: str

# ── Routes ─────────────────────────────────────────────────────────────────────
@router.post("/signup")
async def signup(body: SignupBody):
    if len(body.password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    db = get_db()
    existing = await db.users.find_one({"email": body.email.lower().strip()})
    if existing:
        raise HTTPException(400, "Email already registered. Please login.")
    hashed = _hash_password(body.password)
    doc = {
        "name": body.name.strip(),
        "email": body.email.lower().strip(),
        "password_hash": hashed,
        "created_at": datetime.utcnow().isoformat(),
        "total_sessions": 0,
        "best_score": 0,
        "streak_days": 0,
        "last_active": datetime.utcnow().isoformat()
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    token = create_token(user_id, body.email.lower().strip(), body.name.strip())
    return {"token": token, "user_id": user_id, "name": body.name.strip(), "email": body.email.lower().strip()}

@router.post("/login")
async def login(body: LoginBody):
    db = get_db()
    user = await db.users.find_one({"email": body.email.lower().strip()})
    if not user or not _verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(401, "Invalid email or password")
    user_id = str(user["_id"])
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"last_active": datetime.utcnow().isoformat()}}
    )
    token = create_token(user_id, user["email"], user["name"])
    return {"token": token, "user_id": user_id, "name": user["name"], "email": user["email"]}

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    from bson import ObjectId
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user["sub"])})
    if not user:
        raise HTTPException(404, "User not found")
    user["_id"] = str(user["_id"])
    user.pop("password_hash", None)
    return user

@router.get("/sessions")
async def user_sessions(current_user: dict = Depends(get_current_user)):
    """Return all sessions linked to this user for progress tracking."""
    db = get_db()
    user_id = current_user.get("sub", "")
    user_name = current_user.get("name", "")
    query: dict = {"$or": [{"user_id": user_id}]}
    if user_name:
        query["$or"].append({"student_name": {"$regex": f"^{user_name.strip()}$", "$options": "i"}})
    cursor = db.sessions.find(query).sort("created_at", -1).limit(30)
    sessions = []
    async for s in cursor:
        s["_id"] = str(s["_id"])
        sessions.append({
            "session_id": s["_id"],
            "target_role":       s.get("target_role"),
            "company":           s.get("company"),
            "created_at":        s.get("created_at"),
            "evaluations_count": len(s.get("evaluations", [])),
            "overall_score":     _avg_score(s.get("evaluations", [])),
            "benchmark":         s.get("benchmark"),
        })
    return {"sessions": sessions}

def _avg_score(evals: list) -> float:
    if not evals:
        return 0
    dims = ["content_score", "clarity_score", "confidence_score", "structure_score", "depth_score"]
    scores = []
    for e in evals:
        ev = e.get("evaluation", {})
        vals = [ev.get(k, 0) for k in dims if ev.get(k, 0) > 0]
        if vals:
            scores.append(sum(vals) / len(vals))
    return round(sum(scores) / len(scores), 1) if scores else 0
