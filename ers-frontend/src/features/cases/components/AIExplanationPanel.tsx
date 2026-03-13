import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { AIExplanation } from '../../../models/cases';
import { ExplanationVariableList } from './ExplanationVariableList';
import { RiskScoreBadge } from './RiskScoreBadge';

export function AIExplanationPanel({
  explanation
}: {
  explanation: AIExplanation;
}): JSX.Element {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Explicabilidad del score IA</Typography>
            <Typography color="text.secondary">
              Resumen ejecutivo de la decision del modelo y variables mas influyentes.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
            <Typography variant="h4">{explanation.totalScore}</Typography>
            <RiskScoreBadge category={explanation.textualClassification} />
          </Stack>

          <Typography color="text.secondary">{explanation.executiveSummary}</Typography>

          <ExplanationVariableList variables={explanation.variables} />

          <Alert severity="info">
            Recomendacion sugerida para el evaluador: {explanation.evaluatorRecommendation}
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}
