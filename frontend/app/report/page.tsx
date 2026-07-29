'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeft, Download, Printer, Award, TrendingUp, Target, BookOpen, AlertTriangle, CheckCircle2, Star, Zap, ShieldCheck } from 'lucide-react';

function ScoreGauge({ score, max = 10, label, color = '#6366f1' }: { score: number; max?: number; label: string; color?: string }) {
  const pct = Math.min(1, Math.max(0, score / max));
  const r = 32;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={6} />
        <circle
          cx={40} cy={40} r={r} fill="none" stroke={color} strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform="rotate(-90 40 40)"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
        <text x={40} y={41} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="Space Grotesk">
          {score.toFixed(1)}
        </text>
      </svg>
      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

function ReportContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const router = useRouter();

  const [session, setSession] = useState<any>(null);
  const [benchmark, setBenchmark] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [learningPath, setLearningPath] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sid) return;
    Promise.all([
      api.getSession(sid).catch(() => null),
      api.getBenchmark(sid).catch(() => null),
      api.getReport(sid).catch(() => null),
      api.getLearningPath(sid).catch(() => null),
    ]).then(([s, b, r, lp]) => {
      setSession(s);
      setBenchmark(b);
      setReport(r);
      setLearningPath(lp);
    }).finally(() => setLoading(false));
  }, [sid]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#030308', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800 }}>
        Generating Executive Candidate Assessment Report...
      </div>
    );
  }

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', background: '#030308', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Session report unavailable.
      </div>
    );
  }

  const evals: any[] = session.evaluations || [];
  const scoreDims = ['content_score', 'clarity_score', 'confidence_score', 'structure_score', 'depth_score'];
  const dimLabels = ['Content', 'Clarity', 'Confidence', 'Structure', 'Depth'];
  const dimColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

  const dimScores = scoreDims.map(k => {
    const vals = evals.map(e => e.evaluation?.[k] || 0).filter(v => v > 0);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });

  const overallAvg = dimScores.reduce((a, b) => a + b, 0) / (dimScores.length || 1);
  const dateStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', background: '#030308', color: 'white', fontFamily: 'Inter,sans-serif', padding: '36px 48px 60px' }}>
      
      {/* Top Action Header Bar (No Print) */}
      <div className="no-print" style={{ maxWidth: 960, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={() => router.push(`/dashboard?sid=${sid}`)} style={{ padding: '8px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ArrowLeft size={15} /> Dashboard
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={handlePrint} style={{ padding: '10px 22px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Printer size={16} /> Print PDF
          </button>
          <button onClick={handlePrint} style={{ padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'Space Grotesk', boxShadow: '0 4px 20px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} /> Download Official PDF Report
          </button>
        </div>
      </div>

      {/* Printable Printable Container */}
      <div id="executive-report" style={{ maxWidth: 960, margin: '0 auto', padding: '48px 56px', borderRadius: 24, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* Cover Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 32, marginBottom: 36 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <ShieldCheck size={20} color="#818cf8" />
              <span style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '0.85rem', color: '#a5b4fc', letterSpacing: '0.08em' }}>AI PLACEMENT MISSION CONTROL</span>
            </div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '2.4rem', margin: '0 0 6px', color: 'white' }}>
              Executive Candidate Assessment
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', margin: 0, fontSize: '0.92rem' }}>
              Official 21-Agent Evaluation Report · Candidate: <strong style={{ color: 'white' }}>{session.student_name || 'Candidate'}</strong>
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ padding: '6px 14px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#c7d2fe', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6 }}>
              OFFICIAL VERDICT
            </div>
            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>{dateStr}</div>
          </div>
        </div>

        {/* Candidate Profile Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 36, padding: '18px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>TARGET ROLE</span>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white', marginTop: 2 }}>{session.target_role || 'Software Engineer'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>TARGET COMPANY</span>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#a5b4fc', marginTop: 2 }}>{session.company || 'General'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>EXPERIENCE LEVEL</span>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'white', marginTop: 2 }}>{session.experience_level || 'Fresher'}</div>
          </div>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>READINESS RATING</span>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#10b981', marginTop: 2 }}>
              {Math.round(overallAvg * 10)}/100 {benchmark?.badge ? `(${benchmark.badge})` : ''}
            </div>
          </div>
        </div>

        {/* 5-Dimension Competency Score Rings */}
        <div style={{ marginBottom: 36 }}>
          <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: 20, letterSpacing: '0.06em' }}>
            5-DIMENSION COMPETENCY METRICS
          </h3>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'space-around', padding: '24px', borderRadius: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            {dimScores.map((sc, i) => (
              <ScoreGauge key={i} score={sc} label={dimLabels[i].toUpperCase()} color={dimColors[i]} />
            ))}
          </div>
        </div>

        {/* Executive Summary */}
        {report?.executive_summary && (
          <div style={{ marginBottom: 36, padding: '24px 28px', borderRadius: 20, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '0.95rem', color: '#c7d2fe', margin: '0 0 10px' }}>
              EXECUTIVE SUMMARY & RECOMMENDATION
            </h4>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>
              {report.executive_summary}
            </p>
          </div>
        )}

        {/* 7-Day Study Roadmap */}
        {learningPath?.plan && (
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: 16, letterSpacing: '0.06em' }}>
              PERSONALIZED 7-DAY STUDY ROADMAP
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {learningPath.plan.slice(0, 4).map((dayItem: any, idx: number) => (
                <div key={idx} style={{ padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>DAY {dayItem.day || idx + 1}: {dayItem.topic}</div>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{dayItem.focus || dayItem.tasks?.[0]}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Signature */}
        <div style={{ paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>
          <span>AI Placement Mission Control · 21 AI Agents Verified</span>
          <span>Session ID: {sid}</span>
        </div>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #030308 !important; color: white !important; }
          #executive-report { border: none !important; padding: 0 !important; background: transparent !important; }
        }
      `}</style>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#030308', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}>
      <ReportContent />
    </Suspense>
  );
}
