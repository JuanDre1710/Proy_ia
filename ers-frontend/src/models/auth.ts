export type Role = 'Administrador' | 'Evaluador de Riesgos' | 'Supervisor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastLogin: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface SessionState {
  authenticated: boolean;
  user: User | null;
}
