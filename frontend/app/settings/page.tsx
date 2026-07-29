'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthHelpers, AuthUser } from '@/lib/auth';
import { useAuthGuard } from '@/lib/useAuthGuard';
import { Settings, Volume2, Mic, Code2, ShieldCheck, Palette, Bell, Save, Check } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, checking } = useAuthGuard();

  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [speechRate, setSpeechRate]   = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.05);
  const [defaultRole, setDefaultRole] = useState('Software Engineer');
  const [defaultCompany, setDefaultCompany] = useState('General');
  const [prefLang, setPrefLang]       = useState('Python');
  const [soundEffects, setSoundEffects] = useState(true);
  const [saved, setSaved]             = useState(false);

  useEffect(() => {
    // Load local settings
    const savedVoice = localStorage.getItem('pref_voice');
    if (savedVoice) setVoiceGender(savedVoice as 'female' | 'male');
    const savedRate = localStorage.getItem('pref_rate');
    if (savedRate) setSpeechRate(parseFloat(savedRate));
  }, []);

  const handleSave = () => {
    localStorage.setItem('pref_voice', voiceGender);
    localStorage.setItem('pref_rate', String(speechRate));
    localStorage.setItem('pref_role', defaultRole);
    localStorage.setItem('pref_company', defaultCompany);
    localStorage.setItem('pref_lang', prefLang);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (checking) return null;
  if (!user) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#030308', color:'white', fontFamily:'Inter,sans-serif', padding:'36px 48px 60px' }}>
      <div style={{ maxWidth:900, margin:'0 auto' }}>

        {/* Top Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:36 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'4px 14px', borderRadius:20, background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', marginBottom:12 }}>
              <Settings size={14} color="#818cf8"/>
              <span style={{ fontSize:'0.72rem', fontWeight:800, color:'#a5b4fc', letterSpacing:'0.06em' }}>PLATFORM CUSTOMIZATION</span>
            </div>
            <h1 style={{ fontFamily:'Space Grotesk', fontWeight:900, fontSize:'2.4rem', margin:0, background:'linear-gradient(135deg,#c4b5fd,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Preferences & Settings
            </h1>
            <p style={{ color:'rgba(255,255,255,0.45)', margin:'8px 0 0', fontSize:'0.92rem' }}>
              Configure AI interviewer voice, default target roles, speech synthesis speed, and interview audio preferences.
            </p>
          </div>

          <button
            onClick={handleSave}
            style={{
              padding:'12px 28px', borderRadius:14,
              background: saved ? '#10b981' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
              border:'none', color:'white', fontWeight:800, fontSize:'0.92rem', cursor:'pointer',
              fontFamily:'Space Grotesk', boxShadow:'0 4px 20px rgba(99,102,241,0.35)', display:'flex', alignItems:'center', gap:8,
              transition:'all 0.2s'
            }}
          >
            {saved ? <Check size={16}/> : <Save size={16}/>}
            {saved ? 'Saved Preferences!' : 'Save Settings'}
          </button>
        </div>

        {/* Settings Sections Grid */}
        <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

          {/* 1. Voice & Speech Synthesis */}
          <div style={{ padding:'28px 32px', borderRadius:22, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <Volume2 size={20} color="#818cf8"/>
              <h3 style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.15rem', margin:0, color:'white' }}>
                AI Interviewer Voice & Speech Synthesis
              </h3>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>AI Voice Gender</label>
                <div style={{ display:'flex', gap:10 }}>
                  {(['female', 'male'] as const).map(g => (
                    <button
                      key={g}
                      onClick={() => setVoiceGender(g)}
                      style={{
                        flex:1, padding:'12px', borderRadius:12, fontWeight:700, fontSize:'0.88rem', cursor:'pointer', fontFamily:'Space Grotesk',
                        border: voiceGender === g ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                        background: voiceGender === g ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.02)',
                        color: voiceGender === g ? '#c7d2fe' : 'rgba(255,255,255,0.4)', textTransform:'capitalize'
                      }}
                    >
                      👩 {g} AI Voice {g === 'female' ? '(Recommended)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>Speech Speed Rate: {speechRate}x</label>
                <input
                  type="range" min="0.8" max="1.3" step="0.05"
                  value={speechRate} onChange={e => setSpeechRate(parseFloat(e.target.value))}
                  style={{ width:'100%', accentColor:'#6366f1', height:6, borderRadius:3 }}
                />
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', marginTop:4 }}>
                  <span>0.8x (Slower)</span>
                  <span>1.0x (Normal)</span>
                  <span>1.3x (Faster)</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Target Role & Company Defaults */}
          <div style={{ padding:'28px 32px', borderRadius:22, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <Code2 size={20} color="#06b6d4"/>
              <h3 style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.15rem', margin:0, color:'white' }}>
                Interview Defaults & Role Profile
              </h3>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>Default Target Role</label>
                <select
                  value={defaultRole} onChange={e => setDefaultRole(e.target.value)}
                  style={{ width:'100%', padding:'12px', borderRadius:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'0.88rem', outline:'none' }}
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Product Manager">Product Manager</option>
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>Default Target Company</label>
                <select
                  value={defaultCompany} onChange={e => setDefaultCompany(e.target.value)}
                  style={{ width:'100%', padding:'12px', borderRadius:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'0.88rem', outline:'none' }}
                >
                  <option value="General">General / Any Company</option>
                  <option value="Amazon">Amazon (Leadership Principles)</option>
                  <option value="Google">Google (Algorithmic & System Design)</option>
                  <option value="Microsoft">Microsoft (Growth Mindset)</option>
                  <option value="TCS">TCS (HR & Technical Basics)</option>
                  <option value="Infosys">Infosys (Communication & Aptitude)</option>
                </select>
              </div>

              <div>
                <label style={{ display:'block', fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,0.7)', marginBottom:8 }}>Preferred Programming Language</label>
                <select
                  value={prefLang} onChange={e => setPrefLang(e.target.value)}
                  style={{ width:'100%', padding:'12px', borderRadius:12, background:'rgba(0,0,0,0.4)', border:'1px solid rgba(255,255,255,0.1)', color:'white', fontSize:'0.88rem', outline:'none' }}
                >
                  <option value="Python">Python</option>
                  <option value="JavaScript">JavaScript / TypeScript</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="Go">Go</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Audio & Notifications */}
          <div style={{ padding:'28px 32px', borderRadius:22, background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:18 }}>
              <Bell size={20} color="#10b981"/>
              <h3 style={{ fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.15rem', margin:0, color:'white' }}>
                Sound Effects & Notifications
              </h3>
            </div>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', background:'rgba(0,0,0,0.3)', borderRadius:14, border:'1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <p style={{ margin:0, fontWeight:700, fontSize:'0.88rem' }}>Interactive Aptitude Sound Effects</p>
                <p style={{ margin:0, fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>Play feedback tones when answering questions in Aptitude Games.</p>
              </div>
              <input
                type="checkbox" checked={soundEffects} onChange={e => setSoundEffects(e.target.checked)}
                style={{ width:20, height:20, accentColor:'#10b981', cursor:'pointer' }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
