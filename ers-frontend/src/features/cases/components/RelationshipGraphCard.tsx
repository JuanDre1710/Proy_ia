import { useMemo, useState } from 'react';
import { Card, CardContent, Grid, Stack, Typography } from '@mui/material';
import { GraphEdge, GraphNode } from '../../../models/cases';
import { GraphLegend } from './GraphLegend';
import { RelationshipGraphCanvas } from './RelationshipGraphCanvas';
import { RelationshipNodeDetailDrawer } from './RelationshipNodeDetailDrawer';

interface RelationshipGraphCardProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function RelationshipGraphCard({
  nodes,
  edges
}: RelationshipGraphCardProps): JSX.Element {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(nodes[0] ?? null);
  const nodeCount = nodes.length;
  const edgeCount = edges.length;

  const connectedNodeIds = useMemo(
    () => new Set(edges.flatMap((edge) => [edge.source, edge.target])),
    [edges]
  );

  return (
    <>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack spacing={0.5}>
              <Typography variant="h6">Red de relaciones sospechosas</Typography>
              <Typography color="text.secondary">
                Vista simplificada de vinculos relevantes entre actores, expedientes y terceros.
              </Typography>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} xl={9}>
                <RelationshipGraphCanvas
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNode?.id ?? null}
                  onSelectNode={setSelectedNode}
                />
              </Grid>
              <Grid item xs={12} xl={3}>
                <Stack spacing={2}>
                  <GraphLegend />
                  <Stack
                    spacing={1}
                    sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(227,237,247,0.7)' }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Resumen
                    </Typography>
                    <Typography fontWeight={700}>Nodos: {nodeCount}</Typography>
                    <Typography fontWeight={700}>Relaciones: {edgeCount}</Typography>
                    <Typography fontWeight={700}>
                      Nodos conectados: {connectedNodeIds.size}
                    </Typography>
                  </Stack>
                </Stack>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <RelationshipNodeDetailDrawer
        node={selectedNode}
        edges={edges}
        open={!!selectedNode}
        onClose={() => setSelectedNode(null)}
      />
    </>
  );
}
