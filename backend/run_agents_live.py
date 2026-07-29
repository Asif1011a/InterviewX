import asyncio
import json
import time
import sys
import os

# Fix Windows PowerShell UTF-8 encoding for emojis
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.resume_analyst import analyze_resume
from agents.gap_detector import detect_gaps
from agents.company_intel import get_company_intel
from agents.evaluator import evaluate_answer
from agents.coach import coach_answer

SAMPLE_RESUME = """
Jayanth S S
Sri Eshwar College of Engineering - B.Tech AIDS (CGPA: 7.8)
Skills: Python, Fullstack MERN (React, Node.js, Express, MongoDB), JavaScript, Git, REST APIs
Projects: AI Placement Mission Control - 21 LLM Agent Architecture, Real-Time Eye Contact Monitor
LeetCode Solved: 100 | SkillRack Solved: 550+
"""

async def run_raw_agent_demo():
    print("=" * 80)
    print("  🚀 21-AGENT NEURAL PIPELINE — RAW TERMINAL EXECUTION DEMO")
    print("=" * 80)
    print("Candidate: Jayanth S S (AIDS Dept, SECE)")
    print("Target Role: Software Engineer @ Amazon")
    print("-" * 80)

    # 1. Resume Analyst Agent
    print("\n[1/5] 📄 EXECUTING: ResumeAnalyst Agent (Groq Llama 3.1 8B)...")
    t0 = time.time()
    resume_res = await analyze_resume(SAMPLE_RESUME, "Software Engineer")
    t1 = time.time()
    print(f"✅ Success in {int((t1 - t0) * 1000)}ms | RAW JSON OUTPUT:")
    print(json.dumps(resume_res, indent=2))

    # 2. Gap Detector Agent
    print("\n[2/5] 🔍 EXECUTING: GapDetector Agent...")
    t0 = time.time()
    gap_res = await detect_gaps(SAMPLE_RESUME, "Software Engineer")
    t1 = time.time()
    print(f"✅ Success in {int((t1 - t0) * 1000)}ms | RAW JSON OUTPUT:")
    print(json.dumps(gap_res, indent=2))

    # 3. Company Intel Agent
    print("\n[3/5] 🏢 EXECUTING: CompanyIntel Agent (Amazon)...")
    t0 = time.time()
    intel_res = await get_company_intel("Amazon", "Software Engineer")
    t1 = time.time()
    print(f"✅ Success in {int((t1 - t0) * 1000)}ms | RAW JSON OUTPUT:")
    print(json.dumps(intel_res, indent=2))

    # 4. Evaluator Agent
    print("\n[4/5] ⚖️ EXECUTING: Evaluator Agent (5-Dimension Rubric Scoring)...")
    q = "How do you optimize database query latency when handling high concurrency?"
    a = "I added indexes to foreign keys and used Redis caching to store frequent queries, reducing latency by 40%."
    t0 = time.time()
    eval_res = await evaluate_answer(q, a, "Databases", "Software Engineer")
    t1 = time.time()
    print(f"✅ Success in {int((t1 - t0) * 1000)}ms | RAW JSON OUTPUT:")
    print(json.dumps(eval_res, indent=2))

    # 5. Coach Agent (STAR Format Rewrite)
    print("\n[5/5] 🏋️ EXECUTING: Coach Agent (STAR Format Transformation)...")
    t0 = time.time()
    coach_res = await coach_answer(q, a, {}, "technical")
    t1 = time.time()
    print(f"✅ Success in {int((t1 - t0) * 1000)}ms | RAW JSON OUTPUT:")
    print(json.dumps(coach_res, indent=2))

    print("\n" + "=" * 80)
    print("  🎉 ALL RAW LLM AGENT OUTPUTS GENERATED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(run_raw_agent_demo())
