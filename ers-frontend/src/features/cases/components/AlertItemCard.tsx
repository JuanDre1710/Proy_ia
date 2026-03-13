import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Chip,
  Stack,
  Typography
} from '@mui/material';
import ExpandMoreRoundedIcon from '@mui/icons-material/ExpandMoreRounded';
import { FraudAlert } from '../../../models/cases';

export function AlertItemCard({ alert }: { alert: FraudAlert }): JSX.Element {
  return (
    <Accordion disableGutters sx={{ borderRadius: 3, overflow: 'hidden', '&:before': { display: 'none' } }}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
        <Stack spacing={1} width="100%">
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1} justifyContent="space-between">
            <Stack spacing={0.5}>
              <Typography fontWeight={700}>{alert.title}</Typography>
              <Typography color="text.secondary">{alert.shortDescription}</Typography>
            </Stack>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Chip label={alert.type} size="small" variant="outlined" />
              <Chip label={alert.severity} size="small" color={alert.severity} />
            </Stack>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1.5}>
          <Alert severity={alert.severity}>{alert.detail}</Alert>
          <Typography variant="body2" color="text.secondary">
            Fuente: <strong>{alert.source}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Variable relacionada: <strong>{alert.relatedVariable}</strong>
          </Typography>
          {alert.recommendation ? (
            <Typography variant="body2" color="text.secondary">
              Recomendacion: <strong>{alert.recommendation}</strong>
            </Typography>
          ) : null}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
