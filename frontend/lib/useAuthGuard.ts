'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthHelpers, AuthUser } from './auth';

export function useAuthGuard() {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const u = AuthHelpers.get();
    if (!u) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    } else {
      setUser(u);
    }
    setChecking(false);
  }, [pathname, router]);

  return { user, checking };
}
