import asyncio
from .resume_analyst import analyze_resume
from .gap_detector import detect_gaps
from .strategist import create_plan
from .company_intel import get_company_intel
from .evaluator import evaluate_answer
from .coach import coach_answer
from .confidence_lens import analyze_confidence
from .interviewer import generate_followup
from .practice_generator import generate_drills
from .benchmark_agent import benchmark_performance
from .learning_path import generate_learning_path
from .report_writer import write_report
from .motivation_bot import motivate_student
from .progress_agent import compute_session_analytics

# Import broadcaster — gracefully fail if events module missing
try:
    from events import broadcast
except ImportError:
    async def broadcast(agent, status, action="", extra={}):
        pass


async def orchestrate(action: str, session: dict, payload: dict = {}) -> dict:
    stage = session.get("stage", "init")

    if action == "analyze_resume":
        resume_text = session.get("resume_text", "")
        target_role = session.get("target_role", "Software Engineer")

        await broadcast("ResumeAnalyst", "thinking", action)
        await broadcast("GapDetector", "thinking", action)

        resume_analysis, gap_matrix = await asyncio.gather(
            analyze_resume(resume_text, target_role),
            detect_gaps(resume_text, target_role)
        )

        await broadcast("ResumeAnalyst", "done", action)
        await broadcast("GapDetector", "done", action)

        return {
            "next_stage": "analyzed",
            "result": {"resume_analysis": resume_analysis, "gap_matrix": gap_matrix},
            "agent_used": "ResumeAnalyst+GapDetector"
        }

    elif action == "create_plan":
        company = session.get("company", "General")

        await broadcast("Strategist", "thinking", action)
        await broadcast("CompanyIntel", "thinking", action)

        interview_plan, company_intel = await asyncio.gather(
            create_plan(session["resume_analysis"], session["target_role"], session["difficulty"], session["language"]),
            get_company_intel(company, session["target_role"])
        )

        await broadcast("Strategist", "done", action)
        await broadcast("CompanyIntel", "done", action)

        return {
            "next_stage": "planned",
            "result": {"interview_plan": interview_plan, "company_intel": company_intel},
            "agent_used": "Strategist+CompanyIntel"
        }

    elif action == "evaluate_answer":
        q = payload["question"]
        a = payload["answer"]
        topic = payload.get("topic", "general")
        q_type = payload.get("question_type", "technical")

        await broadcast("Evaluator", "thinking", action)
        await broadcast("Coach", "thinking", action)
        await broadcast("ConfidenceLens", "thinking", action)

        evaluation, coaching, confidence = await asyncio.gather(
            evaluate_answer(q, a, topic, session["target_role"]),
            coach_answer(q, a, {}, q_type),
            analyze_confidence(a)
        )

        await broadcast("Evaluator", "done", action)
        await broadcast("Coach", "done", action)
        await broadcast("ConfidenceLens", "done", action)

        return {
            "next_stage": "interviewing",
            "result": {"evaluation": evaluation, "coaching": coaching, "confidence": confidence},
            "agent_used": "Evaluator+Coach+ConfidenceLens"
        }

    elif action == "generate_followup":
        await broadcast("FollowUpInterviewer", "thinking", action)
        result = await generate_followup(
            payload["question"], payload["answer"], session["target_role"]
        )
        await broadcast("FollowUpInterviewer", "done", action)
        return {"next_stage": stage, "result": result, "agent_used": "FollowUpInterviewer"}

    elif action == "benchmark":
        await broadcast("BenchmarkAgent", "thinking", action)
        analytics = compute_session_analytics(session)
        result = await benchmark_performance(
            analytics, session["target_role"], session.get("experience_level", "Fresher")
        )
        await broadcast("BenchmarkAgent", "done", action)
        return {"next_stage": stage, "result": result, "agent_used": "BenchmarkAgent"}

    elif action == "generate_learning_path":
        await broadcast("LearningPath", "thinking", action)
        analytics = compute_session_analytics(session)
        weak = analytics.get("weak_topics") or [session.get("target_role", "general")]
        result = await generate_learning_path(weak, session["target_role"])
        await broadcast("LearningPath", "done", action)
        return {"next_stage": stage, "result": result, "agent_used": "LearningPathAgent"}

    elif action == "write_report":
        await broadcast("ReportWriter", "thinking", action)
        result = await write_report(session)
        await broadcast("ReportWriter", "done", action)
        return {"next_stage": stage, "result": result, "agent_used": "ReportWriter"}

    elif action == "motivate":
        await broadcast("MotivationBot", "thinking", action)
        analytics = compute_session_analytics(session)
        result = await motivate_student(analytics, session["target_role"], session.get("student_name", "Student"))
        await broadcast("MotivationBot", "done", action)
        return {"next_stage": stage, "result": result, "agent_used": "MotivationBot"}

    elif action == "generate_practice":
        await broadcast("PracticeGenerator", "thinking", action)
        analytics = compute_session_analytics(session)
        drills = await generate_drills(
            analytics.get("weak_topics") or [session.get("target_role", "general")],
            session["target_role"],
            analytics.get("score_breakdown", [])
        )
        await broadcast("PracticeGenerator", "done", action)
        return {"next_stage": stage, "result": drills, "agent_used": "PracticeGenerator"}

    elif action == "get_analytics":
        await broadcast("ProgressAgent", "thinking", action)
        result = compute_session_analytics(session)
        await broadcast("ProgressAgent", "done", action)
        return {"next_stage": stage, "result": result, "agent_used": "ProgressAgent"}

    else:
        raise ValueError(f"Unknown action: {action}")
