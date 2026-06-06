import { Alert, Card, CardContent, Chip, Divider, List, ListItem, Stack, Typography } from '@mui/material';
import { AIExplanation } from '../../../models/cases';
import { ExplanationVariableList } from './ExplanationVariableList';
import { RiskScoreBadge } from './RiskScoreBadge';

export function AIExplanationPanel({
  explanation
}: {
  explanation: AIExplanation;
}): JSX.Element {
  const evidenceForReview = explanation.evidenceForReview ?? [];
  const evidenceAgainstFraud = explanation.evidenceAgainstFraud ?? [];
  const inconsistencies = explanation.inconsistencies ?? [];
  const missingEvidence = explanation.missingEvidence ?? [];
  const suggestedNextChecks = explanation.suggestedNextChecks ?? [];
  const suggestedPriority = explanation.suggestedPriority ?? 'MEDIUM';
  const suggestedPriorityLabel =
    suggestedPriority === 'HIGH' ? 'Alta' : suggestedPriority === 'LOW' ? 'Baja' : 'Media';

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="h6">Analisis contextual del caso</Typography>
            <Typography color="text.secondary">
              Resumen razonado sobre evidencia normalizada, alertas y faltantes del expediente.
            </Typography>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} justifyContent="space-between">
            <Typography variant="h4">{suggestedPriorityLabel}</Typography>
            <RiskScoreBadge category={explanation.textualClassification} />
          </Stack>

          <Typography color="text.secondary">{explanation.executiveSummary}</Typography>

          {explanation.variables.length > 0 ? <ExplanationVariableList variables={explanation.variables} /> : null}

          <Divider />

          <SectionList
            title="Evidencias para revisar"
            emptyMessage="No se detectaron evidencias fuertes para revision adicional."
            items={evidenceForReview}
          />
          <SectionList
            title="Evidencias en contra de fraude"
            emptyMessage="No hay elementos atenuantes destacados."
            items={evidenceAgainstFraud}
          />
          <SectionList
            title="Inconsistencias"
            emptyMessage="No se detectaron inconsistencias relevantes."
            items={inconsistencies}
          />
          <SectionList
            title="Faltantes"
            emptyMessage="No hay faltantes de evidencia relevantes."
            items={missingEvidence}
          />

          {suggestedNextChecks.length > 0 ? (
            <Stack direction="row" gap={1} flexWrap="wrap">
              {suggestedNextChecks.map((item) => (
                <Chip key={item} label={item} variant="outlined" />
              ))}
            </Stack>
          ) : null}

          <Alert severity="info">
            Recomendacion sugerida para el evaluador: {explanation.evaluatorRecommendation}
          </Alert>
        </Stack>
      </CardContent>
    </Card>
  );
}

function SectionList({
  title,
  items,
  emptyMessage
}: {
  title: string;
  items: string[];
  emptyMessage: string;
}): JSX.Element {
  return (
    <Stack spacing={0.75}>
      <Typography variant="subtitle2">{title}</Typography>
      {items.length === 0 ? (
        <Typography color="text.secondary">{emptyMessage}</Typography>
      ) : (
        <List dense disablePadding>
          {items.map((item) => (
            <ListItem key={item} disablePadding sx={{ py: 0.25 }}>
              <Typography color="text.secondary">{item}</Typography>
            </ListItem>
          ))}
        </List>
      )}
    </Stack>
  );
}
