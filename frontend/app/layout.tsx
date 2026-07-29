import type { Metadata } from 'next';
import './globals.css';
import MainShell from '@/components/MainShell';
import MouseSpotlight from '@/components/MouseSpotlight';

export const metadata: Metadata = {
  title: 'AI Placement Mission Control',
  description: '21 specialized AI agents prepare you for your dream interview.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#030308', minHeight: '100vh', overflowX: 'hidden' }}>
        <MouseSpotlight />
        <MainShell>
          {children}
        </MainShell>
      </body>
    </html>
  );
}
