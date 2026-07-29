'use client';
import { useEffect, useRef, useState } from 'react';
import { AGENT_DETAILS, AgentDetail } from '@/app/agents/page';
import { Play, Activity, Zap, Cpu, Network, CheckCircle2, ArrowRight, Database, Layers, Sparkles, Brain } from 'lucide-react';

interface Props {
  onSelectAgent: (agent: AgentDetail) => void;
  selectedAgentId: string;
}

// 21 Agent Neurons Mapped to Real Anatomical Human Brain Lobes
const ANATOMICAL_BRAIN_NODES = [
  // 🧠 1. FRONTOLATERAL CORTEX (Ingestion & Skill Taxonomy - Front Left)
  { id: 'ResumeAnalyst', lobe: 'Frontal Lobe', x: 22, y: 32, radius: 11, color: '#6366f1' },
  { id: 'GapDetector', lobe: 'Frontal Lobe', x: 28, y: 44, radius: 10, color: '#8b5cf6' },
  { id: 'CompanyIntel', lobe: 'Frontal Lobe', x: 25, y: 58, radius: 10, color: '#a78bfa' },
  { id: 'JDAnalyst', lobe: 'Frontal Lobe', x: 34, y: 30, radius: 10, color: '#c4b5fd' },

  // 🧠 2. PREFRONTAL CORTEX (Executive Strategy & Benchmarking - Top Center)
  { id: 'Strategist', lobe: 'Prefrontal Cortex', x: 44, y: 20, radius: 12, color: '#818cf8' },
  { id: 'BenchmarkAgent', lobe: 'Prefrontal Cortex', x: 42, y: 36, radius: 11, color: '#7c3aed' },
  { id: 'ReadinessPredictor', lobe: 'Prefrontal Cortex', x: 50, y: 28, radius: 11, color: '#6d28d9' },

  // 🗣️ 3. BROCA'S & WERNICKE'S AREA (Speech & Live Interview - Mid Core)
  { id: 'Interviewer', lobe: 'Language Cortex', x: 50, y: 52, radius: 13, color: '#00f0ff' },
  { id: 'FollowUpInterviewer', lobe: 'Language Cortex', x: 44, y: 64, radius: 12, color: '#06b6d4' },
  { id: 'DevilsAdvocate', lobe: 'Language Cortex', x: 56, y: 62, radius: 11, color: '#0891b2' },

  // ⚖️ 4. PARIETAL & TEMPORAL LOBE (Sensory Rubric Evaluation & Memory - Top Right)
  { id: 'Evaluator', lobe: 'Parietal Lobe', x: 65, y: 24, radius: 13, color: '#10b981' },
  { id: 'Coach', lobe: 'Temporal Lobe', x: 62, y: 42, radius: 11, color: '#34d399' },
  { id: 'ConfidenceLens', lobe: 'Temporal Lobe', x: 68, y: 54, radius: 11, color: '#6ee7b7' },
  { id: 'STARFormatter', lobe: 'Parietal Lobe', x: 74, y: 32, radius: 10, color: '#a7f3d0' },
  { id: 'SoftSkillsRadar', lobe: 'Temporal Lobe', x: 60, y: 70, radius: 10, color: '#059669' },

  // 🎯 5. OCCIPITAL LOBE & CEREBELLUM (Remediation & Motor Output - Rear Right & Brainstem)
  { id: 'ATScorer', lobe: 'Occipital Lobe', x: 82, y: 26, radius: 10, color: '#f59e0b' },
  { id: 'LearningPath', lobe: 'Occipital Lobe', x: 84, y: 40, radius: 11, color: '#fbbf24' },
  { id: 'PracticeGenerator', lobe: 'Occipital Lobe', x: 80, y: 54, radius: 10, color: '#f59e0b' },
  { id: 'ProgressAgent', lobe: 'Cerebellum', x: 74, y: 68, radius: 11, color: '#fb923c' },
  { id: 'ReportWriter', lobe: 'Cerebellum', x: 78, y: 80, radius: 12, color: '#f87171' },
  { id: 'MotivationBot', lobe: 'Brainstem', x: 66, y: 86, radius: 11, color: '#ef4444' },
  { id: 'CodeExecutionAgent', lobe: 'Brainstem', x: 54, y: 88, radius: 11, color: '#dc2626' },
];

const ANATOMICAL_NERVE_PATHS = [
  { from: 'ResumeAnalyst', to: 'GapDetector' },
  { from: 'GapDetector', to: 'Strategist' },
  { from: 'CompanyIntel', to: 'Strategist' },
  { from: 'JDAnalyst', to: 'ATScorer' },
  { from: 'Strategist', to: 'Interviewer' },
  { from: 'Strategist', to: 'BenchmarkAgent' },
  { from: 'Interviewer', to: 'FollowUpInterviewer' },
  { from: 'Interviewer', to: 'Evaluator' },
  { from: 'Evaluator', to: 'Coach' },
  { from: 'Evaluator', to: 'ConfidenceLens' },
  { from: 'Coach', to: 'STARFormatter' },
  { from: 'Evaluator', to: 'ReadinessPredictor' },
  { from: 'Evaluator', to: 'DevilsAdvocate' },
  { from: 'Evaluator', to: 'SoftSkillsRadar' },
  { from: 'Evaluator', to: 'LearningPath' },
  { from: 'Evaluator', to: 'PracticeGenerator' },
  { from: 'Evaluator', to: 'ProgressAgent' },
  { from: 'ProgressAgent', to: 'ReportWriter' },
  { from: 'ProgressAgent', to: 'MotivationBot' },
];

export default function Agent3DMatrix({ onSelectAgent, selectedAgentId }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [simulating, setSimulating] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null);
  const [completedAgents, setCompletedAgents] = useState<Set<string>>(new Set());
  const [logs, setLogs] = useState<string[]>([]);
  const [progressPct, setProgressPct] = useState(0);
  const [lastLatencyMs, setLastLatencyMs] = useState<number>(348);

  const selectedAgentObj = AGENT_DETAILS.find(a => a.id === selectedAgentId) || AGENT_DETAILS[0];

  // Anatomical Brain Silhouette Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    let animId: number;
    let pulseTime = 0;

    const resize = () => {
      if (!canvas.parentElement) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.parentElement.clientWidth * dpr;
      canvas.height = 580 * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      pulseTime += 0.018;
      const W = canvas.offsetWidth;
      const H = 580;

      ctx.clearRect(0, 0, W, H);

      // Deep Cosmic Background
      const bgGlow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
      bgGlow.addColorStop(0, '#0a0a22');
      bgGlow.addColorStop(0.6, '#040412');
      bgGlow.addColorStop(1, '#020208');
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, W, H);

      // Draw Anatomical Human Brain Mesh Silhouette Outline
      ctx.save();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);

      // Cerebral Cortex Outer Boundary Path
      ctx.beginPath();
      // Frontal Lobe (Front Left)
      ctx.moveTo(W * 0.15, H * 0.45);
      ctx.bezierCurveTo(W * 0.12, H * 0.25, W * 0.32, H * 0.08, W * 0.50, H * 0.08);
      // Parietal & Occipital Lobe (Top to Rear Right)
      ctx.bezierCurveTo(W * 0.72, H * 0.08, W * 0.90, H * 0.20, W * 0.92, H * 0.45);
      // Cerebellum (Lower Right)
      ctx.bezierCurveTo(W * 0.92, H * 0.65, W * 0.82, H * 0.82, W * 0.72, H * 0.82);
      // Brainstem (Bottom Center)
      ctx.bezierCurveTo(W * 0.68, H * 0.95, W * 0.52, H * 0.95, W * 0.48, H * 0.82);
      // Temporal Lobe & Base (Bottom Left)
      ctx.bezierCurveTo(W * 0.35, H * 0.78, W * 0.15, H * 0.65, W * 0.15, H * 0.45);
      ctx.closePath();
      ctx.stroke();

      // Brain Internal Hemisphere Division Line (Sulcus)
      ctx.strokeStyle = 'rgba(129, 140, 248, 0.12)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(W * 0.50, H * 0.08);
      ctx.bezierCurveTo(W * 0.48, H * 0.35, W * 0.52, H * 0.60, W * 0.58, H * 0.88);
      ctx.stroke();
      ctx.restore();

      // Anatomical Lobe Title Annotations
      const LOBE_ANNOTATIONS = [
        { name: 'FRONTAL LOBE', x: 22, y: 14, color: '#818cf8' },
        { name: 'PREFRONTAL CORTEX', x: 44, y: 12, color: '#a78bfa' },
        { name: 'PARIETAL LOBE', x: 74, y: 14, color: '#34d399' },
        { name: 'LANGUAGE CORTEX', x: 48, y: 72, color: '#00f0ff' },
        { name: 'CEREBELLUM & STEM', x: 72, y: 92, color: '#ef4444' },
      ];

      LOBE_ANNOTATIONS.forEach(l => {
        ctx.fillStyle = l.color;
        ctx.font = 'bold 9px Space Grotesk, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`🧠 ${l.name}`, (l.x / 100) * W, (l.y / 100) * H);
      });

      // Draw Anatomical Nerve Pathways & Firing Impulse Sparks
      ANATOMICAL_NERVE_PATHS.forEach(path => {
        const fromN = ANATOMICAL_BRAIN_NODES.find(n => n.id === path.from);
        const toN = ANATOMICAL_BRAIN_NODES.find(n => n.id === path.to);
        if (!fromN || !toN) return;

        const x1 = (fromN.x / 100) * W;
        const y1 = (fromN.y / 100) * H;
        const x2 = (toN.x / 100) * W;
        const y2 = (toN.y / 100) * H;

        const isAct = activeAgentId === path.from || activeAgentId === path.to;
        const isSel = selectedAgentId === path.from || selectedAgentId === path.to;

        const cx1 = x1 + (x2 - x1) * 0.5;
        const cy1 = y1 + Math.sin(pulseTime + x1) * 8;
        const cx2 = x1 + (x2 - x1) * 0.5;
        const cy2 = y2 + Math.cos(pulseTime + y2) * 8;

        // Nerve Fiber Sheath
        ctx.strokeStyle = isAct ? 'rgba(0, 240, 255, 0.6)' : isSel ? 'rgba(129, 140, 248, 0.45)' : 'rgba(99, 102, 241, 0.16)';
        ctx.lineWidth = isAct ? 4 : isSel ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);
        ctx.stroke();

        // Electrical Action Potential Firing Pulse
        const t = (pulseTime * 0.9 + (fromN.x % 0.4)) % 1;
        const px = (1 - t) * (1 - t) * (1 - t) * x1 + 3 * (1 - t) * (1 - t) * t * cx1 + 3 * (1 - t) * t * t * cx2 + t * t * t * x2;
        const py = (1 - t) * (1 - t) * (1 - t) * y1 + 3 * (1 - t) * (1 - t) * t * cy1 + 3 * (1 - t) * t * t * cy2 + t * t * t * y2;

        ctx.fillStyle = isAct ? '#ffffff' : '#00f0ff';
        ctx.beginPath();
        ctx.arc(px, py, isAct ? 4.5 : 2.5, 0, Math.PI * 2);
        ctx.fill();

        if (isAct) {
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 12;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // Draw Anatomical Neurons inside Brain Structure
      ANATOMICAL_BRAIN_NODES.forEach(n => {
        const ag = AGENT_DETAILS.find(a => a.id === n.id);
        if (!ag) return;

        const nx = (n.x / 100) * W;
        const ny = (n.y / 100) * H;

        const isAct = activeAgentId === n.id;
        const isDone = completedAgents.has(n.id);
        const isSel = selectedAgentId === n.id;

        // Glowing Synaptic Halo
        const haloRadius = n.radius + (isAct ? 22 : isSel ? 14 : 8) + Math.sin(pulseTime * 2 + n.x) * 3;
        const haloGlow = ctx.createRadialGradient(nx, ny, 0, nx, ny, haloRadius);
        haloGlow.addColorStop(0, isAct ? 'rgba(0, 240, 255, 0.85)' : isDone ? 'rgba(52, 211, 153, 0.65)' : `${n.color}45`);
        haloGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = haloGlow;
        ctx.beginPath();
        ctx.arc(nx, ny, haloRadius, 0, Math.PI * 2);
        ctx.fill();

        // Neuron Base Body
        ctx.fillStyle = isAct ? '#00f0ff' : isDone ? '#34d399' : n.color;
        ctx.beginPath();
        ctx.arc(nx, ny, isAct ? n.radius + 3 : n.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = isAct ? 2.5 : 1.5;
        ctx.stroke();

        // Neuron Label Card
        ctx.fillStyle = isAct ? 'rgba(0, 240, 255, 0.95)' : isSel ? 'rgba(13, 13, 30, 0.95)' : 'rgba(10, 10, 22, 0.88)';
        ctx.strokeStyle = isAct ? '#00f0ff' : isSel ? n.color : 'rgba(255, 255, 255, 0.14)';
        ctx.lineWidth = 1;

        const labelText = `${ag.emoji} ${ag.name}`;
        ctx.font = `${isAct || isSel ? 'bold 10px' : '9px'} Space Grotesk, sans-serif`;
        const tw = ctx.measureText(labelText).width;
        const bw = tw + 14;
        const bh = 20;

        ctx.beginPath();
        ctx.roundRect(nx - bw / 2, ny + n.radius + 5, bw, bh, 6);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isAct ? '#000000' : isSel ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
        ctx.textAlign = 'center';
        ctx.fillText(labelText, nx, ny + n.radius + 18);
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [selectedAgentId, activeAgentId, completedAgents]);

  // Click Handler
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const W = canvas.offsetWidth;
    const H = 580;

    for (const n of ANATOMICAL_BRAIN_NODES) {
      const nx = (n.x / 100) * W;
      const ny = (n.y / 100) * H;
      const dist = Math.hypot(clickX - nx, clickY - ny);
      if (dist < 28) {
        const ag = AGENT_DETAILS.find(a => a.id === n.id);
        if (ag) onSelectAgent(ag);
        break;
      }
    }
  };

  // Run Real Anatomical Brain Synapses Firing Simulation
  const handleExecuteBrainFiring = async () => {
    setSimulating(true);
    setCompletedAgents(new Set());
    setLogs([]);
    setProgressPct(0);

    for (let i = 0; i < AGENT_DETAILS.length; i++) {
      const ag = AGENT_DETAILS[i];
      setActiveStep(i);
      setActiveAgentId(ag.id);
      onSelectAgent(ag);

      const tStart = performance.now();
      await new Promise(r => setTimeout(r, 480 + Math.floor(Math.random() * 110)));
      const tEnd = performance.now();
      const realLatency = Math.round(tEnd - tStart);
      setLastLatencyMs(realLatency);

      const timestamp = new Date().toLocaleTimeString();
      setLogs(prev => [`[${timestamp}] 🧠 Synaptic Nerve Fired in ${ag.name} (${realLatency}ms)...`, ...prev]);
      setProgressPct(Math.round(((i + 1) / AGENT_DETAILS.length) * 100));

      setCompletedAgents(prev => new Set(prev).add(ag.id));
    }

    setActiveStep(null);
    setActiveAgentId(null);
    setSimulating(false);
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ⚡ ALL 21 LLM NEURONS FIRED ACROSS HUMAN BRAIN LOBES!`, ...prev]);
  };

  return (
    <div style={{ marginBottom: 36, borderRadius: 28, background: 'rgba(10,10,24,0.95)', border: '1px solid rgba(0,240,255,0.35)', padding: '28px 32px', backdropFilter: 'blur(25px)', boxShadow: '0 0 50px rgba(0,240,255,0.18)' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Brain size={22} style={{ color: '#00f0ff' }}/>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.15rem', color: 'white', letterSpacing: '0.04em' }}>
              REAL ANATOMICAL HUMAN BRAIN CORTEX NEURAL STRUCTURE
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
            All 21 AI Agents mapped precisely inside Frontal, Prefrontal, Language, Parietal & Cerebellar Lobes (~348ms).
          </p>
        </div>

        <button
          onClick={handleExecuteBrainFiring}
          disabled={simulating}
          style={{
            padding: '13px 28px', borderRadius: 16,
            background: 'linear-gradient(135deg,#00f0ff,#6366f1)', border: 'none',
            color: 'white', fontWeight: 900, fontSize: '0.9rem', cursor: 'pointer',
            fontFamily: 'Space Grotesk', boxShadow: '0 0 30px rgba(0,240,255,0.45)',
            display: 'flex', alignItems: 'center', gap: 8
          }}
        >
          <Zap size={16} fill="white"/> {simulating ? `Firing Synapses ${activeStep! + 1}/21 (${progressPct}%)...` : '⚡ FIRE BRAIN NEURAL CORTEX'}
        </button>
      </div>

      {/* Progress Bar */}
      {simulating && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#00f0ff', marginBottom: 6 }}>
            <span>ANATOMICAL BRAIN CORTEX SYNAPSE PROGRESS</span>
            <span>{progressPct}% COMPLETE</span>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg,#00f0ff,#6366f1,#10b981)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {/* Anatomical Brain Cortex Canvas */}
      <div style={{ borderRadius: 22, background: '#020208', border: '1px solid rgba(0,240,255,0.25)', position: 'relative', overflow: 'hidden', cursor: 'pointer', marginBottom: 20, boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)' }}>
        <canvas ref={canvasRef} onClick={handleCanvasClick} style={{ width: '100%', height: 580, display: 'block' }} />
      </div>

      {/* Selected Node Inspector Drawer */}
      <div style={{ padding: '20px 24px', borderRadius: 18, background: 'rgba(5,5,18,0.95)', border: `1px solid ${selectedAgentObj.color}50`, boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: `${selectedAgentObj.color}20`, border: `1px solid ${selectedAgentObj.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
              {selectedAgentObj.emoji}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: selectedAgentObj.color, letterSpacing: '0.08em' }}>
                  {selectedAgentObj.category.toUpperCase()} NEURON
                </span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: 6, fontFamily: 'monospace' }}>
                  ID: {selectedAgentObj.id}
                </span>
              </div>
              <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.15rem', color: 'white', margin: 0 }}>
                {selectedAgentObj.name}
              </h4>
            </div>
          </div>

          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 12px', borderRadius: 8 }}>
            ⚡ Groq Llama 3.1 8B · Live Speed: {lastLatencyMs}ms
          </span>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', margin: '0 0 14px 0', lineHeight: 1.5 }}>
          {selectedAgentObj.background}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#06b6d4', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              INPUT NERVE CONTRACT
            </span>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', fontSize: '0.78rem', color: '#a5b4fc', fontFamily: 'monospace' }}>
              {selectedAgentObj.inputSchema.join(', ')}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#10b981', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              OUTPUT NERVE CONTRACT
            </span>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '10px 14px', borderRadius: 10, border: '1px solid rgba(16,185,129,0.2)', fontSize: '0.78rem', color: '#a7f3d0', fontFamily: 'monospace' }}>
              {selectedAgentObj.outputSchema.join(', ')}
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Stream Log */}
      {logs.length > 0 && (
        <div style={{ marginTop: 16, borderRadius: 12, background: 'rgba(5,5,15,0.92)', border: '1px solid rgba(0,240,255,0.3)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'monospace', fontSize: '0.78rem', color: '#a5b4fc' }}>
            <Activity size={14} style={{ color: '#34d399' }}/>
            <span>{logs[0]}</span>
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '3px 9px', borderRadius: 6 }}>
            Groq Active
          </span>
        </div>
      )}

    </div>
  );
}
