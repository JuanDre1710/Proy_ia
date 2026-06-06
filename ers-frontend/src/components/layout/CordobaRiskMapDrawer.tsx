import { Fragment } from 'react';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded';
import {
  Box,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from '@mui/material';
import { CircleMarker, MapContainer, Polygon, Popup, TileLayer, Tooltip } from 'react-leaflet';
import { cordobaMapCenter, cordobaRiskZones, CordobaRiskZone, totalRiskIncidents } from './cordobaRiskData';

interface CordobaRiskMapDrawerProps {
  open: boolean;
  onClose: () => void;
}

const riskColors: Record<CordobaRiskZone['riskLevel'], string> = {
  moderado: '#f97316',
  alto: '#dc2626',
  critico: '#7f1d1d'
};

function getRiskLabel(level: CordobaRiskZone['riskLevel']): string {
  if (level === 'critico') {
    return 'Critico';
  }

  if (level === 'alto') {
    return 'Alto';
  }

  return 'Moderado';
}

export function CordobaRiskMapDrawer({ open, onClose }: CordobaRiskMapDrawerProps): JSX.Element {
  const topZones = [...cordobaRiskZones].sort((a, b) => b.incidents - a.incidents).slice(0, 3);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480, lg: 560 },
          maxWidth: '100%'
        }
      }}
    >
      <Box
        sx={{
          height: '100%',
          overflowY: 'auto',
          background:
            'radial-gradient(circle at top, rgba(220,38,38,0.08), transparent 28%), linear-gradient(180deg, #fff7f7 0%, #ffffff 58%)'
        }}
      >
        <Stack spacing={3} sx={{ p: { xs: 2.5, md: 3 } }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="overline" sx={{ letterSpacing: '0.14em', color: 'error.main', fontWeight: 700 }}>
                Cordoba Capital
              </Typography>
              <Typography variant="h5">Mapa de zonas de riesgo</Typography>
              <Typography color="text.secondary">
                Demo gratuita con OpenStreetMap para visualizar concentracion de siniestros.
              </Typography>
            </Box>
            <IconButton aria-label="Cerrar mapa de riesgo" onClick={onClose}>
              <CloseRoundedIcon />
            </IconButton>
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 4,
                bgcolor: 'rgba(153,27,27,0.08)',
                border: '1px solid rgba(153,27,27,0.12)'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Siniestros relevados
              </Typography>
              <Typography variant="h4">{totalRiskIncidents}</Typography>
              <Typography variant="body2" color="text.secondary">
                Datos mock sobre mapa real para demo funcional.
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                p: 2,
                borderRadius: 4,
                bgcolor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.12)'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Zonas criticas
              </Typography>
              <Typography variant="h4">{cordobaRiskZones.filter((zone) => zone.riskLevel === 'critico').length}</Typography>
              <Typography variant="body2" color="text.secondary">
                Sectores con mayor prioridad de monitoreo.
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={{
              p: 1.25,
              borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(16,36,58,0.08)',
              boxShadow: '0 20px 40px rgba(16,36,58,0.08)'
            }}
          >
            <Box
              sx={{
                height: 380,
                overflow: 'hidden',
                borderRadius: 4,
                '& .leaflet-container': {
                  height: '100%',
                  width: '100%',
                  fontFamily: '"Segoe UI Variable", "Bahnschrift", "IBM Plex Sans", sans-serif'
                }
              }}
            >
              <MapContainer center={cordobaMapCenter} zoom={12} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {cordobaRiskZones.map((zone) => (
                  <Fragment key={zone.id}>
                    <Polygon
                      positions={zone.polygon}
                      pathOptions={{
                        color: riskColors[zone.riskLevel],
                        fillColor: riskColors[zone.riskLevel],
                        fillOpacity: 0.28,
                        weight: 3
                      }}
                    >
                      <Tooltip sticky>
                        <strong>{zone.name}</strong>
                        <br />
                        Riesgo {getRiskLabel(zone.riskLevel).toLowerCase()}
                      </Tooltip>
                    </Polygon>
                    <CircleMarker
                      center={zone.center}
                      radius={Math.max(10, Math.round(zone.incidents / 3))}
                      pathOptions={{
                        color: '#ffffff',
                        weight: 2,
                        fillColor: riskColors[zone.riskLevel],
                        fillOpacity: 0.9
                      }}
                    >
                      <Popup>
                        <Typography fontWeight={700}>{zone.name}</Typography>
                        <Typography variant="body2">Riesgo: {getRiskLabel(zone.riskLevel)}</Typography>
                        <Typography variant="body2">Siniestros: {zone.incidents}</Typography>
                        <Typography variant="body2">{zone.trend}</Typography>
                      </Popup>
                    </CircleMarker>
                  </Fragment>
                ))}
              </MapContainer>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.25} sx={{ mt: 2, px: 1, pb: 0.5 }}>
              {(['moderado', 'alto', 'critico'] as const).map((level) => (
                <Stack key={level} direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 14, height: 14, borderRadius: 99, bgcolor: riskColors[level] }} />
                  <Typography variant="body2" color="text.secondary">
                    {getRiskLabel(level)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Zonas priorizadas
            </Typography>
            <List sx={{ p: 0 }}>
              {topZones.map((zone) => (
                <ListItem
                  key={zone.id}
                  disableGutters
                  sx={{
                    py: 1.25,
                    px: 0,
                    alignItems: 'flex-start'
                  }}
                  secondaryAction={
                    <Chip
                      icon={<WarningAmberRoundedIcon />}
                      label={`${zone.incidents} siniestros`}
                      sx={{
                        bgcolor: `${riskColors[zone.riskLevel]}20`,
                        color: riskColors[zone.riskLevel],
                        fontWeight: 700
                      }}
                    />
                  }
                >
                  <ListItemText
                    primary={
                      <Typography fontWeight={700}>
                        {zone.name} - Riesgo {getRiskLabel(zone.riskLevel).toLowerCase()}
                      </Typography>
                    }
                    secondary={`${zone.trend}. Requiere monitoreo reforzado en la zona.`}
                    secondaryTypographyProps={{ color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider />

          <Typography variant="body2" color="text.secondary">
            La base del mapa usa OpenStreetMap. Las zonas siguen siendo mock y despues pueden alimentarse con siniestros
            reales, coordenadas o agregacion por barrio.
          </Typography>
        </Stack>
      </Box>
    </Drawer>
  );
}
