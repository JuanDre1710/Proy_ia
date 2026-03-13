import { List, ListItem, Typography } from '@mui/material';
import { FinancialInfo } from '../../../models/cases';
import { SectionCard } from '../../../components/shared/SectionCard';

export function FinancialInfoCard({ financialInfo }: { financialInfo: FinancialInfo }): JSX.Element {
  return (
    <SectionCard title="Informacion financiera" subtitle="Situacion crediticia y bancarizacion">
      <List>
        <ListItem disablePadding>Credit score: {financialInfo.creditScore}</ListItem>
        <ListItem disablePadding>Debt ratio: {financialInfo.debtRatio}%</ListItem>
        <ListItem disablePadding>Bancarizacion: {financialInfo.bancarizationLevel}</ListItem>
        <ListItem disablePadding>Prestamos activos: {financialInfo.activeLoans}</ListItem>
        <ListItem disablePadding>Cheques rechazados: {financialInfo.bouncedChecks}</ListItem>
        <ListItem disablePadding>Ingreso estimado: {financialInfo.monthlyIncomeEstimate}</ListItem>
      </List>
      <Typography color="text.secondary">{financialInfo.observation}</Typography>
    </SectionCard>
  );
}
