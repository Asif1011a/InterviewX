'use client';
import { usePathname } from 'next/navigation';
import Sidebar from '@/app/sidebar';

export default function MainShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide sidebar on full-page views: interview, login, signup
  const hideSidebar = ['/interview', '/login', '/signup'].some(
    p => pathname === p || pathname?.startsWith(p + '?')
  );

  return (
    <>
      <Sidebar />
      <main style={{
        marginLeft: hideSidebar ? 0 : 220,
        marginRight: 0,
        minHeight: '100vh',
        position: 'relative',
        transition: 'margin-left 0.2s ease',
      }}>
        {children}
      </main>
    </>
  );
}
