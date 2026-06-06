import {
  Box,
  Chip,
  Divider,
  Drawer,
  Stack,
  Typography,
  useTheme
} from '@mui/material';
import { GraphEdge, GraphNode } from '../../../models/cases';
import { getRiskColor } from '../helpers/relationshipGraph';

interface RelationshipNodeDetailDrawerProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  open: boolean;
  onClose: () => void;
}

export function RelationshipNodeDetailDrawer({
  node,
  edges,
  open,
  onClose
}: RelationshipNodeDetailDrawerProps): JSX.Element {
  const theme = useTheme();

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: 360, p: 3 }}>
        {!node ? null : (
          <Stack spacing={2}>
            <Typography variant="h6">{node.label}</Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              <Chip label={node.type} />
              <Chip
                label={`Riesgo ${node.riskLevel}`}
                sx={{ bgcolor: getRiskColor(node.riskLevel, theme), color: '#fff' }}
              />
            </Stack>
            <Divider />
            <Stack spacing={1}>
              <Typography fontWeight={700}>Metadata</Typography>
              {Object.entries(node.metadata)
                .filter(([, value]) => value !== undefined && value !== '')
                .map(([key, value]) => (
                  <Typography key={key} variant="body2" color="text.secondary">
                    {key}: <strong>{String(value)}</strong>
                  </Typography>
                ))}
            </Stack>
            <Divider />
            <Stack spacing={1}>
              <Typography fontWeight={700}>Relaciones</Typography>
              {edges
                .filter((edge) => edge.source === node.id || edge.target === node.id)
                .map((edge) => (
                  <Box
                    key={edge.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(227,237,247,0.7)'
                    }}
                  >
                    <Typography fontWeight={700}>{edge.relationshipType}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Severidad: {edge.severity}
                    </Typography>
                  </Box>
                ))}
            </Stack>
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}
