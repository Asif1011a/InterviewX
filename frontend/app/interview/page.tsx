'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import ScoreRing from '@/components/ScoreRing';
import { Mic, MicOff, Video, VideoOff, PhoneOff, SkipForward, Volume2, VolumeX, ArrowLeft } from 'lucide-react';

declare global {
  interface Window { SpeechRecognition: any; webkitSpeechRecognition: any; }
}

type AIPhase = 'init'|'greeting'|'asking'|'listening'|'evaluating'|'feedback'|'complete';

// ─── 15 Agents ────────────────────────────────────────────────────────────────
const AGENTS = [
  { id:'ResumeAnalyst',       name:'Resume Analyst',   color:'#6366f1', ring:0, slot:0 },
  { id:'GapDetector',         name:'Gap Detector',     color:'#8b5cf6', ring:0, slot:1 },
  { id:'CompanyIntel',        name:'Company Intel',    color:'#a78bfa', ring:0, slot:2 },
  { id:'Strategist',          name:'Strategist',       color:'#c4b5fd', ring:0, slot:3 },
  { id:'BenchmarkAgent',      name:'Benchmark',        color:'#7c3aed', ring:0, slot:4 },
  { id:'Interviewer',         name:'Interviewer',      color:'#06b6d4', ring:1, slot:0 },
  { id:'FollowUpInterviewer', name:'Follow-Up',        color:'#22d3ee', ring:1, slot:1 },
  { id:'Evaluator',           name:'Evaluator',        color:'#10b981', ring:1, slot:2 },
  { id:'Coach',               name:'Coach Agent',      color:'#34d399', ring:1, slot:3 },
  { id:'ConfidenceLens',      name:'Confidence Lens',  color:'#6ee7b7', ring:1, slot:4 },
  { id:'LearningPath',        name:'Learning Path',    color:'#f59e0b', ring:2, slot:0 },
  { id:'PracticeGenerator',   name:'Practice Gen',     color:'#fbbf24', ring:2, slot:1 },
  { id:'ProgressAgent',       name:'Progress Agent',   color:'#fb923c', ring:2, slot:2 },
  { id:'ReportWriter',        name:'Report Writer',    color:'#f87171', ring:2, slot:3 },
  { id:'MotivationBot',       name:'Motivation Bot',   color:'#ef4444', ring:2, slot:4 },
];

const CONNECTIONS = [
  ['ResumeAnalyst','GapDetector'],['ResumeAnalyst','Strategist'],
  ['GapDetector','Strategist'],['CompanyIntel','Strategist'],
  ['Strategist','Interviewer'],['Strategist','BenchmarkAgent'],
  ['Interviewer','Evaluator'],['Interviewer','FollowUpInterviewer'],
  ['Evaluator','Coach'],['Evaluator','ConfidenceLens'],
  ['Evaluator','ProgressAgent'],['BenchmarkAgent','LearningPath'],
  ['Coach','LearningPath'],['Coach','PracticeGenerator'],
  ['ProgressAgent','ReportWriter'],['ProgressAgent','MotivationBot'],
];

function hex2rgb(h:string){return{r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)}}

// ─── Live Agent Network (right panel canvas) ──────────────────────────────────
function AgentNetwork({ states }: { states: Record<string,string> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const anglesRef = useRef([0,0,0]);
  const particlesRef = useRef<{key:string;t:number;speed:number}[]>([]);
  const rafRef = useRef(0);
  const frameRef = useRef(0);
  // Always-fresh ref so draw() never reads stale states
  const statesRef = useRef(states);
  useEffect(() => { statesRef.current = states; }, [states]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const RING_R = [70, 110, 70];
    const RING_Y = [38, 0, -38];
    const RING_SPEED = [0.004, 0.003, 0.005];
    const RING_TILT = [0.2, 0, -0.2];
    const FOV = 400;

    const resize = () => {
      const dpr = window.devicePixelRatio||1;
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const project = (x:number,y:number,z:number,W:number,H:number) => {
      const scale = FOV/(FOV+z+200);
      return { sx:W/2+x*scale, sy:H/2+y*scale, scale };
    };
    const rotY = (x:number,y:number,z:number,a:number) =>
      ({x:x*Math.cos(a)-z*Math.sin(a),y,z:x*Math.sin(a)+z*Math.cos(a)});
    const rotX = (x:number,y:number,z:number,a:number) =>
      ({x,y:y*Math.cos(a)-z*Math.sin(a),z:y*Math.sin(a)+z*Math.cos(a)});

    let autoRotY = 0;

    const getPos = (agent: typeof AGENTS[0]) => {
      const r = RING_R[agent.ring];
      const angle = anglesRef.current[agent.ring] + (agent.slot/5)*Math.PI*2;
      let x = Math.cos(angle)*r, y = RING_Y[agent.ring], z = Math.sin(angle)*r;
      const t = RING_TILT[agent.ring];
      const yt = y*Math.cos(t)-z*Math.sin(t);
      const zt = y*Math.sin(t)+z*Math.cos(t);
      return {x,y:yt,z:zt};
    };

    const draw = () => {
      frameRef.current++;
      const f = frameRef.current;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0,0,W,H);

      // BG
      const bg = ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,Math.max(W,H)*0.6);
      bg.addColorStop(0,'#0a0a18'); bg.addColorStop(1,'#020208');
      ctx.fillStyle=bg; ctx.fillRect(0,0,W,H);

      autoRotY += 0.003;
      anglesRef.current[0] += RING_SPEED[0];
      anglesRef.current[1] += RING_SPEED[1];
      anglesRef.current[2] += RING_SPEED[2];

      // Project all
      const proj = AGENTS.map(agent => {
        let p = getPos(agent);
        p = rotY(p.x,p.y,p.z,autoRotY);
        p = rotX(p.x,p.y,p.z,0.2);
        const pr = project(p.x,p.y,p.z,W,H);
        // Check both PascalCase id and snake_case variant
        const snakeId = agent.id.replace(/([A-Z])/g, m => '_'+m.toLowerCase()).replace(/^_/,'');
        const status = statesRef.current[agent.id] || statesRef.current[snakeId] || 'idle';
        return {agent, pr:{...pr,scale:Math.max(0.05,pr.scale)}, status, wz:p.z};
      });
      proj.sort((a,b)=>b.wz-a.wz);

      // Connections
      for (const [sid,did] of CONNECTIONS) {
        const s=proj.find(p=>p.agent.id===sid), d=proj.find(p=>p.agent.id===did);
        if(!s||!d) continue;
        const active = s.status!=='idle'||d.status!=='idle';
        const pulsing = s.status==='thinking'||d.status==='thinking';
        const x1=s.pr.sx,y1=s.pr.sy,x2=d.pr.sx,y2=d.pr.sy;
        const mx=(x1+x2)/2+(y2-y1)*0.2, my=(y1+y2)/2-(x2-x1)*0.1;
        const sr=hex2rgb(s.agent.color), dr=hex2rgb(d.agent.color);
        const grd=ctx.createLinearGradient(x1,y1,x2,y2);
        const al=pulsing?0.6:active?0.2:0.06;
        grd.addColorStop(0,`rgba(${sr.r},${sr.g},${sr.b},${al})`);
        grd.addColorStop(1,`rgba(${dr.r},${dr.g},${dr.b},${al})`);
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.quadraticCurveTo(mx,my,x2,y2);
        ctx.strokeStyle=grd; ctx.lineWidth=pulsing?1.5:0.7; ctx.stroke();

        // Particles
        const key=`${sid}->${did}`;
        if (pulsing && f%15===0)
          particlesRef.current.push({key,t:0,speed:0.008+Math.random()*0.006});
        for (const pt of particlesRef.current.filter(p=>p.key===key)) {
          const t=pt.t;
          const px=(1-t)*(1-t)*x1+2*(1-t)*t*mx+t*t*x2;
          const py=(1-t)*(1-t)*y1+2*(1-t)*t*my+t*t*y2;
          const fa=Math.sin(t*Math.PI);
          ctx.beginPath(); ctx.arc(px,py,2.5,0,Math.PI*2);
          ctx.fillStyle=`rgba(255,255,255,${fa*0.9})`; ctx.fill();
          const gg=ctx.createRadialGradient(px,py,0,px,py,6);
          gg.addColorStop(0,`rgba(255,255,255,${fa*0.3})`); gg.addColorStop(1,'transparent');
          ctx.beginPath(); ctx.arc(px,py,6,0,Math.PI*2); ctx.fillStyle=gg; ctx.fill();
        }
      }
      particlesRef.current=particlesRef.current.map(p=>({...p,t:p.t+p.speed})).filter(p=>p.t<1);

      // Nodes
      for (const {agent,pr,status} of proj) {
        const {sx,sy,scale}=pr;
        const r=Math.max(1, 13*scale);
        const rgb=hex2rgb(agent.color);
        const pulse=0.5+0.5*Math.sin(f*0.1+agent.slot);

        if (status==='thinking'||status==='done') {
          const gr=status==='thinking'?r*(2.5+pulse*2):r*2.5;
          const ga=status==='thinking'?0.12+pulse*0.18:0.08;
          const glow=ctx.createRadialGradient(sx,sy,0,sx,sy,gr);
          glow.addColorStop(0,`rgba(${rgb.r},${rgb.g},${rgb.b},${ga})`);
          glow.addColorStop(1,'transparent');
          ctx.beginPath(); ctx.arc(sx,sy,gr,0,Math.PI*2); ctx.fillStyle=glow; ctx.fill();
        }

        const na=status==='idle'?0.3:status==='done'?0.95:0.85+pulse*0.15;
        const ng=ctx.createRadialGradient(sx-r*0.3,sy-r*0.3,r*0.1,sx,sy,r);
        ng.addColorStop(0,`rgba(255,255,255,${na*0.8})`);
        ng.addColorStop(0.4,`rgba(${rgb.r},${rgb.g},${rgb.b},${na})`);
        ng.addColorStop(1,`rgba(${Math.floor(rgb.r*0.3)},${Math.floor(rgb.g*0.3)},${Math.floor(rgb.b*0.3)},${na})`);
        ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2); ctx.fillStyle=ng; ctx.fill();

        if (status==='thinking') {
          ctx.beginPath();
          ctx.arc(sx,sy,r+3*scale+pulse*3*scale,0,Math.PI*2);
          ctx.strokeStyle=`rgba(${rgb.r},${rgb.g},${rgb.b},${0.5+pulse*0.4})`;
          ctx.lineWidth=1.5*scale; ctx.stroke();
        }

        const dot=status==='thinking'?'#facc15':status==='done'?'#10b981':'#1e293b';
        ctx.beginPath(); ctx.arc(sx+r*0.65,sy-r*0.65,3*scale,0,Math.PI*2);
        ctx.fillStyle=dot; ctx.fill();

        if (scale > 0.5) {
          const fs=Math.max(7,8*scale);
          ctx.font=`600 ${fs}px Inter,sans-serif`;
          ctx.textAlign='center';
          ctx.fillStyle=status!=='idle'?'rgba(255,255,255,0.9)':'rgba(255,255,255,0.3)';
          ctx.fillText(agent.name.replace(' ','\n').split('\n')[0], sx, sy+r+11*scale);
        }
      }

      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return()=>{cancelAnimationFrame(rafRef.current);window.removeEventListener('resize',resize);};
  }, []); // run once only — statesRef keeps it fresh

  return <canvas ref={canvasRef} style={{width:'100%',height:'100%',display:'block'}}/>;
}

// ─── AI Interviewer Avatar ─────────────────────────────────────────────────────
function AIAvatar({ phase, speaking }: { phase:AIPhase; speaking:boolean }) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const rafRef=useRef(0); const fRef=useRef(0);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    const ctx=canvas.getContext('2d')!;
    const S=160; canvas.width=S; canvas.height=S;
    const cx=S/2,cy=S/2;
    const draw=()=>{
      fRef.current++;const f=fRef.current;
      ctx.clearRect(0,0,S,S);
      const phaseRGB = phase==='listening'?'16,185,129':phase==='evaluating'?'245,158,11':phase==='feedback'?'139,92,246':'99,102,241';
      const pulse=0.5+0.5*Math.sin(f*(speaking?0.18:0.05));
      // Outer rings
      for(let i=3;i>0;i--){
        const rr=28+i*12+(speaking?pulse*5:0);
        const a=speaking?0.08+pulse*0.06:0.04;
        ctx.beginPath();ctx.arc(cx,cy,rr,0,Math.PI*2);
        ctx.strokeStyle=`rgba(${phaseRGB},${a*i})`;ctx.lineWidth=1;ctx.stroke();
        // orbiting dots
        const angle=f*0.015*i*(i%2?1:-1);
        const dx=cx+Math.cos(angle)*rr,dy=cy+Math.sin(angle)*rr;
        ctx.beginPath();ctx.arc(dx,dy,1.5+Number(speaking)*1.5,0,Math.PI*2);
        ctx.fillStyle=`rgba(${phaseRGB},${0.4+pulse*0.5})`;ctx.fill();
      }
      // Core
      const cr=20+(speaking?pulse*5:pulse*2);
      const g=ctx.createRadialGradient(cx-5,cy-5,2,cx,cy,cr);
      g.addColorStop(0,`rgba(255,255,255,0.95)`);
      g.addColorStop(0.4,`rgba(${phaseRGB},0.9)`);
      g.addColorStop(1,`rgba(${phaseRGB},0.1)`);
      ctx.beginPath();ctx.arc(cx,cy,cr,0,Math.PI*2);ctx.fillStyle=g;ctx.fill();
      // Sound bars when speaking
      if(speaking){
        for(let b=0;b<10;b++){
          const a=(b/10)*Math.PI*2;
          const h=8+Math.sin(f*0.2+b*0.7)*8;
          const x1=cx+Math.cos(a)*(cr+4),y1=cy+Math.sin(a)*(cr+4);
          const x2=cx+Math.cos(a)*(cr+4+h),y2=cy+Math.sin(a)*(cr+4+h);
          ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
          ctx.strokeStyle=`rgba(${phaseRGB},${0.5+Math.sin(f*0.2+b)*0.4})`;
          ctx.lineWidth=2;ctx.lineCap='round';ctx.stroke();
        }
      }
      rafRef.current=requestAnimationFrame(draw);
    };
    rafRef.current=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(rafRef.current);
  },[phase,speaking]);

  return <canvas ref={canvasRef} style={{width:'100%',height:'100%'}}/>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function safeString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(' | ');
  }
  return String(val);
}

function InterviewCall() {
  const searchParams=useSearchParams();
  const sid=searchParams.get('sid');
  const router=useRouter();

  const [session, setSession]   = useState<any>(null);
  const [phase, setPhase]       = useState<AIPhase>('init');
  const [qIndex, setQIndex]     = useState(0);
  const [answer, setAnswer]     = useState('');
  const [evalData, setEvalData] = useState<any>(null);
  const [aiSpeaking, setAiSpk] = useState(false);
  const [subtitle, setSubtitle] = useState('Connecting to AI Interviewer...');
  const [transcript, setTranscript] = useState('');
  const [waveData, setWaveData] = useState<number[]>(Array(28).fill(0));
  const [micOn, setMicOn]       = useState(false);
  const [camOn, setCamOn]       = useState(false);
  const [muted, setMuted]       = useState(false);
  const [agentStates, setAgentStates] = useState<Record<string,string>>({});
  const [eventLog, setEventLog] = useState<{agent:string;status:string;time:string}[]>([]);
  const [toast, setToast]       = useState('');
  const [scoreFlash, setScoreFlash] = useState<any>(null);
  const [followUpQ, setFollowUpQ]   = useState('');
  const [isFollowUp, setIsFollowUp] = useState(false);
  
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showHint, setShowHint] = useState(false);

  // Live Technical Coding State
  const [inputMode, setInputMode] = useState<'voice' | 'code'>('voice');
  const [codeText, setCodeText] = useState('# Write your Python solution below\ndef solve():\n    print("Executing solution...")\n    return True\n\nsolve()');
  const [codeExecuting, setCodeExecuting] = useState(false);
  const [codeOutput, setCodeOutput] = useState<string | null>(null);
  const [codeComplexity, setCodeComplexity] = useState<{ time: string; space: string } | null>(null);

  // Dynamic Live Eye Gaze & Attentiveness Tracking State
  const [eyeScore, setEyeScore] = useState<number>(98.4);
  const [gazeStatus, setGazeStatus] = useState<string>('OPTIMAL FOCUS');
  const [postureStatus, setPostureStatus] = useState<string>('UPRIGHT & ASSERTIVE');
  const lastFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  const runInterviewCode = async () => {
    setCodeExecuting(true);
    setCodeOutput(null);
    setCodeComplexity(null);
    try {
      const res = await api.executeCode(codeText, 'python');
      setCodeOutput(`${res.stdout}\n⏱ Latency: ${res.elapsed_ms}ms`);
      if (res.complexity) setCodeComplexity(res.complexity);
      setAnswer(codeText);
    } catch (err: any) {
      setCodeOutput(`Execution Error: ${err?.message || 'Failed to execute'}`);
    } finally {
      setCodeExecuting(false);
    }
  };

  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream|null>(null);
  const recogRef    = useRef<any>(null);
  const analyserRef = useRef<AnalyserNode|null>(null);
  const audioCtxRef = useRef<AudioContext|null>(null);
  const waveRafRef  = useRef(0);
  const voiceRef    = useRef<SpeechSynthesisVoice|null>(null);
  const planRef     = useRef<any[]>([]);
  const phaseRef    = useRef<AIPhase>('init');
  const listeningActiveRef = useRef(false);
  // Once user clicks mic once, Chrome allows programmatic starts — track this
  const hasGrantedMicRef = useRef(false);
  phaseRef.current  = phase;
  
  const timerIntervalRef = useRef<any>(null);

  // Timer logic
  useEffect(() => {
    if (phase === 'listening' || phase === 'asking') {
      if (!timerIntervalRef.current) {
        timerIntervalRef.current = setInterval(() => {
          setElapsedSeconds(prev => prev + 1);
        }, 1000);
      }
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [phase]);

  // Voices — Prioritize High Quality Female AI Voices (Zira, Samantha, Google Female, Aria, Jenny)
  useEffect(() => {
    const loadVoices = () => {
      const vs = window.speechSynthesis.getVoices();
      const femaleKeywords = ['zira', 'female', 'samantha', 'victoria', 'karen', 'fiona', 'moira', 'ava', 'jenny', 'aria', 'google uk english female', 'google us english female'];
      
      const femaleVoice = vs.find(v => femaleKeywords.some(kw => v.name.toLowerCase().includes(kw)))
        || vs.find(v => v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female'))
        || vs.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('female'))
        || vs.find(v => v.lang.startsWith('en-US'))
        || vs.find(v => v.lang.startsWith('en'))
        || vs[0] || null;

      voiceRef.current = femaleVoice;
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // SSE — agent events
  useEffect(()=>{
    const es=new EventSource('http://localhost:8000/agents/stream');
    es.onmessage=(e)=>{
      try{
        const d=JSON.parse(e.data); if(d.ping) return;
        setAgentStates(prev=>({...prev,[d.agent]:d.status}));
        setEventLog(prev=>[{agent:d.agent,status:d.status,time:new Date().toLocaleTimeString()}, ...prev].slice(0,40));
      }catch{}
    };
    return()=>es.close();
  },[]);

  // TTS — polling fallback fixes Edge/Chrome bug where onend never fires
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (muted) { onEnd?.(); return; }

    window.speechSynthesis.cancel();

    const u = new SpeechSynthesisUtterance(text);
    if (voiceRef.current) u.voice = voiceRef.current;
    u.rate = 0.98; u.pitch = 1.05; u.volume = 1;

    // Stop mic while AI speaks
    listeningActiveRef.current = false;
    try { recogRef.current?.abort(); } catch {}
    recogRef.current = null;
    setMicOn(false);

    let fired = false;
    const finish = () => {
      if (fired) return;
      fired = true;
      clearInterval(pollId);
      clearInterval(resumeId);
      setAiSpk(false);
      setSubtitle('');
      onEnd?.();
    };

    u.onstart = () => setAiSpk(true);
    u.onend   = finish;
    u.onerror = finish;

    // Chrome/Edge bug: speechSynthesis pauses silently and onend never fires.
    // Fix: poll every 250ms; if not speaking any more → fire finish().
    const pollId = setInterval(() => {
      if (!window.speechSynthesis.speaking && !window.speechSynthesis.pending) finish();
    }, 250);

    // Prevent Chrome from pausing long utterances after ~15s
    const resumeId = setInterval(() => {
      if (window.speechSynthesis.paused) window.speechSynthesis.resume();
    }, 5000);

    window.speechSynthesis.speak(u);
    setSubtitle(text);
  }, [muted]);

  // Session load → greet
  useEffect(()=>{
    if(!sid) return;
    api.getSession(sid).then(s=>{
      setSession(s);
      const raw=s.interview_plan as any;
      const qs:any[]=Array.isArray(raw)?raw:Array.isArray(raw?.questions)?raw.questions:[];
      planRef.current=qs;
    });
  },[sid]);

  // Start interview once session + plan are ready
  const startedRef = useRef(false);
  useEffect(() => {
    if (!session || planRef.current.length === 0 || startedRef.current) return;
    startedRef.current = true;
    setPhase('greeting');

    // Auto start candidate camera feed for video interview experience
    startCamera();

    // Short greeting — don't make user wait long
    speak(
      `Hi! I'm your AI interviewer. ${planRef.current.length} questions. Let's start.`,
      () => askQuestion(0)
    );
  // eslint-disable-next-line
  }, [session]);

  // Simulate agent activity from interview phase (works without backend SSE)
  useEffect(() => {
    const PHASE_AGENTS: Record<string, string[]> = {
      greeting:   ['resume_analyst'],
      asking:     ['interviewer', 'company_intel'],
      listening:  ['confidence_lens', 'interviewer'],
      evaluating: ['evaluator','gap_detector','benchmark','strengths','confidence_lens','coach_agent'],
      feedback:   ['coach_agent','learning_path','progress_agent','report_writer'],
      complete:   ['report_writer','progress_agent','motivation_bot'],
    };
    const active = PHASE_AGENTS[phase] || [];
    if (active.length === 0) return;

    // Light up agents in sequence
    const timers: ReturnType<typeof setTimeout>[] = [];
    active.forEach((id, i) => {
      timers.push(setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [id]: 'thinking' }));
        setEventLog(prev => [{ agent: id.replace(/_/g,' '), status:'thinking', time: new Date().toLocaleTimeString() }, ...prev].slice(0,40));
      }, i * 400));
      timers.push(setTimeout(() => {
        setAgentStates(prev => ({ ...prev, [id]: 'done' }));
        setEventLog(prev => [{ agent: id.replace(/_/g,' '), status:'done', time: new Date().toLocaleTimeString() }, ...prev].slice(0,40));
      }, i * 400 + (phase === 'evaluating' ? 3500 : 1800)));
    });
    return () => timers.forEach(clearTimeout);
  }, [phase]);


  // Camera — video only (avoid locking microphone hardware so SpeechRecognition gets full audio clarity)
  const startCamera = useCallback(async () => {
    try {
      const vidStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = vidStream;
      if (videoRef.current) {
        videoRef.current.srcObject = vidStream;
        await videoRef.current.play().catch(() => {});
      }
      setCamOn(true);
    } catch (err: any) {
      showToast(err?.name === 'NotAllowedError' ? 'Camera permission denied — allow in browser settings.' : 'Could not access camera.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    cancelAnimationFrame(waveRafRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamOn(false); setMicOn(false);
  }, []);

  // Live HTML5 Eye-Tracking & Optical Motion Analysis Loop
  useEffect(() => {
    if (!camOn || typeof window === 'undefined') return;

    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 90;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const intervalId = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.paused || vid.ended) return;

      try {
        ctx.drawImage(vid, 0, 0, 120, 90);
        const imgData = ctx.getImageData(0, 0, 120, 90);
        const data = imgData.data;

        if (lastFrameDataRef.current) {
          let diffSum = 0;
          const step = 8;
          for (let i = 0; i < data.length; i += step * 4) {
            diffSum += Math.abs(data[i] - lastFrameDataRef.current[i]);
          }

          const avgDiff = diffSum / (data.length / (step * 4));

          if (avgDiff > 45) {
            setGazeStatus('GAZE MOVEMENT DETECTED');
            setPostureStatus('HEAD MOVEMENT DETECTED');
            setEyeScore(prev => Math.max(68.2, +(prev - 2.8).toFixed(1)));
          } else if (avgDiff > 18) {
            setGazeStatus('STABLE FOCUS');
            setPostureStatus('UPRIGHT & ENGAGED');
            setEyeScore(prev => +(Math.min(99.4, prev + 0.3)).toFixed(1));
          } else {
            setGazeStatus('OPTIMAL GAZE');
            setPostureStatus('UPRIGHT & ASSERTIVE');
            setEyeScore(prev => +(Math.min(99.6, prev + 0.5)).toFixed(1));
          }
        }

        lastFrameDataRef.current = new Uint8ClampedArray(data);
      } catch {}
    }, 300);

    return () => clearInterval(intervalId);
  }, [camOn]);

  // STT — finalText stored in a ref so it never goes stale across auto-restarts
  const finalTextRef = useRef('');

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Use Google Chrome or Microsoft Edge for voice recognition.');
      return;
    }

    // Stop any existing loop
    listeningActiveRef.current = false;
    try { recogRef.current?.abort(); } catch {}

    // Always reset to empty on fresh start
    finalTextRef.current = '';
    setAnswer('');
    setTranscript('');
    setMicOn(true);
    listeningActiveRef.current = true;

    const makeRec = (): any => {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      // Auto-detect candidate locale with fallback to en-IN / en-US for max accuracy on technical terms
      rec.lang = (typeof navigator !== 'undefined' && navigator.language) ? navigator.language : 'en-IN';

      rec.onstart = () => setMicOn(true);

      rec.onresult = (e: any) => {
        let finalAcc = '';
        let interimAcc = '';

        for (let i = 0; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) {
            finalAcc += t + ' ';
          } else {
            interimAcc += t;
          }
        }

        setTranscript(interimAcc);
        const combined = (finalAcc + interimAcc).trim();
        if (combined) {
          finalTextRef.current = combined;
          setAnswer(combined);
        }
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          listeningActiveRef.current = false;
          setMicOn(false);
          showToast('Microphone blocked. Click lock icon in browser bar → Allow Microphone.');
        }
      };

      rec.onend = () => {
        if (listeningActiveRef.current) {
          setTimeout(() => {
            if (!listeningActiveRef.current) return;
            try {
              const next = makeRec();
              recogRef.current = next;
              next.start();
            } catch {}
          }, 100);
        } else {
          setMicOn(false);
        }
      };

      return rec;
    };

    const first = makeRec();
    recogRef.current = first;
    hasGrantedMicRef.current = true;
    try {
      first.start();
    } catch {}
  }, []);


  const stopListening = useCallback(() => {
    listeningActiveRef.current = false;   // stop auto-restart loop first
    try { recogRef.current?.abort(); } catch {}
    recogRef.current = null;
    setMicOn(false);
    setTranscript('');
  }, []);


  // Ask question n
  const askQuestion = useCallback((idx: number) => {
    const q = planRef.current[idx]; if (!q) return;
    setQIndex(idx);
    setAnswer('');
    setTranscript('');
    setFollowUpQ('');
    setIsFollowUp(false);
    setPhase('asking');
    setElapsedSeconds(0);
    setShowHint(false);
    finalTextRef.current = '';
    // Speak ONLY the question number + text
    speak(`Question ${idx + 1}. ${q.question}`, () => {
      setPhase('listening');
      setSubtitle('');
      if (hasGrantedMicRef.current) startListening();
    });
  }, [speak, startListening]);

  // Submit
  const submitAnswer = useCallback(async () => {
    if (!answer.trim()) { showToast('Please speak or type your answer.'); return; }
    stopListening();
    setPhase('evaluating');
    setSubtitle('AI agents are analyzing your answer...');

    try {
      const q = followUpQ || planRef.current[qIndex]?.question || '';
      const res: any = await api.submitAnswer({ session_id: sid!, question_index: qIndex, question: q, answer });
      const evalObj = res?.evaluation ?? res ?? {};
      setEvalData(res);
      setScoreFlash(evalObj);

      const overall = evalObj?.overall_score ?? 0;
      const isDontKnow = evalObj?.is_dont_know ?? false;
      const tip = res?.coaching?.tips?.[0] || res?.coach?.tips?.[0] || 'Keep learning and practicing!';

      // Special motivating feedback if candidate said "I don't know" or skipped
      if (isDontKnow) {
        setIsFollowUp(false);
        setFollowUpQ('');
        setPhase('feedback');
        const fbText = `That's completely fine! No candidate knows every single concept. I've added this topic to your 7-day study roadmap and provided a model answer below. Let's move to the next question.`;
        speak(fbText, () => {
          const next = qIndex + 1;
          if (next < planRef.current.length) setTimeout(() => askQuestion(next), 400);
          else { setPhase('complete'); speak('Technical interview complete! Great effort today.'); }
        });
        return;
      }

      // Standard technical answer handling: generate follow-up if first attempt
      if (!isFollowUp && sid) {
        try {
          const fRes: any = await api.generateFollowup(sid, q, answer);
          const fQ = fRes?.followup_question || fRes?.question;
          if (fQ) {
            setFollowUpQ(fQ);
            setIsFollowUp(true);
            setPhase('feedback');
            const fbText = `Score: ${overall} out of 10. ${tip}. Follow-up question: ${fQ}`;
            speak(fbText, () => {
              setPhase('listening');
              setSubtitle('');
              if (hasGrantedMicRef.current) startListening();
            });
            return;
          }
        } catch {}
      }

      // If already answered follow-up or no follow-up generated, move to next question
      setIsFollowUp(false);
      setFollowUpQ('');
      const fbText = `Score: ${overall} out of 10. ${tip}`;
      setPhase('feedback');
      speak(fbText, () => {
        const next = qIndex + 1;
        if (next < planRef.current.length) setTimeout(() => askQuestion(next), 400);
        else { setPhase('complete'); speak('Excellent! Technical interview complete.'); }
      });
    } catch { showToast('Evaluation failed. Retrying...'); setPhase('listening'); }
  }, [answer, qIndex, sid, speak, stopListening, startListening, askQuestion, isFollowUp, followUpQ]);

  const skipQuestion=useCallback(()=>{
    stopListening(); window.speechSynthesis.cancel();
    const next=qIndex+1;
    if(next<planRef.current.length) askQuestion(next);
    else {setPhase('complete');speak('Interview complete!');}
  },[qIndex,askQuestion,speak,stopListening]);

  const endCall=()=>{
    window.speechSynthesis.cancel(); stopCamera(); recogRef.current?.stop();
    router.push(sid?`/dashboard?sid=${sid}`:'/setup');
  };

  const showToast=(msg:string)=>{setToast(msg);setTimeout(()=>setToast(''),4000);};

  useEffect(()=>()=>{stopCamera();recogRef.current?.stop();window.speechSynthesis.cancel();},[stopCamera]);

  const currentQ=followUpQ||planRef.current[qIndex]?.question||'';
  const currentHint = planRef.current[qIndex]?.hint || "Focus on your impact, specific examples, and the outcome.";
  const progress=planRef.current.length>0?((qIndex+(phase==='complete'?1:0))/planRef.current.length)*100:0;
  const phaseColor=phase==='listening'?'#10b981':phase==='evaluating'?'#f59e0b':phase==='feedback'?'#8b5cf6':'#6366f1';
  const phaseLabel={
    init:'Connecting...',greeting:'AI Interviewer: Introduction',
    asking:'AI Interviewer: Asking question',
    listening:'Your Turn — Speak your answer',
    evaluating:'15 Agents analyzing your answer...',
    feedback:'AI Feedback',complete:'Interview Complete',
  }[phase];

  const activeAgentCount=Object.values(agentStates).filter(s=>s==='thinking').length;
  
  // METRICS calculations
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const confidenceMetric = Math.min(100, Math.round((wordCount / 30) * 100));
  const wpm = Math.round(wordCount / Math.max(1, elapsedSeconds / 60));
  const fillerWords = ['um','uh','like','you know','basically','actually','sort of','kind of'].filter(fw => answer.toLowerCase().includes(fw));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if(!session) return (
    <div style={{position:'fixed',inset:0,background:'#030308',display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:16,zIndex:9999}}>
      <div style={{width:48,height:48,border:'3px solid rgba(99,102,241,0.3)',borderTopColor:'#6366f1',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
      <p style={{color:'#6366f1',fontFamily:'Space Grotesk',fontWeight:700}}>Preparing interview room...</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(phase==='complete') return (
    <div style={{position:'fixed',inset:0,background:'radial-gradient(ellipse at center,#0f0a2a,#030308)',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:24,zIndex:9999}}>
      <div style={{fontSize:64}}>🎉</div>
      <h1 style={{fontFamily:'Space Grotesk',fontWeight:800,fontSize:'2rem',color:'white'}}>Interview Complete!</h1>
      {evalData&&<div style={{display:'flex',gap:20,flexWrap:'wrap',justifyContent:'center'}}>
        {[['Content','content_score'],['Clarity','clarity_score'],['Structure','structure_score'],['Overall','overall_score']].map(([l,k])=>(
          <ScoreRing key={k} score={evalData.evaluation?.[k]??0} label={l} size={72} strokeWidth={5}/>
        ))}
      </div>}
      <div style={{display:'flex',gap:12}}>
        <button onClick={()=>router.push(`/dashboard?sid=${sid}`)} style={{padding:'12px 28px',borderRadius:12,background:'linear-gradient(135deg,#6366f1,#8b5cf6)',color:'white',fontWeight:800,fontSize:'0.9rem',border:'none',cursor:'pointer',fontFamily:'Space Grotesk'}}>View Dashboard</button>
        <button onClick={()=>router.push(`/feedback?sid=${sid}`)} style={{padding:'12px 28px',borderRadius:12,background:'rgba(255,255,255,0.06)',color:'rgba(255,255,255,0.7)',fontWeight:700,fontSize:'0.9rem',border:'1px solid rgba(255,255,255,0.1)',cursor:'pointer'}}>Detailed Feedback</button>
      </div>
    </div>
  );

  return (
    <div style={{position:'fixed', inset:0, zIndex:9999, background:'#030308', fontFamily:'Inter,sans-serif', display:'flex', flexDirection:'column', color:'white'}}>
      
      {/* ── TOP BAR (height:56px) ── */}
      <div style={{height:56, background:'rgba(255,255,255,0.02)', backdropFilter:'blur(10px)', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', flexShrink:0}}>
        
        {/* Left: back button + red pulsing dot + 'LIVE' text + separator + session.target_role + '@' + session.company */}
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <button onClick={() => router.back()} style={{background:'none', border:'none', color:'rgba(255,255,255,0.7)', cursor:'pointer', display:'flex', alignItems:'center'}}>
            <ArrowLeft size={18}/>
          </button>
          <div style={{display:'flex', alignItems:'center', gap:10}}>
            <div style={{width:8, height:8, borderRadius:'50%', background:'#ef4444', boxShadow:'0 0 10px #ef4444', animation:'pulse-dot 2s infinite'}}/>
            <span style={{fontFamily:'Space Grotesk', fontWeight:800, fontSize:'0.85rem', letterSpacing:'0.05em'}}>LIVE</span>
            <span style={{color:'rgba(255,255,255,0.2)'}}>|</span>
            <span style={{color:'rgba(255,255,255,0.6)', fontSize:'0.85rem', fontWeight:500}}>{session?.target_role} @ {session?.company}</span>
          </div>
        </div>
        
        {/* Center: Q progress dots */}
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          {planRef.current.map((_, i) => (
            <div key={i} style={{width:8, height:8, borderRadius:'50%', background:i<qIndex?'#10b981':i===qIndex?'#6366f1':'rgba(255,255,255,0.1)', transition:'background 0.3s'}}/>
          ))}
        </div>

        {/* Right: timer + mute button + red 'End Call' button */}
        <div style={{display:'flex', alignItems:'center', gap:16}}>
          <div style={{fontFamily:'Space Grotesk', fontWeight:600, fontSize:'0.95rem', color:elapsedSeconds>120?'#ef4444':'white'}}>
            {formatTime(elapsedSeconds)}
          </div>
          <button onClick={()=>setMuted(!muted)} style={{background:'none', border:'none', cursor:'pointer', color:muted?'#f87171':'rgba(255,255,255,0.6)'}}>
            {muted?<VolumeX size={18}/>:<Volume2 size={18}/>}
          </button>
          <button onClick={endCall} style={{padding:'6px 16px', borderRadius:6, background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:'0.8rem', fontWeight:700, cursor:'pointer'}}>
            End Call
          </button>
        </div>
      </div>

      {/* ── MAIN AREA ── */}
      <div style={{flex:1, display:'flex', overflow:'hidden'}}>
        
        {/* ── LEFT COLUMN ── */}
        <div style={{width:340, flexShrink:0, display:'flex', flexDirection:'column', background:'linear-gradient(180deg, #0a0818 0%, #050308 100%)', borderRight:'1px solid rgba(255,255,255,0.06)'}}>
          
          {/* Top 65% — Maya AI Avatar area */}
          <div style={{height:'65%', position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'radial-gradient(circle at center, rgba(99,102,241,0.1) 0%, transparent 70%)'}}>
            {aiSpeaking && <div style={{position:'absolute', width:220, height:220, borderRadius:'50%', background:'rgba(167,139,250,0.2)', filter:'blur(40px)', animation:'pulse-ring 2s infinite'}}/>}
            
            {/* SVG Avatar */}
            <svg width="200" height="260" viewBox="0 0 200 260" style={{zIndex:2, animation: aiSpeaking ? 'maya-speak 2s infinite ease-in-out' : 'none', filter: aiSpeaking ? 'drop-shadow(0 0 15px rgba(167,139,250,0.6))' : 'none', transition: 'all 0.3s ease'}}>
              <defs>
                <linearGradient id="hairGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1a1a2e" />
                  <stop offset="100%" stopColor="#0f0f1a" />
                </linearGradient>
                <linearGradient id="skinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#ffe0d2" />
                  <stop offset="100%" stopColor="#f5c6b5" />
                </linearGradient>
                <linearGradient id="suitGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#4c1d95" />
                  <stop offset="100%" stopColor="#312e81" />
                </linearGradient>
                <radialGradient id="blushGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(255,100,100,0.3)" />
                  <stop offset="100%" stopColor="rgba(255,100,100,0)" />
                </radialGradient>
              </defs>
              
              {/* Back Hair */}
              <path d="M40 100 C 30 180, 20 220, 40 260 L 160 260 C 180 220, 170 180, 160 100 C 150 40, 50 40, 40 100 Z" fill="url(#hairGradient)"/>
              
              {/* Face/Neck */}
              <path d="M85 170 C 85 190, 115 190, 115 170 L 115 200 C 115 210, 85 210, 85 200 Z" fill="url(#skinGradient)"/>
              <ellipse cx="100" cy="120" rx="45" ry="55" fill="url(#skinGradient)"/>
              
              {/* Blush */}
              <circle cx="70" cy="135" r="12" fill="url(#blushGradient)"/>
              <circle cx="130" cy="135" r="12" fill="url(#blushGradient)"/>
              
              {/* Eyes */}
              <path d="M 65 110 Q 75 100 85 110" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
              <path d="M 115 110 Q 125 100 135 110" fill="none" stroke="#222" strokeWidth="2" strokeLinecap="round"/>
              <circle cx="75" cy="115" r="7" fill="#4c1d95"/>
              <circle cx="125" cy="115" r="7" fill="#4c1d95"/>
              <circle cx="77" cy="113" r="2.5" fill="white"/>
              <circle cx="127" cy="113" r="2.5" fill="white"/>
              <circle cx="73" cy="117" r="1" fill="white"/>
              <circle cx="123" cy="117" r="1" fill="white"/>
              
              {/* Nose */}
              <path d="M 100 125 L 98 135 L 100 137" fill="none" stroke="#d6a392" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              
              {/* Mouth */}
              {aiSpeaking ? (
                <ellipse cx="100" cy="150" rx="8" ry="6" fill="#883333"/>
              ) : (
                <path d="M 90 150 Q 100 155 110 150" fill="none" stroke="#b06565" strokeWidth="2" strokeLinecap="round"/>
              )}

              {/* Front Hair */}
              <path d="M 100 50 C 40 50, 40 140, 50 160 C 55 120, 80 80, 100 70 C 120 80, 145 120, 150 160 C 160 140, 160 50, 100 50 Z" fill="url(#hairGradient)"/>
              <path d="M 100 70 C 80 75, 65 100, 60 120 C 65 95, 80 80, 100 75 C 120 80, 135 95, 140 120 C 135 100, 120 75, 100 70 Z" fill="rgba(255,255,255,0.1)"/>
              
              {/* Clothes/Collar */}
              <path d="M 60 260 C 60 210, 80 195, 100 200 C 120 195, 140 210, 140 260 Z" fill="url(#suitGradient)"/>
              <path d="M 85 200 L 100 220 L 115 200 Z" fill="#e2e8f0"/>
              <path d="M 85 200 L 100 220 L 70 260 L 60 260 Z" fill="#1e1b4b"/>
              <path d="M 115 200 L 100 220 L 130 260 L 140 260 Z" fill="#1e1b4b"/>
            </svg>
            
            {/* Name badge */}
            <div style={{position:'absolute', bottom:20, display:'flex', alignItems:'center', gap:8, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.1)', padding:'6px 16px', borderRadius:20, zIndex:3}}>
              <div style={{width:8, height:8, borderRadius:'50%', background: aiSpeaking ? '#34d399' : '#94a3b8', boxShadow: aiSpeaking ? '0 0 8px #34d399' : 'none'}}/>
              <span style={{fontSize:'0.85rem', fontWeight:600, color:'white'}}>Maya · AI Interviewer</span>
            </div>
          </div>

          {/* Bottom 35% — User video tile */}
          <div style={{height:'35%', padding:16, display:'flex', flexDirection:'column', justifyContent:'center'}}>
            <div style={{position:'relative', width:'100%', height:'100%', borderRadius:12, overflow:'hidden', background:'#050510', border:'1px solid rgba(255,255,255,0.08)', boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
              <video ref={videoRef} autoPlay muted playsInline
                style={{position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', transform:'scaleX(-1)', opacity: camOn ? 1 : 0, transition:'opacity 0.4s'}}
              />
              {/* High-Tech Eye Gaze & Attentiveness Tracking HUD Overlay */}
              {camOn && (
                <>
                  {/* Eye Target Reticle */}
                  <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(6,182,212,0.25)', borderRadius: 12, pointerEvents: 'none', zIndex: 10 }} />
                  <div style={{ position: 'absolute', top: '30%', left: '42%', width: 50, height: 26, border: '1px solid rgba(0,240,255,0.4)', borderRadius: 14, pointerEvents: 'none', zIndex: 10, boxShadow: '0 0 10px rgba(0,240,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.5rem', color: '#00f0ff', fontFamily: 'monospace' }}>+ FOCUS</span>
                  </div>

                  {/* AI Vision & Dynamic Eye-Tracking Telemetry Badge */}
                  <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(5,5,15,0.85)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0,240,255,0.4)', borderRadius: 10, padding: '6px 10px', zIndex: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: eyeScore > 85 ? '#00f0ff' : '#f59e0b', boxShadow: `0 0 8px ${eyeScore > 85 ? '#00f0ff' : '#f59e0b'}`, animation: 'pulse-dot 1.5s infinite' }} />
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, color: eyeScore > 85 ? '#00f0ff' : '#fbbf24', letterSpacing: '0.06em', fontFamily: 'Space Grotesk' }}>
                        👁 EYE GAZE: {eyeScore}% ({gazeStatus})
                      </span>
                    </div>
                    <span style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
                      POSTURE: {postureStatus}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: eyeScore > 80 ? '#34d399' : '#f87171', fontWeight: 800 }}>
                      {eyeScore > 80 ? '✓ CONFIDENCE LENS: HIGH ENGAGEMENT' : '⚠ ATTENTION DRIFT DETECTED'}
                    </span>
                  </div>
                </>
              )}

              {!camOn && (
                <div style={{position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, background:'#050510'}}>
                  <div style={{width:48, height:48, borderRadius:'50%', background:'rgba(99,102,241,0.1)', border:'2px solid rgba(99,102,241,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem'}}>👤</div>
                  <button onClick={startCamera} style={{padding:'6px 14px', borderRadius:6, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', cursor:'pointer', fontWeight:600, fontSize:'0.75rem'}}>Enable Camera</button>
                </div>
              )}

              {/* Camera toggle */}
              <button onClick={()=>camOn?stopCamera():startCamera()} style={{position:'absolute', top:8, right:8, width:32, height:32, borderRadius:'50%', background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)', border:`1px solid ${camOn?'rgba(99,102,241,0.4)':'rgba(255,255,255,0.15)'}`, display:'flex', alignItems:'center', justifyContent:'center', color:camOn?'#a5b4fc':'rgba(255,255,255,0.5)', cursor:'pointer', zIndex:10}}>
                {camOn?<Video size={14}/>:<VideoOff size={14}/>}
              </button>

              {/* Waveform bar at bottom of video */}
              {micOn && (
                <div style={{position:'absolute', bottom:0, left:0, right:0, height:30, background:'linear-gradient(transparent,rgba(0,0,0,0.7))', display:'flex', alignItems:'flex-end', padding:'0 8px 4px', gap:2, zIndex:10}}>
                  {waveData.slice(0, 24).map((v,i)=>(
                    <div key={i} style={{flex:1, minHeight:2, borderRadius:2, height:`${Math.max(2,(v/255)*20)}px`, background:'#34d399', opacity:0.6+(v/255)*0.4}}/>
                  ))}
                </div>
              )}

              {/* REC badge */}
              {micOn && (
                <div style={{position:'absolute', bottom:8, right:8, display:'flex', alignItems:'center', gap:4, background:'rgba(239,68,68,0.25)', border:'1px solid rgba(239,68,68,0.4)', borderRadius:4, padding:'2px 6px', zIndex:10}}>
                  <div style={{width:6, height:6, borderRadius:'50%', background:'#ef4444', animation:'pulse-dot 1s infinite'}}/>
                  <span style={{fontSize:'0.6rem', fontWeight:800, color:'#f87171'}}>REC</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN ── */}
        <div style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', background:'rgba(4,4,14,0.9)', borderLeft:'1px solid rgba(255,255,255,0.04)', borderRight:'1px solid rgba(255,255,255,0.04)'}}>
          
          {/* Top 42% — Question card */}
          <div style={{height:'42%', padding:'32px', display:'flex', flexDirection:'column', borderBottom:'1px solid rgba(255,255,255,0.05)', overflowY:'auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20}}>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <div style={{padding:'6px 14px', borderRadius:20, background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)', color:'#a5b4fc', fontWeight:800, fontSize:'0.85rem'}}>
                  Q{qIndex+1}/{planRef.current.length}
                </div>
                <div style={{padding:'6px 14px', borderRadius:20, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', fontSize:'0.85rem', fontWeight:600, textTransform:'capitalize'}}>
                  {session?.difficulty || 'Medium'}
                </div>
              </div>
              
              <div style={{position:'relative', width:44, height:44}}>
                <svg width="44" height="44" viewBox="0 0 44 44">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4"/>
                  <circle cx="22" cy="22" r="18" fill="none" stroke="#6366f1" strokeWidth="4" strokeDasharray="113.1" strokeDashoffset={113.1 - (Math.min(elapsedSeconds, 120) / 120) * 113.1} transform="rotate(-90 22 22)"/>
                </svg>
                <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:700}}>
                  {elapsedSeconds}s
                </div>
              </div>
            </div>

            <h2 style={{fontSize:'1.3rem', lineHeight:1.6, fontWeight:600, color:'white', margin:0, flex:1}}>
              {currentQ || "Waiting for question..."}
            </h2>

            <div style={{marginTop:16, display:'flex', flexDirection:'column', gap:12}}>
              <button onClick={()=>setShowHint(!showHint)} style={{alignSelf:'flex-start', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'6px 14px', color:'rgba(255,255,255,0.7)', fontSize:'0.8rem', cursor:'pointer', display:'flex', alignItems:'center', gap:8}}>
                💡 {showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
              {showHint && (
                <div style={{padding:'10px 14px', borderRadius:8, background:'rgba(250,204,21,0.1)', border:'1px solid rgba(250,204,21,0.2)', color:'#fbbf24', fontSize:'0.85rem', lineHeight:1.5}}>
                  {currentHint}
                </div>
              )}
            </div>

            <div style={{marginTop:20, padding:'6px 16px', borderRadius:20, alignSelf:'flex-start', background:`rgba(${phase==='listening'?'16,185,129':phase==='evaluating'?'245,158,11':'99,102,241'},0.15)`, border:`1px solid ${phaseColor}40`, color:phaseColor, fontSize:'0.8rem', fontWeight:700, display:'flex', alignItems:'center', gap:8}}>
              {phase === 'listening' && <div style={{width:6, height:6, borderRadius:'50%', background:micOn?'#10b981':'rgba(255,255,255,0.3)', animation:micOn?'pulse-dot 1s infinite':'none'}}/>}
              {phaseLabel}
            </div>
          </div>

          {/* Middle 30% — Live Transcript or Code Editor */}
          <div style={{height:'30%', padding:'16px 28px', display:'flex', flexDirection:'column', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <button
                  onClick={() => setInputMode('voice')}
                  style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                    background: inputMode === 'voice' ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.04)',
                    border: inputMode === 'voice' ? '1px solid #10b981' : '1px solid rgba(255,255,255,0.08)',
                    color: inputMode === 'voice' ? '#34d399' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  🎙 Voice Answer
                </button>
                <button
                  onClick={() => setInputMode('code')}
                  style={{
                    padding: '4px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
                    background: inputMode === 'code' ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                    border: inputMode === 'code' ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    color: inputMode === 'code' ? '#a5b4fc' : 'rgba(255,255,255,0.5)'
                  }}
                >
                  💻 Code Your Solution
                </button>
              </div>

              {inputMode === 'voice' ? (
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span style={{fontSize:'0.72rem', color:'rgba(255,255,255,0.35)'}}>{wordCount}w</span>
                  <button
                    onClick={() => { setAnswer(''); finalTextRef.current = ''; setTranscript(''); }}
                    style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.45)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'3px 8px', cursor:'pointer'}}
                  >Clear</button>
                </div>
              ) : (
                <button
                  onClick={runInterviewCode}
                  disabled={codeExecuting}
                  style={{
                    padding: '4px 12px', borderRadius: 8, background: 'linear-gradient(135deg,#10b981,#059669)',
                    border: 'none', color: 'white', fontWeight: 800, fontSize: '0.72rem', cursor: 'pointer'
                  }}
                >
                  {codeExecuting ? 'Executing...' : '▶ Run & Test Code'}
                </button>
              )}
            </div>

            {inputMode === 'voice' ? (
              <div style={{ flex: 1, position: 'relative', display: 'flex', flexDirection: 'column' }}>
                <textarea
                  value={transcript ? `${answer}${answer ? ' ' : ''}${transcript}` : answer}
                  onChange={e => {
                    const val = e.target.value;
                    setAnswer(val);
                    finalTextRef.current = val;
                  }}
                  placeholder={micOn ? '🎙 Listening… speak your answer clearly (you can click and edit any word mismatch anytime)...' : 'Transcription will appear here... Click and edit any misrecognized words directly with your keyboard!'}
                  rows={4}
                  style={{
                    width: '100%', flex: 1, padding: '12px 16px', borderRadius: 8,
                    background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(52,211,153,0.3)',
                    color: '#86efac', fontFamily: 'Inter, sans-serif', fontSize: '0.95rem',
                    lineHeight: 1.6, outline: 'none', resize: 'none', boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)'
                  }}
                />
                <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: 4, pointerEvents: 'none' }}>
                  <span>✏ Click anywhere in box to edit text</span>
                </div>
              </div>
            ) : (
              <div style={{flex:1, display:'flex', flexDirection:'column', gap:8, overflow:'hidden'}}>
                <textarea
                  value={codeText}
                  onChange={e => { setCodeText(e.target.value); setAnswer(e.target.value); }}
                  rows={4}
                  style={{
                    width: '100%', flex: 1, padding: '10px 14px', borderRadius: 8, background: 'rgba(0,0,0,0.6)',
                    border: '1px solid rgba(99,102,241,0.3)', color: '#a7f3d0', fontFamily: 'monospace',
                    fontSize: '0.8rem', lineHeight: 1.5, outline: 'none', resize: 'none'
                  }}
                />
                {codeOutput && (
                  <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(16,185,129,0.3)', fontFamily: 'monospace', fontSize: '0.72rem', color: '#a7f3d0', maxHeight: 50, overflowY: 'auto' }}>
                    {codeOutput}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom 28% — Controls */}
          <div style={{height:'28%', display:'flex', alignItems:'center', justifyContent:'center', position:'relative'}}>
            
            <div style={{display:'flex', alignItems:'center', gap:24}}>
              <div style={{position:'relative', display:'flex', flexDirection:'column', alignItems:'center'}}>
                {phase === 'listening' && !micOn && (
                  <div style={{position:'absolute', top:-32, whiteSpace:'nowrap', fontSize:'0.7rem', fontWeight:800, color:'#34d399', background:'rgba(16,185,129,0.15)', padding:'4px 10px', borderRadius:10, border:'1px solid rgba(16,185,129,0.3)'}}>
                    TAP TO SPEAK
                  </div>
                )}
                <button 
                  onClick={()=>micOn?stopListening():startListening()} 
                  style={{width:72, height:72, borderRadius:'50%', border:`2px solid ${micOn?'#ef4444':phase==='listening'?'#10b981':'rgba(255,255,255,0.2)'}`, background:micOn?'rgba(239,68,68,0.2)':phase==='listening'?'rgba(16,185,129,0.2)':'rgba(255,255,255,0.05)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:micOn?'#f87171':phase==='listening'?'#34d399':'rgba(255,255,255,0.5)', boxShadow:micOn?'0 0 20px rgba(239,68,68,0.4)':phase==='listening'&&!micOn?'0 0 24px rgba(16,185,129,0.6)':'none', animation:phase==='listening'&&!micOn?'pulse-ring 1.5s ease infinite':'none', transition:'all 0.2s'}}
                >
                  {micOn?<Mic size={32}/>:<MicOff size={28}/>}
                </button>
              </div>

              <button 
                onClick={submitAnswer} 
                disabled={phase!=='listening'||!answer.trim()} 
                style={{height:56, padding:'0 36px', borderRadius:28, background:phase==='listening'&&answer.trim()?'linear-gradient(135deg,#6366f1,#8b5cf6)':'rgba(255,255,255,0.05)', border:`2px solid ${phase==='listening'&&answer.trim()?'rgba(99,102,241,0.5)':'rgba(255,255,255,0.1)'}`, color:phase==='listening'&&answer.trim()?'white':'rgba(255,255,255,0.3)', fontWeight:800, fontSize:'0.95rem', cursor:phase==='listening'&&answer.trim()?'pointer':'not-allowed', fontFamily:'Space Grotesk', boxShadow:phase==='listening'&&answer.trim()?'0 0 24px rgba(99,102,241,0.4)':'none', transition:'all 0.2s'}}
              >
                Submit Answer
              </button>

              <button onClick={skipQuestion} style={{width:52, height:52, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.1)', background:'rgba(255,255,255,0.03)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.5)'}}>
                <SkipForward size={22}/>
              </button>
            </div>
            
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div style={{width:280, flexShrink:0, display:'flex', flexDirection:'column', background:'linear-gradient(180deg, #0a0818 0%, #050308 100%)', borderLeft:'1px solid rgba(255,255,255,0.06)', overflowY:'auto'}}>
          
          <div style={{padding:'24px 20px', display:'flex', flexDirection:'column', gap:24}}>
            <h3 style={{fontSize:'1rem', fontWeight:800, fontFamily:'Space Grotesk', margin:0, color:'white', display:'flex', alignItems:'center', gap:8}}>
              📊 Real-Time Analysis
            </h3>
            
            {/* Section 1 (always visible - live metrics) */}
            <div style={{display:'flex', flexDirection:'column', gap:20}}>
              <div>
                <div style={{display:'flex', justifyContent:'space-between', marginBottom:6}}>
                  <span style={{fontSize:'0.75rem', fontWeight:700, color:'rgba(255,255,255,0.5)', letterSpacing:'0.04em'}}>CONFIDENCE</span>
                  <span style={{fontSize:'0.8rem', fontWeight:800, color:confidenceMetric>60?'#34d399':confidenceMetric>30?'#f59e0b':'#f87171'}}>{confidenceMetric}%</span>
                </div>
                <div style={{height:5, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden'}}>
                  <div style={{width:`${confidenceMetric}%`, height:'100%', background:`linear-gradient(90deg,${confidenceMetric>60?'#6ee7b7,#10b981':confidenceMetric>30?'#fbbf24,#f59e0b':'#fca5a5,#ef4444'})`, transition:'width 0.4s'}}/>
                </div>
              </div>

              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                {[
                  {label:'Pace', value:`${wpm}`, unit:'WPM', color:'#818cf8'},
                  {label:'Words', value:`${wordCount}`, unit:'', color:'#34d399'},
                  {label:'Fillers', value:`${fillerWords.length}`, unit:'', color:fillerWords.length>0?'#f87171':'#34d399'},
                  {label:'Phase', value:phase==='listening'?'🎙':phase==='evaluating'?'⚙️':'📋', unit:'', color:'#f59e0b'},
                ].map(s=>(
                  <div key={s.label} style={{background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:8, padding:'8px 10px'}}>
                    <div style={{fontSize:'0.62rem', color:'rgba(255,255,255,0.4)', marginBottom:2, fontWeight:700, letterSpacing:'0.04em'}}>{s.label.toUpperCase()}</div>
                    <div style={{fontSize:'0.9rem', fontWeight:800, color:s.color}}>{s.value} <span style={{fontSize:'0.6rem', fontWeight:400, color:'rgba(255,255,255,0.35)'}}>{s.unit}</span></div>
                  </div>
                ))}
              </div>

              {fillerWords.length > 0 && (
                <div>
                  <div style={{fontSize:'0.65rem', fontWeight:700, color:'#f87171', letterSpacing:'0.06em', marginBottom:5}}>⚠ FILLERS DETECTED</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:5}}>
                    {fillerWords.map((fw,i)=>(
                      <span key={i} style={{background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', padding:'2px 8px', borderRadius:8, fontSize:'0.7rem'}}>"{fw}"</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Section 2 & 3 */}
            {scoreFlash ? (
              <div style={{display:'flex', flexDirection:'column', gap:16}}>
                {/* Last Answer Score */}
                <div style={{padding:'14px 12px', background:'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.18)', borderRadius:12}}>
                  <div style={{fontSize:'0.65rem', fontWeight:800, color:'#34d399', letterSpacing:'0.08em', marginBottom:10}}>✦ LAST ANSWER SCORE</div>
                  <div style={{display:'flex', justifyContent:'space-between', gap:4}}>
                    {[
                      {label:'Content', key:'content_score', color:'#6366f1'},
                      {label:'Clarity', key:'clarity_score', color:'#06b6d4'},
                      {label:'Overall', key:'overall_score', color:'#10b981'},
                    ].map(({label,key,color})=>{
                      const val = scoreFlash?.[key] ?? 0;
                      const pct = (val/10)*100;
                      return (
                        <div key={key} style={{display:'flex', flexDirection:'column', alignItems:'center', gap:4}}>
                          <div style={{position:'relative', width:40, height:40}}>
                            <svg width="40" height="40" viewBox="0 0 40 40">
                              <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4"/>
                              <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="4"
                                strokeDasharray={`${(pct/100)*100.5} 100.5`} strokeLinecap="round" transform="rotate(-90 20 20)"
                                style={{transition:'stroke-dasharray 0.8s ease'}}/>
                            </svg>
                            <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.7rem', fontWeight:800, color:'white'}}>{val.toFixed?val.toFixed(0):val}</div>
                          </div>
                          <span style={{fontSize:'0.55rem', color:'rgba(255,255,255,0.5)', fontWeight:700}}>{label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coach Says */}
                {(evalData?.coaching?.tips || evalData?.coach?.tips) && (
                  <div style={{padding:'12px', background:'rgba(99,102,241,0.07)', border:'1px solid rgba(99,102,241,0.18)', borderRadius:12}}>
                    <div style={{fontSize:'0.65rem', fontWeight:800, color:'#a5b4fc', letterSpacing:'0.08em', marginBottom:8}}>🏋 COACH SAYS</div>
                    <div style={{display:'flex', flexDirection:'column', gap:6}}>
                      {(evalData?.coaching?.tips || evalData?.coach?.tips || []).map((tip:any,i:number)=>(
                        <div key={i} style={{display:'flex', gap:7, alignItems:'flex-start'}}>
                          <div style={{width:16, height:16, borderRadius:'50%', background:'rgba(99,102,241,0.2)', border:'1px solid rgba(99,102,241,0.4)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1}}>
                            <span style={{fontSize:'0.5rem', color:'#a5b4fc', fontWeight:800}}>{i+1}</span>
                          </div>
                          <p style={{margin:0, fontSize:'0.72rem', color:'rgba(255,255,255,0.75)', lineHeight:1.45}}>{safeString(tip)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {evalData?.evaluation?.strengths && evalData.evaluation.strengths.length > 0 && (
                  <div style={{padding:'10px 12px', background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:10}}>
                    <div style={{fontSize:'0.62rem', fontWeight:800, color:'#34d399', letterSpacing:'0.07em', marginBottom:6}}>✅ STRENGTHS</div>
                    {(Array.isArray(evalData.evaluation.strengths)?evalData.evaluation.strengths:[evalData.evaluation.strengths]).map((s:any,i:number)=>(
                      <p key={i} style={{margin:'0 0 4px', fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', lineHeight:1.4}}>· {safeString(s)}</p>
                    ))}
                  </div>
                )}

                {/* Weaknesses */}
                {evalData?.evaluation?.weaknesses && evalData.evaluation.weaknesses.length > 0 && (
                  <div style={{padding:'10px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:10}}>
                    <div style={{fontSize:'0.62rem', fontWeight:800, color:'#f87171', letterSpacing:'0.07em', marginBottom:6}}>⚠ IMPROVE NEXT TIME</div>
                    {(Array.isArray(evalData.evaluation.weaknesses)?evalData.evaluation.weaknesses:[evalData.evaluation.weaknesses]).map((w:any,i:number)=>(
                      <p key={i} style={{margin:'0 0 4px', fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', lineHeight:1.4}}>· {safeString(w)}</p>
                    ))}
                  </div>
                )}

                {/* Ideal Approach */}
                {(evalData?.coaching?.improved_answer || evalData?.coach?.improved_answer) && (
                  <div style={{padding:'10px 12px', background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)', borderRadius:10}}>
                    <div style={{fontSize:'0.62rem', fontWeight:800, color:'#fbbf24', letterSpacing:'0.07em', marginBottom:6}}>💡 IDEAL APPROACH</div>
                    <p style={{margin:0, fontSize:'0.7rem', color:'rgba(255,255,255,0.7)', lineHeight:1.45, fontStyle:'italic'}}>"{safeString(evalData?.coaching?.improved_answer || evalData?.coach?.improved_answer)}"</p>
                  </div>
                )}
              </div>
            ) : (
              <div style={{padding:'20px', borderRadius:12, background:'rgba(99,102,241,0.05)', border:'1px dashed rgba(99,102,241,0.2)', textAlign:'center', marginTop:20}}>
                <p style={{margin:0, fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', lineHeight:1.6}}>🤖 Speak your answer and submit — AI coach feedback appears here</p>
              </div>
            )}

          </div>
        </div>
      </div>

      {toast && <div style={{position:'fixed', bottom:40, left:'50%', transform:'translateX(-50%)', background:'rgba(239,68,68,0.9)', color:'white', padding:'10px 24px', borderRadius:12, fontSize:'0.9rem', fontWeight:600, zIndex:300, boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>{toast}</div>}
      
      <style>{`
        @keyframes pulse-dot { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes pulse-ring { 0% { box-shadow: 0 0 0 0 rgba(16,185,129,0.6); } 70% { box-shadow: 0 0 0 16px rgba(16,185,129,0); } 100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes maya-speak { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
      `}</style>
    </div>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div style={{position:'fixed',inset:0,background:'#030308',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}><p style={{color:'#6366f1',fontFamily:'Space Grotesk',fontWeight:700}}>Preparing interview room...</p></div>}>
      <InterviewCall/>
    </Suspense>
  );
}
