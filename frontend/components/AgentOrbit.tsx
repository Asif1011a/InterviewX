'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const AGENT_COLORS = [
  '#6366f1','#8b5cf6','#a78bfa','#c4b5fd','#7c3aed',
  '#06b6d4','#22d3ee','#10b981','#34d399','#6ee7b7',
  '#f59e0b','#fbbf24','#fb923c','#f87171','#ef4444',
];

// Ring layout for mini canvas: 3 rings × 5 agents
const RING_CFG_MINI = [
  { r: 28, count: 5, speed: 0.012 },
  { r: 42, count: 5, speed: 0.008 },
  { r: 56, count: 5, speed: 0.010 },
];

const AGENT_IDS = [
  'ResumeAnalyst','GapDetector','CompanyIntel','Strategist','BenchmarkAgent',
  'Interviewer','FollowUpInterviewer','Evaluator','Coach','ConfidenceLens',
  'LearningPath','PracticeGenerator','ProgressAgent','ReportWriter','MotivationBot',
];

export default function AgentOrbit() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const statesRef = useRef<Record<string, string>>({});
  const anglesRef = useRef([0, 0, 0]);
  const rafRef    = useRef<number>(0);
  const [activeCount, setActiveCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [lastAgent, setLastAgent] = useState('');

  // Note: we never early-return before hooks — use hidden flag at render time
  const hidden = pathname === '/agents';

  // SSE connection
  useEffect(() => {
    const es = new EventSource('http://localhost:8000/agents/stream');
    es.onmessage = (e) => {
      try {
        const { agent, status } = JSON.parse(e.data);
        if (!agent) return;
        statesRef.current[agent] = status;
        setActiveCount(Object.values(statesRef.current).filter(s => s === 'thinking').length);
        if (status === 'thinking') setLastAgent(agent.replace(/([A-Z])/g, ' $1').trim());
      } catch {}
    };
    return () => es.close();
  }, []);

  // Mini canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 140; // canvas size
    canvas.width = S;
    canvas.height = S;
    const cx = S / 2, cy = S / 2;
    let frame = 0;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, S, S);

      // Background circle
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, S/2);
      bg.addColorStop(0, 'rgba(15,12,35,0.97)');
      bg.addColorStop(1, 'rgba(5,5,15,0.99)');
      ctx.beginPath();
      ctx.arc(cx, cy, S/2 - 1, 0, Math.PI*2);
      ctx.fillStyle = bg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(99,102,241,0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Advance ring angles
      anglesRef.current[0] += RING_CFG_MINI[0].speed;
      anglesRef.current[1] -= RING_CFG_MINI[1].speed;
      anglesRef.current[2] += RING_CFG_MINI[2].speed;

      // Draw orbit rings
      RING_CFG_MINI.forEach(cfg => {
        ctx.beginPath();
        ctx.arc(cx, cy, cfg.r, 0, Math.PI*2);
        ctx.strokeStyle = 'rgba(99,102,241,0.08)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });

      // Draw agent dots
      let agentIdx = 0;
      RING_CFG_MINI.forEach((cfg, ring) => {
        for (let slot = 0; slot < cfg.count; slot++) {
          const id = AGENT_IDS[agentIdx];
          const status = statesRef.current[id] ?? 'idle';
          const angle = anglesRef.current[ring] + (slot / cfg.count) * Math.PI * 2;
          const x = cx + Math.cos(angle) * cfg.r;
          const y = cy + Math.sin(angle) * cfg.r;
          const color = AGENT_COLORS[agentIdx];
          const pulse = 0.5 + 0.5 * Math.sin(frame * 0.12 + agentIdx);

          // Glow for active agents
          if (status === 'thinking') {
            const g = ctx.createRadialGradient(x, y, 0, x, y, 10);
            g.addColorStop(0, color + 'aa');
            g.addColorStop(1, 'transparent');
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, Math.PI*2);
            ctx.fillStyle = g;
            ctx.fill();
          }

          // Dot
          const r = status === 'thinking' ? 3.5 + pulse * 1.5 : status === 'done' ? 3.5 : 2.5;
          const alpha = status === 'idle' ? 0.35 : status === 'done' ? 0.8 : 0.95 + pulse * 0.05;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI*2);
          ctx.fillStyle = color + Math.round(alpha * 255).toString(16).padStart(2, '0');
          ctx.fill();

          agentIdx++;
        }
      });

      // Center glow
      const hasActive = activeCount > 0;
      if (hasActive) {
        const pulse = 0.5 + 0.5 * Math.sin(frame * 0.08);
        const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18 + pulse * 6);
        cg.addColorStop(0, `rgba(99,102,241,${0.25 + pulse * 0.15})`);
        cg.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(cx, cy, 18 + pulse * 6, 0, Math.PI*2);
        ctx.fillStyle = cg;
        ctx.fill();
      }

      // Center icon
      ctx.font = `bold ${hasActive ? 11 : 9}px Space Grotesk, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = hasActive ? '#a5b4fc' : 'rgba(255,255,255,0.3)';
      ctx.fillText(hasActive ? `${activeCount}` : '15', cx, cy - 4);
      ctx.font = '7px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillText('AGENTS', cx, cy + 6);

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [activeCount]);

  if (hidden) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 100,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8,
    }}>
      {/* Active agent label */}
      {lastAgent && activeCount > 0 && (
        <div style={{
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 8, padding: '4px 10px', backdropFilter: 'blur(10px)',
          fontSize: '0.68rem', color: '#a5b4fc', fontWeight: 700,
          animation: 'slideIn 0.3s ease', whiteSpace: 'nowrap',
        }}>
          ⚡ {lastAgent}
        </div>
      )}

      {/* Mini canvas widget */}
      <Link href="/agents" title="Open Agent Lab" style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', boxShadow: activeCount > 0 ? '0 0 20px rgba(99,102,241,0.4)' : '0 4px 20px rgba(0,0,0,0.5)', transition: 'box-shadow 0.3s', cursor: 'pointer' }}>
        <canvas ref={canvasRef} style={{ width: 70, height: 70, display: 'block', borderRadius: '50%' }} />
      </Link>

      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateX(10px); } to { opacity:1; transform:translateX(0); } }
      `}</style>
    </div>
  );
}
