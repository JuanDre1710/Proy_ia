import { createContext, useContext, useEffect, useState } from 'react';
import { LoginRequest, Role, SessionState } from '../models/auth';
import { authService } from '../services/authService';

interface AuthContextValue {
  session: SessionState;
  loading: boolean;
  login: (request: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  hasAnyRole: (roles: Role[]) => boolean;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [session, setSession] = useState<SessionState>(() => authService.getSession());
  const [loading, setLoading] = useState(true);

  const refreshSession = async (): Promise<void> => {
    const nextSession = await authService.refreshSession();
    setSession(nextSession);
  };

  const login = async (request: LoginRequest): Promise<boolean> => {
    const user = await authService.login(request);
    if (!user) {
      return false;
    }
    setSession(authService.getSession());
    return true;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setSession({ authenticated: false, user: null });
  };

  const hasAnyRole = (roles: Role[]): boolean => authService.hasAnyRole(session.user, roles);

  useEffect(() => {
    void refreshSession().finally(() => setLoading(false));

    const handleFocus = (): void => {
      void refreshSession();
    };

    const interval = window.setInterval(() => {
      void refreshSession();
    }, 30000);

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(interval);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, login, logout, hasAnyRole, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
