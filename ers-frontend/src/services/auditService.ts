import { mockAuditLogs } from '../mocks/auditMock';
import { AuditLogEntry, AuditLogPage, AuditLogQuery } from '../models/audit';
import { authService } from './authService';

function compareValues(left: string, right: string, direction: 'asc' | 'desc'): number {
  const result = left.localeCompare(right, 'es', { numeric: true, sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

let auditState: AuditLogEntry[] = [...mockAuditLogs];
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000').replace(/\/$/, '');

export const auditService = {
  async getLogs(query: AuditLogQuery): Promise<AuditLogPage> {
    try {
      const params = new URLSearchParams({
        usuario: query.usuario,
        rol: query.rol,
        fechaDesde: query.fechaDesde,
        fechaHasta: query.fechaHasta,
        accion: query.accion,
        resultado: query.resultado,
        page: String(query.page),
        pageSize: String(query.pageSize),
        sortBy: query.sortBy,
        sortDirection: query.sortDirection
      });
      const response = await fetch(`${apiBaseUrl}/audit/logs?${params.toString()}`, {
        headers: authService.getActorHeaders()
      });
      if (response.ok) {
        return response.json() as Promise<AuditLogPage>;
      }
      if (response.status === 403) {
        throw new Error('No tenes permisos para consultar auditoria.');
      }
    } catch (_error) {
      // keep fallback below during migration
    }

    await new Promise((resolve) => setTimeout(resolve, 450));

    let rows = [...auditState];

    if (query.fechaDesde && query.fechaHasta && query.fechaDesde > query.fechaHasta) {
      throw new Error('El rango de fechas es invalido.');
    }

    if (query.usuario.trim()) {
      const search = query.usuario.trim().toLowerCase();
      rows = rows.filter((row) => row.usuario.toLowerCase().includes(search));
    }

    if (query.rol) {
      rows = rows.filter((row) => row.rol === query.rol);
    }

    if (query.accion) {
      rows = rows.filter((row) => row.accion === query.accion);
    }

    if (query.resultado) {
      rows = rows.filter((row) => row.resultado === query.resultado);
    }

    if (query.fechaDesde) {
      rows = rows.filter((row) => row.fechaHora.slice(0, 10) >= query.fechaDesde);
    }

    if (query.fechaHasta) {
      rows = rows.filter((row) => row.fechaHora.slice(0, 10) <= query.fechaHasta);
    }

    rows.sort((left, right) => {
      const leftValue = String(left[query.sortBy] ?? '');
      const rightValue = String(right[query.sortBy] ?? '');
      return compareValues(leftValue, rightValue, query.sortDirection);
    });

    const start = query.page * query.pageSize;
    const pagedRows = rows.slice(start, start + query.pageSize);

    return {
      rows: pagedRows,
      total: rows.length
    };
  },
  async recordAdminChange(event: { action: string; entityType: string; entityId: string; detail: string; metadata?: Record<string, unknown> }): Promise<void> {
    try {
      await fetch(`${apiBaseUrl}/audit/logs/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authService.getActorHeaders()
        },
        body: JSON.stringify({
          action: event.action,
          result: 'OK',
          entityType: event.entityType,
          entityId: event.entityId,
          detail: event.detail,
          metadata: event.metadata ?? {}
        })
      });
    } catch (_error) {
      // Keep admin UI usable if backend audit endpoint is unavailable.
    }
  },
  exportCsv(rows: AuditLogEntry[]): void {
    const csvRows = [
      ['fechaHora', 'usuario', 'rol', 'accion', 'identificadorConsultado', 'resultado', 'ip', 'detalle'],
      ...rows.map((row) => [
        row.fechaHora,
        row.usuario,
        row.rol,
        row.accion,
        row.identificadorConsultado,
        row.resultado,
        row.ip,
        row.detalle
      ])
    ];

    download(
      csvRows
        .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
        .join('\n'),
      `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`,
      'text/csv;charset=utf-8'
    );
  }
};
