'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home, Settings, BarChart2, BookOpen, Network,
  Gamepad2, MessageSquare, Cpu, Activity, Zap, User
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { AuthHelpers, AuthUser } from '@/lib/auth';

const NAV = [
  { href:'/',          icon:<Home size={17}/>,         label:'Home',           desc:'Mission Control Home' },
  { href:'/setup',     icon:<Zap size={17}/>,          label:'New Session',    desc:'Start interview setup', badge:'Start' },
  { href:'/dashboard', icon:<BarChart2 size={17}/>,    label:'Dashboard',      desc:'Performance analytics' },
  { href:'/practice',  icon:<BookOpen size={17}/>,     label:'Practice',       desc:'Flip card drills' },
  { href:'/roadmap',   icon:<BookOpen size={17}/>,     label:'Roadmap',        desc:'Learning path' },
  { href:'/games',     icon:<Gamepad2 size={17}/>,     label:'Aptitude Games', desc:'Quizzes & puzzles', badge:'New' },
  { href:'/agents',    icon:<Network size={17}/>,      label:'Agent Lab',      desc:'21 AI agents live' },
  { href:'/profile',   icon:<User size={17}/>,         label:'My Profile',     desc:'Candidate profile' },
  { href:'/settings',  icon:<Settings size={17}/>,     label:'Settings',       desc:'Preferences & Voice' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setUser(AuthHelpers.get());
  }, [pathname]);

  // Hide sidebar on full-page views
  if (['/interview','/login','/signup'].some(p => pathname === p || pathname.startsWith(p + '?'))) return null;

  return (
    <aside style={{
      position:'fixed', left:0, top:0, bottom:0, width:220,
      background:'linear-gradient(180deg,#07070f 0%,#050508 100%)',
      borderRight:'1px solid rgba(255,255,255,0.06)',
      display:'flex', flexDirection:'column', zIndex:100,
      fontFamily:'Inter, sans-serif',
    }}>
      {/* Logo Header */}
      <div style={{padding:'20px 18px 16px', borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
        <Link href="/" style={{display:'flex',alignItems:'center',gap:10,textDecoration:'none'}}>
          <div style={{
            width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 0 20px rgba(99,102,241,0.4)', flexShrink:0,
          }}>
            <Cpu size={18} color="white"/>
          </div>
          <div>
            <p style={{fontFamily:'Space Grotesk',fontWeight:900,fontSize:'0.92rem',color:'white',margin:0,lineHeight:1.1}}>Mission</p>
            <p style={{fontFamily:'Space Grotesk',fontWeight:900,fontSize:'0.92rem',color:'#a5b4fc',margin:0,lineHeight:1.1}}>Control</p>
          </div>
        </Link>
      </div>

      {/* Nav Links */}
      <nav style={{flex:1,padding:'12px 10px',overflowY:'auto',display:'flex',flexDirection:'column',gap:2}}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:10, textDecoration:'none',
              background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
              borderLeft: `3px solid ${active ? '#6366f1' : 'transparent'}`,
              color: active ? '#c7d2fe' : 'rgba(255,255,255,0.5)',
              transition:'all 0.18s', position:'relative',
            }}
            onMouseEnter={e => { if(!active)(e.currentTarget as HTMLAnchorElement).style.background='rgba(255,255,255,0.04)'; }}
            onMouseLeave={e => { if(!active)(e.currentTarget as HTMLAnchorElement).style.background='transparent'; }}
            >
              <span style={{color: active ? '#818cf8' : 'rgba(255,255,255,0.35)', flexShrink:0}}>{item.icon}</span>
              <span style={{fontSize:'0.83rem',fontWeight: active ? 700 : 500, flex:1}}>{item.label}</span>
              {item.badge && (
                <span style={{fontSize:'0.58rem',fontWeight:800,padding:'2px 6px',borderRadius:6,background:'rgba(99,102,241,0.2)',color:'#a5b4fc',border:'1px solid rgba(99,102,241,0.3)'}}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* System Status Footer */}
      <div style={{padding:'12px 14px 16px', borderTop:'1px solid rgba(255,255,255,0.05)'}}>
        <div style={{
          background:'rgba(99,102,241,0.06)', borderRadius:12,
          border:'1px solid rgba(99,102,241,0.12)', padding:'10px 12px',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:6}}>
            <Activity size={12} color="#818cf8"/>
            <span style={{fontSize:'0.65rem',fontWeight:800,color:'#818cf8',letterSpacing:'0.06em'}}>SYSTEM STATUS</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#10b981',boxShadow:'0 0 6px #10b981',animation:'sidebar-pulse 2s infinite'}}/>
            <span style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.6)'}}>21 Agents Online</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'#6366f1',boxShadow:'0 0 6px #6366f1'}}/>
            <span style={{fontSize:'0.7rem',color:'rgba(255,255,255,0.6)'}}>FastAPI & MongoDB Connected</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes sidebar-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(0.85)} }
        aside::-webkit-scrollbar { width:3px }
        aside::-webkit-scrollbar-thumb { background:rgba(99,102,241,0.3);border-radius:3px }
      `}</style>
    </aside>
  );
}
