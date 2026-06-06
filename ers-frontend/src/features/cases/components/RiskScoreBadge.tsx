import { Chip } from '@mui/material';
import { RiskCategory } from '../../../models/cases';

export function RiskScoreBadge({ category }: { category: RiskCategory }): JSX.Element {
  const color =
    category === 'Normal' ? 'success' : category === 'Requiere revision' ? 'warning' : 'error';

  return <Chip label={category} color={color} />;
}
