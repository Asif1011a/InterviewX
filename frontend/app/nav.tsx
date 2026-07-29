'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cpu, Home, Settings, BarChart2, BookOpen, Network } from 'lucide-react';

const links = [
  { href: '/', label: 'Home', icon: <Home size={14} /> },
  { href: '/setup', label: 'New Session', icon: <Settings size={14} /> },
  { href: '/dashboard', label: 'Dashboard', icon: <BarChart2 size={14} /> },
  { href: '/roadmap', label: 'Roadmap', icon: <BookOpen size={14} /> },
  { href: '/agents', label: 'Agent Lab', icon: <Network size={14} />, special: true },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      borderBottom: '1px solid var(--border)',
      background: 'rgba(5, 5, 9, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)'
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem', height: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 15px rgba(99,102,241,0.4)'
          }}>
            <Cpu size={16} color="white" />
          </div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>InterviewX</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 'auto' }}>
          {links.map((l: any) => {
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '0.375rem 0.75rem', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 500, textDecoration: 'none',
                  transition: 'all 0.2s',
                  background: l.special
                    ? active ? 'rgba(250,204,21,0.15)' : 'rgba(250,204,21,0.07)'
                    : active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: l.special ? '#fbbf24' : active ? '#a5b4fc' : 'var(--text-muted)',
                  border: l.special
                    ? `1px solid rgba(250,204,21,${active ? '0.3' : '0.15'})`
                    : active ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent'
                }}
              >
                {l.icon}
                <span className="hidden sm:inline">{l.label}</span>
                {l.special && <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981', animation: 'pulse-dot 2s infinite' }} />}
              </Link>
            );
          })}
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0.25rem 0.75rem', borderRadius: 9999,
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'rgba(99,102,241,0.05)', marginLeft: 8
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', animation: 'pulse-dot 2s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.7rem', fontFamily: 'Space Grotesk', fontWeight: 600, color: '#a5b4fc' }}>15 Agents Active</span>
        </div>
      </div>
    </nav>
  );
}
