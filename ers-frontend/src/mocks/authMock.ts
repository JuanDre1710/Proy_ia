import { User } from '../models/auth';

export const mockUsers: Array<User & { username: string; password: string }> = [
  {
    id: 'usr-admin',
    username: 'admin',
    password: 'Admin#123',
    name: 'Laura Mendez',
    email: 'laura.mendez@ers.local',
    role: 'Administrador',
    lastLogin: '2026-03-13T08:15:00'
  },
  {
    id: 'usr-eval',
    username: 'evaluador',
    password: 'Eval#123',
    name: 'Julian Acosta',
    email: 'julian.acosta@ers.local',
    role: 'Evaluador de Riesgos',
    lastLogin: '2026-03-13T07:55:00'
  },
  {
    id: 'usr-supervisor',
    username: 'supervisor',
    password: 'Super#123',
    name: 'Carla Sosa',
    email: 'carla.sosa@ers.local',
    role: 'Supervisor',
    lastLogin: '2026-03-12T18:40:00'
  }
];
