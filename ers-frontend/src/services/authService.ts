import { LoginRequest, Role, SessionState, User } from '../models/auth';
import { mockUsers } from '../mocks/authMock';
import { apiBaseUrls } from '../config/apiBaseUrls';

const sessionKey = 'ers-session';
const expiredKey = 'ers-session-expired';
const sessionDurationMs = 1000 * 60 * 30;
const apiBaseUrl = apiBaseUrls.backend;

type StoredSession = {
  user: User;
  expiresAt: string;
  accessToken?: string;
  refreshToken?: string;
  mode: 'mock' | 'real';
};

type BackendSessionResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Supervisor' | 'Evaluador';
    lastLogin: string | null;
  };
};

function mapBackendRole(role: BackendSessionResponse['user']['role']): Role {
  if (role === 'Admin') {
    return 'Administrador';
  }
  if (role === 'Supervisor') {
    return 'Supervisor';
  }
  return 'Evaluador de Riesgos';
}

function mapBackendUser(user: BackendSessionResponse['user']): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: mapBackendRole(user.role),
    lastLogin: user.lastLogin ?? new Date().toISOString()
  };
}

function saveSession(payload: StoredSession): void {
  window.localStorage.setItem(sessionKey, JSON.stringify(payload));
}

function loadStoredSession(): StoredSession | null {
  const raw = window.localStorage.getItem(sessionKey);
  if (!raw) {
    return null;
  }

  return JSON.parse(raw) as StoredSession;
}

async function requestJson<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function refreshRealSession(stored: StoredSession): Promise<SessionState> {
  if (!stored.refreshToken) {
    window.localStorage.removeItem(sessionKey);
    window.sessionStorage.setItem(expiredKey, 'true');
    return { authenticated: false, user: null };
  }

  const refreshed = await requestJson<BackendSessionResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({
      refreshToken: stored.refreshToken
    })
  });

  const nextSession: StoredSession = {
    user: mapBackendUser(refreshed.user),
    expiresAt: refreshed.expiresAt,
    accessToken: refreshed.accessToken,
    refreshToken: refreshed.refreshToken,
    mode: 'real'
  };

  saveSession(nextSession);

  return {
    authenticated: true,
    user: nextSession.user,
    expiresAt: nextSession.expiresAt,
    mode: nextSession.mode
  };
}

export const authService = {
  async login(request: LoginRequest): Promise<User | null> {
    try {
      const response = await requestJson<BackendSessionResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(request)
      });
      const user = mapBackendUser(response.user);
      saveSession({
        user,
        expiresAt: response.expiresAt,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        mode: 'real'
      });
      window.sessionStorage.removeItem(expiredKey);
      return user;
    } catch (_error) {
      const match = mockUsers.find(
        (user) =>
          user.username.toLowerCase() === request.username.trim().toLowerCase() &&
          user.password === request.password
      );
      if (!match) {
        return null;
      }

      const { password: _password, username: _username, ...user } = match;
      saveSession({
        user,
        expiresAt: new Date(Date.now() + sessionDurationMs).toISOString(),
        mode: 'mock'
      });
      window.sessionStorage.removeItem(expiredKey);
      return user;
    }
  },
  async logout(): Promise<void> {
    const session = loadStoredSession();
    if (session?.mode === 'real') {
      try {
        await requestJson<void>('/auth/logout', {
          method: 'POST',
          headers: {
            Authorization: session.accessToken ? `Bearer ${session.accessToken}` : ''
          },
          body: JSON.stringify({
            refreshToken: session.refreshToken ?? null
          })
        });
      } catch (_error) {
        // Fallback to local logout only.
      }
    }

    window.localStorage.removeItem(sessionKey);
  },
  getSession(): SessionState {
    const parsed = loadStoredSession();
    if (!parsed) {
      return { authenticated: false, user: null };
    }

    if (new Date(parsed.expiresAt).getTime() <= Date.now()) {
      if (parsed.mode === 'real' && parsed.refreshToken) {
        return { authenticated: false, user: null, expiresAt: parsed.expiresAt, mode: parsed.mode };
      }
      window.localStorage.removeItem(sessionKey);
      window.sessionStorage.setItem(expiredKey, 'true');
      return { authenticated: false, user: null };
    }
    return { authenticated: true, user: parsed.user, expiresAt: parsed.expiresAt, mode: parsed.mode };
  },
  async refreshSession(): Promise<SessionState> {
    const stored = loadStoredSession();
    if (!stored) {
      return { authenticated: false, user: null };
    }

    if (stored.mode === 'mock') {
      return this.getSession();
    }

    try {
      if (stored.accessToken && new Date(stored.expiresAt).getTime() > Date.now()) {
        try {
          const me = await requestJson<{ user: BackendSessionResponse['user']; expiresAt: string }>('/auth/me', {
            headers: {
              Authorization: `Bearer ${stored.accessToken}`
            }
          });
          const nextSession: StoredSession = {
            ...stored,
            user: mapBackendUser(me.user),
            expiresAt: me.expiresAt
          };
          saveSession(nextSession);
          return {
            authenticated: true,
            user: nextSession.user,
            expiresAt: nextSession.expiresAt,
            mode: nextSession.mode
          };
        } catch (error) {
          if (!(error instanceof Error) || error.message !== 'HTTP 401' || !stored.refreshToken) {
            throw error;
          }

          return await refreshRealSession(stored);
        };
      }

      return await refreshRealSession(stored);
    } catch (_error) {
      window.localStorage.removeItem(sessionKey);
      window.sessionStorage.setItem(expiredKey, 'true');
      return { authenticated: false, user: null };
    }
  },
  hasAnyRole(user: User | null, roles: Role[]): boolean {
    return !!user && roles.includes(user.role);
  },
  getAccessToken(): string | null {
    return loadStoredSession()?.accessToken ?? null;
  },
  getActorHeaders(): Record<string, string> {
    const stored = loadStoredSession();
    const user = stored?.user;
    const role =
      user?.role === 'Administrador'
        ? 'Admin'
        : user?.role === 'Supervisor'
          ? 'Supervisor'
          : 'Evaluador';
    return {
      ...(stored?.accessToken ? { Authorization: `Bearer ${stored.accessToken}` } : {}),
      ...(user?.id ? { 'X-Actor-Id': user.id } : {}),
      ...(user?.name ? { 'X-Actor-Name': user.name } : {}),
      ...(role ? { 'X-Actor-Role': role } : {})
    };
  },
  consumeExpirationNotice(): boolean {
    const expired = window.sessionStorage.getItem(expiredKey) === 'true';
    if (expired) {
      window.sessionStorage.removeItem(expiredKey);
    }
    return expired;
  }
};
