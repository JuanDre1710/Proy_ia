import { Chip, Stack } from '@mui/material';
import { ClaimRecord } from '../../../models/cases';
import { DataColumn, DataTable } from '../../../components/shared/DataTable';
import { SectionCard } from '../../../components/shared/SectionCard';

const columns: DataColumn[] = [
  { key: 'date', label: 'Fecha' },
  { key: 'type', label: 'Tipo' },
  { key: 'amount', label: 'Monto' },
  { key: 'status', label: 'Estado' },
  { key: 'counterpart', label: 'Contraparte' },
  { key: 'notes', label: 'Observaciones' }
];

export function ClaimsHistoryCard({ claimsHistory }: { claimsHistory: ClaimRecord[] }): JSX.Element {
  return (
    <SectionCard title="Historial de siniestros" subtitle="Eventos consolidados del caso">
      <Stack spacing={2}>
        <Chip
          label={
            claimsHistory.length === 0
              ? 'Sin historial consolidado'
              : `${claimsHistory.length} siniestro(s) registrados`
          }
          color={claimsHistory.length === 0 ? 'default' : 'primary'}
          sx={{ alignSelf: 'flex-start' }}
        />
        <DataTable
          columns={columns}
          rows={claimsHistory.map((claim) => ({
            date: claim.date,
            type: claim.type,
            amount: `$${claim.amount.toLocaleString('es-AR')}`,
            status: claim.status,
            counterpart: claim.counterpart,
            notes: claim.notes
          }))}
        />
      </Stack>
    </SectionCard>
  );
}
