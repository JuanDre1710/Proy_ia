import { Theme } from '@mui/material';
import { RiskVariableImpact } from '../../../models/cases';

export function getImpactColor(level: RiskVariableImpact['impactLevel'], theme: Theme): string {
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

export function getImpactLabel(level: RiskVariableImpact['impactLevel']): string {
  switch (level) {
    case 'critical':
      return 'Critico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Medio';
    case 'low':
    default:
      return 'Bajo';
  }
}

export function getImpactWeight(level: RiskVariableImpact['impactLevel']): number {
  switch (level) {
    case 'critical':
      return 100;
    case 'high':
      return 78;
    case 'medium':
      return 52;
    case 'low':
    default:
      return 26;
  }
}
