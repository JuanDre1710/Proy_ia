import { Box, Typography, useTheme } from '@mui/material';
import { GraphEdge, GraphNode } from '../../../models/cases';
import { getNodePosition, getNodeTypeColor, getRiskColor } from '../helpers/relationshipGraph';

interface RelationshipGraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: GraphNode) => void;
}

export function RelationshipGraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode
}: RelationshipGraphCanvasProps): JSX.Element {
  const theme = useTheme();
  const width = 640;
  const height = 360;

  return (
    <Box
      sx={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: 'rgba(255,255,255,0.72)'
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Red de relaciones sospechosas del caso"
      >
        {edges.map((edge) => {
          const source = nodes.find((node) => node.id === edge.source);
          const target = nodes.find((node) => node.id === edge.target);

          if (!source || !target) {
            return null;
          }

          const sourcePosition = getNodePosition(source);
          const targetPosition = getNodePosition(target);
          const midX = (sourcePosition.x + targetPosition.x) / 2;
          const midY = (sourcePosition.y + targetPosition.y) / 2;

          return (
            <g key={edge.id}>
              <line
                x1={sourcePosition.x}
                y1={sourcePosition.y}
                x2={targetPosition.x}
                y2={targetPosition.y}
                stroke={getRiskColor(edge.severity, theme)}
                strokeWidth={edge.severity === 'critical' ? 4 : edge.severity === 'high' ? 3 : 2}
                strokeDasharray={edge.severity === 'medium' ? '7 4' : edge.severity === 'low' ? '4 4' : undefined}
                opacity={0.85}
              />
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontSize="10"
                fill={theme.palette.text.secondary}
              >
                {edge.relationshipType}
              </text>
            </g>
          );
        })}

        {nodes.map((node) => {
          const { x, y } = getNodePosition(node);
          const selected = node.id === selectedNodeId;
          const fill = getNodeTypeColor(node.type, theme);
          const ring = getRiskColor(node.riskLevel, theme);

          return (
            <g
              key={node.id}
              onClick={() => onSelectNode(node)}
              style={{ cursor: 'pointer' }}
              aria-label={`Nodo ${node.label}`}
            >
              <circle
                cx={x}
                cy={y}
                r={selected ? 30 : 24}
                fill={fill}
                stroke={ring}
                strokeWidth={selected ? 5 : 3}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="700">
                {node.type.slice(0, 3).toUpperCase()}
              </text>
              <text x={x} y={y + 44} textAnchor="middle" fontSize="11" fill={theme.palette.text.primary}>
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
      <Box sx={{ px: 2, pb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Hover visual simplificado: selecciona un nodo para inspeccionar detalles y relaciones.
        </Typography>
      </Box>
    </Box>
  );
}
