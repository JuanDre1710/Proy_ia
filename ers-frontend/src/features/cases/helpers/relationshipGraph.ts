import { Theme } from '@mui/material';
import { GraphNode, NodeType, RelationshipSeverity } from '../../../models/cases';

export function getRiskColor(level: RelationshipSeverity, theme: Theme): string {
  switch (level) {
    case 'critical':
      return theme.palette.error.dark;
    case 'high':
      return theme.palette.error.main;
    case 'medium':
      return theme.palette.warning.main;
    case 'low':
    default:
      return theme.palette.success.main;
  }
}

export function getNodeTypeColor(type: NodeType, theme: Theme): string {
  switch (type) {
    case 'Persona':
      return theme.palette.primary.main;
    case 'Empresa':
      return '#455A64';
    case 'Siniestro':
      return theme.palette.secondary.main;
    case 'Taller':
      return '#6D4C41';
    case 'Abogado':
      return '#5E35B1';
    case 'Medico':
      return '#00897B';
    case 'Testigo':
      return '#546E7A';
    case 'Familiar':
      return '#8E24AA';
    case 'Cuenta':
    default:
      return '#3949AB';
  }
}

export function getNodePosition(node: GraphNode): { x: number; y: number } {
  const x = Number(node.metadata.x);
  const y = Number(node.metadata.y);

  return {
    x: Number.isFinite(x) ? x : 100,
    y: Number.isFinite(y) ? y : 100
  };
}
