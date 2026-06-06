import { Card, CardContent, Stack, Typography } from '@mui/material';

interface KpiCardProps {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}

export function KpiCard({ label, value, detail, icon }: KpiCardProps): JSX.Element {
  return (
    <Card sx={{ background: 'linear-gradient(180deg, #fff 0%, #f5f9fc 100%)' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" color="text.secondary">
          <Typography variant="body2">{label}</Typography>
          {icon}
        </Stack>
        <Typography variant="h4" sx={{ mt: 1.5, mb: 0.5 }}>
          {value}
        </Typography>
        <Typography color="text.secondary">{detail}</Typography>
      </CardContent>
    </Card>
  );
}
