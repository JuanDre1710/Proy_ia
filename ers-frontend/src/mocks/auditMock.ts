import { AuditLogEntry } from '../models/audit';

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'AUD-001',
    fechaHora: '2026-03-16T10:14:00',
    usuario: 'Laura Mendez',
    rol: 'Administrador',
    accion: 'Cambio de parametros',
    identificadorConsultado: 'system-settings',
    resultado: 'OK',
    ip: '10.20.1.15',
    detalle: 'Actualizo timeout de sesion a 30 minutos y retencion de auditoria a 180 dias.'
  },
  {
    id: 'AUD-002',
    fechaHora: '2026-03-16T10:06:00',
    usuario: 'Carla Sosa',
    rol: 'Supervisor',
    accion: 'Revision manual',
    identificadorConsultado: 'CAS-88421',
    resultado: 'Observado',
    ip: '10.20.1.51',
    detalle: 'Solicito documentacion adicional por inconsistencias en tercero vinculado.'
  },
  {
    id: 'AUD-003',
    fechaHora: '2026-03-16T09:58:00',
    usuario: 'Laura Mendez',
    rol: 'Administrador',
    accion: 'Actualizacion de umbrales',
    identificadorConsultado: 'risk-thresholds',
    resultado: 'OK',
    ip: '10.20.1.15',
    detalle: 'Modifico umbral de revision manual de 60 a 65 y rechazo automatico de 88 a 90.'
  },
  {
    id: 'AUD-004',
    fechaHora: '2026-03-16T09:43:00',
    usuario: 'Julian Acosta',
    rol: 'Evaluador de Riesgos',
    accion: 'Consulta de riesgo',
    identificadorConsultado: '30111222',
    resultado: 'Observado',
    ip: '10.20.1.42',
    detalle: 'Consulta de DNI con score alto y coincidencia en taller observado.'
  },
  {
    id: 'AUD-005',
    fechaHora: '2026-03-16T09:35:00',
    usuario: 'Carla Sosa',
    rol: 'Supervisor',
    accion: 'Exportacion CSV',
    identificadorConsultado: '20333444556',
    resultado: 'OK',
    ip: '10.20.1.51',
    detalle: 'Genero exportacion para auditoria interna de caso de flota.'
  },
  {
    id: 'AUD-006',
    fechaHora: '2026-03-16T09:20:00',
    usuario: 'Laura Mendez',
    rol: 'Administrador',
    accion: 'Login',
    identificadorConsultado: 'admin',
    resultado: 'OK',
    ip: '10.20.1.15',
    detalle: 'Inicio de sesion exitoso desde red corporativa.'
  },
  {
    id: 'AUD-007',
    fechaHora: '2026-03-15T18:47:00',
    usuario: 'Sistema',
    rol: 'Sistema',
    accion: 'Exportacion PDF',
    identificadorConsultado: '30111222',
    resultado: 'Error',
    ip: '127.0.0.1',
    detalle: 'Fallo mock por timeout del proceso de generacion PDF.'
  },
  {
    id: 'AUD-008',
    fechaHora: '2026-03-15T18:15:00',
    usuario: 'Carla Sosa',
    rol: 'Supervisor',
    accion: 'Consulta de riesgo',
    identificadorConsultado: '27123456789',
    resultado: 'OK',
    ip: '10.20.1.51',
    detalle: 'Consulta de CUIL sin alertas materiales.'
  },
  {
    id: 'AUD-009',
    fechaHora: '2026-03-15T17:52:00',
    usuario: 'Julian Acosta',
    rol: 'Evaluador de Riesgos',
    accion: 'Consulta de riesgo',
    identificadorConsultado: '20333444556',
    resultado: 'OK',
    ip: '10.20.1.42',
    detalle: 'Consulta de CUIT con score bajo y documentacion societaria valida.'
  },
  {
    id: 'AUD-010',
    fechaHora: '2026-03-15T17:34:00',
    usuario: 'Laura Mendez',
    rol: 'Administrador',
    accion: 'Cambio de parametros',
    identificadorConsultado: 'export-settings',
    resultado: 'OK',
    ip: '10.20.1.15',
    detalle: 'Deshabilito inclusion de datos sensibles en exportaciones masivas.'
  },
  {
    id: 'AUD-011',
    fechaHora: '2026-03-15T16:58:00',
    usuario: 'Carla Sosa',
    rol: 'Supervisor',
    accion: 'Exportacion CSV',
    identificadorConsultado: 'CAS-88421',
    resultado: 'Bloqueado',
    ip: '10.20.1.51',
    detalle: 'Exportacion bloqueada por requerir aprobacion previa.'
  },
  {
    id: 'AUD-012',
    fechaHora: '2026-03-15T16:22:00',
    usuario: 'Julian Acosta',
    rol: 'Evaluador de Riesgos',
    accion: 'Logout',
    identificadorConsultado: 'evaluador',
    resultado: 'OK',
    ip: '10.20.1.42',
    detalle: 'Cierre de sesion voluntario.'
  },
  {
    id: 'AUD-013',
    fechaHora: '2026-03-15T15:50:00',
    usuario: 'Sistema',
    rol: 'Sistema',
    accion: 'Cambio de parametros',
    identificadorConsultado: 'integrations',
    resultado: 'Observado',
    ip: '127.0.0.1',
    detalle: 'Se marco integracion AFIP como degradada por latencia superior a 900 ms.'
  },
  {
    id: 'AUD-014',
    fechaHora: '2026-03-15T15:11:00',
    usuario: 'Laura Mendez',
    rol: 'Administrador',
    accion: 'Exportacion CSV',
    identificadorConsultado: 'AUDIT-BATCH-20260315',
    resultado: 'OK',
    ip: '10.20.1.15',
    detalle: 'Descargo consolidado de auditoria para seguimiento semanal.'
  },
  {
    id: 'AUD-015',
    fechaHora: '2026-03-15T14:42:00',
    usuario: 'Carla Sosa',
    rol: 'Supervisor',
    accion: 'Revision manual',
    identificadorConsultado: 'CAS-77102',
    resultado: 'OK',
    ip: '10.20.1.51',
    detalle: 'Caso aprobado para continuar circuito operativo estandar.'
  },
  {
    id: 'AUD-016',
    fechaHora: '2026-03-15T13:57:00',
    usuario: 'Julian Acosta',
    rol: 'Evaluador de Riesgos',
    accion: 'Consulta de riesgo',
    identificadorConsultado: '30999888777',
    resultado: 'Bloqueado',
    ip: '10.20.1.42',
    detalle: 'Consulta rechazada por mantenimiento temporal de integracion externa.'
  },
  {
    id: 'AUD-017',
    fechaHora: '2026-03-15T13:10:00',
    usuario: 'Laura Mendez',
    rol: 'Administrador',
    accion: 'Login',
    identificadorConsultado: 'admin',
    resultado: 'OK',
    ip: '10.20.1.15',
    detalle: 'Ingreso exitoso para revision de configuracion central.'
  },
  {
    id: 'AUD-018',
    fechaHora: '2026-03-14T19:44:00',
    usuario: 'Carla Sosa',
    rol: 'Supervisor',
    accion: 'Logout',
    identificadorConsultado: 'supervisor',
    resultado: 'OK',
    ip: '10.20.1.51',
    detalle: 'Fin de jornada con cierre de sesion.'
  }
];
