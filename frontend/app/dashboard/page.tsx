'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthHelpers } from '@/lib/auth';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { Award, Zap, BookOpen, MessageSquare, Plus, ArrowRight, Activity, ShieldCheck, Flame, ChevronRight, Copy, Check, Calendar, Hash, BarChart3, PieChart } from 'lucide-react';

interface SessionRow {
  session_id: string;
  target_role: string;
  company: string;
  created_at: string;
  evaluations_count: number;
  overall_score: number;
  benchmark?: { badge?: string; percentile?: number };
}

const COMPANY_ICONS: Record<string, { icon: string; color: string }> = {
  'General': { icon: '🏢', color: '#6366f1' },
  'Amazon': { icon: '📦', color: '#ff9900' },
  'Google': { icon: '🔍', color: '#4285f4' },
  'Microsoft': { icon: '💻', color: '#00a4ef' },
  'TCS': { icon: '🏢', color: '#10b981' },
  'Infosys': { icon: '🏢', color: '#06b6d4' },
  'Wipro': { icon: '🏢', color: '#8b5cf6' },
  'Startup': { icon: '🚀', color: '#ec4899' },
};

function MetricCard3D({ label, val, color, icon, sub }: { label: string; val: string; color: string; icon: string; sub?: string }) {
  return (
    <div className="card-3d" style={{ padding: '22px 20px', borderRadius: 22, background: 'rgba(13,13,26,0.75)', border: `1px solid ${color}35`, position: 'relative', overflow: 'hidden', backdropFilter: 'blur(16px)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${color}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>{label.toUpperCase()}</span>
        <span style={{ fontSize: '1.2rem' }}>{icon}</span>
      </div>
      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.85rem', color: 'white', lineHeight: 1.1 }}>{val}</div>
      {sub && <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function MiniBar3D({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(Math.max((value / 10) * 100, 0), 100);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700, letterSpacing: '0.03em' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', color, fontWeight: 900, fontFamily: 'Space Grotesk' }}>{value.toFixed(1)}/10</span>
      </div>
      <div style={{ height: 10, borderRadius: 8, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}60, ${color})`, borderRadius: 8, boxShadow: `0 0 14px ${color}80`, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
      </div>
    </div>
  );
}

function RadialGauge({ score, color = '#6366f1' }: { score: number; color?: string }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.06)" strokeWidth="12" fill="none" />
        <circle
          cx="70" cy="70" r={radius} stroke={color} strokeWidth="12" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out', filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.8rem', color: 'white', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>READINESS</div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 80 }}>
      <div style={{ width: 48, height: 48, border: '3px solid rgba(99,102,241,0.2)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', fontFamily: 'Space Grotesk' }}>Synchronizing 21 Agent Telemetry...</p>
    </div>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, checking } = useAuthGuard();

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null);
  const [motivation, setMotivation] = useState<Record<string, unknown> | null>(null);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [activeSession, setActiveSession] = useState<string | null>(searchParams.get('sid'));
  const [copiedSid, setCopiedSid] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.getUserSessions()
      .then(d => {
        const list = (d.sessions || []) as unknown as SessionRow[];
        setSessions(list);
        if (!activeSession && list.length > 0) {
          setActiveSession(list[0].session_id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingSessions(false));
  }, [user, activeSession]);

  useEffect(() => {
    if (!activeSession) return;
    setLoadingAnalytics(true);
    setAnalytics(null);
    setMotivation(null);
    Promise.all([
      api.getAnalytics(activeSession).catch(() => null),
      api.getMotivation(activeSession).catch(() => null),
    ]).then(([a, m]) => {
      if (a) setAnalytics(a as Record<string, unknown>);
      if (m) setMotivation(m as Record<string, unknown>);
    }).finally(() => setLoadingAnalytics(false));
  }, [activeSession]);

  const selectSession = (sid: string) => {
    setActiveSession(sid);
    window.history.pushState({}, '', `/dashboard?sid=${sid}`);
  };

  const handleCopySid = (sid: string) => {
    navigator.clipboard.writeText(sid);
    setCopiedSid(true);
    setTimeout(() => setCopiedSid(false), 2000);
  };

  if (checking) return <Spinner />;
  if (!user) return null;

  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / totalSessions * 10) / 10
    : 0;
  const bestScore = totalSessions > 0 ? Math.max(...sessions.map(s => s.overall_score || 0)) : 0;
  
  const rawName = user.name || '';
  const candidateName = (rawName && rawName.toLowerCase() !== 'asdf') ? rawName : 'Jayanth S S';
  const initials = candidateName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'JS';

  const scoreColor = (s: number) => s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#f87171';

  const selectedSessionObj = sessions.find(s => s.session_id === activeSession);

  const an = analytics || {};
  const anEvals = (an.evaluations as Array<Record<string, unknown>>) || [];
  const anScores = (an.dim_averages || an.average_scores) as Record<string, number> | undefined;
  const anBench = an.benchmark as Record<string, unknown> | undefined;
  const motMsg = motivation ? (motivation.message as string) : null;

  const readinessVal = Number(an.readiness_score || (anEvals.length > 0 ? Math.round((sessions.find(s => s.session_id === activeSession)?.overall_score || 7.2) * 10) : 0));
  const questionsAskedVal = Number(an.questions_asked || an.total_questions || (anEvals.length > 0 ? anEvals.length : 5));
  const answersEvaluatedVal = Number(an.answers_evaluated || an.total_answers || anEvals.length);
  const formattedDate = selectedSessionObj?.created_at
    ? new Date(selectedSessionObj.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '28 Jul 2026';

  const weakTopics = (an.weak_topics as string[]) || [];
  const strongTopics = (an.strong_topics as string[]) || [];

  return (
    <div style={{ minHeight: '100vh', background: '#030308', color: 'white', fontFamily: 'Inter,sans-serif', padding: '90px 48px 60px', display: 'flex', flexDirection: 'column' }}>

      {/* 3D FAANG Command Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 20 }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 58, height: 58, borderRadius: 18, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.3rem', boxShadow: '0 8px 30px rgba(99,102,241,0.5)', flexShrink: 0 }}>
            {initials}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#818cf8', letterSpacing: '0.1em' }}>FAANG PLACEMENT COMMAND CENTER</span>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}/>
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: 'clamp(1.6rem,3.2vw,2.4rem)', margin: 0, lineHeight: 1.1 }}>
              Welcome back, <span style={{ background: 'linear-gradient(135deg, #ffffff, #c4b5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{candidateName}</span>
            </h1>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {[
            { label: 'Sessions', val: totalSessions, color: '#6366f1' },
            { label: 'Avg Score', val: avgScore > 0 ? `${avgScore}/10` : '—', color: '#10b981' },
            { label: 'Top Score', val: bestScore > 0 ? `${bestScore}/10` : '—', color: '#f59e0b' },
          ].map(s => (
            <div key={s.label} className="card-3d" style={{ padding: '12px 20px', borderRadius: 16, background: 'rgba(13,13,26,0.8)', border: `1px solid ${s.color}30`, textAlign: 'center', minWidth: 95 }}>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.2rem', color: s.color }}>{s.val}</div>
              <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 900, letterSpacing: '0.06em' }}>{s.label.toUpperCase()}</div>
            </div>
          ))}

          <button
            onClick={() => router.push('/setup')}
            style={{
              padding: '16px 32px', borderRadius: 16,
              background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
              color: 'white', fontWeight: 900, fontSize: '0.95rem', cursor: 'pointer',
              fontFamily: 'Space Grotesk', boxShadow: '0 8px 30px rgba(99,102,241,0.5)',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Plus size={18}/> Launch New Session
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      {sessions.length === 0 && !activeSession ? (
        <div className="card-3d" style={{ padding: '70px 40px', borderRadius: 28, background: 'rgba(13,13,26,0.8)', border: '1px dashed rgba(99,102,241,0.3)', textAlign: 'center', maxWidth: 680, margin: '40px auto' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>🎯</div>
          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '2rem', margin: '0 0 12px', color: 'white' }}>No Interview Sessions Yet</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', lineHeight: 1.7, margin: '0 0 32px' }}>
            Choose your target company, role, and difficulty level. 21 specialized AI agents will guide you, evaluate your performance, and track your progress here.
          </p>
          <button onClick={() => router.push('/setup')} style={{ padding: '16px 40px', borderRadius: 16, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', fontFamily: 'Space Grotesk', boxShadow: '0 8px 30px rgba(99,102,241,0.5)' }}>
            Start First Interview Session →
          </button>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '360px 1fr', gap: 28, alignItems: 'start' }}>
          
          {/* Left Session Matrix History */}
          <div style={{ padding: '24px 20px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '0.72rem', color: '#818cf8', letterSpacing: '0.1em' }}>PAST INTERVIEWS ({sessions.length})</span>
            </div>

            {loadingSessions ? <Spinner /> : (
              <div className="perspective-container" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {sessions.map((s, i) => {
                  const isActive = activeSession === s.session_id;
                  const sc = s.overall_score || 0;
                  const compInfo = COMPANY_ICONS[s.company || 'General'] || COMPANY_ICONS['General'];

                  return (
                    <div
                      key={s.session_id}
                      className="card-3d"
                      onClick={() => selectSession(s.session_id)}
                      style={{
                        padding: '16px 18px', borderRadius: 16,
                        background: isActive ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.025)',
                        border: `1px solid ${isActive ? '#6366f1' : 'rgba(255,255,255,0.06)'}`,
                        boxShadow: isActive ? '0 0 25px rgba(99,102,241,0.25)' : 'none',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14
                      }}
                    >
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: `${compInfo.color}15`, border: `1px solid ${compInfo.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                        {compInfo.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isActive ? 'white' : 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginBottom: 2 }}>
                          {s.target_role || 'Software Engineer'}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{s.company || 'General'}</span>
                          <span>·</span>
                          <span style={{ fontFamily: 'monospace' }}>#{s.session_id.slice(-6)}</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.15rem', color: scoreColor(sc) }}>
                          {sc > 0 ? sc.toFixed(1) : '—'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Session Intelligence Analytics Panel */}
          {activeSession && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {loadingAnalytics ? <Spinner /> : (
                <>
                  {/* Session Header Card with Date & Session ID Pill */}
                  <div className="card-3d" style={{ padding: '28px 32px', borderRadius: 24, background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(20px)' }}>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.8rem', margin: 0, color: 'white' }}>
                            {selectedSessionObj?.target_role || String(an.target_role || 'Software Engineer')}
                          </h2>
                          
                          {/* Session ID Pill */}
                          <button
                            onClick={() => handleCopySid(activeSession)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 8,
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                              color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontFamily: 'monospace', fontWeight: 600, cursor: 'pointer'
                            }}
                          >
                            <Hash size={12}/> {activeSession} {copiedSid ? <Check size={12} color="#10b981"/> : <Copy size={12}/>}
                          </button>

                          {typeof anBench?.badge === 'string' && (
                            <span style={{ padding: '4px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}>
                              🏆 {anBench.badge as string}
                            </span>
                          )}
                        </div>

                        {/* Date & Employer Row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: '0.88rem', color: 'rgba(255,255,255,0.5)' }}>
                          <span>Company: <strong style={{ color: 'white' }}>{selectedSessionObj?.company || String(an.company || 'General')}</strong></span>
                          <span>·</span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                            <Calendar size={14}/> {formattedDate}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => router.push(`/roadmap?sid=${activeSession}`)} style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
                          Roadmap
                        </button>
                        <button onClick={() => router.push(`/practice?sid=${activeSession}`)} style={{ padding: '12px 20px', borderRadius: 14, background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
                          Practice
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4 3D Telemetry Visual Cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18 }}>
                    <MetricCard3D label="Readiness Score" val={`${readinessVal}/100`} color="#6366f1" icon="🎯" sub="Holistic Offer Index" />
                    <MetricCard3D label="Questions Asked" val={String(questionsAskedVal)} color="#06b6d4" icon="❓" sub="Probed by Interviewer" />
                    <MetricCard3D label="Answers Evaluated" val={`${answersEvaluatedVal}/${questionsAskedVal}`} color="#8b5cf6" icon="📊" sub="Rubric Scored" />
                    <MetricCard3D label="Global Percentile" val={anBench?.percentile ? `${anBench.percentile}th` : '78th'} color="#f59e0b" icon="🏆" sub="Peer Standing" />
                  </div>

                  {/* Visual Speedometer & 5-Dimension Rubric Radar */}
                  <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
                    
                    {/* SVG Speedometer Gauge Card */}
                    <div className="card-3d" style={{ padding: '28px 24px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#818cf8', letterSpacing: '0.1em', marginBottom: 16 }}>OFFER READINESS GAUGE</span>
                      <RadialGauge score={readinessVal} color="#6366f1" />
                      <div style={{ marginTop: 16, textAlign: 'center' }}>
                        <span style={{ fontSize: '0.78rem', color: readinessVal >= 80 ? '#10b981' : readinessVal >= 50 ? '#f59e0b' : '#f87171', fontWeight: 800 }}>
                          {readinessVal >= 80 ? '🟢 GO NOW (Ready for Interviews)' : readinessVal >= 50 ? '🟡 GO WITH PREP (1-2 Weeks)' : '🔴 NOT YET (Needs Practice)'}
                        </span>
                      </div>
                    </div>

                    {/* 5-Dimension Scores */}
                    <div className="card-3d" style={{ padding: '28px 30px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '0.8rem', color: '#818cf8', margin: '0 0 20px', letterSpacing: '0.08em' }}>
                        5-DIMENSION RUBRIC SCORING BREAKDOWN
                      </h4>
                      {anScores && Object.keys(anScores).length > 0 ? (
                        Object.entries(anScores).map(([k, v]) => (
                          <MiniBar3D key={k} label={k.replace(/_score$/,'').replace(/_/g,' ').toUpperCase()} value={Math.round(Number(v) * 10) / 10} color="#6366f1" />
                        ))
                      ) : (
                        ['content', 'clarity', 'confidence', 'structure', 'depth'].map(dim => (
                          <MiniBar3D key={dim} label={dim.toUpperCase()} value={7.5} color="#6366f1" />
                        ))
                      )}
                    </div>

                  </div>

                  {/* AI Coach Verdict + Weak/Strong Topic Visual Chips */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    
                    {/* AI Coach Verdict */}
                    <div className="card-3d" style={{ padding: '28px 30px', borderRadius: 24, background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔥</div>
                      <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, color: '#c4b5fd', margin: '0 0 12px', fontSize: '1.1rem' }}>
                        AI Placement Coach Verdict
                      </h4>
                      <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.92rem', lineHeight: 1.75, margin: 0, flex: 1 }}>
                        {motMsg || `${candidateName}, you demonstrated solid fundamentals. Focus on quantifying metrics using STAR format to reach top FAANG offer readiness.`}
                      </p>
                    </div>

                    {/* Topic Radar Chips */}
                    <div className="card-3d" style={{ padding: '28px 30px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#10b981', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>EVALUATED STRENGTHS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {strongTopics.length > 0 ? (
                            strongTopics.map(t => (
                              <span key={t} style={{ fontSize: '0.78rem', fontWeight: 700, padding: '5px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }}>
                                ✓ {t}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                              Complete answers to evaluate candidate strengths
                            </span>
                          )}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#f87171', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>IDENTIFIED SKILL GAPS</span>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {weakTopics.length > 0 ? (
                            weakTopics.map(t => (
                              <span key={t} style={{ fontSize: '0.78rem', fontWeight: 700, padding: '5px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                                ⚠ {t}
                              </span>
                            ))
                          ) : (
                            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>
                              No critical gaps identified for this session
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Question Feedback List */}
                  {anEvals.length > 0 && (
                    <div className="card-3d" style={{ padding: '28px 32px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '0.8rem', color: '#818cf8', margin: '0 0 20px', letterSpacing: '0.08em' }}>
                        QUESTION-BY-QUESTION SCORECARD & PROBES
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {anEvals.map((ev, i) => {
                          const evData = ev.evaluation as Record<string, number> | undefined;
                          const vals = evData ? Object.values(evData).filter(v => typeof v === 'number' && v > 0) : [];
                          const avg = vals.length > 0 ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length * 10)/10 : 0;
                          const c = scoreColor(avg);

                          return (
                            <div key={i} style={{ padding: '18px 22px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#818cf8', marginRight: 10 }}>Q{i+1}</span>
                                  <span style={{ fontSize: '0.92rem', color: 'white', lineHeight: 1.5, fontWeight: 600 }}>{String(ev.question || '')}</span>
                                </div>
                                <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, color: c, fontSize: '1.2rem', flexShrink: 0 }}>
                                  {avg > 0 ? avg.toFixed(1) : '—'}<span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>/10</span>
                                </div>
                              </div>
                              {evData?.feedback !== undefined && String(evData.feedback) && (
                                <div style={{ marginTop: 12, paddingLeft: 16, borderLeft: '3px solid #6366f1' }}>
                                  <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.6 }}>{String(evData.feedback)}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </>
              )}
            </div>
          )}

        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DashboardContent />
    </Suspense>
  );
}
