import { useState } from 'react';
import {
  Card,
  CardContent,
  Collapse,
  IconButton,
  Stack,
  Typography
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import KeyboardArrowUpRoundedIcon from '@mui/icons-material/KeyboardArrowUpRounded';
import { RiskVariableImpact } from '../../../models/cases';
import { RiskLegend } from './RiskLegend';
import { RiskVariableRow } from './RiskVariableRow';

export function RiskHeatmapCard({
  variables
}: {
  variables: RiskVariableImpact[];
}): JSX.Element {
  const [expanded, setExpanded] = useState(true);

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={0.5}>
              <Typography variant="h6">Mapa de calor de riesgo</Typography>
              <Typography color="text.secondary">
                Impacto visual de las variables mas relevantes sobre el score del caso.
              </Typography>
            </Stack>
            <IconButton
              aria-label={expanded ? 'Colapsar mapa de calor' : 'Expandir mapa de calor'}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? <KeyboardArrowUpRoundedIcon /> : <ExpandMoreRoundedIcon />}
            </IconButton>
          </Stack>

          <RiskLegend />

          <Collapse in={expanded}>
            <Stack spacing={1.5}>
              {variables.map((variable) => (
                <RiskVariableRow key={variable.key} variable={variable} />
              ))}
            </Stack>
          </Collapse>
        </Stack>
      </CardContent>
    </Card>
  );
}
