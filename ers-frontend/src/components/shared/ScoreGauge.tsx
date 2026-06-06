import { Box, LinearProgress, Stack, Typography } from '@mui/material';
import { RiskScoreExplanation } from '../../models/domain';

export function ScoreGauge({ score }: { score: RiskScoreExplanation }): JSX.Element {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{
            width: 88,
            height: 88,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 4,
            color: 'white',
            background: 'linear-gradient(135deg, #0d3b66, #0c7b93)',
            fontSize: 32,
            fontWeight: 700
          }}
        >
          {score.score}
        </Box>
        <Box>
          <Typography variant="h6">{score.level}</Typography>
          <Typography color="text.secondary">{score.summary}</Typography>
        </Box>
      </Stack>
      <LinearProgress variant="determinate" value={score.score} sx={{ height: 10, borderRadius: 999 }} />
      <Stack spacing={1}>
        {score.drivers.map((driver) => (
          <Stack key={driver.label} direction="row" justifyContent="space-between" gap={2}>
            <Typography>{driver.label}</Typography>
            <Typography fontWeight={700}>{driver.weight}%</Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
