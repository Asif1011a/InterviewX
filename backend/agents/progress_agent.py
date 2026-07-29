from datetime import datetime, timezone
from typing import Any, Dict, List

DIMS = ["content_score", "clarity_score", "confidence_score", "structure_score", "depth_score"]

def compute_session_analytics(session: Dict[str, Any]) -> Dict[str, Any]:
    evaluations = session.get("evaluations", [])
    now_iso = datetime.now(timezone.utc).isoformat()

    # Pre-populate dimension defaults for zero state
    default_dims = {dim.replace("_score", ""): 0.0 for dim in DIMS}

    if not evaluations:
        return {
            "readiness_score": 0,
            "weak_topics": [],
            "strong_topics": [],
            "score_breakdown": [],
            "dim_averages": default_dims,
            "answers_evaluated": 0,
            "computed_at": now_iso
        }

    scores = [e.get("evaluation", {}).get("overall_score", 0) for e in evaluations]
    avg_score = sum(scores) / len(scores) if scores else 0.0

    # 1. Group scores per topic to prevent duplicate weak/strong classification
    topic_scores: Dict[str, List[float]] = {}
    for e in evaluations:
        topic = e.get("topic", "general").strip()
        score = e.get("evaluation", {}).get("overall_score", 0)
        topic_scores.setdefault(topic, []).append(score)

    weak_topics = []
    strong_topics = []

    for topic, t_scores in topic_scores.items():
        topic_avg = sum(t_scores) / len(t_scores)
        if topic_avg < 6.0:
            weak_topics.append(topic)
        elif topic_avg >= 7.0:
            strong_topics.append(topic)

    # 2. Per-dimension averages across all answers
    dim_averages = {}
    for dim in DIMS:
        vals = [e.get("evaluation", {}).get(dim, 0) for e in evaluations]
        dim_averages[dim.replace("_score", "")] = round(sum(vals) / len(vals), 1) if vals else 0.0

    plan_qs = session.get("interview_plan", {}).get("questions", [])
    questions_asked_count = len(plan_qs) if plan_qs else len(evaluations)

    return {
        "session_id": str(session.get("_id", "")),
        "created_at": session.get("created_at", now_iso),
        "company": session.get("company", "General"),
        "target_role": session.get("target_role", "Software Engineer"),
        "readiness_score": round(avg_score * 10),
        "total_questions": questions_asked_count,
        "questions_asked": questions_asked_count,
        "answers_evaluated": len(evaluations),
        "weak_topics": weak_topics,
        "strong_topics": strong_topics,
        "score_breakdown": scores,
        "dim_averages": dim_averages,
        "evaluations": evaluations,
        "computed_at": now_iso
    }


def build_progress_history(sessions: List[Dict[str, Any]]) -> Dict[str, Any]:
    history = []
    
    for s in sessions:
        if not s:
            continue
        
        analytics = s.get("analytics") or {}
        
        # Check explicitly for None to handle readiness_score = 0 safely
        if analytics.get("readiness_score") is None:
            analytics = compute_session_analytics(s)

        history.append({
            "date": s.get("created_at", ""),
            "readiness_score": analytics.get("readiness_score", 0),
            "role": s.get("target_role", ""),
            "company": s.get("company", "General"),
            "session_id": str(s.get("_id", ""))
        })

    # Calculate macro progress trend across sessions
    overall_trend = "insufficient_data"
    if len(history) >= 2:
        recent_score = history[-1]["readiness_score"]
        previous_score = history[-2]["readiness_score"]
        diff = recent_score - previous_score
        
        if diff > 3:
            overall_trend = "improving"
        elif diff < -3:
            overall_trend = "declining"
        else:
            overall_trend = "stable"

    return {
        "sessions": history,
        "total_sessions": len(history),
        "overall_trend": overall_trend
    }
