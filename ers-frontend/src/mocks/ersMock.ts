import { AuditLogEntry, RiskEvaluation, RiskThresholdConfig } from '../models/domain';

export const mockEvaluations: Record<string, RiskEvaluation> = {
  '30111222': {
    requestedAt: '2026-03-13T09:21:00',
    person: {
      fullName: 'Marina Veronica Salvatierra',
      identifier: '30111222',
      birthDate: '1985-07-12',
      age: 40,
      address: 'Av. Rivadavia 4580',
      locality: 'Caballito',
      province: 'Buenos Aires',
      phone: '+54 11 4455 8821',
      email: 'mvsalvatierra@mail.test',
      verified: true
    },
    financial: {
      creditScore: 618,
      debtRatio: 48,
      bancarizationLevel: 'Alta',
      bouncedChecks: 2,
      activeLoans: 4,
      observation: 'Endeudamiento creciente en los ultimos 6 meses.'
    },
    employmentFiscal: {
      taxStatus: 'Responsable Inscripto',
      mainActivity: 'Servicios administrativos',
      employer: 'Salvatierra Consultora SAS',
      monthlyIncomeRange: '$2.400.000 - $3.100.000',
      registeredEmployees: 3,
      observation: 'Actividad fiscal consistente pero con variacion mensual relevante.'
    },
    claims: [
      {
        id: 'SIN-1001',
        date: '2025-12-18',
        type: 'Automotor',
        amount: 6400000,
        status: 'Observado',
        notes: 'Coincidencia parcial con taller previamente alertado.'
      },
      {
        id: 'SIN-0984',
        date: '2025-09-02',
        type: 'Automotor',
        amount: 5100000,
        status: 'Aprobado',
        notes: 'Sin observaciones materiales.'
      },
      {
        id: 'SIN-0901',
        date: '2024-11-24',
        type: 'Hogar',
        amount: 1800000,
        status: 'Rechazado',
        notes: 'Documentacion inconsistente.'
      }
    ],
    alerts: [
      {
        id: 'ALT-01',
        title: 'Frecuencia de siniestros elevada',
        detail: '3 eventos relevantes en 16 meses.',
        level: 'high'
      },
      {
        id: 'ALT-02',
        title: 'Relacion con taller observado',
        detail: 'Aparece en 2 casos con proveedor de alta recurrencia.',
        level: 'medium'
      },
      {
        id: 'ALT-03',
        title: 'Endeudamiento alto',
        detail: 'Debt ratio cercano al umbral critico.',
        level: 'medium'
      }
    ],
    score: {
      score: 78,
      level: 'Alto',
      summary: 'La combinacion de recurrencia de siniestros, endeudamiento y relaciones cruzadas eleva el riesgo de fraude.',
      drivers: [
        { label: 'Frecuencia de siniestros', impact: 'Negativo', weight: 32 },
        { label: 'Relacion con tercero observado', impact: 'Negativo', weight: 24 },
        { label: 'Bancarizacion alta', impact: 'Positivo', weight: 9 },
        { label: 'Identidad verificada', impact: 'Positivo', weight: 7 }
      ]
    },
    heatmap: [
      { variable: 'Frecuencia siniestros', value: 'Alta', intensity: 92 },
      { variable: 'Monto promedio', value: '$4.4M', intensity: 78 },
      { variable: 'Debt ratio', value: '48%', intensity: 74 },
      { variable: 'Coincidencias de terceros', value: '2', intensity: 85 },
      { variable: 'Verificacion identidad', value: 'OK', intensity: 18 },
      { variable: 'Bancarizacion', value: 'Alta', intensity: 25 }
    ],
    relationships: {
      nodes: [
        { id: 'n1', label: 'Titular', category: 'Titular', riskLevel: 'high' },
        { id: 'n2', label: 'Taller Delta', category: 'Tercero', riskLevel: 'medium' },
        { id: 'n3', label: 'SIN-1001', category: 'Siniestro', riskLevel: 'high' },
        { id: 'n4', label: 'Cuenta 8841', category: 'Cuenta', riskLevel: 'low' },
        { id: 'n5', label: 'Consultora SAS', category: 'Empresa', riskLevel: 'low' }
      ],
      edges: [
        { source: 'n1', target: 'n3', reason: 'Titular del reclamo' },
        { source: 'n3', target: 'n2', reason: 'Proveedor asociado' },
        { source: 'n1', target: 'n4', reason: 'Cuenta de cobro informada' },
        { source: 'n1', target: 'n5', reason: 'Actividad fiscal principal' }
      ]
    }
  },
  '20333444556': {
    requestedAt: '2026-03-13T09:28:00',
    person: {
      fullName: 'Transporte Litoral SRL',
      identifier: '20333444556',
      birthDate: '2009-04-03',
      age: 16,
      address: 'Ruta 12 Km 118',
      locality: 'Zarate',
      province: 'Buenos Aires',
      phone: '+54 3487 410220',
      email: 'riesgos@translitoral.test',
      verified: true
    },
    financial: {
      creditScore: 712,
      debtRatio: 31,
      bancarizationLevel: 'Alta',
      bouncedChecks: 0,
      activeLoans: 1,
      observation: 'Perfil financiero estable.'
    },
    employmentFiscal: {
      taxStatus: 'Sociedad vigente',
      mainActivity: 'Transporte de carga',
      employer: 'N/A',
      monthlyIncomeRange: '$18.000.000 - $24.000.000',
      registeredEmployees: 28,
      observation: 'Actividad consistente con escala operativa declarada.'
    },
    claims: [
      {
        id: 'SIN-1204',
        date: '2025-08-21',
        type: 'Flota',
        amount: 3200000,
        status: 'Aprobado',
        notes: 'Historial documentado correctamente.'
      }
    ],
    alerts: [
      {
        id: 'ALT-10',
        title: 'Sin alertas criticas',
        detail: 'Caso apto para revision operativa estandar.',
        level: 'low'
      }
    ],
    score: {
      score: 29,
      level: 'Bajo',
      summary: 'No se observan patrones anormales relevantes en la informacion integrada.',
      drivers: [
        { label: 'Historial de siniestros bajo', impact: 'Positivo', weight: 28 },
        { label: 'Documentacion societaria valida', impact: 'Positivo', weight: 22 },
        { label: 'Coincidencias de terceros', impact: 'Neutro', weight: 4 }
      ]
    },
    heatmap: [
      { variable: 'Frecuencia siniestros', value: 'Baja', intensity: 22 },
      { variable: 'Monto promedio', value: '$3.2M', intensity: 34 },
      { variable: 'Debt ratio', value: '31%', intensity: 38 },
      { variable: 'Coincidencias de terceros', value: '0', intensity: 12 },
      { variable: 'Verificacion identidad', value: 'OK', intensity: 10 },
      { variable: 'Bancarizacion', value: 'Alta', intensity: 18 }
    ],
    relationships: {
      nodes: [
        { id: 'm1', label: 'Empresa', category: 'Titular', riskLevel: 'low' },
        { id: 'm2', label: 'SIN-1204', category: 'Siniestro', riskLevel: 'low' },
        { id: 'm3', label: 'Cuenta principal', category: 'Cuenta', riskLevel: 'low' }
      ],
      edges: [
        { source: 'm1', target: 'm2', reason: 'Siniestro historico' },
        { source: 'm1', target: 'm3', reason: 'Cuenta declarada' }
      ]
    }
  }
};

export const mockThresholds: RiskThresholdConfig = {
  reviewThreshold: 55,
  autoRejectThreshold: 85,
  suspiciousClaimFrequency: 3,
  debtRatioThreshold: 50,
  updatedBy: 'Laura Mendez',
  updatedAt: '2026-03-12T17:10:00'
};

export const mockAuditLogs: AuditLogEntry[] = [
  {
    id: 'LOG-1',
    timestamp: '2026-03-13T09:24:11',
    actor: 'Laura Mendez',
    role: 'Administrador',
    action: 'Actualizacion de umbrales',
    entity: 'risk-thresholds',
    result: 'OK',
    ip: '10.20.1.15'
  },
  {
    id: 'LOG-2',
    timestamp: '2026-03-13T09:18:39',
    actor: 'Julian Acosta',
    role: 'Evaluador de Riesgos',
    action: 'Consulta por DNI',
    entity: '30111222',
    result: 'ALERTA ALTA',
    ip: '10.20.1.42'
  },
  {
    id: 'LOG-3',
    timestamp: '2026-03-13T08:56:05',
    actor: 'Carla Sosa',
    role: 'Supervisor',
    action: 'Exportacion CSV',
    entity: '20333444556',
    result: 'OK',
    ip: '10.20.1.51'
  }
];
