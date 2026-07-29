from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from db.mongo import connect_db, close_db
from routers import session, interview, progress, resume, agents_router, auth, new_agents_router, agent_lab

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="AI Placement Mission Control", lifespan=lifespan)

# Standard robust CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Catch-all OPTIONS handler to guarantee preflight request success
@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return JSONResponse(
        content="OK",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )

app.include_router(session.router)
app.include_router(interview.router)
app.include_router(progress.router)
app.include_router(resume.router)
app.include_router(agents_router.router)
app.include_router(auth.router)
app.include_router(new_agents_router.router)
app.include_router(agent_lab.router)

@app.get("/health")
async def health():
    return {"status": "ok", "service": "AI Placement Mission Control"}
