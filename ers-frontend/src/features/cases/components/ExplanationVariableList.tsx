import { Chip, Stack, Typography } from '@mui/material';
import { ExplanationVariable } from '../../../models/cases';

export function ExplanationVariableList({
  variables
}: {
  variables: ExplanationVariable[];
}): JSX.Element {
  return (
    <Stack spacing={1.5}>
      {variables.map((variable) => (
        <Stack
          key={variable.id}
          spacing={1}
          sx={{ p: 1.75, borderRadius: 3, bgcolor: 'rgba(227,237,247,0.7)' }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
            <Typography fontWeight={700}>{variable.name}</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Chip label={variable.impact} size="small" color={variable.impact === 'Positivo' ? 'success' : variable.impact === 'Negativo' ? 'error' : 'default'} />
              <Chip label={`${variable.weight}%`} size="small" variant="outlined" />
            </Stack>
          </Stack>
          <Typography color="text.secondary">{variable.description}</Typography>
        </Stack>
      ))}
    </Stack>
  );
}
