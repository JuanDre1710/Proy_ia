import PictureAsPdfRoundedIcon from '@mui/icons-material/PictureAsPdfRounded';
import TableViewRoundedIcon from '@mui/icons-material/TableViewRounded';
import { Button, CircularProgress, Stack } from '@mui/material';

interface ExportButtonGroupProps {
  pdfLoading: boolean;
  csvLoading: boolean;
  onExportPdf: () => void;
  onExportCsv: () => void;
}

export function ExportButtonGroup({
  pdfLoading,
  csvLoading,
  onExportPdf,
  onExportCsv
}: ExportButtonGroupProps): JSX.Element {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
      <Button
        variant="outlined"
        startIcon={pdfLoading ? <CircularProgress size={18} /> : <PictureAsPdfRoundedIcon />}
        disabled={pdfLoading || csvLoading}
        onClick={onExportPdf}
      >
        Exportar PDF
      </Button>
      <Button
        variant="contained"
        startIcon={csvLoading ? <CircularProgress size={18} color="inherit" /> : <TableViewRoundedIcon />}
        disabled={pdfLoading || csvLoading}
        onClick={onExportCsv}
      >
        Exportar CSV
      </Button>
    </Stack>
  );
}
