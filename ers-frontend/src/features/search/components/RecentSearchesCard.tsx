import {
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography
} from '@mui/material';
import NorthEastRoundedIcon from '@mui/icons-material/NorthEastRounded';
import { RecentSearch } from '../../../models/search';

interface RecentSearchesCardProps {
  searches: RecentSearch[];
  onOpen: (search: RecentSearch) => void;
}

export function RecentSearchesCard({ searches, onOpen }: RecentSearchesCardProps): JSX.Element {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <BoxHeader
            title="Consultas recientes"
            subtitle="Ultimos identificadores consultados por el usuario actual."
          />
          {searches.length === 0 ? (
            <Typography color="text.secondary">
              Aun no hay consultas recientes registradas para este usuario.
            </Typography>
          ) : (
            searches.map((search, index) => (
              <Stack key={search.id} spacing={1.25}>
                <Stack direction="row" justifyContent="space-between" gap={1} alignItems="center">
                  <Stack spacing={0.25}>
                    <Typography fontWeight={700}>{search.identifier}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {search.identifierType} • {search.searchedAt.replace('T', ' ').slice(0, 16)}
                    </Typography>
                  </Stack>
                  <Chip
                    label={search.outcome}
                    color={search.outcome === 'found' ? 'success' : search.outcome === 'not_found' ? 'default' : 'warning'}
                    size="small"
                  />
                </Stack>
                <Typography color="text.secondary">{search.summary}</Typography>
                <Button
                  size="small"
                  variant="text"
                  onClick={() => onOpen(search)}
                  endIcon={<NorthEastRoundedIcon />}
                  sx={{ alignSelf: 'flex-start', px: 0 }}
                >
                  {search.outcome === 'found' ? 'Abrir dashboard' : 'Ver resultado'}
                </Button>
                {index < searches.length - 1 ? <Divider /> : null}
              </Stack>
            ))
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function BoxHeader({ title, subtitle }: { title: string; subtitle: string }): JSX.Element {
  return (
    <Stack spacing={0.5}>
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary">{subtitle}</Typography>
    </Stack>
  );
}
