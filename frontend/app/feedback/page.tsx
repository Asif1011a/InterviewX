'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sid = searchParams.get('sid');

  useEffect(() => {
    if (sid) {
      router.replace(`/dashboard?sid=${sid}`);
    } else {
      router.replace('/dashboard');
    }
  }, [router, sid]);

  return (
    <div style={{ minHeight: '100vh', background: '#030308', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Space Grotesk', fontWeight: 800 }}>
      Redirecting to Placement Dashboard...
    </div>
  );
}
