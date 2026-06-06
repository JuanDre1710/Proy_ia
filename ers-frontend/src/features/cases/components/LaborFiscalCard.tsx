import { List, ListItem, Typography } from '@mui/material';
import { LaborFiscalInfo } from '../../../models/cases';
import { SectionCard } from '../../../components/shared/SectionCard';

export function LaborFiscalCard({ laborFiscalInfo }: { laborFiscalInfo: LaborFiscalInfo }): JSX.Element {
  return (
    <SectionCard title="Informacion laboral y fiscal" subtitle="Actividad, ingresos y situacion fiscal">
      <List>
        <ListItem disablePadding>Condicion fiscal: {laborFiscalInfo.taxStatus}</ListItem>
        <ListItem disablePadding>Actividad principal: {laborFiscalInfo.mainActivity}</ListItem>
        <ListItem disablePadding>Empleador / razon social: {laborFiscalInfo.employerOrCompany}</ListItem>
        <ListItem disablePadding>Rango de ingresos: {laborFiscalInfo.incomeBracket}</ListItem>
        {laborFiscalInfo.registeredEmployees ? (
          <ListItem disablePadding>Empleados registrados: {laborFiscalInfo.registeredEmployees}</ListItem>
        ) : null}
      </List>
      <Typography color="text.secondary">{laborFiscalInfo.fiscalObservation}</Typography>
    </SectionCard>
  );
}
