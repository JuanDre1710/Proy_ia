import { LoginRequest, Role, SessionState, User } from '../models/auth';
import { mockUsers } from '../mocks/authMock';

const sessionKey = 'ers-session';

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
    window.localStorage.setItem(sessionKey, JSON.stringify(user));
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
    const user = JSON.parse(raw) as User;
    return { authenticated: true, user };
  },
  hasAnyRole(user: User | null, roles: Role[]): boolean {
    return !!user && roles.includes(user.role);
  }
};
