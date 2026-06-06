import { Grid, Stack, Typography } from '@mui/material';
import { CaseOperationalInfo } from '../../../models/cases';
import { SectionCard } from '../../../components/shared/SectionCard';

export function PolicyClaimInfoCard({ operationalInfo }: { operationalInfo: CaseOperationalInfo }): JSX.Element {
  const items: Array<[string, string]> = [
    ['Poliza', operationalInfo.policyNumber],
    ['Certificado', operationalInfo.certificateNumber],
    ['Propuesta', operationalInfo.proposalNumber],
    ['Estado poliza', operationalInfo.policyStatus],
    ['Estado vinculo', operationalInfo.linkStatus],
    ['Nro siniestro', operationalInfo.claimNumber],
    ['Fecha siniestro', operationalInfo.claimDate],
    ['Tipo siniestro', operationalInfo.claimType],
    ['Estado siniestro', operationalInfo.claimStatus],
    ['Monto reclamo', operationalInfo.claimedAmount],
    ['Monto pagado', operationalInfo.paidAmount],
    ['Domicilio ocurrencia', operationalInfo.occurrenceAddress]
  ];

  return (
    <SectionCard title="Poliza y siniestro" subtitle="Referencia operativa del caso monitoreado">
      <Grid container spacing={1.5}>
        {items.map(([label, value]) => (
          <Grid key={label} item xs={12} md={6}>
            <Stack sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(227,237,247,0.7)' }}>
              <Typography fontWeight={700}>{label}</Typography>
              <Typography color="text.secondary">{value}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  );
}
