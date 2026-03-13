import { Button, Stack } from '@mui/material';
import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import TableViewRoundedIcon from '@mui/icons-material/TableViewRounded';

interface ExportActionsProps {
  onExportPdf: () => void;
  onExportCsv: () => void;
}

export function ExportActions({ onExportPdf, onExportCsv }: ExportActionsProps): JSX.Element {
  return (
    <Stack direction="row" gap={1.5} flexWrap="wrap">
      <Button variant="outlined" startIcon={<PictureAsPdfRoundedIcon />} onClick={onExportPdf}>
        PDF
      </Button>
      <Button variant="contained" startIcon={<TableViewRoundedIcon />} onClick={onExportCsv}>
        CSV
      </Button>
    </Stack>
  );
}
