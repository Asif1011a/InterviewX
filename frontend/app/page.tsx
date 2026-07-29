'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthHelpers, AuthUser } from '@/lib/auth';
import LineWaves from '@/components/LineWaves';
import { Cpu, Zap, ArrowRight } from 'lucide-react';

const AGENTS = [
  { emoji:'📄', name:'Resume Analyst',      color:'#6366f1', category:'Analysis', desc:'Parses skills & calculates initial role fit score 0–100' },
  { emoji:'🔍', name:'Gap Detector',        color:'#8b5cf6', category:'Analysis', desc:'Constructs 4-severity skill gap matrix' },
  { emoji:'🏢', name:'Company Intel',       color:'#a78bfa', category:'Analysis', desc:'Injects company culture, question mixes & red flags' },
  { emoji:'♟️', name:'Strategist',          color:'#c4b5fd', category:'Strategy', desc:'Generates dynamic 5–7 question interview blueprint' },
  { emoji:'📊', name:'Benchmark',           color:'#7c3aed', category:'Strategy', desc:'Computes peer percentile rankings & badges' },
  { emoji:'🎙️', name:'Interviewer',         color:'#06b6d4', category:'Interview', desc:'Adaptive AI interviewer with company-style questions' },
  { emoji:'🔗', name:'Follow-Up',           color:'#22d3ee', category:'Interview', desc:'Probes deeper when candidate answers are vague' },
  { emoji:'⚖️', name:'Evaluator',           color:'#10b981', category:'Evaluation', desc:'Strict 5-dimension rubric answer scoring' },
  { emoji:'🏋️', name:'Coach Agent',         color:'#34d399', category:'Evaluation', desc:'STAR-format answer rewriter & 2-3 tips' },
  { emoji:'🧠', name:'Confidence Lens',     color:'#6ee7b7', category:'Evaluation', desc:'Detects hedging phrases, passive voice & pace' },
  { emoji:'🎯', name:'JD Analyst',          color:'#f472b6', category:'Power', desc:'Dissects JDs into ATS keywords & hidden signals' },
  { emoji:'🔮', name:'Readiness Predictor', color:'#e879f9', category:'Power', desc:'Predicts HR, Tech & Design round pass probabilities' },
  { emoji:'📝', name:'STAR Formatter',      color:'#c084fc', category:'Power', desc:'Restructures raw answers into STAR framework' },
  { emoji:'🩺', name:'Soft Skills Radar',   color:'#f0abfc', category:'Power', desc:'Evaluates non-technical behavioral competencies' },
  { emoji:'⚔️', name:"Devil's Advocate",    color:'#fb7185', category:'Power', desc:'Simulates high-pressure FAANG pushback counter-questions' },
  { emoji:'🤖', name:'ATS Scorer',          color:'#fda4af', category:'Power', desc:'Calculates ATS resume vs JD match percentage' },
  { emoji:'🗺️', name:'Learning Path',       color:'#f59e0b', category:'Output', desc:'Generates structured 7-day study roadmap' },
  { emoji:'🎯', name:'Practice Gen',        color:'#fbbf24', category:'Output', desc:'Creates rapid-fire drill exercises for weak areas' },
  { emoji:'📈', name:'Progress Agent',      color:'#fb923c', category:'Output', desc:'Tracks score velocity & trend across sessions' },
  { emoji:'📋', name:'Report Writer',       color:'#f87171', category:'Output', desc:'Compiles 21-agent findings into downloadable PDF' },
  { emoji:'🔥', name:'Motivation Bot',      color:'#ef4444', category:'Output', desc:'Data-backed encouragement & 3 immediate actions' },
];

const STEPS = [
  { n:'01', title:'Candidate Onboarding', desc:'Upload resume, select target company (Amazon, Google, TCS), role & difficulty.', icon:'🔐', color:'#6366f1' },
  { n:'02', title:'Multi-Agent Planning', desc:'Resume Analyst, Gap Detector & Strategist construct your custom interview blueprint.', icon:'♟️', color:'#8b5cf6' },
  { n:'03', title:'Interactive Studio', desc:'Voice Speech-to-Text or Live Python IDE with real execution & Big-O analysis.', icon:'🎙️', color:'#06b6d4' },
  { n:'04', title:'Executive PDF Report', desc:'Receive 5-dimension scorecards, STAR rewrites, and 7-day study roadmap.', icon:'📊', color:'#10b981' },
];

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');

  useEffect(() => {
    setMounted(true);
    const u = AuthHelpers.get();
    setUser(u);
  }, []);

  const handleStartMission = () => {
    if (user) {
      router.push('/setup');
    } else {
      router.push('/login?returnTo=/setup');
    }
  };

  const categories = ['ALL', 'Analysis', 'Strategy', 'Interview', 'Evaluation', 'Power', 'Output'];

  const filteredAgents = activeCategory === 'ALL'
    ? AGENTS
    : AGENTS.filter(a => a.category === activeCategory);

  return (
    <div style={{ minHeight:'100vh', background:'#030308', color:'white', fontFamily:'Inter,sans-serif', overflowX:'hidden' }}>

      {/* ═══════════ HERO 3D STAGE ═══════════ */}
      <section style={{ position:'relative', minHeight:'92vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px 32px 60px', textAlign:'center' }}>
        
        {/* Background Particle Canvas */}
        <div style={{ position:'absolute', inset:0, zIndex:0, opacity:0.8 }}>
          <LineWaves speed={0.2} innerLineCount={24} outerLineCount={28} warpIntensity={0.7} rotation={-35} edgeFadeWidth={0.05} colorCycleSpeed={0.5} brightness={0.15} color1="#6366f1" color2="#8b5cf6" color3="#06b6d4" enableMouseInteraction={true} mouseInfluence={1.6}/>
        </div>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at 50% 30%, rgba(99,102,241,0.12) 0%, rgba(3,3,8,0.9) 75%)', zIndex:1 }}/>

        <div style={{ position:'relative', zIndex:2, maxWidth:960, width:'100%' }}>
          
          {/* Top Live Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'8px 22px', borderRadius:999, border:'1px solid rgba(99,102,241,0.35)', background:'rgba(99,102,241,0.08)', backdropFilter:'blur(12px)', marginBottom:32, boxShadow:'0 0 20px rgba(99,102,241,0.15)' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#10b981', boxShadow:'0 0 10px #10b981', animation:'pulse-dot 1.5s infinite' }}/>
            <span style={{ fontSize:'0.78rem', fontFamily:'Space Grotesk', fontWeight:800, color:'#a5b4fc', letterSpacing:'0.08em' }}>
              21 SPECIALIZED LLM AGENTS · REAL PYTHON EXECUTION · FAANG BAR CALIBRATION
            </span>
          </div>

          {/* Main 3D Title */}
          <h1 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'clamp(3rem,6.5vw,5.5rem)', lineHeight:1.02, margin:'0 0 24px', letterSpacing:'-0.03em' }}>
            <span style={{ background:'linear-gradient(135deg, #ffffff 0%, #c4b5fd 50%, #818cf8 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              AI Placement
            </span>
            <br/>
            <span style={{ background:'linear-gradient(135deg, #6366f1, #8b5cf6, #06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Mission Control
            </span>
          </h1>

          <p style={{ color:'rgba(255,255,255,0.65)', fontSize:'clamp(1rem,2vw,1.2rem)', maxWidth:720, margin:'0 auto 44px', lineHeight:1.75, fontWeight:400 }}>
            An enterprise multi-agent placement engine that conducts realistic voice & coding mock interviews, evaluates 5 answer dimensions, and predicts offer probabilities.
          </p>

          {/* Welcome User Pill */}
          {mounted && user && (
            <div style={{ marginBottom:28, padding:'10px 24px', borderRadius:16, background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', display:'inline-flex', alignItems:'center', gap:10, boxShadow:'0 0 20px rgba(16,185,129,0.15)' }}>
              <span style={{ fontSize:'1.1rem' }}>👋</span>
              <span style={{ fontSize:'0.9rem', color:'#34d399', fontWeight:700 }}>
                Welcome back, <strong>{user.name}</strong>! Ready for your next mock interview?
              </span>
            </div>
          )}

          {/* Call-to-Actions */}
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <button
              onClick={handleStartMission}
              style={{
                padding:'18px 42px', borderRadius:18,
                background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none', color:'white', fontWeight:800, fontSize:'1.1rem',
                cursor:'pointer', boxShadow:'0 10px 40px -10px rgba(99,102,241,0.6)',
                fontFamily:'Space Grotesk', letterSpacing:'0.02em',
                display:'flex', alignItems:'center', gap:10, transition:'transform 0.2s ease, box-shadow 0.2s ease'
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 16px 50px -10px rgba(99,102,241,0.8)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = '';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 40px -10px rgba(99,102,241,0.6)';
              }}
            >
              <Zap size={20}/> {user ? 'Launch Mock Interview' : 'Start Your Mission'}
            </button>

            <button
              onClick={() => router.push('/agents')}
              style={{
                padding:'18px 36px', borderRadius:18,
                background:'rgba(255,255,255,0.04)',
                border:'1px solid rgba(255,255,255,0.12)',
                color:'white', fontWeight:700, fontSize:'1.05rem',
                cursor:'pointer', fontFamily:'Space Grotesk',
                display:'flex', alignItems:'center', gap:10, transition:'all 0.2s ease'
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.08)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
            >
              <Cpu size={19}/> Explore 21 Agents
            </button>
          </div>

        </div>
      </section>

      {/* ═══════════ TELEMETRY STATS BAR ═══════════ */}
      <section style={{ borderTop:'1px solid rgba(255,255,255,0.06)', borderBottom:'1px solid rgba(255,255,255,0.06)', background:'rgba(13,13,26,0.6)', backdropFilter:'blur(16px)', padding:'24px 32px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:24, textAlign:'center' }}>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2rem', color:'#a5b4fc', lineHeight:1 }}>21</div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginTop:4, fontWeight:600 }}>Specialized Sub-Agents</div>
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2rem', color:'#34d399', lineHeight:1 }}>~380ms</div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginTop:4, fontWeight:600 }}>Groq LLM Latency</div>
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2rem', color:'#38bdf8', lineHeight:1 }}>5</div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginTop:4, fontWeight:600 }}>Rubric Score Dimensions</div>
          </div>
          <div>
            <div style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2rem', color:'#f472b6', lineHeight:1 }}>100%</div>
            <div style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginTop:4, fontWeight:600 }}>Async Workflow Parallelism</div>
          </div>
        </div>
      </section>

      {/* ═══════════ 21 AGENT NETWORK MATRIX ═══════════ */}
      <section style={{ padding:'90px 48px', maxWidth:1200, margin:'0 auto' }}>
        
        <div style={{ textAlign:'center', marginBottom:48 }}>
          <span style={{ fontSize:'0.7rem', fontWeight:800, color:'#818cf8', letterSpacing:'0.1em', display:'block', marginBottom:8 }}>INTELLIGENT ARCHITECTURE</span>
          <h2 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'clamp(1.8rem,3.5vw,2.6rem)', margin:'0 0 16px', color:'white' }}>
            21 Specialized AI Agents Operating in Sync
          </h2>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.98rem', maxWidth:600, margin:'0 auto 32px', lineHeight:1.6 }}>
            Each agent handles a specific role in your placement pipeline — from ATS resume optimization to live speech confidence analysis and 7-day study paths.
          </p>

          {/* Category Filter Tabs */}
          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding:'8px 18px', borderRadius:12, fontSize:'0.78rem', fontWeight:700, cursor:'pointer',
                  fontFamily:'Space Grotesk', transition:'all 0.2s',
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

        {/* 3D Agent Physics Cards Grid */}
        <div className="perspective-container" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:20 }}>
          {filteredAgents.map((agent, i) => (
            <div
              key={i}
              className="card-3d"
              onClick={() => router.push(`/agents?inspect=${agent.name.replace(/\s+/g,'')}`)}
              style={{
                padding:'24px 22px', borderRadius:20,
                background:'rgba(13,13,26,0.7)',
                border:`1px solid ${agent.color}25`,
                cursor:'pointer', backdropFilter:'blur(16px)',
                position:'relative', overflow:'hidden', display:'flex', flexDirection:'column'
              }}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg, ${agent.color}, transparent)` }}/>
              
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`${agent.color}15`, border:`1px solid ${agent.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>
                  {agent.emoji}
                </div>
                <span style={{ fontSize:'0.65rem', fontWeight:800, color:agent.color, background:`${agent.color}12`, border:`1px solid ${agent.color}25`, padding:'3px 9px', borderRadius:20, letterSpacing:'0.06em' }}>
                  {agent.category}
                </span>
              </div>

              <h4 style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.1rem', color:'white', margin:'0 0 6px' }}>
                {agent.name}
              </h4>
              <p style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.5)', lineHeight:1.55, margin:0, flex:1 }}>
                {agent.desc}
              </p>

              <div style={{ marginTop:16, display:'flex', alignItems:'center', gap:6, fontSize:'0.72rem', fontWeight:700, color:agent.color }}>
                Inspect Schema & Exec <ArrowRight size={13}/>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section style={{ padding:'80px 48px', background:'rgba(0,0,0,0.4)', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:1000, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <h2 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'clamp(1.6rem,3.5vw,2.4rem)', margin:'0 0 12px', color:'white' }}>
              Four Steps from Zero to Offer Ready
            </h2>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.95rem', margin:0 }}>Automated placement pipeline</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:20 }}>
            {STEPS.map((s, i) => (
              <div key={i} className="card-3d" style={{ padding:'28px 22px', borderRadius:20, background:'rgba(255,255,255,0.025)', border:`1px solid ${s.color}22`, position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},transparent)` }}/>
                <div style={{ fontSize:'2rem', marginBottom:14 }}>{s.icon}</div>
                <div style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'0.65rem', color:s.color, letterSpacing:'0.1em', marginBottom:6 }}>STEP {s.n}</div>
                <div style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.05rem', marginBottom:8, color:'white' }}>{s.title}</div>
                <div style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.45)', lineHeight:1.6 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ═══════════ FOOTER CTA ═══════════ */}
      <section style={{ padding:'80px 48px', textAlign:'center', background:'linear-gradient(180deg,transparent,rgba(99,102,241,0.06))' }}>
        <div style={{ maxWidth:600, margin:'0 auto' }}>
          <h2 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2rem', margin:'0 0 16px', color:'white' }}>
            Ready to Ace Your Next Tech Interview?
          </h2>
          <p style={{ color:'rgba(255,255,255,0.45)', margin:'0 0 32px', fontSize:'0.95rem' }}>
            Join candidates using 21 specialized AI agents to practice, improve, and secure top offers.
          </p>
          <button
            onClick={handleStartMission}
            style={{
              padding:'16px 40px', borderRadius:16,
              background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border:'none', color:'white', fontWeight:800, fontSize:'1.05rem',
              cursor:'pointer', boxShadow:'0 8px 30px rgba(99,102,241,0.5)',
              fontFamily:'Space Grotesk'
            }}
          >
            🚀 Launch Mission Control — Free
          </button>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(0.85)} }
      `}</style>
    </div>
  );
}
