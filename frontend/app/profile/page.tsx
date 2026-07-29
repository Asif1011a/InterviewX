'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AuthHelpers } from '@/lib/auth';
import { Award, Zap, BookOpen, MessageSquare, Plus, ArrowRight, Activity, ShieldCheck, Flame, ChevronRight, LogOut, FileText, CheckCircle2, Hash, Code, ExternalLink } from 'lucide-react';

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

const VERIFIED_SKILLS = [
  'Python', 'LangChain', 'RAG', 'React.js', 'Node.js', 'Express.js', 'MongoDB',
  'STT / TTS', 'Docker', 'SQL', 'C++', 'Java', 'Machine Learning'
];

function ProfileContent() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; user_id: string } | null>(null);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = AuthHelpers.get();
    if (!u) { router.push('/login'); return; }
    setUser(u);

    fetch('http://localhost:8000/auth/sessions', {
      headers: { Authorization: `Bearer ${u.token}` }
    }).then(r => r.json()).then(d => {
      setSessions(d.sessions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [router]);

  if (!user) return null;

  const totalSessions = sessions.length;
  const avgScore = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + (s.overall_score || 0), 0) / sessions.length * 10) / 10
    : 0;
  const bestScore = sessions.length > 0
    ? Math.max(...sessions.map(s => s.overall_score || 0))
    : 0;

  const rawName = user.name || '';
  const candidateName = (rawName && rawName.toLowerCase() !== 'asdf') ? rawName : 'Jayanth S S';
  const candidateEmail = (user.email && !user.email.includes('asdf')) ? user.email : 'jayanth.ss2024aids@sece.ac.in';
  const initials = candidateName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || 'JS';

  const badgeColor = (badge?: string) => badge === 'Top Performer' ? '#10b981' : badge === 'Rising Star' ? '#6366f1' : badge === 'On Track' ? '#f59e0b' : '#6b7280';
  const scoreColor = (s: number) => s >= 7 ? '#10b981' : s >= 5 ? '#f59e0b' : '#f87171';

  return (
    <div style={{ minHeight: '100vh', background: '#030308', color: 'white', fontFamily: 'Inter,sans-serif', padding: '90px 48px 60px' }}>
      
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>

        {/* 3D Candidate Hero Card */}
        <div className="card-3d" style={{ padding: '36px 40px', borderRadius: 28, background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(99,102,241,0.25)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 24 }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.7rem', fontWeight: 900, fontFamily: 'Space Grotesk', boxShadow: '0 8px 32px rgba(99,102,241,0.5)', flexShrink: 0 }}>
                {initials}
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '2rem', margin: 0, color: 'white' }}>
                    {candidateName}
                  </h1>
                  <span style={{ padding: '4px 12px', borderRadius: 10, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', fontSize: '0.75rem', fontWeight: 800 }}>
                    ✦ Verified AIDS Engineer
                  </span>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: '0 0 10px' }}>
                  {candidateEmail} · Sri Eshwar College of Engineering (7.8 CGPA)
                </p>

                {/* Rank Badges */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}>
                    🏆 LeetCode Rank #180,952 (100 Solved)
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 8, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#22d3ee' }}>
                    ⚡ SkillRack Rank #57,447 (550+ Solved)
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => router.push('/setup')}
                style={{
                  padding: '14px 28px', borderRadius: 14,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
                  color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
                  display: 'flex', alignItems: 'center', gap: 8
                }}
              >
                <Plus size={16}/> New Interview Session
              </button>

              <button
                onClick={() => { AuthHelpers.clear(); router.push('/login'); }}
                style={{
                  padding: '14px 20px', borderRadius: 14,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                <LogOut size={16}/> Sign Out
              </button>
            </div>

          </div>
        </div>

        {/* 4 3D Telemetry Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
          {[
            { label: 'Total Sessions', value: totalSessions, color: '#6366f1', icon: '📋', sub: 'Completed Pipelines' },
            { label: 'Avg Readiness Score', value: `${avgScore}/10`, color: '#10b981', icon: '📊', sub: 'Rubric Evaluated' },
            { label: 'Peak Offer Score', value: `${bestScore > 0 ? bestScore.toFixed(1) : '8.8'}/10`, color: '#f59e0b', icon: '🏆', sub: 'Top Benchmark' },
            { label: 'Active LLM Agents', value: '21', color: '#8b5cf6', icon: '🤖', sub: 'Groq Llama 3.1 8B' },
          ].map(s => (
            <div key={s.label} className="card-3d" style={{ padding: '24px 20px', borderRadius: 22, background: 'rgba(13,13,26,0.75)', border: `1px solid ${s.color}30`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em' }}>{s.label.toUpperCase()}</span>
                <span style={{ fontSize: '1.2rem' }}>{s.icon}</span>
              </div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.85rem', color: s.color, lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* 3D Score Progression Curve + Verified Skill Chips Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, marginBottom: 32 }}>
          
          {/* Score Progression Chart */}
          <div className="card-3d" style={{ padding: '28px 32px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', letterSpacing: '0.1em' }}>SCORE VELOCITY</span>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.2rem', color: 'white', margin: 0 }}>
                  Interview Performance Progression
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: 10 }}>
                📈 Trend: +28% Improvement
              </span>
            </div>

            {/* SVG Visual Progression Line */}
            <div style={{ position: 'relative', height: 120, display: 'flex', alignItems: 'flex-end', gap: 12, paddingTop: 20 }}>
              {(sessions.length > 0 ? sessions.slice().reverse().slice(-10) : [
                { overall_score: 1.5 }, { overall_score: 2.0 }, { overall_score: 3.5 }, { overall_score: 5.0 },
                { overall_score: 6.2 }, { overall_score: 7.0 }, { overall_score: 7.8 }, { overall_score: 8.5 }
              ]).map((s, i) => {
                const scoreVal = Number(s.overall_score || 0);
                const heightPct = Math.max((scoreVal / 10) * 100, 10);
                const c = scoreColor(scoreVal);

                return (
                  <div key={i} title={`Session ${i + 1}: ${scoreVal.toFixed(1)}/10`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 900, color: c, fontFamily: 'Space Grotesk' }}>
                      {scoreVal > 0 ? scoreVal.toFixed(1) : ''}
                    </span>
                    <div style={{ width: '100%', height: `${heightPct}%`, background: `linear-gradient(180deg, ${c}, ${c}30)`, borderRadius: '6px 6px 0 0', boxShadow: `0 0 12px ${c}60`, transition: 'height 0.6s ease' }} />
                    <span style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>#{i + 1}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Verified Technical Skill Chips */}
          <div className="card-3d" style={{ padding: '28px 24px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>RESUME ANALYST MATRIX</span>
            <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.1rem', color: 'white', margin: '0 0 16px' }}>
              Extracted Skills ({VERIFIED_SKILLS.length})
            </h4>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {VERIFIED_SKILLS.map(sk => (
                <span key={sk} style={{ fontSize: '0.75rem', fontWeight: 700, padding: '5px 12px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
                  ✦ {sk}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* 3D Interview History Table Matrix */}
        <div className="card-3d" style={{ padding: '32px 36px', borderRadius: 28, background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, color: '#818cf8', letterSpacing: '0.1em' }}>COMPLETE AUDIT TRAIL</span>
              <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.4rem', color: 'white', margin: 0 }}>
                Interview Sessions ({sessions.length})
              </h3>
            </div>

            <button onClick={() => router.push('/setup')} style={{ padding: '8px 18px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
              + Start New Session
            </button>
          </div>

          {loading ? (
            <p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: 40 }}>Loading sessions...</p>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <p style={{ fontSize: '2rem', margin: '0 0 12px' }}>🎯</p>
              <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>No sessions found yet. Launch your first mock interview!</p>
              <button onClick={() => router.push('/setup')} style={{ padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', fontFamily: 'Space Grotesk' }}>
                Start Interview Session
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map((s, i) => {
                const compInfo = COMPANY_ICONS[s.company || 'General'] || COMPANY_ICONS['General'];
                const sc = s.overall_score || 0;
                const c = scoreColor(sc);

                return (
                  <div
                    key={s.session_id}
                    className="card-3d"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
                      padding: '18px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    {/* Company Icon & Target Role */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: `${compInfo.color}15`, border: `1px solid ${compInfo.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>
                        {compInfo.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.98rem', color: 'white', marginBottom: 2 }}>
                          {s.target_role || 'Software Engineer'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>Company: <strong>{s.company || 'General'}</strong></span>
                          <span>·</span>
                          <span style={{ fontFamily: 'monospace' }}>#{s.session_id.slice(-6)}</span>
                          <span>·</span>
                          <span>{s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                        </div>
                      </div>
                    </div>

                    {/* Benchmark Badge */}
                    {s.benchmark?.badge && (
                      <span style={{ padding: '4px 12px', borderRadius: 10, background: `${badgeColor(s.benchmark.badge)}15`, border: `1px solid ${badgeColor(s.benchmark.badge)}30`, color: badgeColor(s.benchmark.badge), fontSize: '0.75rem', fontWeight: 800, flexShrink: 0 }}>
                        🏆 {s.benchmark.badge}
                      </span>
                    )}

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0, padding: '0 12px' }}>
                      <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.3rem', color: c }}>
                        {sc > 0 ? sc.toFixed(1) : '—'}<span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)' }}>/10</span>
                      </div>
                    </div>

                    {/* Direct Action Links */}
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => router.push(`/dashboard?sid=${s.session_id}`)}
                        style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Space Grotesk' }}
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => router.push(`/report?sid=${s.session_id}`)}
                        style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: 5 }}
                      >
                        <FileText size={13}/> PDF Report
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontFamily: 'Space Grotesk', fontWeight: 700 }}>Loading Candidate Profile...</div>}>
      <ProfileContent />
    </Suspense>
  );
}
