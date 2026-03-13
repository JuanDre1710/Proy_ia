import { Card, CardContent, CardHeader } from '@mui/material';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SectionCard({ title, subtitle, children }: SectionCardProps): JSX.Element {
  return (
    <Card>
      {title ? <CardHeader title={title} subheader={subtitle} /> : null}
      <CardContent>{children}</CardContent>
    </Card>
  );
}
