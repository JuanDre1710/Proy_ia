import { CaseEvaluation } from '../models/cases';

export const mockCases: Record<string, CaseEvaluation> = {
  '30111222': {
    caseId: '30111222',
    requestedAt: '2026-03-13T09:21:00',
    analystSummary:
      'Frecuencia de siniestros elevada, endeudamiento creciente y cruce con proveedor observado.',
    generalStatus: 'En revision prioritaria',
    riskScore: {
      score: 87,
      category: 'Sospechoso de fraude',
      explanation:
        'El score combina recurrencia de siniestros, patrones de terceros vinculados y tensiones financieras recientes.'
    },
    alerts: [
      {
        id: 'ALT-3011-1',
        type: 'Siniestros',
        severity: 'error',
        title: 'Frecuencia de siniestros elevada',
        shortDescription: 'Tres siniestros relevantes en menos de 16 meses.',
        detail:
          'El caso presenta una frecuencia superior al umbral operativo esperado para el segmento y producto.',
        source: 'Motor antifraude ERS',
        relatedVariable: 'claim_frequency_16m',
        recommendation: 'Escalar a revision manual y verificar trazabilidad documental.'
      },
      {
        id: 'ALT-3011-2',
        type: 'Conductual',
        severity: 'warning',
        title: 'Proveedor observado vinculado',
        shortDescription: 'Coincidencia parcial con taller de alta recurrencia.',
        detail:
          'El taller Delta aparece en otros expedientes con observaciones previas y elevada reutilizacion.',
        source: 'Red de relaciones',
        relatedVariable: 'third_party_overlap',
        recommendation: 'Validar presupuesto, geolocalizacion y comprobantes del tercero.'
      },
      {
        id: 'ALT-3011-3',
        type: 'Financiera',
        severity: 'warning',
        title: 'Endeudamiento creciente',
        shortDescription: 'Debt ratio en ascenso sostenido.',
        detail:
          'La razon deuda/ingreso se incremento en los ultimos 6 meses y se encuentra cerca del umbral critico.',
        source: 'Buró financiero mock',
        relatedVariable: 'debt_ratio_trend'
      }
    ],
    aiExplanation: {
      totalScore: 87,
      textualClassification: 'Sospechoso de fraude',
      executiveSummary:
        'El modelo prioriza la frecuencia anomala de siniestros, el cruce con terceros observados y el deterioro financiero reciente.',
      variables: [
        {
          id: 'VAR-3011-1',
          name: 'Frecuencia de siniestros',
          impact: 'Negativo',
          weight: 34,
          description: 'La cantidad y cercania temporal de eventos eleva el riesgo esperado.'
        },
        {
          id: 'VAR-3011-2',
          name: 'Coincidencias con terceros',
          impact: 'Negativo',
          weight: 27,
          description: 'La red de proveedores y relaciones aumenta la probabilidad de maniobra coordinada.'
        },
        {
          id: 'VAR-3011-3',
          name: 'Debt ratio',
          impact: 'Negativo',
          weight: 21,
          description: 'El tensionamiento financiero incrementa la exposicion a comportamientos oportunistas.'
        },
        {
          id: 'VAR-3011-4',
          name: 'Identidad verificada',
          impact: 'Positivo',
          weight: 8,
          description: 'La identidad validada reduce parcialmente la incertidumbre base.'
        }
      ],
      evaluatorRecommendation:
        'No aprobar en linea. Requerir validacion manual integral y contrastar documentacion con fuentes externas.'
    },
    personalInfo: {
      fullName: 'Marina Veronica Salvatierra',
      document: '30111222',
      documentType: 'DNI',
      birthDate: '1985-07-12',
      age: 40,
      verified: true,
      deceased: false,
      address: 'Av. Rivadavia 4580',
      locality: 'Caballito',
      province: 'Buenos Aires',
      phone: '+54 11 4455 8821',
      email: 'mvsalvatierra@mail.test'
    },
    financialInfo: {
      creditScore: 618,
      debtRatio: 48,
      bancarizationLevel: 'Alta',
      activeLoans: 4,
      bouncedChecks: 2,
      monthlyIncomeEstimate: '$2.400.000 - $3.100.000',
      observation: 'Endeudamiento creciente en los ultimos 6 meses.'
    },
    laborFiscalInfo: {
      taxStatus: 'Responsable Inscripto',
      mainActivity: 'Servicios administrativos',
      employerOrCompany: 'Salvatierra Consultora SAS',
      incomeBracket: '$2.400.000 - $3.100.000',
      registeredEmployees: 3,
      fiscalObservation: 'Actividad fiscal consistente pero con variacion mensual relevante.'
    },
    claimsHistory: [
      {
        id: 'SIN-1001',
        date: '2025-12-18',
        type: 'Automotor',
        amount: 6400000,
        status: 'Observado',
        counterpart: 'Taller Delta',
        notes: 'Coincidencia parcial con taller previamente alertado.'
      },
      {
        id: 'SIN-0984',
        date: '2025-09-02',
        type: 'Automotor',
        amount: 5100000,
        status: 'Aprobado',
        counterpart: 'Asegurado',
        notes: 'Sin observaciones materiales.'
      },
      {
        id: 'SIN-0901',
        date: '2024-11-24',
        type: 'Hogar',
        amount: 1800000,
        status: 'Rechazado',
        counterpart: 'Proveedor externo',
        notes: 'Documentacion inconsistente.'
      }
    ]
  },
  '20333444556': {
    caseId: '20333444556',
    requestedAt: '2026-03-13T09:28:00',
    analystSummary:
      'Perfil societario estable, sin alertas criticas y con baja recurrencia de siniestros.',
    generalStatus: 'Evaluable',
    riskScore: {
      score: 24,
      category: 'Normal',
      explanation:
        'No se observan patrones anormales relevantes en la informacion consolidada del caso.'
    },
    alerts: [
      {
        id: 'ALT-2033-1',
        type: 'Integridad',
        severity: 'success',
        title: 'Caso limpio',
        shortDescription: 'No se detectaron alertas criticas.',
        detail:
          'La informacion financiera, fiscal y de siniestros se mantiene dentro de parametros operativos esperados.',
        source: 'Motor antifraude ERS',
        relatedVariable: 'overall_consistency',
        recommendation: 'Continuar con revision operativa estandar.'
      }
    ],
    aiExplanation: {
      totalScore: 24,
      textualClassification: 'Normal',
      executiveSummary:
        'El score es bajo porque el caso presenta historial estable, consistencia societaria y baja recurrencia de eventos.',
      variables: [
        {
          id: 'VAR-2033-1',
          name: 'Historial de siniestros',
          impact: 'Positivo',
          weight: 29,
          description: 'La frecuencia y severidad historicas son compatibles con el segmento.'
        },
        {
          id: 'VAR-2033-2',
          name: 'Consistencia societaria',
          impact: 'Positivo',
          weight: 24,
          description: 'La empresa mantiene trazabilidad documental y fiscal estable.'
        },
        {
          id: 'VAR-2033-3',
          name: 'Coincidencias de terceros',
          impact: 'Neutro',
          weight: 5,
          description: 'No se detectan cruces relevantes con proveedores observados.'
        }
      ],
      evaluatorRecommendation:
        'El caso puede seguir el circuito operativo normal sin escalamiento antifraude.'
    },
    personalInfo: {
      fullName: 'Transporte Litoral SRL',
      document: '20333444556',
      documentType: 'CUIT',
      birthDate: '2009-04-03',
      age: 16,
      verified: true,
      deceased: false,
      address: 'Ruta 12 Km 118',
      locality: 'Zarate',
      province: 'Buenos Aires',
      phone: '+54 3487 410220',
      email: 'riesgos@translitoral.test'
    },
    financialInfo: {
      creditScore: 712,
      debtRatio: 31,
      bancarizationLevel: 'Alta',
      activeLoans: 1,
      bouncedChecks: 0,
      monthlyIncomeEstimate: '$18.000.000 - $24.000.000',
      observation: 'Perfil financiero estable.'
    },
    laborFiscalInfo: {
      taxStatus: 'Sociedad vigente',
      mainActivity: 'Transporte de carga',
      employerOrCompany: 'Transporte Litoral SRL',
      incomeBracket: '$18.000.000 - $24.000.000',
      registeredEmployees: 28,
      fiscalObservation: 'Actividad consistente con escala operativa declarada.'
    },
    claimsHistory: [
      {
        id: 'SIN-1204',
        date: '2025-08-21',
        type: 'Flota',
        amount: 3200000,
        status: 'Aprobado',
        counterpart: 'Taller habilitado',
        notes: 'Historial documentado correctamente.'
      }
    ]
  },
  '27123456789': {
    caseId: '27123456789',
    requestedAt: '2026-03-13T10:05:00',
    analystSummary:
      'Se recomienda revision manual por inconsistencias menores entre actividad declarada y capacidad de pago.',
    generalStatus: 'Evaluable',
    riskScore: {
      score: 58,
      category: 'Requiere revision',
      explanation:
        'La trazabilidad es aceptable, pero existen desalineaciones que ameritan validacion complementaria.'
    },
    alerts: [
      {
        id: 'ALT-2712-1',
        type: 'Fiscal',
        severity: 'warning',
        title: 'Inconsistencia leve de facturacion',
        shortDescription: 'La actividad declarada no explica del todo el perfil de consumo.',
        detail:
          'Se observan diferencias moderadas entre ingresos informados, consumo financiero y comportamiento histórico.',
        source: 'Perfil fiscal consolidado',
        relatedVariable: 'income_consistency',
        recommendation: 'Solicitar documentacion de respaldo adicional.'
      },
      {
        id: 'ALT-2712-2',
        type: 'Financiera',
        severity: 'info',
        title: 'Variabilidad de ingresos',
        shortDescription: 'Cambios mensuales superiores al promedio.',
        detail:
          'La dispersion de ingresos no invalida el caso, pero reduce confianza automatica en la decision.',
        source: 'Motor IA',
        relatedVariable: 'income_volatility'
      }
    ],
    aiExplanation: {
      totalScore: 58,
      textualClassification: 'Requiere revision',
      executiveSummary:
        'El modelo ubica el caso en revision por señales moderadas de inconsistencia fiscal y volatilidad financiera.',
      variables: [
        {
          id: 'VAR-2712-1',
          name: 'Consistencia ingreso-facturacion',
          impact: 'Negativo',
          weight: 26,
          description: 'Existen desalineaciones entre lo declarado y la evidencia financiera.'
        },
        {
          id: 'VAR-2712-2',
          name: 'Volatilidad mensual',
          impact: 'Negativo',
          weight: 18,
          description: 'La variacion mensual eleva la incertidumbre del caso.'
        },
        {
          id: 'VAR-2712-3',
          name: 'Identidad y contacto',
          impact: 'Positivo',
          weight: 12,
          description: 'La identidad fue validada y el contacto es consistente.'
        }
      ],
      evaluatorRecommendation:
        'Solicitar soportes fiscales y confirmar razonabilidad economica antes de cerrar la decision.'
    },
    personalInfo: {
      fullName: 'Sandra Luciana Perez',
      document: '27123456789',
      documentType: 'CUIL',
      birthDate: '1988-02-20',
      age: 38,
      verified: true,
      deceased: false,
      address: 'Mitre 1240',
      locality: 'Rosario',
      province: 'Santa Fe',
      phone: '+54 341 5521987',
      email: 'slperez@testmail.local'
    },
    financialInfo: {
      creditScore: 644,
      debtRatio: 43,
      bancarizationLevel: 'Media',
      activeLoans: 2,
      bouncedChecks: 1,
      monthlyIncomeEstimate: '$1.800.000 - $2.400.000',
      observation: 'Existe variabilidad en niveles de ingreso y financiamiento.'
    },
    laborFiscalInfo: {
      taxStatus: 'Monotributo categoria H',
      mainActivity: 'Comercio minorista',
      employerOrCompany: 'Actividad independiente',
      incomeBracket: '$1.800.000 - $2.400.000',
      fiscalObservation: 'Inconsistencia leve entre facturacion declarada y consumo financiero.'
    },
    claimsHistory: [
      {
        id: 'SIN-1301',
        date: '2025-10-12',
        type: 'Hogar',
        amount: 1250000,
        status: 'Observado',
        counterpart: 'Proveedor no habitual',
        notes: 'Requiere validacion adicional del presupuesto presentado.'
      }
    ]
  },
  '27222333444': {
    caseId: '27222333444',
    requestedAt: '2026-03-13T10:18:00',
    analystSummary:
      'La verificacion de padron marca persona fallecida. El caso debe escalarse para bloqueo operativo.',
    generalStatus: 'Fallecido',
    riskScore: {
      score: 96,
      category: 'Sospechoso de fraude',
      explanation:
        'La existencia de una persona fallecida asociada al reclamo constituye una alerta critica inmediata.'
    },
    alerts: [
      {
        id: 'ALT-2722-1',
        type: 'RENAPER',
        severity: 'error',
        title: 'Persona fallecida en RENAPER',
        shortDescription: 'Alerta critica de identidad.',
        detail:
          'La identidad consultada aparece con estado fallecido en la fuente prioritaria de validacion.',
        source: 'RENAPER mock',
        relatedVariable: 'renaper_deceased_flag',
        recommendation: 'Bloquear gestion automatica y escalar de inmediato a supervisor antifraude.'
      },
      {
        id: 'ALT-2722-2',
        type: 'Integridad',
        severity: 'error',
        title: 'Reclamo incompatible con estado de identidad',
        shortDescription: 'Existe actividad posterior al fallecimiento informado.',
        detail:
          'Se detecta apertura de expediente posterior a la fecha informada en la fuente de identidad.',
        source: 'Motor antifraude ERS',
        relatedVariable: 'post_mortem_activity'
      }
    ],
    aiExplanation: {
      totalScore: 96,
      textualClassification: 'Sospechoso de fraude',
      executiveSummary:
        'La señal dominante del modelo es critica: identidad en estado fallecido combinada con actividad reciente del expediente.',
      variables: [
        {
          id: 'VAR-2722-1',
          name: 'Estado fallecido RENAPER',
          impact: 'Negativo',
          weight: 61,
          description: 'Es la variable de mayor impacto por su severidad operativa.'
        },
        {
          id: 'VAR-2722-2',
          name: 'Actividad posterior',
          impact: 'Negativo',
          weight: 23,
          description: 'La existencia de movimientos posteriores incrementa la sospecha de maniobra.'
        },
        {
          id: 'VAR-2722-3',
          name: 'Ausencia de actividad economica vigente',
          impact: 'Negativo',
          weight: 9,
          description: 'No existe soporte laboral o fiscal que legitime el reclamo.'
        }
      ],
      evaluatorRecommendation:
        'Tratar el expediente como critico. Congelar el flujo y activar protocolo antifraude con trazabilidad reforzada.'
    },
    personalInfo: {
      fullName: 'Ruben Osvaldo Molina',
      document: '27222333444',
      documentType: 'CUIL',
      birthDate: '1959-11-08',
      age: 66,
      verified: true,
      deceased: true,
      address: 'Belgrano 215',
      locality: 'Lanus',
      province: 'Buenos Aires',
      phone: '+54 11 43001122',
      email: 'rmolina@legacy.test'
    },
    financialInfo: {
      creditScore: 402,
      debtRatio: 72,
      bancarizationLevel: 'Baja',
      activeLoans: 0,
      bouncedChecks: 0,
      monthlyIncomeEstimate: 'Sin actividad reciente',
      observation: 'No hay actividad financiera compatible con un reclamo vigente.'
    },
    laborFiscalInfo: {
      taxStatus: 'Sin actividad vigente',
      mainActivity: 'Sin registros activos',
      employerOrCompany: 'N/A',
      incomeBracket: 'Sin datos',
      fiscalObservation: 'No se registran aportes ni actividad fiscal recientes.'
    },
    claimsHistory: [
      {
        id: 'SIN-1402',
        date: '2026-02-01',
        type: 'Vida',
        amount: 9200000,
        status: 'Observado',
        counterpart: 'Tercero solicitante',
        notes: 'El reclamo fue iniciado con identidad en estado fallecido.'
      }
    ]
  },
  '27999888776': {
    caseId: '27999888776',
    requestedAt: '2026-03-13T10:27:00',
    analystSummary:
      'No se pudo consolidar informacion minima suficiente para una evaluacion antifraude confiable.',
    generalStatus: 'No evaluable',
    riskScore: {
      score: 0,
      category: 'Requiere revision',
      explanation:
        'La informacion disponible es insuficiente; se requiere completar fuentes antes de tomar una decision.'
    },
    alerts: [
      {
        id: 'ALT-2799-1',
        type: 'Integridad',
        severity: 'info',
        title: 'Informacion insuficiente',
        shortDescription: 'No hay datos minimos para una evaluacion robusta.',
        detail:
          'Las fuentes financieras, laborales y de identidad no devuelven un set minimo de datos confiables.',
        source: 'Orquestador de fuentes mock',
        relatedVariable: 'minimum_data_availability',
        recommendation: 'Completar fuentes antes de emitir una decision.'
      },
      {
        id: 'ALT-2799-2',
        type: 'Fiscal',
        severity: 'warning',
        title: 'Sin actividad validable',
        shortDescription: 'No se verifican datos laborales o fiscales vigentes.',
        detail:
          'La ausencia de informacion no implica fraude, pero impide clasificar el caso automaticamente.',
        source: 'Perfil fiscal consolidado',
        relatedVariable: 'fiscal_data_coverage'
      }
    ],
    aiExplanation: {
      totalScore: 0,
      textualClassification: 'Requiere revision',
      executiveSummary:
        'El modelo no emite una conclusion confiable porque faltan variables esenciales para construir el score.',
      variables: [
        {
          id: 'VAR-2799-1',
          name: 'Cobertura de datos',
          impact: 'Neutro',
          weight: 0,
          description: 'La ausencia de insumos obliga a suspender la clasificacion automatica.'
        },
        {
          id: 'VAR-2799-2',
          name: 'Verificacion de identidad',
          impact: 'Negativo',
          weight: 0,
          description: 'No existe evidencia suficiente para validar la identidad completa del caso.'
        }
      ],
      evaluatorRecommendation:
        'No tomar decision final. Priorizar recupero de informacion y relanzar la evaluacion cuando haya datos suficientes.'
    },
    personalInfo: {
      fullName: 'Caso con datos parciales',
      document: '27999888776',
      documentType: 'CUIL',
      birthDate: 'N/D',
      age: 0,
      verified: false,
      deceased: false,
      address: 'N/D',
      locality: 'N/D',
      province: 'N/D',
      phone: 'N/D',
      email: 'N/D'
    },
    financialInfo: {
      creditScore: 0,
      debtRatio: 0,
      bancarizationLevel: 'Baja',
      activeLoans: 0,
      bouncedChecks: 0,
      monthlyIncomeEstimate: 'Sin datos',
      observation: 'No existen suficientes datos financieros para concluir.'
    },
    laborFiscalInfo: {
      taxStatus: 'Sin datos',
      mainActivity: 'Sin datos',
      employerOrCompany: 'Sin datos',
      incomeBracket: 'Sin datos',
      fiscalObservation: 'La actividad laboral y fiscal no pudo verificarse.'
    },
    claimsHistory: []
  }
};
