import { LoginRequest, Role, SessionState, User } from '../models/auth';
import { mockUsers } from '../mocks/authMock';

const sessionKey = 'ers-session';
const expiredKey = 'ers-session-expired';
const sessionDurationMs = 1000 * 60 * 30;

export const authService = {
  login(request: LoginRequest): User | null {
    const match = mockUsers.find(
      (user) =>
        user.username.toLowerCase() === request.username.trim().toLowerCase() &&
        user.password === request.password
    );
    if (!match) {
      return null;
    }

    const { password: _password, username: _username, ...user } = match;
    window.localStorage.setItem(
      sessionKey,
      JSON.stringify({
        user,
        expiresAt: new Date(Date.now() + sessionDurationMs).toISOString()
      })
    );
    window.sessionStorage.removeItem(expiredKey);
    return user;
  },
  logout(): void {
    window.localStorage.removeItem(sessionKey);
  },
  getSession(): SessionState {
    const raw = window.localStorage.getItem(sessionKey);
    if (!raw) {
      return { authenticated: false, user: null };
    }
    const parsed = JSON.parse(raw) as { user: User; expiresAt: string };
    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(sessionKey);
      window.sessionStorage.setItem(expiredKey, 'true');
      return { authenticated: false, user: null };
    }
    return { authenticated: true, user: parsed.user, expiresAt: parsed.expiresAt };
  },
  hasAnyRole(user: User | null, roles: Role[]): boolean {
    return !!user && roles.includes(user.role);
  },
  consumeExpirationNotice(): boolean {
    const expired = window.sessionStorage.getItem(expiredKey) === 'true';
    if (expired) {
      window.sessionStorage.removeItem(expiredKey);
    }
    return expired;
  }
};
