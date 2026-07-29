'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Agent3DMatrix from '@/components/Agent3DMatrix';
import {
  Brain, Play, Sparkles, Terminal, Cpu, Zap, Activity, Shield, Target,
  BookOpen, MessageSquare, Award, ArrowRight, Layers, RefreshCw, CheckCircle2,
  Code, Eye, Search, GitBranch, Heart, BarChart2, FileText, Lock, Radio, Database
} from 'lucide-react';

export interface AgentDetail {
  id: string;
  emoji: string;
  name: string;
  color: string;
  category: 'Analysis' | 'Strategy' | 'Interview' | 'Evaluation' | 'Power' | 'Output';
  shortDesc: string;
  background: string;
  systemPromptStrategy: string;
  inputSchema: string[];
  outputSchema: string[];
  sampleInput: Record<string, unknown>;
  sampleOutput: Record<string, unknown>;
}

export const AGENT_DETAILS: AgentDetail[] = [
  // ── Analysis ──
  {
    id: 'ResumeAnalyst',
    emoji: '📄',
    name: 'Resume Analyst',
    color: '#6366f1',
    category: 'Analysis',
    shortDesc: 'Extracts skills, project timeline, and role fit score (0-100).',
    background: 'Parses raw resume text into structured technical skills, project complexity, and initial fit scores using zero-shot domain taxonomy.',
    systemPromptStrategy: 'Uses 4,000-character context window protection with defensive JSON regex extraction to prevent parsing errors.',
    inputSchema: ['resume_text', 'target_role'],
    outputSchema: ['skills', 'projects', 'role_fit_score', 'summary'],
    sampleInput: { resume: 'Fullstack SDE with 3 yrs React, Node.js, Python, PostgreSQL, Redis experience.', role: 'Senior Software Engineer' },
    sampleOutput: { role_fit_score: 84, top_skills: ['React', 'Node.js', 'Python', 'PostgreSQL', 'Redis'], missing_skills: ['System Design', 'Docker'], summary: 'Solid technical background in full-stack web development.' }
  },
  {
    id: 'GapDetector',
    emoji: '🔍',
    name: 'Gap Detector',
    color: '#8b5cf6',
    category: 'Analysis',
    shortDesc: 'Constructs a 4-level severity matrix (None, Low, Medium, High).',
    background: 'Cross-evaluates candidate skills against target employer standards, highlighting critical gaps before the interview.',
    systemPromptStrategy: 'Constructs explicit severity matrices for missing competencies.',
    inputSchema: ['candidate_skills', 'role_requirements'],
    outputSchema: ['gap_matrix', 'critical_gaps', 'strengths', 'gap_score'],
    sampleInput: { candidate_skills: ['React', 'JavaScript'], role_requirements: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'] },
    sampleOutput: { gap_score: 65, critical_gaps: ['AWS', 'Docker'], gap_matrix: [{ skill: 'TypeScript', severity: 'medium' }, { skill: 'AWS', severity: 'high' }] }
  },
  {
    id: 'CompanyIntel',
    emoji: '🏢',
    name: 'Company Intel',
    color: '#a78bfa',
    category: 'Analysis',
    shortDesc: 'Injects employer culture, question mixes, and red flags.',
    background: 'Queries company-specific interview profiles (Amazon Leadership Principles vs Google Algorithmic Trade-offs vs TCS Aptitude).',
    systemPromptStrategy: 'Synthesizes employer-specific interview DNA and red flags to calibrate interviewer probes.',
    inputSchema: ['company_name', 'target_role'],
    outputSchema: ['interview_style', 'question_mix', 'red_flags', 'insider_tips'],
    sampleInput: { company_name: 'Amazon', target_role: 'Software Development Engineer' },
    sampleOutput: { style: 'Behavioral heavy with Leadership Principles. STAR format mandatory.', red_flags: ['Vague answers', 'No metrics'], insider_tips: ['Reference Customer Obsession with metrics'] }
  },

  // ── Strategy ──
  {
    id: 'Strategist',
    emoji: '♟️',
    name: 'Strategist',
    color: '#c4b5fd',
    category: 'Strategy',
    shortDesc: 'Generates dynamic 5-7 question interview blueprint.',
    background: 'Synthesizes Resume Analysis, Gap Detection, and Company Intel to build a calibrated interview roadmap.',
    systemPromptStrategy: 'Calculates question counts dynamically (Easy=3, Medium=5, Hard=7).',
    inputSchema: ['resume_analysis', 'gap_matrix', 'company_intel', 'difficulty'],
    outputSchema: ['total_questions', 'question_mix', 'focus_topics', 'questions'],
    sampleInput: { target_role: 'Frontend Engineer', experience: 'Fresher', target_company: 'Google' },
    sampleOutput: { total_questions: 5, focus_topics: ['DOM Performance', 'React Fiber Architecture', 'Async JS'], difficulty: 'Medium-Hard' }
  },
  {
    id: 'BenchmarkAgent',
    emoji: '📊',
    name: 'Benchmark Agent',
    color: '#7c3aed',
    category: 'Strategy',
    shortDesc: 'Computes peer percentile rankings and 4-tier badges.',
    background: 'Evaluates candidate readiness scores against industry standards for their experience level.',
    systemPromptStrategy: 'Ranks scores against baseline distributions returning percentiles and 4-tier badges (Needs Work, On Track, Rising Star, Top Performer).',
    inputSchema: ['readiness_score', 'target_role', 'experience_level'],
    outputSchema: ['percentile', 'expected_score', 'verdict', 'badge'],
    sampleInput: { readiness_score: 78, target_role: 'Software Engineer', experience_level: 'Fresher' },
    sampleOutput: { percentile: 82, expected_score: 60, verdict: 'Outperforming 82% of fresher applicants.', badge: 'Rising Star' }
  },

  // ── Interview ──
  {
    id: 'Interviewer',
    emoji: '🎙️',
    name: 'Interviewer Agent',
    color: '#06b6d4',
    category: 'Interview',
    shortDesc: 'Conducts interactive speech & technical mock interviews.',
    background: 'Presents tailored interview questions calibrated to the candidate target role and employer.',
    systemPromptStrategy: 'Maintains conversational interviewer tone while testing technical fundamentals.',
    inputSchema: ['question_blueprint', 'candidate_context'],
    outputSchema: ['question_text', 'topic', 'difficulty'],
    sampleInput: { topic: 'React State Management', difficulty: 'Medium' },
    sampleOutput: { question_text: 'How do you handle global state in React when prop drilling becomes unmanageable?' }
  },
  {
    id: 'FollowUpInterviewer',
    emoji: '🔗',
    name: 'Follow-Up Probe Agent',
    color: '#22d3ee',
    category: 'Interview',
    shortDesc: 'Generates 4 probe types (depth, clarification, challenge, extension).',
    background: 'Probes deeper when candidate answers lack concrete technical specifics or metrics.',
    systemPromptStrategy: 'Detects vague phrases and formulates sharp counter-questions.',
    inputSchema: ['original_question', 'student_answer', 'role'],
    outputSchema: ['followup_question', 'probe_type', 'reason'],
    sampleInput: { question: 'How do you optimize SQL queries?', answer: 'I add indexes to database tables.' },
    sampleOutput: { followup_question: 'What type of index would you choose for multi-column filtering and what is its trade-off?', probe_type: 'depth' }
  },

  // ── Evaluation ──
  {
    id: 'Evaluator',
    emoji: '⚖️',
    name: 'Evaluator Agent',
    color: '#10b981',
    category: 'Evaluation',
    shortDesc: 'Scores candidate answers on 5 distinct rubric dimensions.',
    background: 'Rigorously scores Content, Clarity, Confidence, Structure, and Technical Depth on a 1-10 scale.',
    systemPromptStrategy: 'Enforces strict rubric criteria without grade inflation.',
    inputSchema: ['question', 'answer', 'topic', 'target_role'],
    outputSchema: ['content_score', 'clarity_score', 'confidence_score', 'structure_score', 'depth_score', 'overall_score'],
    sampleInput: { question: 'Explain REST vs GraphQL', answer: 'GraphQL allows clients to request exact fields reducing over-fetching.' },
    sampleOutput: { overall_score: 8.2, content_score: 8.5, clarity_score: 8.0, depth_score: 8.0 }
  },
  {
    id: 'Coach',
    emoji: '🏋️',
    name: 'Coach Agent',
    color: '#34d399',
    category: 'Evaluation',
    shortDesc: 'Rewrites weak answers into high-impact STAR / technical format.',
    background: 'Transforms weak candidate responses into professional, metric-driven answers.',
    systemPromptStrategy: 'Adapts rewrite structure dynamically: STAR format for behavioral questions vs Structured Technical Breakdown for engineering questions.',
    inputSchema: ['question', 'answer', 'evaluation', 'question_type'],
    outputSchema: ['improved_answer', 'tips', 'star_format_used'],
    sampleInput: { question: 'Tell me about a challenging project', answer: 'I built a web app that crashed during launch but I fixed it.' },
    sampleOutput: { star_format_used: true, improved_answer: 'Situation: During product launch, our API server crashed under 50k DAU load. Task: Restore uptime... Action: Implemented Redis caching. Result: Latency reduced by 35%.', tips: ['Quantify load metrics', 'Detail root cause'] }
  },
  {
    id: 'ConfidenceLens',
    emoji: '🧠',
    name: 'Confidence Lens',
    color: '#6ee7b7',
    category: 'Evaluation',
    shortDesc: 'Detects hedging words, passive voice, and communication tone.',
    background: 'Analyzes speech transcripts for weak filler language like "I think", "maybe", or "I guess".',
    systemPromptStrategy: 'Combines Python word-counter metrics with LLM hedging signal analysis.',
    inputSchema: ['student_answer'],
    outputSchema: ['confidence_score', 'hedging_words_found', 'passive_voice_signals', 'confidence_tips'],
    sampleInput: { answer: 'I think maybe we could try using Docker to fix deployment issues, not sure though.' },
    sampleOutput: { confidence_score: 4, hedging_words_found: ['I think', 'maybe', 'not sure'], confidence_tips: ['Use definitive statements: say "I implemented Docker" instead of "I think maybe"'] }
  },

  // ── Power ──
  {
    id: 'JDAnalyst',
    emoji: '🎯',
    name: 'JD Analyst',
    color: '#f472b6',
    category: 'Power',
    shortDesc: 'Parses Job Descriptions into ATS keywords and culture signals.',
    background: 'Extracts must-have vs good-to-have skills and hidden employer culture requirements.',
    systemPromptStrategy: 'Categorizes job requirements into ATS keyword density vectors.',
    inputSchema: ['job_description_text'],
    outputSchema: ['must_have_skills', 'good_to_have_skills', 'ats_keywords', 'culture_signals'],
    sampleInput: { jd: 'Looking for a Senior Python Developer proficient in FastAPI, LangChain, PostgreSQL, Docker.' },
    sampleOutput: { must_have_skills: ['Python', 'FastAPI', 'LangChain'], ats_keywords: ['Python', 'FastAPI', 'RAG', 'Vector Database'] }
  },
  {
    id: 'ReadinessPredictor',
    emoji: '🔮',
    name: 'Readiness Predictor',
    color: '#e879f9',
    category: 'Power',
    shortDesc: 'Predicts offer readiness and round-by-round pass probabilities.',
    background: 'Holistically projects candidate pass rates for HR, Technical, and System Design rounds.',
    systemPromptStrategy: 'Calculates GO_NOW (score >= 80), GO_WITH_PREP (50-79), or NOT_YET (< 50) decisions.',
    inputSchema: ['analytics_data', 'gap_matrix', 'benchmark_data'],
    outputSchema: ['overall_readiness_score', 'go_no_go', 'round_predictions', 'days_to_interview_ready'],
    sampleInput: { readiness_score: 74, weak_topics: ['System Design'] },
    sampleOutput: { overall_readiness_score: 74, go_no_go: 'GO_WITH_PREP', round_predictions: { hr_round: 85, technical_round: 75, system_design: 60 }, days_to_interview_ready: 7 }
  },
  {
    id: 'STARFormatter',
    emoji: '📝',
    name: 'STAR Formatter',
    color: '#c084fc',
    category: 'Power',
    shortDesc: 'Restructures raw answers into Situation, Task, Action, Result.',
    background: 'Converts unstructured story narratives into structured STAR blocks.',
    systemPromptStrategy: 'Infers missing metrics and inserts placeholder markers like [X%] where metrics are needed.',
    inputSchema: ['raw_answer'],
    outputSchema: ['star_structured_answer', 'missing_elements'],
    sampleInput: { raw_answer: 'I helped my team build a search bar that made the app faster.' },
    sampleOutput: { star_structured_answer: 'Situation: App search was slow. Task: Speed up query response. Action: Implemented elasticsearch index. Result: Reduced search latency by [X%].', missing_elements: ['Quantifiable speed metric'] }
  },
  {
    id: 'SoftSkillsRadar',
    emoji: '🩺',
    name: 'Soft Skills Radar',
    color: '#f0abfc',
    category: 'Power',
    shortDesc: 'Evaluates behavioral competencies and "I" vs "We" signals.',
    background: 'Measures ownership, teamwork, leadership, and emotional intelligence.',
    systemPromptStrategy: 'Tracks pronoun frequency to detect teamwork vs individual contribution signals.',
    inputSchema: ['student_answer'],
    outputSchema: ['leadership_score', 'teamwork_score', 'ownership_score', 'pronoun_analysis'],
    sampleInput: { answer: 'We collaborated with the backend team to launch the feature on schedule.' },
    sampleOutput: { teamwork_score: 9.0, pronoun_analysis: { I_count: 0, We_count: 2, verdict: 'Strong team player' } }
  },
  {
    id: 'DevilsAdvocate',
    emoji: '⚔️',
    name: "Devil's Advocate",
    color: '#fb7185',
    category: 'Power',
    shortDesc: 'Simulates high-pressure FAANG interviewer pushback.',
    background: 'Challenges candidate assumptions with counter-examples and stress questions.',
    systemPromptStrategy: 'Generates 3 sharp pressure questions and interviewer sentiment ratings.',
    inputSchema: ['question', 'answer', 'role'],
    outputSchema: ['pressure_questions', 'interviewer_sentiment', 'rejection_risk'],
    sampleInput: { question: 'Why microservices?', answer: 'Because microservices scale better.' },
    sampleOutput: { pressure_questions: ['What about network latency overhead between microservices?'], rejection_risk: 'medium' }
  },
  {
    id: 'ATScorer',
    emoji: '🤖',
    name: 'ATS Scorer',
    color: '#fda4af',
    category: 'Power',
    shortDesc: 'Scores resume vs JD keyword match percentage.',
    background: 'Applies standard ATS parsing algorithms to score keyword density and missing section penalties.',
    systemPromptStrategy: 'Calculates section match scores (penalizing missing projects <30).',
    inputSchema: ['resume_text', 'job_description'],
    outputSchema: ['ats_match_score', 'keyword_density_score', 'missing_keywords', 'ats_pass_prediction'],
    sampleInput: { resume: 'Python React Developer', jd: 'Python React FastAPI Docker AWS SDE' },
    sampleOutput: { ats_match_score: 68, missing_keywords: ['FastAPI', 'Docker', 'AWS'], ats_pass_prediction: 'Moderate' }
  },

  // ── Output ──
  {
    id: 'LearningPath',
    emoji: '🗺️',
    name: 'Learning Path',
    color: '#f59e0b',
    category: 'Output',
    shortDesc: 'Generates personalized 7-day study roadmap.',
    background: 'Creates actionable 7-day study schedules targeting identified weak topics using verified domain URLs.',
    systemPromptStrategy: 'Generates 7 daily task objects with estimated study hours and curated links.',
    inputSchema: ['weak_topics', 'target_role'],
    outputSchema: ['plan', 'total_hours', 'priority_topic', 'study_tip'],
    sampleInput: { weak_topics: ['SQL Joins', 'System Design'], target_role: 'Software Engineer' },
    sampleOutput: { total_hours: 14, plan: [{ day: 1, topic: 'SQL Joins', focus: 'Master INNER and LEFT joins', estimated_hours: 2 }] }
  },
  {
    id: 'PracticeGenerator',
    emoji: '🎯',
    name: 'Practice Generator',
    color: '#fbbf24',
    category: 'Output',
    shortDesc: 'Creates rapid-fire drill exercises calibrated to scores.',
    background: 'Generates targeted practice drills (<5 Easy, 5-7 Medium, 8+ Hard).',
    systemPromptStrategy: 'Outputs score-calibrated drill questions with subtle one-line hints.',
    inputSchema: ['weak_topics', 'target_role', 'previous_scores'],
    outputSchema: ['drills'],
    sampleInput: { weak_topics: ['SQL Joins'], target_role: 'Data Analyst', previous_scores: [4.5] },
    sampleOutput: { drills: [{ topic: 'SQL Joins', question: 'Write a query to find employees without a department.', difficulty: 'Easy', hint: 'Use LEFT JOIN and check for NULL.' }] }
  },
  {
    id: 'ProgressAgent',
    emoji: '📈',
    name: 'Progress Agent',
    color: '#fb923c',
    category: 'Output',
    shortDesc: 'Tracks score velocity and macro trend across sessions.',
    background: 'Computes UTC session analytics, score trends, and topic groupings.',
    systemPromptStrategy: 'Calculates macro trend velocity (improving, declining, stable).',
    inputSchema: ['sessions_history'],
    outputSchema: ['readiness_score', 'score_breakdown', 'dim_averages', 'macro_trend'],
    sampleInput: { sessions: [{ score: 60 }, { score: 78 }] },
    sampleOutput: { readiness_score: 78, macro_trend: 'improving' }
  },
  {
    id: 'ReportWriter',
    emoji: '📋',
    name: 'Report Writer',
    color: '#f87171',
    category: 'Output',
    shortDesc: 'Compiles session findings into executive PDF report.',
    background: 'Synthesizes all 21 agent evaluation outputs into a concise readiness document.',
    systemPromptStrategy: 'Outputs structured executive summary, key strengths, gaps, and 2-3 recommendations.',
    inputSchema: ['session_data', 'evaluations', 'analytics'],
    outputSchema: ['title', 'executive_summary', 'key_strengths', 'key_gaps', 'recommendations', 'verdict'],
    sampleInput: { student_name: 'Jayanth S S', role: 'Software Engineer', readiness_score: 78 },
    sampleOutput: { title: 'Interview Readiness Report', executive_summary: 'Strong technical fundamentals in MERN and AI/ML.', verdict: 'Ready for tech rounds in 1 week.' }
  },
  {
    id: 'MotivationBot',
    emoji: '🔥',
    name: 'Motivation Bot',
    color: '#ef4444',
    category: 'Output',
    shortDesc: 'Data-backed encouragement & 3 immediate actions.',
    background: 'Delivers personalized motivation calibrated to current candidate performance.',
    systemPromptStrategy: 'Outputs score-calibrated tone, emoji, affirmation, and 3 immediate action items.',
    inputSchema: ['analytics', 'target_role', 'student_name'],
    outputSchema: ['message', 'emoji', 'next_steps', 'affirmation'],
    sampleInput: { student_name: 'Jayanth', readiness_score: 78 },
    sampleOutput: { message: "Jayanth, you're 78% ready! 3 focused days on System Design will push you past 85%.", emoji: '💪', next_steps: ['Practice 5 SQL problems', 'Rewrite STAR answer'] }
  },
  {
    id: 'CodeExecutionAgent',
    emoji: '💻',
    name: 'Code Execution Engine',
    color: '#38bdf8',
    category: 'Power',
    shortDesc: 'Live Python sandbox execution with Big-O analysis.',
    background: 'Executes Python code in an isolated sandbox capturing sys.stdout, execution latency, and time/space complexity.',
    systemPromptStrategy: 'Parses Python stdout, tracebacks, and computes algorithmic Big-O complexity.',
    inputSchema: ['code_content', 'test_cases'],
    outputSchema: ['stdout', 'latency_ms', 'big_o_time', 'big_o_space', 'traceback'],
    sampleInput: { code: 'def add(a, b): return a + b\nprint(add(2, 3))' },
    sampleOutput: { stdout: '5\n', latency_ms: 12, big_o_time: 'O(1)', big_o_space: 'O(1)', traceback: null }
  }
];

export default function AgentsPage() {
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail>(AGENT_DETAILS[0]);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<Record<string, unknown> | null>(null);
  const [execLatency, setExecLatency] = useState<number | null>(null);
  const [customInputJson, setCustomInputJson] = useState<string>('');

  useEffect(() => {
    setCustomInputJson(JSON.stringify(selectedAgent.sampleInput, null, 2));
    setExecResult(null);
    setExecLatency(null);
  }, [selectedAgent]);

  const handleExecuteAgent = async () => {
    setExecuting(true);
    setExecResult(null);
    const startMs = Date.now();
    try {
      let parsedPayload: Record<string, unknown> = {};
      try {
        parsedPayload = JSON.parse(customInputJson);
      } catch {
        parsedPayload = selectedAgent.sampleInput;
      }

      const res = (await api.executeAgentLab(selectedAgent.id, parsedPayload)) as Record<string, unknown>;
      setExecResult((res.output as Record<string, unknown>) || (res.result as Record<string, unknown>) || res);
      setExecLatency(Date.now() - startMs);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Inference failed';
      setExecResult({ error: msg, fallback: selectedAgent.sampleOutput });
      setExecLatency(Date.now() - startMs);
    } finally {
      setExecuting(false);
    }
  };

  const categories = ['ALL', 'Analysis', 'Strategy', 'Interview', 'Evaluation', 'Power', 'Output'];

  const filteredAgents = activeCategory === 'ALL'
    ? AGENT_DETAILS
    : AGENT_DETAILS.filter(a => a.category === activeCategory);

  return (
    <main style={{ minHeight: '100vh', background: '#030308', color: 'white', fontFamily: 'Inter,sans-serif', padding: '90px 32px 60px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      
      {/* Top Header */}
      <div style={{ width: '100%', margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 14px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 8 }}>
            <Cpu size={14} style={{ color: '#818cf8' }}/>
            <span style={{ fontSize: '0.72rem', fontFamily: 'Space Grotesk', fontWeight: 900, color: '#a5b4fc', letterSpacing: '0.08em' }}>
              21 SPECIALIZED LLM AGENTS · GROQ ENGINE (~380ms)
            </span>
          </div>
          <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', margin: 0, color: 'white' }}>
            Agent Laboratory & Live Sandbox
          </h1>
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '8px 16px', borderRadius: 12, fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                fontFamily: 'Space Grotesk', transition: 'all 0.2s',
                background: activeCategory === cat ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.03)',
                border: activeCategory === cat ? 'none' : '1px solid rgba(255,255,255,0.08)',
                color: activeCategory === cat ? 'white' : 'rgba(255,255,255,0.5)',
                boxShadow: activeCategory === cat ? '0 4px 15px rgba(99,102,241,0.3)' : 'none'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Jaw-Dropping 3D Live Agent Neural Matrix */}
      <Agent3DMatrix onSelectAgent={setSelectedAgent} selectedAgentId={selectedAgent.id} />

      {/* Main Balanced 2-Column Command Center */}
      <div style={{ width: '100%', margin: '0 auto', display: 'grid', gridTemplateColumns: '280px minmax(0, 1fr)', gap: 24, boxSizing: 'border-box' }}>
        
        {/* Left Agent List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '840px', overflowY: 'auto', paddingRight: 4 }}>
          {filteredAgents.map((ag) => {
            const isSel = selectedAgent.id === ag.id;
            return (
              <div
                key={ag.id}
                className="card-3d"
                onClick={() => setSelectedAgent(ag)}
                style={{
                  padding: '14px 16px', borderRadius: 16,
                  background: isSel ? `${ag.color}18` : 'rgba(13,13,26,0.7)',
                  border: `1px solid ${isSel ? ag.color : 'rgba(255,255,255,0.06)'}`,
                  boxShadow: isSel ? `0 0 20px ${ag.color}30` : 'none',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s ease'
                }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${ag.color}15`, border: `1px solid ${ag.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                  {ag.emoji}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.9rem', color: isSel ? 'white' : 'rgba(255,255,255,0.85)', margin: 0 }}>
                      {ag.name}
                    </h4>
                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: ag.color, background: `${ag.color}12`, border: `1px solid ${ag.color}25`, padding: '2px 6px', borderRadius: 6 }}>
                      {ag.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ag.shortDesc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Selected Agent Architecture & Live Sandbox Panel */}
        <div style={{ padding: '32px 36px', borderRadius: 24, background: 'rgba(13,13,26,0.85)', border: `1px solid ${selectedAgent.color}35`, backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: `${selectedAgent.color}20`, border: `1px solid ${selectedAgent.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem' }}>
                {selectedAgent.emoji}
              </div>
              <div>
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: selectedAgent.color, letterSpacing: '0.08em' }}>{selectedAgent.category.toUpperCase()} AGENT</span>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.7rem', color: 'white', margin: 0 }}>
                  {selectedAgent.name}
                </h2>
              </div>
            </div>

            <button
              onClick={handleExecuteAgent}
              disabled={executing}
              style={{
                padding: '12px 24px', borderRadius: 14,
                background: `linear-gradient(135deg, ${selectedAgent.color}, #8b5cf6)`, border: 'none',
                color: 'white', fontWeight: 900, fontSize: '0.88rem', cursor: 'pointer',
                fontFamily: 'Space Grotesk', boxShadow: `0 6px 25px ${selectedAgent.color}50`,
                display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0
              }}
            >
              <Play size={15} fill="white"/> {executing ? 'Executing Groq...' : '⚡ Run Live Groq Inference'}
            </button>
          </div>

          {/* Role & Prompt Strategy */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>AGENT PURPOSE & ROLE</span>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>
                {selectedAgent.background}
              </p>
            </div>

            <div style={{ padding: '20px', borderRadius: 16, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: selectedAgent.color, letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>SYSTEM PROMPT STRATEGY</span>
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', margin: 0, lineHeight: 1.6 }}>
                {selectedAgent.systemPromptStrategy}
              </p>
            </div>
          </div>

          {/* Schemas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>INPUT SCHEMA KEYS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedAgent.inputSchema.map(k => (
                  <span key={k} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'rgba(6,182,212,0.12)', color: '#22d3ee', fontFamily: 'monospace' }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>OUTPUT SCHEMA KEYS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedAgent.outputSchema.map(k => (
                  <span key={k} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '3px 9px', borderRadius: 6, background: 'rgba(16,185,129,0.12)', color: '#34d399', fontFamily: 'monospace' }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Full-Width Live Groq Inference Sandbox */}
          <div style={{ padding: '24px', borderRadius: 20, background: 'rgba(0,0,0,0.5)', border: `1px solid ${selectedAgent.color}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '0.85rem', color: 'white', letterSpacing: '0.06em' }}>
                ⚡ LIVE GROQ LLM INFERENCE TEST SANDBOX
              </span>
              {execLatency && (
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.15)', padding: '4px 12px', borderRadius: 8, fontFamily: 'monospace' }}>
                  ⚡ Groq Latency: {execLatency}ms
                </span>
              )}
            </div>

            {/* Input & Output Stacked Vertically for Full Width & Clean Alignment */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>INPUT PAYLOAD (EDITABLE JSON)</label>
                <textarea
                  value={customInputJson}
                  onChange={e => setCustomInputJson(e.target.value)}
                  rows={5}
                  style={{ width: '100%', padding: '14px 16px', borderRadius: 14, background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#a5b4fc', fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: 1.6, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>GROQ LLM LIVE RESULT</label>
                <pre style={{ margin: 0, padding: '16px', borderRadius: 14, background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: '#a7f3d0', fontFamily: 'monospace', fontSize: '0.85rem', minHeight: 180, maxHeight: 300, overflowY: 'auto', lineHeight: 1.6, boxSizing: 'border-box' }}>
                  {executing ? '⚙️ Processing Groq LLM Inference...' : execResult ? JSON.stringify(execResult, null, 2) : JSON.stringify(selectedAgent.sampleOutput, null, 2)}
                </pre>
              </div>
            </div>
          </div>

        </div>

      </div>

    </main>
  );
}
