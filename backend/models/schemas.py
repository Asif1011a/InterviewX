from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class SessionCreate(BaseModel):
    student_name: str
    resume_text: str
    target_role: str
    language: str = "English"
    difficulty: str = "Medium"
    company: str = "General"
    experience_level: str = "Fresher"

class ResumeAnalysis(BaseModel):
    skills: List[str]
    projects: List[str]
    achievements: List[str]
    weak_areas: List[str]
    role_fit_score: int
    summary: str

class GapItem(BaseModel):
    skill: str
    student_level: str
    required_level: str
    severity: str

class GapMatrix(BaseModel):
    gap_matrix: List[GapItem]
    critical_gaps: List[str]
    strengths: List[str]
    gap_score: int
    gap_summary: str

class InterviewPlan(BaseModel):
    total_questions: int
    question_mix: Dict[str, int]
    focus_topics: List[str]
    questions: List[Dict[str, str]]

class AnswerSubmit(BaseModel):
    session_id: str
    question_index: int
    question: str
    answer: str

class EvaluationScore(BaseModel):
    content_score: int
    clarity_score: int
    confidence_score: int
    structure_score: int
    depth_score: int
    overall_score: int
    missing_points: List[str]
    strengths: List[str]

class CoachFeedback(BaseModel):
    improved_answer: str
    tips: List[str]
    star_format_used: bool

class ConfidenceAnalysis(BaseModel):
    confidence_score: int
    hedging_words_found: List[str]
    passive_voice_signals: int
    specificity_score: int
    answer_word_count: int
    is_too_short: bool
    is_too_vague: bool
    confidence_level: str
    confidence_tips: List[str]

class FollowUpQuestion(BaseModel):
    session_id: str
    question: str
    answer: str

class BenchmarkResult(BaseModel):
    level: str
    expected_score: int
    student_score: int
    percentile: int
    verdict: str
    comparison: str
    next_milestone: str
    badge: str

class ResourceItem(BaseModel):
    title: str
    url: str
    type: str

class DayPlan(BaseModel):
    day: int
    topic: str
    focus: str
    tasks: List[str]
    resources: List[Dict[str, str]]
    estimated_hours: float

class LearningPath(BaseModel):
    plan: List[DayPlan]
    total_hours: float
    priority_topic: str
    study_tip: str

class MotivationOutput(BaseModel):
    message: str
    emoji: str
    next_steps: List[str]
    affirmation: str
    estimated_ready_in: str

class PracticeDrill(BaseModel):
    topic: str
    question: str
    hint: str
    difficulty: str

class SessionSummary(BaseModel):
    session_id: str
    student_name: str
    target_role: str
    overall_readiness: int
    weak_topics: List[str]
    strong_topics: List[str]
    answers_evaluated: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserSessionLink(BaseModel):
    user_id: Optional[str] = None
