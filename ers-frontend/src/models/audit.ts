export type AuditActionType =
  | 'Login'
  | 'Logout'
  | 'Consulta de riesgo'
  | 'Exportacion CSV'
  | 'Exportacion PDF'
  | 'Actualizacion de umbrales'
  | 'Cambio de parametros'
  | 'Revision manual';

export type AuditResultType = 'OK' | 'Observado' | 'Bloqueado' | 'Error';

export interface AuditLogEntry {
  id: string;
  fechaHora: string;
  usuario: string;
  rol: 'Administrador' | 'Supervisor' | 'Evaluador de Riesgos' | 'Sistema';
  accion: AuditActionType;
  identificadorConsultado: string;
  resultado: AuditResultType;
  ip: string;
  detalle: string;
}

export interface AuditLogFilter {
  usuario: string;
  rol: '' | AuditLogEntry['rol'];
  fechaDesde: string;
  fechaHasta: string;
  accion: '' | AuditActionType;
  resultado: '' | AuditResultType;
}

export interface AuditLogQuery extends AuditLogFilter {
  page: number;
  pageSize: number;
  sortBy: keyof AuditLogEntry;
  sortDirection: 'asc' | 'desc';
}

export interface AuditLogPage {
  rows: AuditLogEntry[];
  total: number;
}
