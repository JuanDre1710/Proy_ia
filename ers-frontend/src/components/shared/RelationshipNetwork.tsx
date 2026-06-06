import { Box, Grid, Typography } from '@mui/material';
import { RelationshipEdge, RelationshipNode } from '../../models/domain';

interface RelationshipNetworkProps {
  nodes: RelationshipNode[];
  edges: RelationshipEdge[];
}

export function RelationshipNetwork({ nodes, edges }: RelationshipNetworkProps): JSX.Element {
  const nodeName = (id: string): string => nodes.find((node) => node.id === id)?.label ?? id;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {nodes.map((node) => (
            <Box
              key={node.id}
              sx={{
                p: 2,
                borderRadius: 4,
                background:
                  node.riskLevel === 'high'
                    ? 'rgba(180,35,24,0.12)'
                    : node.riskLevel === 'medium'
                      ? 'rgba(217,119,6,0.15)'
                      : 'rgba(227,237,247,0.9)'
              }}
            >
              <Typography fontWeight={700}>{node.label}</Typography>
              <Typography color="text.secondary">{node.category}</Typography>
            </Box>
          ))}
        </Box>
      </Grid>
      <Grid item xs={12} md={6}>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {edges.map((edge, index) => (
            <Box key={`${edge.source}-${edge.target}-${index}`} sx={{ p: 2, borderRadius: 4, background: 'rgba(227,237,247,0.9)' }}>
              <Typography fontWeight={700}>
                {nodeName(edge.source)} {'->'} {nodeName(edge.target)}
              </Typography>
              <Typography color="text.secondary">{edge.reason}</Typography>
            </Box>
          ))}
        </Box>
      </Grid>
    </Grid>
  );
}
