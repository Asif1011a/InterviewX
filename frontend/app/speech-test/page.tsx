'use client';
import { useState, useEffect, useRef } from 'react';

export default function SpeechTest() {
  const [log, setLog]         = useState<string[]>([]);
  const [transcript, setTranscript] = useState('');
  const [running, setRunning] = useState(false);
  const recRef = useRef<any>(null);

  const addLog = (msg: string, type: 'info'|'ok'|'err' = 'info') => {
    const icon = type === 'ok' ? '✅' : type === 'err' ? '❌' : 'ℹ️';
    setLog(p => [`${icon} ${msg}`, ...p]);
  };

  useEffect(() => {
    // Browser check
    const ua = navigator.userAgent;
    if (/Chrome/.test(ua) && !/Edg/.test(ua))  addLog('Browser: Google Chrome', 'ok');
    else if (/Edg/.test(ua))                    addLog('Browser: Microsoft Edge', 'ok');
    else if (/Firefox/.test(ua))                addLog('Browser: Firefox — SpeechRecognition NOT supported', 'err');
    else if (/Safari/.test(ua))                 addLog('Browser: Safari — limited support', 'info');
    else                                        addLog(`Browser: ${ua.slice(0,60)}`, 'info');

    // API check
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SR) addLog('SpeechRecognition API: Available', 'ok');
    else    addLog('SpeechRecognition API: NOT available in this browser', 'err');

    // Protocol check
    const proto = window.location.protocol;
    if (proto === 'https:' || window.location.hostname === 'localhost') addLog(`Protocol: ${proto}//${window.location.host} — OK`, 'ok');
    else addLog(`Protocol: ${proto} — needs HTTPS or localhost`, 'err');

    // Network check
    if (navigator.onLine) addLog('Network: Online (Chrome STT needs internet)', 'ok');
    else addLog('Network: OFFLINE — Chrome STT will fail', 'err');

    // Mic permission check
    navigator.permissions?.query({ name: 'microphone' as PermissionName })
      .then(r => addLog(`Microphone permission: ${r.state}`, r.state === 'granted' ? 'ok' : r.state === 'denied' ? 'err' : 'info'))
      .catch(() => addLog('Microphone permission: cannot check (query not supported)', 'info'));
  }, []);

  const startTest = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { addLog('Cannot start — SpeechRecognition unavailable', 'err'); return; }

    setTranscript('');
    setRunning(true);

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    addLog('Starting SpeechRecognition with lang=en-US…', 'info');

    rec.onstart      = () => addLog('rec.onstart fired — mic is active!', 'ok');
    rec.onaudiostart = () => addLog('rec.onaudiostart — audio detected', 'ok');
    rec.onspeechstart= () => addLog('rec.onspeechstart — speech detected!', 'ok');
    rec.onspeechend  = () => addLog('rec.onspeechend — speech ended', 'info');
    rec.onaudioend   = () => addLog('rec.onaudioend', 'info');

    rec.onresult = (e: any) => {
      let final = '', interim = '';
      for (let i = 0; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) final += t;
        else interim = t;
      }
      const full = (final || interim);
      setTranscript(full);
      addLog(`Result: "${full}" (confidence: ${(e.results[0][0].confidence * 100).toFixed(0)}%)`, 'ok');
    };

    rec.onerror = (e: any) => {
      addLog(`ERROR: ${e.error} — ${getErrorHelp(e.error)}`, 'err');
      setRunning(false);
    };

    rec.onend = () => {
      addLog('rec.onend — recognition finished', 'info');
      setRunning(false);
    };

    recRef.current = rec;
    try {
      rec.start();
    } catch (err: any) {
      addLog(`rec.start() threw: ${err.message}`, 'err');
      setRunning(false);
    }
  };

  const stopTest = () => {
    try { recRef.current?.abort(); } catch {}
    setRunning(false);
    addLog('Manually stopped', 'info');
  };

  const getErrorHelp = (code: string) => ({
    'not-allowed':          'MICROPHONE BLOCKED. Click 🔒 in address bar → allow mic → refresh',
    'service-not-allowed':  'Service blocked. Try HTTPS or check browser flags.',
    'network':              'Network error — Chrome STT needs internet connection',
    'no-speech':            'No speech detected — speak louder or check mic in system settings',
    'audio-capture':        'Mic not found — check it is plugged in and set as default',
    'aborted':              'Aborted by code (normal when stopping)',
    'bad-grammar':          'Grammar error (should not happen)',
    'language-not-supported': 'en-US not supported? Try different lang',
  }[code] || 'Unknown error');

  return (
    <div style={{
      minHeight:'100vh', background:'#030308', color:'white',
      fontFamily:'Inter, sans-serif', padding:'40px 24px',
    }}>
      <div style={{maxWidth:700, margin:'0 auto'}}>
        <h1 style={{fontFamily:'Space Grotesk', fontWeight:800, fontSize:'1.5rem', marginBottom:4}}>
          🎙 Speech Recognition Diagnostics
        </h1>
        <p style={{color:'rgba(255,255,255,0.4)', fontSize:'0.85rem', marginBottom:32}}>
          This page tells us exactly why STT is or is not working.
        </p>

        {/* Big test button */}
        <div style={{display:'flex', gap:12, marginBottom:32}}>
          <button
            onClick={running ? stopTest : startTest}
            style={{
              padding:'14px 32px', borderRadius:14, fontWeight:800, fontSize:'1rem',
              fontFamily:'Space Grotesk', border:'none', cursor:'pointer',
              background: running
                ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                : 'linear-gradient(135deg,#10b981,#059669)',
              color:'white',
              boxShadow: running ? '0 0 24px rgba(239,68,68,0.5)' : '0 0 24px rgba(16,185,129,0.5)',
            }}
          >
            {running ? '⏹ Stop Test' : '▶ Start Speaking Test'}
          </button>
          <button
            onClick={() => setLog([])}
            style={{padding:'14px 20px', borderRadius:14, fontWeight:700, fontSize:'0.9rem', background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', cursor:'pointer'}}
          >
            Clear
          </button>
        </div>

        {/* Live transcript */}
        <div style={{
          background: running ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${running ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius:12, padding:'16px 20px', marginBottom:24, minHeight:60,
          transition:'all 0.3s',
        }}>
          <p style={{fontSize:'0.7rem', fontWeight:700, color:'rgba(255,255,255,0.3)', marginBottom:8, letterSpacing:'0.08em'}}>
            LIVE TRANSCRIPT
          </p>
          <p style={{fontSize:'1.1rem', color: transcript ? '#86efac' : 'rgba(255,255,255,0.2)', fontStyle: transcript ? 'normal' : 'italic'}}>
            {transcript || (running ? 'Listening… say something' : 'Click Start then speak')}
          </p>
        </div>

        {/* Status indicator */}
        {running && (
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:20, padding:'10px 16px', background:'rgba(16,185,129,0.1)', borderRadius:10, border:'1px solid rgba(16,185,129,0.2)'}}>
            <div style={{width:10, height:10, borderRadius:'50%', background:'#10b981', animation:'pulse 1s infinite'}}/>
            <p style={{color:'#34d399', fontWeight:700, fontSize:'0.85rem'}}>Microphone active — speak clearly into your mic</p>
          </div>
        )}

        {/* Log */}
        <div style={{background:'rgba(0,0,0,0.4)', borderRadius:12, border:'1px solid rgba(255,255,255,0.06)', overflow:'hidden'}}>
          <div style={{padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between'}}>
            <p style={{fontSize:'0.7rem', fontWeight:700, color:'rgba(255,255,255,0.3)', letterSpacing:'0.08em'}}>DIAGNOSTIC LOG</p>
            <p style={{fontSize:'0.7rem', color:'rgba(255,255,255,0.2)'}}>{log.length} events</p>
          </div>
          <div style={{maxHeight:400, overflowY:'auto', padding:'8px 0'}}>
            {log.length === 0 && (
              <p style={{padding:'16px', color:'rgba(255,255,255,0.2)', fontSize:'0.82rem'}}>Diagnostics will appear here…</p>
            )}
            {log.map((l, i) => (
              <div key={i} style={{
                padding:'6px 16px',
                background: i === 0 ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderLeft: l.startsWith('❌') ? '2px solid #ef4444' : l.startsWith('✅') ? '2px solid #10b981' : '2px solid rgba(255,255,255,0.1)',
                marginLeft:8, marginBottom:2,
              }}>
                <p style={{fontSize:'0.82rem', color: l.startsWith('❌') ? '#fca5a5' : l.startsWith('✅') ? '#86efac' : 'rgba(255,255,255,0.65)'}}>{l}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Fix guide */}
        <div style={{marginTop:24, padding:'16px 20px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12}}>
          <p style={{fontWeight:700, fontSize:'0.82rem', color:'#a5b4fc', marginBottom:10}}>🔧 Common Fixes</p>
          {[
            ['not-allowed error', 'Click the 🔒 lock icon in Chrome address bar → Microphone → Allow → Refresh page'],
            ['No transcript appears', 'Speak louder & clearly. Check Windows Settings → Privacy → Microphone → Allow apps'],
            ['network error', 'Chrome STT sends audio to Google — you need internet. Check connection.'],
            ['Works here but not in interview', 'Interview auto-starts mic — may need to click mic button once first'],
          ].map(([prob, fix]) => (
            <div key={prob} style={{marginBottom:8}}>
              <span style={{color:'rgba(255,255,255,0.5)', fontSize:'0.78rem', fontWeight:700}}>{prob}: </span>
              <span style={{color:'rgba(255,255,255,0.7)', fontSize:'0.78rem'}}>{fix}</span>
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}`}</style>
    </div>
  );
}
