'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AuthHelpers } from '@/lib/auth';

const FEATURES = [
  { emoji:'🎯', text:'JD Analyst reads job descriptions and tells you exactly what to prepare' },
  { emoji:'🔮', text:'Readiness Predictor gives you pass % before you enter the room' },
  { emoji:'⚔️', text:"Devil's Advocate challenges you like a real FAANG interviewer" },
  { emoji:'📝', text:'STAR Formatter turns messy answers into perfect interview responses' },
  { emoji:'🤖', text:'ATS Scorer checks how well your resume matches the job' },
];

export default function SignupPage() {
  const router = useRouter();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [mounted, setMounted]   = useState(false);
  const [focused, setFocused]   = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);

  // Lamp physics
  const angleRef  = useRef(0);
  const velRef    = useRef(0);
  const targetRef = useRef(0);
  const animRef   = useRef<number>(0);
  const lampDivRef = useRef<HTMLDivElement>(null);
  const [lampAngle, setLampAngle] = useState(0);
  const [eyeShift, setEyeShift]   = useState(0);
  const [blink, setBlink]         = useState(false);
  const [excited, setExcited]     = useState(false);
  const [mouthState, setMouthState] = useState<'smile'|'open'|'sad'>('smile');

  useEffect(() => {
    setMounted(true);
    if (AuthHelpers.isLoggedIn()) { router.replace('/'); return; }

    // Feature ticker
    const fi = setInterval(() => setFeatureIdx(i => (i + 1) % FEATURES.length), 3200);

    // Blink
    const blinkLoop = () => { setBlink(true); setTimeout(() => setBlink(false), 170); };
    const blinkId = setInterval(blinkLoop, 3800 + Math.random() * 1500);

    // Spring loop
    const STIFF = 0.09, DAMP = 0.7;
    const tick = () => {
      const acc = (targetRef.current - angleRef.current) * STIFF;
      velRef.current = velRef.current * DAMP + acc;
      angleRef.current += velRef.current;
      const c = Math.max(-35, Math.min(35, angleRef.current));
      setLampAngle(c);
      setEyeShift(c * 0.17);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(animRef.current); clearInterval(blinkId); clearInterval(fi); };
  }, [router]);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!lampDivRef.current) return;
    const rect = lampDivRef.current.getBoundingClientRect();
    const lx = rect.left + rect.width * 0.27;
    const ly = rect.top + rect.height * 0.30;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    const angle = Math.atan2(dx, -dy) * (180 / Math.PI);
    targetRef.current = Math.max(-35, Math.min(35, angle * 0.6));
  }, []);

  useEffect(() => {
    if (loading || success) { setMouthState('open'); setExcited(true); }
    else if (error) { setMouthState('sad'); setExcited(false); }
    else { setMouthState('smile'); setExcited(false); }
  }, [loading, error, success]);

  useEffect(() => {
    const map: Record<string, number> = { name: -10, email: 5, password: 15, confirm: 22 };
    if (focused && map[focused] !== undefined) targetRef.current = map[focused];
  }, [focused]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) { setError('Please fill all fields'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:8000/auth/signup', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Signup failed'); }
      const data = await res.json();
      AuthHelpers.save({ user_id: data.user_id, name: data.name, email: data.email, token: data.token });
      setSuccess(true);
      setTimeout(() => router.replace('/'), 900);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed — is the backend running?');
    } finally { setLoading(false); }
  };

  if (!mounted) return null;

  const coneOpacity = Math.max(0.12, (lampAngle + 35) / 70);
  const formGlow    = Math.max(0, (lampAngle - 5) / 30);
  const mouthPath   = mouthState === 'smile'
    ? 'M 28 56 Q 40 65 52 56'
    : mouthState === 'sad'
    ? 'M 28 62 Q 40 54 52 62'
    : 'M 32 55 Q 40 66 48 55 Q 40 46 32 55 Z';

  return (
    <div ref={lampDivRef} onMouseMove={onMouseMove} style={{ minHeight:'100vh', background:'#030308', display:'flex', alignItems:'stretch', fontFamily:'Inter,sans-serif', overflow:'hidden', position:'relative' }}>

      {/* Ambient glow */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0,
        background:`radial-gradient(ellipse 60% 60% at ${18 + lampAngle * 0.25}% 40%, rgba(16,185,129,0.09) 0%, rgba(99,102,241,0.04) 50%, transparent 80%)` }}/>

      {/* LEFT — Lamp panel */}
      <div style={{ flex:'0 0 48%', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        background:'linear-gradient(160deg,#040e0a 0%,#030308 60%,#050410 100%)',
        borderRight:'1px solid rgba(16,185,129,0.08)', zIndex:1 }}>

        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(16,185,129,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.03) 1px,transparent 1px)', backgroundSize:'44px 44px', pointerEvents:'none' }}/>

        {/* Floor glow */}
        <div style={{ position:'absolute', bottom:'8%', left:'50%', transform:`translateX(-50%) translateX(${lampAngle * 2.5}px)`,
          width:240, height:80, borderRadius:'50%',
          background:'radial-gradient(ellipse, rgba(16,185,129,0.16) 0%, rgba(52,211,153,0.04) 50%, transparent 80%)',
          filter:'blur(14px)', pointerEvents:'none' }}/>

        {/* LAMP */}
        <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', alignItems:'center', marginBottom:20 }}>

          {/* Rotating upper body */}
          <div style={{ transformOrigin:'50% 100%', transform:`rotate(${lampAngle}deg)${excited ? ' scale(1.03)' : ''}`, transition: excited ? 'transform 0.15s' : 'none', position:'relative' }}>

            {/* Cone */}
            <div style={{ position:'absolute', top:'96%', left:'50%', transform:'translateX(-50%)', width:0, height:0, zIndex:0,
              borderLeft:`${75 + Math.abs(lampAngle)}px solid transparent`,
              borderRight:`${75 + Math.abs(lampAngle)}px solid transparent`,
              borderTop:`155px solid rgba(16,185,129,${coneOpacity * 0.3})`,
              filter:'blur(6px)', pointerEvents:'none' }}/>
            <div style={{ position:'absolute', top:'96%', left:'50%', transform:'translateX(-50%)', width:0, height:0, zIndex:0,
              borderLeft:'45px solid transparent', borderRight:'45px solid transparent',
              borderTop:`110px solid rgba(52,211,153,${coneOpacity * 0.22})`,
              filter:'blur(3px)', pointerEvents:'none' }}/>

            {/* SVG — Emerald lamp */}
            <svg width="160" height="140" viewBox="0 0 160 140" style={{ position:'relative', zIndex:1 }}>
              <defs>
                <linearGradient id="shadeGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#065f46"/>
                  <stop offset="40%" stopColor="#059669"/>
                  <stop offset="100%" stopColor="#047857"/>
                </linearGradient>
                <linearGradient id="highlight2" x1="0%" y1="0%" x2="20%" y2="100%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.18)"/>
                  <stop offset="100%" stopColor="rgba(0,0,0,0.15)"/>
                </linearGradient>
                <radialGradient id="innerGlow2" cx="50%" cy="80%" r="50%">
                  <stop offset="0%" stopColor="rgba(110,231,183,0.55)"/>
                  <stop offset="100%" stopColor="rgba(16,185,129,0)"/>
                </radialGradient>
                <filter id="glow2"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>

              {/* Top rim */}
              <ellipse cx="80" cy="18" rx="24" ry="6" fill="#064e3b" opacity="0.95"/>

              {/* Shade */}
              <path d="M 56 18 L 22 118 L 138 118 L 104 18 Z" fill="url(#shadeGrad2)" filter="url(#glow2)"/>
              <path d="M 56 18 L 22 118 L 138 118 L 104 18 Z" fill="url(#highlight2)" opacity="0.35"/>

              {/* Inner glow */}
              <ellipse cx="80" cy="105" rx="48" ry="18" fill="url(#innerGlow2)" opacity="0.75"/>

              {/* Bottom rim */}
              <ellipse cx="80" cy="118" rx="58" ry="10" fill="#022c22" opacity="0.95"/>
              <ellipse cx="80" cy="115" rx="48" ry="6" fill="rgba(110,231,183,0.12)"/>

              {/* Star decoration on shade */}
              {excited && <circle cx="80" cy="50" r="3" fill="rgba(255,255,255,0.6)" filter="url(#glow2)"/>}

              {/* Eyes */}
              <ellipse cx={62 + eyeShift * 0.3} cy="72" rx="10" ry={blink ? 1.5 : 10} fill="white"/>
              <circle cx={64 + eyeShift} cy="72" r={blink ? 0 : 5} fill="#022c22"/>
              <circle cx={65 + eyeShift} cy="70" r={blink ? 0 : 2} fill="white" opacity="0.9"/>
              {/* Stars in eyes when excited */}
              {excited && !blink && <text x={59 + eyeShift} y="76" fontSize="9" fill="#fbbf24">✦</text>}

              <ellipse cx={98 + eyeShift * 0.3} cy="72" rx="10" ry={blink ? 1.5 : 10} fill="white"/>
              <circle cx={100 + eyeShift} cy="72" r={blink ? 0 : 5} fill="#022c22"/>
              <circle cx={101 + eyeShift} cy="70" r={blink ? 0 : 2} fill="white" opacity="0.9"/>
              {excited && !blink && <text x={95 + eyeShift} y="76" fontSize="9" fill="#fbbf24">✦</text>}

              {/* Blush */}
              <ellipse cx="54" cy="87" rx="9" ry="5.5" fill="rgba(244,114,182,0.3)"/>
              <ellipse cx="106" cy="87" rx="9" ry="5.5" fill="rgba(244,114,182,0.3)"/>

              {/* Mouth */}
              <path d={mouthPath} stroke="white" strokeWidth="2.5" fill={mouthState === 'open' ? 'rgba(2,44,34,0.8)' : 'none'} strokeLinecap="round"/>

              {/* Top glow dot */}
              <ellipse cx="80" cy="18" rx="8" ry="4" fill="#064e3b"/>
              <circle cx="80" cy="15" r="3" fill="#6ee7b7" filter="url(#glow2)" opacity="0.95"/>
            </svg>
          </div>

          {/* Stand */}
          <div style={{ width:8, height:110, background:'linear-gradient(180deg,#047857,#065f46,#022c22)', borderRadius:4, boxShadow:'0 0 12px rgba(16,185,129,0.3)', marginTop:-4 }}/>
          {/* Joint */}
          <div style={{ width:20, height:12, borderRadius:10, background:'linear-gradient(135deg,#10b981,#047857)', marginTop:-10, boxShadow:'0 0 10px rgba(16,185,129,0.5)' }}/>
          {/* Base */}
          <div style={{ width:90, height:16, borderRadius:'50%/100%', background:'linear-gradient(135deg,#065f46,#022c22)', marginTop:2, boxShadow:'0 4px 20px rgba(16,185,129,0.25), 0 0 0 1px rgba(16,185,129,0.15)' }}/>
          {/* Reflection */}
          <div style={{ width:70, height:4, borderRadius:'50%', background:'rgba(16,185,129,0.18)', marginTop:4, filter:'blur(4px)' }}/>
        </div>

        {/* Feature carousel */}
        <div style={{ position:'relative', zIndex:2, width:'100%', maxWidth:320, padding:'0 24px' }}>
          <div style={{ padding:'18px 20px', borderRadius:18, background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', backdropFilter:'blur(10px)', minHeight:90, transition:'all 0.3s' }}>
            <div style={{ fontSize:'1.4rem', marginBottom:6 }}>{FEATURES[featureIdx].emoji}</div>
            <div style={{ fontSize:'0.82rem', color:'rgba(255,255,255,0.55)', lineHeight:1.6 }}>{FEATURES[featureIdx].text}</div>
          </div>
          {/* Dots */}
          <div style={{ display:'flex', justifyContent:'center', gap:5, marginTop:12 }}>
            {FEATURES.map((_, i) => (
              <div key={i} onClick={() => setFeatureIdx(i)} style={{ width: i === featureIdx ? 18 : 5, height:5, borderRadius:3, background: i === featureIdx ? '#10b981' : 'rgba(255,255,255,0.12)', transition:'all 0.3s', cursor:'pointer' }}/>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT — Form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 48px', position:'relative', zIndex:1, overflowY:'auto' }}>
        <div style={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`radial-gradient(ellipse 70% 70% at 50% 50%, rgba(16,185,129,${formGlow * 0.08}) 0%, transparent 70%)` }}/>

        <div style={{ width:'100%', maxWidth:380 }}>
          <div style={{ padding:'36px 36px', borderRadius:24,
            background:'rgba(255,255,255,0.025)',
            border:`1px solid rgba(16,185,129,${0.15 + formGlow * 0.2})`,
            boxShadow:`0 0 ${40 + formGlow * 50}px rgba(16,185,129,${0.06 + formGlow * 0.1}), 0 24px 48px rgba(0,0,0,0.4)`,
            backdropFilter:'blur(20px)', position:'relative' }}>

            {/* Accents */}
            <div style={{ position:'absolute', top:-1, left:28, width:50, height:2, background:'linear-gradient(90deg,#10b981,transparent)', borderRadius:1 }}/>
            <div style={{ position:'absolute', bottom:-1, right:28, width:50, height:2, background:'linear-gradient(90deg,transparent,#059669)', borderRadius:1 }}/>

            <h2 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'1.8rem', margin:'0 0 5px', color:'white' }}>
              Create Account {success ? '🎉' : '🚀'}
            </h2>
            <p style={{ color:'rgba(255,255,255,0.32)', fontSize:'0.84rem', margin:'0 0 26px' }}>Free forever · track progress · 21 AI agents</p>

            {error && (
              <div style={{ padding:'10px 14px', borderRadius:11, background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)', color:'#f87171', fontSize:'0.81rem', marginBottom:18, lineHeight:1.5 }}>
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div style={{ padding:'10px 14px', borderRadius:11, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', color:'#34d399', fontSize:'0.83rem', marginBottom:18, fontWeight:600 }}>
                ✓ Account created! Redirecting...
              </div>
            )}

            <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
              {[
                { id:'name',     label:'Full Name',        val:name,     set:setName,     type:'text',     ph:'Arjun Kumar',       ac:'name' },
                { id:'email',    label:'Email Address',    val:email,    set:setEmail,    type:'email',    ph:'you@example.com',   ac:'email' },
                { id:'password', label:'Password',         val:password, set:setPassword, type:'password', ph:'Min. 6 characters', ac:'new-password' },
                { id:'confirm',  label:'Confirm Password', val:confirm,  set:setConfirm,  type:'password', ph:'Repeat password',   ac:'new-password' },
              ].map(f => (
                <div key={f.id}>
                  <label style={{ display:'block', fontSize:'0.65rem', fontWeight:800, color: focused === f.id ? '#6ee7b7' : 'rgba(255,255,255,0.35)', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:7, transition:'color 0.2s' }}>{f.label}</label>
                  <input id={f.id} type={f.type} value={f.val}
                    onChange={e => f.set(e.target.value)}
                    onFocus={() => setFocused(f.id)}
                    onBlur={() => setFocused(null)}
                    placeholder={f.ph} autoComplete={f.ac}
                    style={{ width:'100%', padding:'12px 16px', borderRadius:13,
                      background: focused === f.id ? 'rgba(16,185,129,0.07)' : 'rgba(255,255,255,0.035)',
                      border: `1px solid ${focused === f.id ? 'rgba(16,185,129,0.55)' : 'rgba(255,255,255,0.07)'}`,
                      boxShadow: focused === f.id ? '0 0 0 3px rgba(16,185,129,0.1)' : 'none',
                      color:'white', fontSize:'0.9rem', outline:'none', boxSizing:'border-box',
                      fontFamily:'Inter,sans-serif', transition:'all 0.2s' }}
                  />
                </div>
              ))}

              {/* Perks */}
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {['✓ 21 AI Agents','✓ Progress tracking','✓ Free forever'].map(p => (
                  <span key={p} style={{ fontSize:'0.65rem', color:'#34d399', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)', padding:'3px 9px', borderRadius:20, fontWeight:700 }}>{p}</span>
                ))}
              </div>

              <button type="submit" disabled={loading || success} style={{ padding:'14px', borderRadius:13,
                background: success ? 'linear-gradient(135deg,#10b981,#059669)' : loading ? 'rgba(16,185,129,0.4)' : 'linear-gradient(135deg,#10b981,#059669)',
                border:'none', color:'white', fontWeight:800, fontSize:'0.97rem',
                cursor: loading || success ? 'default' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 24px rgba(16,185,129,0.38)', transition:'all 0.2s', fontFamily:'Inter,sans-serif' }}
                onMouseEnter={e => { if(!loading && !success)(e.currentTarget as HTMLButtonElement).style.transform='translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform=''; }}>
                {success ? '✓ Account Created!' : loading ? '⏳ Creating...' : '→ Create Free Account'}
              </button>
            </form>

            <div style={{ marginTop:22, paddingTop:18, borderTop:'1px solid rgba(255,255,255,0.05)', textAlign:'center' }}>
              <p style={{ fontSize:'0.83rem', color:'rgba(255,255,255,0.32)', margin:'0 0 10px' }}>
                Already have an account?{' '}
                <button onClick={() => router.push('/login')} style={{ background:'none', border:'none', color:'#a5b4fc', fontWeight:700, cursor:'pointer', fontSize:'0.83rem', padding:0 }}>Sign in →</button>
              </p>
              <button onClick={() => router.push('/')} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.18)', cursor:'pointer', fontSize:'0.71rem', textDecoration:'underline' }}>
                Continue without account
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`input::placeholder { color: rgba(255,255,255,0.16); } * { box-sizing:border-box; }`}</style>
    </div>
  );
}
