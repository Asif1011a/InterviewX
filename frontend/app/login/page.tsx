'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthHelpers } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mounted, setMounted]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  // Lamp physics
  const angleRef   = useRef(0);       // current rotation angle
  const velRef     = useRef(0);       // angular velocity
  const targetRef  = useRef(0);       // target angle
  const animRef    = useRef<number>(0);
  const lampDivRef = useRef<HTMLDivElement>(null);
  const [lampAngle, setLampAngle] = useState(0);
  const [eyeShift, setEyeShift]   = useState(0);  // pupils shift
  const [blink, setBlink]         = useState(false);
  const [mouthState, setMouthState] = useState<'smile'|'open'|'sad'>('smile');

  useEffect(() => {
    setMounted(true);
    if (AuthHelpers.isLoggedIn()) { router.replace('/'); return; }

    // Blink timer
    const blinkLoop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 180);
    };
    const blinkId = setInterval(blinkLoop, 3500 + Math.random() * 2000);

    // Spring physics loop
    const STIFFNESS = 0.08, DAMPING = 0.72;
    const tick = () => {
      const acc = (targetRef.current - angleRef.current) * STIFFNESS;
      velRef.current = velRef.current * DAMPING + acc;
      angleRef.current += velRef.current;
      const clamped = Math.max(-35, Math.min(35, angleRef.current));
      setLampAngle(clamped);
      setEyeShift(clamped * 0.18);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(animRef.current); clearInterval(blinkId); };
  }, [router]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!lampDivRef.current) return;
    const rect = lampDivRef.current.getBoundingClientRect();
    const lampCx = rect.left + rect.width * 0.28; // lamp center X
    const lampPivotY = rect.top + rect.height * 0.30; // pivot Y (neck)
    const dx = e.clientX - lampCx;
    const dy = e.clientY - lampPivotY;
    const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    targetRef.current = Math.max(-35, Math.min(35, angle * 0.6));
  }, []);

  useEffect(() => {
    if (loading) setMouthState('open');
    else if (error) setMouthState('sad');
    else if (success) setMouthState('open');
    else setMouthState('smile');
  }, [loading, error, success]);

  useEffect(() => {
    if (focused === 'email') targetRef.current = 12;
    else if (focused === 'password') targetRef.current = 18;
    else targetRef.current = targetRef.current;
  }, [focused]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Fill in all fields'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:8000/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Invalid credentials'); }
      const data = await res.json();
      AuthHelpers.save({ user_id: data.user_id, name: data.name, email: data.email, token: data.token });
      setSuccess(true);
      setTimeout(() => router.replace(returnTo), 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed — is the backend running?');
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  // Lamp cone opacity: how much it illuminates the form area
  const coneOpacity = Math.max(0.15, (lampAngle + 35) / 70);
  const formGlow    = Math.max(0, (lampAngle - 5) / 30); // form glows when lamp points right

  const mouthPath = mouthState === 'smile'
    ? 'M 28 56 Q 40 64 52 56'
    : mouthState === 'sad'
    ? 'M 28 62 Q 40 54 52 62'
    : 'M 32 56 Q 40 66 48 56 Q 40 48 32 56 Z';

  return (
    <div ref={lampDivRef} onMouseMove={onMouseMove} style={{ minHeight:'100vh', background:'#030308', display:'flex', alignItems:'stretch', fontFamily:'Inter,sans-serif', overflow:'hidden', position:'relative' }}>

      {/* ── Ambient background glow ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:`radial-gradient(ellipse 60% 60% at ${20 + lampAngle * 0.3}% 40%, rgba(99,102,241,0.12) 0%, transparent 70%)` }}/>
      <div style={{ position:'fixed', top:'-20%', left:'-10%', width:'60%', height:'60%', borderRadius:'50%',
        background:'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', pointerEvents:'none', zIndex:0 }}/>

      {/* ── LEFT PANEL — Lamp ── */}
      <div style={{ flex:'0 0 48%', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(160deg, #050515 0%, #030308 60%, #060412 100%)',
        borderRight:'1px solid rgba(99,102,241,0.1)', zIndex:1 }}>

        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(99,102,241,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,0.035) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' }}/>

        {/* Lamp spotlight on floor */}
        <div style={{ position:'absolute', bottom:'8%', left:'50%', transform:`translateX(-50%) translateX(${lampAngle * 3}px)`,
          width:260, height:100, borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, rgba(99,102,241,0.05) 50%, transparent 80%)',
          filter:'blur(12px)', transition:'none', pointerEvents:'none' }}/>

        {/* LAMP SVG */}
        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>

          {/* Rotating upper body (shade + face + cone) */}
          <div style={{ transformOrigin:'50% 100%', transform:`rotate(${lampAngle}deg)`, transition:'none', position:'relative' }}>

            {/* Light CONE — emanates from shade bottom */}
            <div style={{ position:'absolute', top:'96%', left:'50%', transform:'translateX(-50%)', width:0, height:0, zIndex:0,
              borderLeft:`${80 + Math.abs(lampAngle) * 1.5}px solid transparent`,
              borderRight:`${80 + Math.abs(lampAngle) * 1.5}px solid transparent`,
              borderTop:`160px solid rgba(139,92,246,${coneOpacity * 0.35})`,
              filter:`blur(6px)`, pointerEvents:'none' }}/>
            <div style={{ position:'absolute', top:'96%', left:'50%', transform:'translateX(-50%)', width:0, height:0, zIndex:0,
              borderLeft:'50px solid transparent', borderRight:'50px solid transparent',
              borderTop:`120px solid rgba(167,139,250,${coneOpacity * 0.25})`,
              filter:'blur(3px)', pointerEvents:'none' }}/>

            {/* SVG Lamp Head */}
            <svg width="160" height="140" viewBox="0 0 160 140" style={{ position:'relative', zIndex:1 }}>
              <defs>
                <linearGradient id="shadeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7c3aed"/>
                  <stop offset="40%" stopColor="#6366f1"/>
                  <stop offset="100%" stopColor="#4338ca"/>
                </linearGradient>
                <linearGradient id="shadeHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.15)"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0.2)"/>
                </linearGradient>
                <filter id="lampGlow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
                <radialGradient id="innerGlow" cx="50%" cy="80%" r="50%">
                  <stop offset="0%" stopColor="rgba(196,181,253,0.6)"/>
                  <stop offset="100%" stopColor="rgba(99,102,241,0)"/>
                </radialGradient>
              </defs>

              {/* Shade top rim */}
              <ellipse cx="80" cy="18" rx="24" ry="6" fill="#3730a3" opacity="0.9"/>

              {/* Main shade shape */}
              <path d="M 56 18 L 22 118 L 138 118 L 104 18 Z" fill="url(#shadeGrad)" filter="url(#lampGlow)"/>
              <path d="M 56 18 L 22 118 L 138 118 L 104 18 Z" fill="url(#shadeHighlight)" opacity="0.4"/>

              {/* Inner lamp glow */}
              <ellipse cx="80" cy="105" rx="48" ry="18" fill="url(#innerGlow)" opacity="0.8"/>

              {/* Shade bottom rim */}
              <ellipse cx="80" cy="118" rx="58" ry="10" fill="#312e81" opacity="0.95"/>
              <ellipse cx="80" cy="115" rx="48" ry="6" fill="rgba(196,181,253,0.15)"/>

              {/* Face — EYES */}
              {/* Left eye */}
              <ellipse cx={62 + eyeShift * 0.3} cy="72" rx="10" ry={blink ? 1.5 : 10} fill="white" style={{ transition: blink ? 'none' : 'ry 0.1s' }}/>
              <circle cx={64 + eyeShift} cy="72" r={blink ? 0 : 5} fill="#1e1b4b"/>
              <circle cx={65 + eyeShift} cy="70" r={blink ? 0 : 1.5} fill="white" opacity="0.9"/>

              {/* Right eye */}
              <ellipse cx={98 + eyeShift * 0.3} cy="72" rx="10" ry={blink ? 1.5 : 10} fill="white" style={{ transition: blink ? 'none' : 'ry 0.1s' }}/>
              <circle cx={100 + eyeShift} cy="72" r={blink ? 0 : 5} fill="#1e1b4b"/>
              <circle cx={101 + eyeShift} cy="70" r={blink ? 0 : 1.5} fill="white" opacity="0.9"/>

              {/* Blush */}
              <ellipse cx="54" cy="86" rx="10" ry="6" fill="rgba(244,114,182,0.35)"/>
              <ellipse cx="106" cy="86" rx="10" ry="6" fill="rgba(244,114,182,0.35)"/>

              {/* Mouth */}
              <path d={mouthPath} stroke="white" strokeWidth="2.5" fill={mouthState === 'open' ? 'rgba(30,27,75,0.8)' : 'none'} strokeLinecap="round"/>

              {/* Top cap with glow dot */}
              <ellipse cx="80" cy="18" rx="8" ry="4" fill="#4c1d95"/>
              <circle cx="80" cy="15" r="3" fill="#c4b5fd" filter="url(#lampGlow)" opacity="0.9"/>
            </svg>
          </div>

          {/* Stand — fixed */}
          <div style={{ width:8, height:120, background:'linear-gradient(180deg,#4338ca,#312e81,#1e1b4b)', borderRadius:4, boxShadow:'0 0 12px rgba(99,102,241,0.3)', marginTop:-4 }}/>

          {/* Joint at top of stand */}
          <div style={{ width:20, height:12, borderRadius:10, background:'linear-gradient(135deg,#6366f1,#4338ca)', marginTop:-10, boxShadow:'0 0 10px rgba(99,102,241,0.5)' }}/>

          {/* Base */}
          <div style={{ width:90, height:16, borderRadius:'50%/100%', background:'linear-gradient(135deg,#312e81,#1e1b4b)', marginTop:2, boxShadow:'0 4px 24px rgba(99,102,241,0.3), 0 0 0 1px rgba(99,102,241,0.2)' }}/>

          {/* Floor reflection */}
          <div style={{ width:70, height:4, borderRadius:'50%', background:'rgba(99,102,241,0.2)', marginTop:4, filter:'blur(4px)' }}/>
        </div>

        {/* Text below lamp */}
        <div style={{ position:'relative', zIndex:2, textAlign:'center', maxWidth:320, padding:'0 24px' }}>
          <h1 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'1.8rem', margin:'0 0 10px',
            background:'linear-gradient(135deg,#c4b5fd,#818cf8,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            Mission Control
          </h1>
          <p style={{ color:'rgba(255,255,255,0.38)', fontSize:'0.88rem', lineHeight:1.65, margin:0 }}>
            21 AI agents ready to prep you for your<br/>dream interview. Sign in to track progress.
          </p>

          {/* Stats row */}
          <div style={{ display:'flex', gap:20, justifyContent:'center', marginTop:24 }}>
            {[['🤖','21 Agents'],['📊','Track Progress'],['⚡','Real-time AI']].map(([emoji, label]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <div style={{ fontSize:'1.1rem' }}>{emoji}</div>
                <div style={{ fontSize:'0.65rem', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.03em', marginTop:3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'40px 56px', position:'relative', zIndex:1 }}>

        {/* Form glow when lamp points right */}
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(ellipse 70% 70% at 50% 50%, rgba(99,102,241,${formGlow * 0.12}) 0%, transparent 70%)`,
          transition:'none' }}/>

        <div style={{ width:'100%', maxWidth:380, position:'relative' }}>
          {/* Card */}
          <div style={{ padding:'40px 36px', borderRadius:24, position:'relative',
            background:'rgba(255,255,255,0.03)',
            border:`1px solid rgba(99,102,241,${0.2 + formGlow * 0.25})`,
            boxShadow:`0 0 ${40 + formGlow * 60}px rgba(99,102,241,${0.08 + formGlow * 0.15}), 0 24px 48px rgba(0,0,0,0.4)`,
            backdropFilter:'blur(20px)', transition:'border-color 0.3s, box-shadow 0.3s' }}>

            {/* Corner accent */}
            <div style={{ position:'absolute', top:-1, left:28, width:60, height:2, background:'linear-gradient(90deg,#6366f1,transparent)', borderRadius:1 }}/>
            <div style={{ position:'absolute', bottom:-1, right:28, width:60, height:2, background:'linear-gradient(90deg,transparent,#8b5cf6)', borderRadius:1 }}/>

            <h2 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2rem', margin:'0 0 6px', color:'white' }}>
              Welcome Back <span style={{ fontSize:'1.6rem' }}>{success ? '🎉' : '👋'}</span>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.87rem', margin:'0 0 32px' }}>
              Sign in to continue your interview journey
            </p>

            {error && (
              <div style={{ padding:'11px 16px', borderRadius:12, background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:'0.82rem', marginBottom:22, lineHeight:1.5, display:'flex', alignItems:'center', gap:8 }}>
                <span>⚠️</span><span>{error}</span>
              </div>
            )}

            {success && (
              <div style={{ padding:'11px 16px', borderRadius:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', color:'#34d399', fontSize:'0.85rem', marginBottom:22, fontWeight:600 }}>
                ✓ Login successful! Redirecting...
              </div>
            )}

            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {[
                { id:'email',    label:'Email Address', val:email,    set:setEmail,    type:'email',    ph:'you@example.com',   ac:'email' },
                { id:'password', label:'Password',      val:password, set:setPassword, type:'password', ph:'Your password',      ac:'current-password' },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ display:'block', fontSize:'0.68rem', fontWeight:800, color: focused === f.id ? '#a5b4fc' : 'rgba(255,255,255,0.38)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8, transition:'color 0.2s' }}>{f.label}</label>
                  <input
                    id={f.id} type={f.type} value={f.val}
                    onChange={e => f.set(e.target.value)}
                    onFocus={() => setFocused(f.id)}
                    onBlur={() => setFocused(null)}
                    placeholder={f.ph} autoComplete={f.ac}
                    style={{ width:'100%', padding:'13px 18px', borderRadius:14,
                      background: focused === f.id ? 'rgba(99,102,241,0.08)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${focused === f.id ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: focused === f.id ? '0 0 0 3px rgba(99,102,241,0.12), 0 0 20px rgba(99,102,241,0.1)' : 'none',
                      color:'white', fontSize:'0.95rem', outline:'none', boxSizing:'border-box',
                      fontFamily:'Inter,sans-serif', transition:'all 0.25s' }}
                  />
                </div>
              ))}

              <button type="submit" disabled={loading || success} style={{ marginTop:4, padding:'15px', borderRadius:14,
                background: success ? 'linear-gradient(135deg,#10b981,#059669)' : loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                border:'none', color:'white', fontWeight:800, fontSize:'1rem',
                cursor: loading || success ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : success ? '0 4px 28px rgba(16,185,129,0.4)' : '0 4px 28px rgba(99,102,241,0.45)',
                transition:'all 0.25s', fontFamily:'Inter,sans-serif', letterSpacing:'0.03em' }}
                onMouseEnter={e => { if(!loading && !success)(e.currentTarget as HTMLButtonElement).style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform=''; }}>
                {success ? '✓ Signed in!' : loading ? '⏳ Signing in...' : '→ Sign In'}
              </button>
            </form>

            <div style={{ marginTop:28, paddingTop:20, borderTop:'1px solid rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', gap:10, alignItems:'center' }}>
              <p style={{ fontSize:'0.84rem', color:'rgba(255,255,255,0.35)', margin:0 }}>
                New here?{' '}
                <button onClick={() => router.push('/signup')} style={{ background:'none', border:'none', color:'#a5b4fc', fontWeight:700, cursor:'pointer', fontSize:'0.84rem', padding:0 }}>
                  Create a free account →
                </button>
              </p>
              <button onClick={() => router.push('/')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.2)', cursor:'pointer', fontSize:'0.73rem', textDecoration:'underline' }}>
                Continue without account
              </button>
            </div>
          </div>

          {/* Card glow reflection below */}
          <div style={{ height:20, marginTop:-10, background:`linear-gradient(0deg, transparent, rgba(99,102,241,${0.04 + formGlow * 0.08}))`, borderRadius:'0 0 24px 24px', filter:'blur(8px)' }}/>
        </div>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.18); }
        * { box-sizing: border-box; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight:'100vh', background:'#030308', display:'flex', alignItems:'center', justifyContent:'center', color:'#6366f1', fontFamily:'Space Grotesk', fontWeight:700, fontSize:'1.1rem' }}>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
