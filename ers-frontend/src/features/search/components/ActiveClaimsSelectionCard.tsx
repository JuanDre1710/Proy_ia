import { Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { ActiveClaimSummary, SearchPerson } from '../../../models/search';

interface ActiveClaimsSelectionCardProps {
  person?: SearchPerson | null;
  claims: ActiveClaimSummary[];
  onSelect: (claimId: string) => Promise<void>;
  isLoading: boolean;
}

export function ActiveClaimsSelectionCard({
  person,
  claims,
  onSelect,
  isLoading
}: ActiveClaimsSelectionCardProps): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <div>
            <Typography variant="h6">Seleccion de siniestro</Typography>
            <Typography color="text.secondary">
              {person
                ? `${person.displayName} tiene ${claims.length} siniestros activos. Selecciona uno para armar el caso.`
                : 'La identidad consultada tiene multiples siniestros activos.'}
            </Typography>
          </div>

          {claims.map((claim) => (
            <Stack
              key={claim.claimId}
              direction={{ xs: 'column', md: 'row' }}
              justifyContent="space-between"
              alignItems={{ xs: 'flex-start', md: 'center' }}
              spacing={2}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2 }}
            >
              <Stack spacing={1}>
                <Typography variant="subtitle1">{claim.claimNumber}</Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip label={claim.statusLabel} color="warning" size="small" />
                  <Chip label={claim.policyNumber ?? 'Poliza N/D'} size="small" variant="outlined" />
                  <Chip label={claim.certificateNumber ?? 'Certificado N/D'} size="small" variant="outlined" />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  Fecha: {claim.occurredAt?.slice(0, 10) ?? 'N/D'} | Tipo: {claim.claimTypeId ?? 'N/D'} | Reclamo: $
                  {(claim.claimedAmount ?? 0).toLocaleString('es-AR')}
                </Typography>
              </Stack>

              <Button
                variant="contained"
                disabled={isLoading}
                onClick={() => {
                  void onSelect(claim.claimId);
                }}
              >
                Analizar este siniestro
              </Button>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

