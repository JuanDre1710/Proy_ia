import { Card, CardContent, LinearProgress, Stack, Typography } from '@mui/material';
import { CaseEvaluation } from '../../../models/cases';
import { RiskScoreBadge } from './RiskScoreBadge';

export function RiskScoreCard({ caseData }: { caseData: CaseEvaluation }): JSX.Element {
  const { score, category, explanation } = caseData.riskScore;
  const color = category === 'Normal' ? 'success' : category === 'Requiere revision' ? 'warning' : 'error';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Score de fraude</Typography>
            <RiskScoreBadge category={category} />
          </Stack>
          <Typography variant="h3">{score}</Typography>
          <LinearProgress value={Math.min(score, 100)} variant="determinate" color={color} sx={{ height: 10, borderRadius: 999 }} />
          <Typography color="text.secondary">{explanation}</Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
