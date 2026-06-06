import { Chip, Stack } from '@mui/material';
import { RiskAlert } from '../../models/domain';

export function AlertChips({ alerts }: { alerts: RiskAlert[] }): JSX.Element {
  return (
    <Stack direction="row" gap={1} flexWrap="wrap">
      {alerts.map((alert) => (
        <Chip
          key={alert.id}
          label={alert.title}
          sx={{
            bgcolor:
              alert.level === 'high'
                ? 'error.main'
                : alert.level === 'medium'
                  ? 'warning.main'
                  : 'success.main',
            color: 'white'
          }}
        />
      ))}
    </Stack>
  );
}
