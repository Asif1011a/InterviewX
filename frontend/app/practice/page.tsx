'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import FlipCard from '@/components/FlipCard';
import {
  ArrowLeft, Zap, CheckCircle2, RotateCcw, XCircle,
  Mic, MicOff, ChevronDown, ChevronUp, Filter, RefreshCw,
  Code2, Play, Check, Terminal, Cpu, Clock
} from 'lucide-react';

interface Drill { question: string; hint: string; topic: string; difficulty: 'Easy' | 'Medium' | 'Hard'; }

const DiffBadge = ({ d }: { d: string }) => {
  const color = d === 'Hard' ? '#ef4444' : d === 'Medium' ? '#f59e0b' : '#10b981';
  return (
    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700,
      background: `${color}18`, border: `1px solid ${color}40`, color }}>{d}</span>
  );
};

// ─── Live Code IDE Component ──────────────────────────────────────────────────
function LiveCodeIDE() {
  const [lang, setLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState<string>(
`# Write Python solution below
def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

# Test Case Execution
print(solve([2, 7, 11, 15], 9)) # Expected: [0, 1]`
  );
  const [executing, setExecuting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<{ time: string; space: string } | null>(null);

  const handleLangChange = (l: 'python' | 'javascript' | 'cpp' | 'java') => {
    setLang(l);
    if (l === 'javascript') {
      setCode(`// Write JavaScript solution below
function solve(nums, target) {
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (seen.has(diff)) return [seen.get(diff), i];
        seen.set(nums[i], i);
    }
    return [];
}

console.log(solve([2, 7, 11, 15], 9)); // Expected: [0, 1]`);
    } else if (l === 'python') {
      setCode(`# Write Python solution below
def solve(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []

print(solve([2, 7, 11, 15], 9))`);
    } else if (l === 'cpp') {
      setCode(`// Write C++ Solution
#include <iostream>
#include <unordered_map>
#include <vector>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> mp;
    for (int i = 0; i < nums.size(); i++) {
        if (mp.count(target - nums[i])) return {mp[target - nums[i]], i};
        mp[nums[i]] = i;
    }
    return {};
}`);
    } else {
      setCode(`// Write Java Solution
import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (map.containsKey(target - nums[i])) return new int[]{map.get(target - nums[i]), i};
            map.put(nums[i], i);
        }
        return new int[]{};
    }
}`);
    }
  };

  const [execStatus, setExecStatus] = useState<'success' | 'error' | null>(null);

  const runCode = async () => {
    setExecuting(true);
    setOutput(null);
    setComplexity(null);
    setExecStatus(null);

    try {
      const res = await api.executeCode(code, lang);
      setExecStatus(res.status === 'error' ? 'error' : 'success');
      setOutput(`${res.stdout}\n\n⏱ Execution Latency: ${res.elapsed_ms}ms`);
      if (res.complexity) {
        setComplexity(res.complexity);
      }
    } catch (err: any) {
      setExecStatus('error');
      setOutput(`Execution Failed: ${err?.message || 'Server error during code execution'}`);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', borderRadius: 22, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(99,102,241,0.25)', marginBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Code2 size={20} color="#818cf8" />
          <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.2rem', margin: 0, color: 'white' }}>
            Live Code IDE Sandbox
          </h3>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['python', 'javascript', 'cpp', 'java'] as const).map(l => (
            <button
              key={l}
              onClick={() => handleLangChange(l)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, textTransform: 'capitalize',
                border: lang === l ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                background: lang === l ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                color: lang === l ? '#a5b4fc' : 'rgba(255,255,255,0.5)', cursor: 'pointer'
              }}
            >
              {l === 'cpp' ? 'C++' : l}
            </button>
          ))}
        </div>
      </div>

      {/* Editor Textarea */}
      <textarea
        value={code}
        onChange={e => setCode(e.target.value)}
        rows={10}
        style={{
          width: '100%', padding: '16px 20px', borderRadius: 14, background: 'rgba(0,0,0,0.6)',
          border: '1px solid rgba(255,255,255,0.08)', color: '#a7f3d0', fontFamily: 'monospace',
          fontSize: '0.85rem', lineHeight: 1.6, outline: 'none', resize: 'vertical', marginBottom: 14
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <button
          onClick={runCode}
          disabled={executing}
          style={{
            padding: '10px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#10b981,#059669)',
            border: 'none', color: 'white', fontWeight: 800, fontSize: '0.88rem', cursor: executing ? 'default' : 'pointer',
            fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(16,185,129,0.3)'
          }}
        >
          {executing ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
          {executing ? 'Executing Code...' : 'Run Test Cases'}
        </button>

        {complexity && (
          <div style={{ display: 'flex', gap: 12, fontSize: '0.75rem', fontFamily: 'monospace' }}>
            <span style={{ color: '#a5b4fc', background: 'rgba(99,102,241,0.12)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.25)' }}>
              ⚡ Time: {complexity.time}
            </span>
            <span style={{ color: '#34d399', background: 'rgba(16,185,129,0.12)', padding: '4px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.25)' }}>
              💾 Space: {complexity.space}
            </span>
          </div>
        )}
      </div>

      {output && (
        <div style={{
          padding: '14px 18px', borderRadius: 12, background: 'rgba(0,0,0,0.7)',
          border: execStatus === 'error' ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(16,185,129,0.4)',
          fontFamily: 'monospace', fontSize: '0.8rem',
          color: execStatus === 'error' ? '#fca5a5' : '#a7f3d0',
          lineHeight: 1.6, whiteSpace: 'pre-wrap'
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: execStatus === 'error' ? '#ef4444' : '#10b981', marginBottom: 6, letterSpacing: '0.06em' }}>
            {execStatus === 'error' ? '❌ EXECUTION TRACEBACK ERROR' : '✓ LIVE STDOUT OUTPUT'}
          </div>
          {output}
        </div>
      )}
    </div>
  );
}

// ─── Speak-Practice Modal ─────────────────────────────────────────────────────
function PracticeModal({ drill, onClose }: { drill: Drill; onClose: () => void }) {
  const [micOn, setMicOn] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalText, setFinalText] = useState('');
  const [interimText, setInterimText] = useState('');
  const recRef = useRef<any>(null);
  const activeRef = useRef(false);
  const finalRef = useRef('');

  const start = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Use Chrome or Edge for voice practice.'); return; }
    activeRef.current = true;
    finalRef.current = '';
    setFinalText(''); setInterimText(''); setTranscript('');
    setMicOn(true);

    const makeRec = (): any => {
      const r = new SR();
      r.continuous = true; r.interimResults = true; r.lang = 'en-US';
      r.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) finalRef.current += (finalRef.current ? ' ' : '') + t;
          else interim = t;
        }
        setInterimText(interim);
        setFinalText(finalRef.current);
        setTranscript(finalRef.current + (interim ? ' ' + interim : ''));
      };
      r.onend = () => { if (activeRef.current) { recRef.current = makeRec(); recRef.current.start(); } else setMicOn(false); };
      r.onerror = (e: any) => { if (e.error === 'not-allowed') { activeRef.current = false; setMicOn(false); } };
      return r;
    };
    recRef.current = makeRec();
    recRef.current.start();
  };

  const stop = () => {
    activeRef.current = false;
    try { recRef.current?.abort(); } catch {}
    setMicOn(false);
  };

  const wordCount = transcript.trim().split(/\s+/).filter(Boolean).length;
  const fillers = ['um','uh','like','you know','basically','actually','sort of'].filter(f => transcript.toLowerCase().includes(f));

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
      <div style={{ width: '100%', maxWidth: 680, background: '#0d0d1a', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 20, padding: 36, boxShadow: '0 24px 80px rgba(0,0,0,0.8)', position: 'relative' }}>
        <button onClick={() => { stop(); onClose(); }} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, width: 36, height: 36, cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <span style={{ padding: '4px 10px', borderRadius: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', fontSize: '0.75rem', fontWeight: 700 }}>{drill.topic}</span>
            <DiffBadge d={drill.difficulty} />
          </div>
          <h2 style={{ fontSize: '1.15rem', lineHeight: 1.55, color: 'white', fontWeight: 600, margin: 0 }}>{drill.question}</h2>
        </div>

        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, minHeight: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: micOn ? '#ef4444' : 'rgba(255,255,255,0.2)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>LIVE SPEECH TRANSCRIPT</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'rgba(255,255,255,0.3)' }}>{wordCount} words</span>
          </div>
          <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.6, color: finalText ? '#86efac' : 'rgba(255,255,255,0.25)', fontStyle: finalText ? 'normal' : 'italic' }}>
            {finalText || (micOn ? 'Listening…' : 'Click the mic button below to start speaking')}
            {interimText && <span style={{ color: '#fbbf24', fontStyle: 'italic' }}>{' '}{interimText}</span>}
          </p>
        </div>

        {fillers.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Fillers detected:</span>
            {fillers.map((f, i) => (
              <span key={i} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem' }}>"{f}"</span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center' }}>
          <button onClick={() => micOn ? stop() : start()} style={{ width: 60, height: 60, borderRadius: '50%', border: `2px solid ${micOn ? '#ef4444' : '#10b981'}`, background: micOn ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: micOn ? '#f87171' : '#34d399' }}>
            {micOn ? <Mic size={26} /> : <MicOff size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function PracticeContent() {
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');
  const router = useRouter();

  const [drills, setDrills] = useState<Drill[]>([]);
  const [loading, setLoading] = useState(true);
  const [practiceTarget, setPracticeTarget] = useState<Drill | null>(null);

  const loadDrills = async () => {
    if (!sid) return;
    setLoading(true);
    try {
      const res = await api.generatePractice(sid) as { drills: Drill[] };
      setDrills(res.drills || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadDrills(); }, [sid]);

  return (
    <div style={{ minHeight: '100vh', paddingTop: '5rem', paddingBottom: '4rem', fontFamily: 'Inter, sans-serif', color: 'white' }}>
      {practiceTarget && <PracticeModal drill={practiceTarget} onClose={() => setPracticeTarget(null)} />}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 14px', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>
            <ArrowLeft size={15} /> Back
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>›</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>Technical IDE & Drills</span>
        </div>

        {/* Live IDE Sandbox */}
        <LiveCodeIDE />

        {/* Practice Cards */}
        <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.2rem', marginBottom: 20 }}>
          ⚡ Targeted Practice Drills
        </h3>

        {loading ? <p style={{ color: 'rgba(255,255,255,0.4)' }}>Generating drills...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {drills.map((d, i) => (
              <div key={i} style={{ padding: '24px', borderRadius: 18, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: '0.72rem', color: '#a5b4fc', fontWeight: 700 }}>{d.topic}</span>
                  <DiffBadge d={d.difficulty} />
                </div>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.92rem', color: 'white', lineHeight: 1.5 }}>{d.question}</h4>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>💡 {d.hint}</p>
                <button onClick={() => setPracticeTarget(d)} style={{ width: '100%', padding: '10px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>
                  🎙 Practice Answer Out Loud
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>Loading practice drills...</div>}>
      <PracticeContent />
    </Suspense>
  );
}
