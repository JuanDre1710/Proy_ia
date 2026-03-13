import { createContext, useContext, useState } from 'react';
import { LoginRequest, Role, SessionState } from '../models/auth';
import { authService } from '../services/authService';

interface AuthContextValue {
  session: SessionState;
  login: (request: LoginRequest) => boolean;
  logout: () => void;
  hasAnyRole: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [session, setSession] = useState<SessionState>(() => authService.getSession());

  const login = (request: LoginRequest): boolean => {
    const user = authService.login(request);
    if (!user) {
      return false;
    }
    setSession({ authenticated: true, user });
    return true;
  };

  const logout = (): void => {
    authService.logout();
    setSession({ authenticated: false, user: null });
  };

  const hasAnyRole = (roles: Role[]): boolean => authService.hasAnyRole(session.user, roles);

  return (
    <AuthContext.Provider value={{ session, login, logout, hasAnyRole }}>
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
