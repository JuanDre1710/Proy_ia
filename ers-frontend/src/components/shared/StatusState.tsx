import { CircularProgress, Stack, Typography } from '@mui/material';
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded';
import SearchOffRoundedIcon from '@mui/icons-material/SearchOffRounded';
import ShieldRoundedIcon from '@mui/icons-material/ShieldRounded';
import { UiStatus } from '../../models/domain';
import { SectionCard } from './SectionCard';

interface StatusStateProps {
  status: UiStatus;
  message?: string;
}

export function StatusState({ status, message }: StatusStateProps): JSX.Element {
  const content =
    status === 'loading'
      ? {
          icon: <CircularProgress size={42} />,
          title: 'Cargando analisis',
          description: message || 'Consolidando senales de riesgo y antecedentes.'
        }
      : status === 'empty'
        ? {
            icon: <SearchOffRoundedIcon color="primary" sx={{ fontSize: 42 }} />,
            title: 'Sin resultados',
            description: message || 'No se encontro informacion para el identificador consultado.'
          }
        : status === 'error'
          ? {
              icon: <ErrorRoundedIcon color="primary" sx={{ fontSize: 42 }} />,
              title: 'Error de consulta',
              description: message || 'No se pudo completar la evaluacion.'
            }
          : {
              icon: <ShieldRoundedIcon color="primary" sx={{ fontSize: 42 }} />,
              title: 'Esperando una consulta',
              description: message || 'Busca un DNI, CUIL o CUIT para visualizar el panel antifraude.'
            };

  return (
    <SectionCard title="">
      <Stack alignItems="center" justifyContent="center" textAlign="center" spacing={1.25} sx={{ minHeight: 220 }}>
        {content.icon}
        <Typography variant="h6">{content.title}</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 480 }}>
          {content.description}
        </Typography>
      </Stack>
    </SectionCard>
  );
}
