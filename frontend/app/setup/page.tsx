'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AuthHelpers } from '@/lib/auth';
import AgentStatusBar from '@/components/AgentStatusBar';
import { UploadCloud, FileText, ChevronRight, X, AlertCircle, CheckCircle2, ArrowLeft, Shield, Cpu, Zap, Target, Sparkles, Building, Layers } from 'lucide-react';

const ROLES = [
  'Software Engineer', 'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'Data Scientist', 'Data Analyst', 'ML Engineer', 'Product Manager',
  'UX Designer', 'Business Analyst', 'DevOps Engineer',
];

const COMPANY_DETAILS: Record<string, { icon: string; color: string; desc: string; focus: string[] }> = {
  'General': { icon: '🏢', color: '#6366f1', desc: 'Balanced technical & behavioral interview with STAR format focus.', focus: ['STAR Format', 'Core Problem Solving', 'Clear Metrics'] },
  'Amazon': { icon: '📦', color: '#ff9900', desc: 'Behavioral heavy. 16 Leadership Principles & STAR metrics mandatory.', focus: ['Leadership Principles', 'Customer Obsession', 'Scale & Impact'] },
  'Google': { icon: '🔍', color: '#4285f4', desc: 'Algorithmic thinking, data structures & high-scale system design.', focus: ['Time/Space Complexity', 'Clarifying Edge Cases', 'Trade-off Analysis'] },
  'Microsoft': { icon: '💻', color: '#00a4ef', desc: 'Growth mindset, collaborative problem solving, and architecture.', focus: ['Growth Mindset', 'System Modularization', 'Teamwork Signals'] },
  'TCS': { icon: '🏢', color: '#10b981', desc: 'Aptitude, core programming fundamentals, OOPs, and HR adaptability.', focus: ['OOPs Concepts', 'Process Knowledge', 'Communication'] },
  'Infosys': { icon: '🏢', color: '#06b6d4', desc: 'Technical basics, DBMS, SQL joins, and HR situational scenarios.', focus: ['SQL Proficiency', 'Core CS Basics', 'Flexibility'] },
  'Wipro': { icon: '🏢', color: '#8b5cf6', desc: 'Fundamental technical aptitude, project depth, and teamwork.', focus: ['Project Architecture', 'Adaptability', 'Professionalism'] },
  'Startup': { icon: '🚀', color: '#ec4899', desc: 'Fast-paced, ownership mentality, comfort with ambiguity, and shipping fast.', focus: ['Bias for Action', 'Self-Driven Execution', 'Product Thinking'] },
};

const EXP = ['Fresher', '1-2 years', '3+ years'];
const DIFF = ['Easy', 'Medium', 'Hard'];

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    student_name: 'Jayanth S S', target_role: ROLES[0], experience_level: EXP[0], company: 'General',
    resume_text: '', difficulty: DIFF[1], language: 'English',
  });

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Session launch state
  const [loading, setLoading] = useState(false);
  const [launchError, setLaunchError] = useState('');
  const [agentStatus, setAgentStatus] = useState<{ [key: string]: 'idle' | 'thinking' | 'done' }>({
    'Resume Analyst & Gap Detector': 'idle',
    'Strategist & Company Intel': 'idle',
  });

  // Auto-prefill candidate name and saved resume text on mount
  useEffect(() => {
    const u = AuthHelpers.get();
    const savedResume = localStorage.getItem('user_saved_resume') || '';
    const savedFilename = localStorage.getItem('user_saved_resume_filename') || '';

    setForm(prev => ({
      ...prev,
      student_name: prev.student_name || u?.name || 'Jayanth S S',
      resume_text: prev.resume_text || savedResume,
    }));

    if (savedFilename) {
      setUploadedFileName(savedFilename);
    }
  }, []);

  // ── Upload handler ──
  const processFile = useCallback(async (file: File) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setUploadError('Only PDF files are supported. Please upload a .pdf file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File too large. Please upload a PDF smaller than 5 MB.');
      return;
    }

    setUploadError('');
    setUploading(true);
    setUploadedFileName('');

    try {
      const res = await api.uploadResume(file);
      if (!res.resume_text || res.resume_text.trim().length < 50) {
        setUploadError('Could not extract text from this PDF. Try a text-based PDF or paste your resume below.');
        setUploading(false);
        return;
      }
      
      const lines = res.resume_text.split('\n').map((l: string) => l.trim()).filter(Boolean);
      let detectedName = '';
      for (const line of lines) {
        if (line.length >= 3 && line.length <= 35 && !line.includes(':') && !line.includes('@') && !line.includes('http') && !/tech|stack|project|skills|education|contact|profile|schooling|college/i.test(line)) {
          detectedName = line;
          break;
        }
      }

      setForm(prev => ({
        ...prev,
        resume_text: res.resume_text,
        student_name: detectedName || prev.student_name || 'Jayanth S S'
      }));
      setUploadedFileName(file.name);
      try {
        localStorage.setItem('user_saved_resume', res.resume_text);
        localStorage.setItem('user_saved_resume_filename', file.name);
      } catch {}
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(`Upload failed: ${msg}. Please paste your resume text instead.`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  // ── Session launch ──
  const submit = async () => {
    setLaunchError('');
    setLoading(true);
    setAgentStatus({ 'Resume Analyst & Gap Detector': 'thinking', 'Strategist & Company Intel': 'idle' });
    try {
      const u = AuthHelpers.get();
      const sessionRes = await api.createSession(form, u?.user_id) as { session_id: string };
      const sid = sessionRes.session_id;

      await api.analyzeResume(sid);
      setAgentStatus({ 'Resume Analyst & Gap Detector': 'done', 'Strategist & Company Intel': 'thinking' });

      await api.createPlan(sid);
      setAgentStatus({ 'Resume Analyst & Gap Detector': 'done', 'Strategist & Company Intel': 'done' });

      router.push(`/interview?sid=${sid}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setLaunchError(`Launch failed: ${msg}`);
      setLoading(false);
      setAgentStatus({ 'Resume Analyst & Gap Detector': 'idle', 'Strategist & Company Intel': 'idle' });
    }
  };

  const STEP_LABELS = ['Profile & Role', 'Resume Upload', 'Preferences & Launch'];
  const selectedCompany = COMPANY_DETAILS[form.company] || COMPANY_DETAILS['General'];

  return (
    <main style={{ minHeight: '100vh', padding: '90px 48px 60px', background: '#030308', color: 'white', fontFamily: 'Inter,sans-serif' }}>
      
      {/* Top Header Bar */}
      <div style={{ maxWidth: 1240, margin: '0 auto 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => router.push('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}
          >
            <ArrowLeft size={15}/> Back to Control Room
          </button>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>|</span>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>New Mission Setup</span>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const active = step === num;
            const done = step > num;
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.75rem',
                  background: done ? '#10b981' : active ? '#6366f1' : 'rgba(255,255,255,0.06)',
                  color: 'white', border: `1px solid ${done ? '#10b981' : active ? '#6366f1' : 'rgba(255,255,255,0.1)'}`
                }}>
                  {done ? '✓' : num}
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: active ? 700 : 400, color: active ? 'white' : 'rgba(255,255,255,0.4)' }}>{label}</span>
                {i < STEP_LABELS.length - 1 && <span style={{ color: 'rgba(255,255,255,0.15)', marginLeft: 8 }}>→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Full Screen 2-Column Responsive Layout */}
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '380px 1fr', gap: 28 }}>
        
        {/* Left Column — Live AI Intelligence Blueprint Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Target Company Intelligence Card */}
          <div style={{ padding: '24px 26px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: `1px solid ${selectedCompany.color}35`, backdropFilter: 'blur(16px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${selectedCompany.color}, transparent)` }}/>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: `${selectedCompany.color}15`, border: `1px solid ${selectedCompany.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>
                {selectedCompany.icon}
              </div>
              <div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: selectedCompany.color, letterSpacing: '0.08em' }}>TARGET EMPLOYER BLUEPRINT</span>
                <h3 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.3rem', color: 'white', margin: 0 }}>
                  {form.company} Mode
                </h3>
              </div>
            </div>

            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
              {selectedCompany.desc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.06em' }}>EVALUATION FOCUS AREAS</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedCompany.focus.map((f, i) => (
                  <span key={i} style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 8, background: `${selectedCompany.color}12`, border: `1px solid ${selectedCompany.color}25`, color: '#e2e8f0' }}>
                    ✦ {f}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Sub-Agent Pipeline Status */}
          <div style={{ padding: '24px 26px', borderRadius: 24, background: 'rgba(13,13,26,0.8)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Cpu size={18} style={{ color: '#6366f1' }}/>
              <h4 style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1rem', color: 'white', margin: 0 }}>
                Active Agent Assembly Line
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { name: 'Resume Analyst', role: 'Skills & Fit Extraction', color: '#6366f1' },
                { name: 'Gap Detector', role: 'Severity Skill Matrix', color: '#8b5cf6' },
                { name: 'Company Intel', role: 'Culture & Bar Calibration', color: '#a78bfa' },
                { name: 'Strategist', role: 'Dynamic Blueprint Assembly', color: '#c4b5fd' },
              ].map((ag, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'white' }}>{ag.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>{ag.role}</div>
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: 6, marginLeft: 'auto' }}>READY</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column — Full-Width Setup Form */}
        <div style={{ padding: '32px 36px', borderRadius: 24, background: 'rgba(13,13,26,0.85)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>

          {/* ── STEP 1: Profile & Role ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.6rem', color: 'white', margin: '0 0 6px' }}>
                  Candidate Profile & Role Setup
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                  Configure candidate identity and employer targets for the AI evaluation team.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Candidate Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 8 }}>
                    CANDIDATE NAME
                  </label>
                  <input
                    value={form.student_name}
                    onChange={e => setForm(p => ({ ...p, student_name: e.target.value }))}
                    placeholder="e.g. Jayanth S S"
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                  />
                </div>

                {/* Target Role */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 8 }}>
                    TARGET ROLE
                  </label>
                  <select
                    value={form.target_role}
                    onChange={e => setForm(p => ({ ...p, target_role: e.target.value }))}
                    style={{ width: '100%', padding: '14px 18px', borderRadius: 14, background: 'rgba(13,13,26,0.95)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: '0.95rem', outline: 'none' }}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>

                {/* Target Company Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 8 }}>
                    TARGET EMPLOYER MODE
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                    {Object.entries(COMPANY_DETAILS).map(([compKey, compData]) => {
                      const isSel = form.company === compKey;
                      return (
                        <button
                          key={compKey}
                          onClick={() => setForm(p => ({ ...p, company: compKey }))}
                          style={{
                            padding: '12px 10px', borderRadius: 12, textAlign: 'center', cursor: 'pointer',
                            background: isSel ? `${compData.color}20` : 'rgba(255,255,255,0.025)',
                            border: `1px solid ${isSel ? compData.color : 'rgba(255,255,255,0.08)'}`,
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{compData.icon}</div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: isSel ? 'white' : 'rgba(255,255,255,0.6)' }}>{compKey}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Experience Level */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 8 }}>
                    EXPERIENCE LEVEL
                  </label>
                  <div style={{ display: 'flex', gap: 12 }}>
                    {EXP.map(expItem => (
                      <button
                        key={expItem}
                        onClick={() => setForm(p => ({ ...p, experience_level: expItem }))}
                        style={{
                          flex: 1, padding: '14px', borderRadius: 14, fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                          background: form.experience_level === expItem ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                          border: form.experience_level === expItem ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                          color: form.experience_level === expItem ? '#a5b4fc' : 'rgba(255,255,255,0.5)'
                        }}
                      >
                        {expItem}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              <button
                onClick={() => setStep(2)}
                disabled={!form.student_name.trim()}
                style={{
                  width: '100%', padding: '16px', borderRadius: 14,
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none',
                  color: 'white', fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                  fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                Next: Add Resume PDF <ChevronRight size={18}/>
              </button>
            </div>
          )}

          {/* ── STEP 2: Resume Upload ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.6rem', color: 'white', margin: '0 0 6px' }}>
                  Candidate Resume Source
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                  Upload a PDF resume or click 1-click sample resume to analyze.
                </p>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileRef.current?.click()}
                style={{
                  border: `2px dashed ${isDragOver ? '#6366f1' : uploadedFileName ? '#10b981' : 'rgba(255,255,255,0.15)'}`,
                  borderRadius: 20, padding: '36px 24px', textAlign: 'center',
                  cursor: uploading ? 'wait' : 'pointer',
                  background: isDragOver ? 'rgba(99,102,241,0.08)' : uploadedFileName ? 'rgba(16,185,129,0.06)' : 'rgba(0,0,0,0.3)'
                }}
              >
                <input ref={fileRef} type="file" accept=".pdf,application/pdf" style={{ display: 'none' }} onChange={handleInputChange} />

                {uploading ? (
                  <div>
                    <div style={{ width: 36, height: 36, border: '3px solid rgba(99,102,241,0.3)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ color: '#a5b4fc', fontWeight: 700, fontFamily: 'Space Grotesk', margin: 0 }}>Extracting Resume Text & Skills...</p>
                  </div>
                ) : uploadedFileName ? (
                  <div>
                    <CheckCircle2 size={40} style={{ margin: '0 auto 10px', color: '#10b981' }} />
                    <p style={{ color: '#10b981', fontWeight: 800, fontFamily: 'Space Grotesk', margin: 0 }}>{uploadedFileName} Uploaded!</p>
                    <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Click to re-upload or edit below</p>
                  </div>
                ) : (
                  <div>
                    <UploadCloud size={44} style={{ margin: '0 auto 12px', color: '#818cf8' }} />
                    <p style={{ fontWeight: 800, color: 'white', fontFamily: 'Space Grotesk', fontSize: '1.05rem', margin: '0 0 4px' }}>
                      Drag & Drop your PDF resume here
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>or click to browse files (Max 5MB)</p>
                  </div>
                )}
              </div>

              {/* Sample FAANG Resume Pre-fill option */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderRadius: 14, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#a5b4fc' }}>Fast Review Demonstration?</div>
                  <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>Pre-fill candidate Jayanth S S (AI/ML & MERN Developer)</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const SAMPLE_RESUME = `Jayanth S S\nAIDS Engineer | Sri Eshwar College of Engineering\n\nTECHNICAL SKILLS:\n- AI/ML & NLP: Python, LangChain, RAG, Speech-to-Text, Text-to-Speech, ChromaDB, Scikit-learn, Pandas, NumPy\n- Fullstack: React.js, Node.js, Express.js, MongoDB, REST APIs, JWT Auth, C, C++, Java, HTML, CSS, SQL\n- Tools: Git, GitHub, GitHub Actions, AWS, VS Code\n\nPROJECTS:\n1. VOICE4FARMERS (Bharat AI Krishi Saathi):\n   - Built voice-based AI farming assistant delivering crop guidance via phone calls in Tamil and Hindi using NLP, RAG, STT, and TTS.\n2. Scholar Agent:\n   - AI-powered scholarship recommendation system with LLM RAG chatbot using LangChain, Groq, ChromaDB.\n3. Twin OS:\n   - Real-time 3D Digital Twin for predictive maintenance and energy optimization using ML classification & regression.\n4. Astra Beauty:\n   - MERN Full Stack E-Commerce platform with JWT auth, cart/wishlist management.`;
                    setForm(p => ({ ...p, resume_text: SAMPLE_RESUME, student_name: 'Jayanth S S' }));
                    setUploadedFileName('jayanth_ss_faang_resume.pdf');
                  }}
                  style={{ padding: '8px 16px', borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 800, fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Space Grotesk' }}
                >
                  ⚡ Pre-fill Jayanth's Resume
                </button>
              </div>

              {/* Paste Textarea */}
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 8 }}>
                  RESUME TEXT (PASTE / EDIT)
                </label>
                <textarea
                  value={form.resume_text}
                  onChange={e => setForm(p => ({ ...p, resume_text: e.target.value }))}
                  rows={6}
                  placeholder="Paste or review candidate resume text..."
                  style={{ width: '100%', padding: '14px 18px', borderRadius: 14, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#a7f3d0', fontFamily: 'monospace', fontSize: '0.82rem', lineHeight: 1.6, outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!form.resume_text.trim()}
                  style={{ flex: 2, padding: '14px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer', fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  Next: Preferences <ChevronRight size={18}/>
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Preferences & Launch ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h2 style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.6rem', color: 'white', margin: '0 0 6px' }}>
                  Interview Preferences & Multi-Agent Launch
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>
                  Select interview difficulty level and launch the multi-agent pipeline.
                </p>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.06em', marginBottom: 10 }}>
                  INTERVIEW DIFFICULTY LEVEL
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {DIFF.map(d => (
                    <button
                      key={d}
                      onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                      style={{
                        flex: 1, padding: '16px', borderRadius: 14, fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer',
                        background: form.difficulty === d ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                        border: form.difficulty === d ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                        color: form.difficulty === d ? '#a5b4fc' : 'rgba(255,255,255,0.5)'
                      }}
                    >
                      {d} {d === 'Easy' ? '(3 Qs)' : d === 'Medium' ? '(5 Qs)' : '(7 Qs)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Agent Status Progress Bar during launch */}
              {loading && (
                <div style={{ padding: '20px', borderRadius: 16, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <AgentStatusBar agentStatus={agentStatus} />
                </div>
              )}

              {launchError && (
                <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '0.85rem' }}>
                  {launchError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setStep(2)}
                  style={{ flex: 1, padding: '16px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', fontWeight: 700, cursor: 'pointer' }}
                >
                  ← Back
                </button>
                <button
                  onClick={submit}
                  disabled={loading}
                  style={{ flex: 2, padding: '16px', borderRadius: 14, background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', color: 'white', fontWeight: 900, fontSize: '1.05rem', cursor: 'pointer', fontFamily: 'Space Grotesk', boxShadow: '0 0 30px rgba(16,185,129,0.3)' }}
                >
                  {loading ? 'Initializing Agents...' : '🚀 Launch Multi-Agent Studio'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </main>
  );
}
