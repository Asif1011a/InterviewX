// Store/retrieve JWT token and user info in localStorage
export interface AuthUser {
  user_id: string;
  name: string;
  email: string;
  token: string;
}

export const AuthHelpers = {
  save: (user: AuthUser) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('mc_user', JSON.stringify(user));
  },
  get: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    try {
      const d = localStorage.getItem('mc_user');
      return d ? JSON.parse(d) : null;
    } catch { return null; }
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('mc_user');
  },
  isLoggedIn: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('mc_user');
  },
  getToken: (): string | null => {
    const u = AuthHelpers.get();
    return u ? u.token : null;
  },
  getName: (): string => {
    const u = AuthHelpers.get();
    return u ? u.name : 'Guest';
  },
};
