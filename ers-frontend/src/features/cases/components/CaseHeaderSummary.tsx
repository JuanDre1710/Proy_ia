import { Avatar, Card, CardContent, Chip, Grid, Stack, Typography } from '@mui/material';
import FolderSharedRoundedIcon from '@mui/icons-material/FolderSharedRounded';
import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { CaseEvaluation } from '../../../models/cases';

function getOperationalStatus(caseData: CaseEvaluation): string {
  return caseData.resolution?.status ?? 'Pendiente';
}

export function CaseHeaderSummary({ caseData }: { caseData: CaseEvaluation }): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={7}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <FolderSharedRoundedIcon />
              </Avatar>
              <Stack spacing={0.5}>
                <Typography variant="h5">{caseData.personalInfo.fullName}</Typography>
                <Typography color="text.secondary">
                  Caso #{caseData.caseId} • {caseData.personalInfo.documentType} {caseData.personalInfo.document}
                </Typography>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Chip
                    icon={<VerifiedRoundedIcon />}
                    label={caseData.personalInfo.verified ? 'Identidad verificada' : 'Identidad no verificada'}
                    color={caseData.personalInfo.verified ? 'success' : 'warning'}
                    size="small"
                  />
                  <Chip label={`Solicitado: ${caseData.requestedAt.replace('T', ' ').slice(0, 16)}`} size="small" />
                </Stack>
              </Stack>
            </Stack>
          </Grid>
          <Grid item xs={12} md={5}>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <SummaryMetric label="Operacion" value={getOperationalStatus(caseData)} />
              </Grid>
              <Grid item xs={6}>
                <SummaryMetric label="Categoria" value={caseData.riskScore.category} />
              </Grid>
              <Grid item xs={6}>
                <SummaryMetric label="Estado" value={caseData.generalStatus} />
              </Grid>
              <Grid item xs={6}>
                <SummaryMetric label="Siniestros" value={`${caseData.claimsHistory.length}`} />
              </Grid>
              <Grid item xs={12}>
                <SummaryMetric label="Deuda" value={`${caseData.financialInfo.debtRatio}%`} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Stack sx={{ p: 1.5, borderRadius: 3, bgcolor: 'rgba(227,237,247,0.7)' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={700}>{value}</Typography>
    </Stack>
  );
}
