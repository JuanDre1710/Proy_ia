import { Grid, Stack, Typography } from '@mui/material';
import { PersonalInfo } from '../../../models/cases';
import { SectionCard } from '../../../components/shared/SectionCard';

export function PersonalInfoCard({ personalInfo }: { personalInfo: PersonalInfo }): JSX.Element {
  const items: Array<[string, string]> = [
    ['Nombre', personalInfo.fullName],
    ['Documento', `${personalInfo.documentType} ${personalInfo.document}`],
    ['Fecha de nacimiento', personalInfo.birthDate],
    ['Edad', `${personalInfo.age || 'N/D'}`],
    ['Direccion', personalInfo.address],
    ['Localidad', personalInfo.locality],
    ['Provincia', personalInfo.province],
    ['Telefono', personalInfo.phone],
    ['Email', personalInfo.email]
  ];

  return (
    <SectionCard title="Datos personales verificados" subtitle="Identidad y contacto consolidados">
      <Grid container spacing={1.5}>
        {items.map(([label, value]) => (
          <Grid key={label} item xs={12} md={6}>
            <Stack sx={{ p: 2, borderRadius: 3, bgcolor: 'rgba(227,237,247,0.7)' }}>
              <Typography fontWeight={700}>{label}</Typography>
              <Typography color="text.secondary">{value}</Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </SectionCard>
  );
}
