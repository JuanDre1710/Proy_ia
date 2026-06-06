import { Grid, Skeleton, Stack } from '@mui/material';
import { SectionCard } from './SectionCard';

interface PageSkeletonProps {
  sections?: number;
}

export function PageSkeleton({ sections = 3 }: PageSkeletonProps): JSX.Element {
  return (
    <Stack spacing={3}>
      <Stack spacing={1}>
        <Skeleton variant="text" width="32%" height={48} />
        <Skeleton variant="text" width="58%" />
      </Stack>
      <Grid container spacing={2}>
        {Array.from({ length: sections }).map((_, index) => (
          <Grid item xs={12} md={sections > 2 ? 6 : 12} key={index}>
            <SectionCard title="">
              <Stack spacing={1.5}>
                <Skeleton variant="rectangular" height={18} width="45%" />
                <Skeleton variant="rounded" height={22} width="100%" />
                <Skeleton variant="rounded" height={22} width="94%" />
                <Skeleton variant="rounded" height={22} width="88%" />
                <Skeleton variant="rounded" height={72} width="100%" />
              </Stack>
            </SectionCard>
          </Grid>
        ))}
      </Grid>
    </Stack>
  );
}
