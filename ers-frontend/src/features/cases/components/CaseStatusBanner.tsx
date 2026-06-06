import { Alert, Stack, Typography } from '@mui/material';
import { CaseEvaluation } from '../../../models/cases';
import { RiskScoreBadge } from './RiskScoreBadge';

function severityForStatus(status: CaseEvaluation['generalStatus']): 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case 'Evaluable':
      return 'success';
    case 'No evaluable':
      return 'info';
    case 'Fallecido':
    case 'En revision prioritaria':
      return 'error';
    default:
      return 'warning';
  }
}

export function CaseStatusBanner({ caseData }: { caseData: CaseEvaluation }): JSX.Element {
  return (
    <Alert severity={severityForStatus(caseData.generalStatus)} sx={{ borderRadius: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
        <Typography fontWeight={700}>Estado general: {caseData.generalStatus}</Typography>
        <RiskScoreBadge category={caseData.riskScore.category} />
        <Typography>{caseData.analystSummary}</Typography>
      </Stack>
    </Alert>
  );
}
