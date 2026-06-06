import { Chip, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { ActiveRule } from '../../../models/admin';
import { SectionCard } from '../../../components/shared/SectionCard';

interface RulesSummaryCardProps {
  rules: ActiveRule[];
}

export function RulesSummaryCard({ rules }: RulesSummaryCardProps): JSX.Element {
  return (
    <SectionCard
      title="Resumen de reglas activas"
      subtitle={`${rules.filter((rule) => rule.status === 'Activa').length} activas y ${rules.filter((rule) => rule.status === 'Monitoreada').length} monitoreadas`}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Regla</TableCell>
            <TableCell>Categoria</TableCell>
            <TableCell>Severidad</TableCell>
            <TableCell>Estado</TableCell>
            <TableCell>Descripcion</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id} hover>
              <TableCell>
                <Stack spacing={0.5}>
                  <Typography fontWeight={700}>{rule.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {rule.id} · {new Date(rule.lastUpdatedAt).toLocaleString()}
                  </Typography>
                  {rule.source ? (
                    <Typography variant="caption" color="text.secondary">
                      Fuente: {rule.source}
                    </Typography>
                  ) : null}
                </Stack>
              </TableCell>
              <TableCell>{rule.category}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={rule.severity}
                  color={rule.severity === 'Alta' ? 'error' : rule.severity === 'Media' ? 'warning' : 'success'}
                />
              </TableCell>
              <TableCell>
                <Chip size="small" variant="outlined" label={rule.status} color={rule.status === 'Activa' ? 'primary' : 'default'} />
              </TableCell>
              <TableCell>{rule.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  );
}
