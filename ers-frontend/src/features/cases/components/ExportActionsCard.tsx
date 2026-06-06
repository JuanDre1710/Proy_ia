import VerifiedRoundedIcon from '@mui/icons-material/VerifiedRounded';
import { Alert, List, ListItem, ListItemIcon, ListItemText, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { SectionCard } from '../../../components/shared/SectionCard';
import { CaseEvaluation } from '../../../models/cases';
import { ExportFormat } from '../../../models/export';
import { exportService } from '../../../services/exportService';
import { ExportButtonGroup } from './ExportButtonGroup';

interface ExportActionsCardProps {
  evaluation: CaseEvaluation;
}

type FeedbackState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
} | null;

export function ExportActionsCard({ evaluation }: ExportActionsCardProps): JSX.Element {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [csvLoading, setCsvLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const handleExport = async (format: ExportFormat): Promise<void> => {
    if (format === 'pdf') {
      setPdfLoading(true);
    } else {
      setCsvLoading(true);
    }

    try {
      const result = await exportService.exportEvaluation({ format, evaluation });
      setFeedback({
        open: true,
        severity: result.success ? 'success' : 'error',
        message: result.message
      });
    } catch (_error) {
      setFeedback({
        open: true,
        severity: 'error',
        message: `No se pudo exportar el informe en ${format.toUpperCase()}.`
      });
    } finally {
      if (format === 'pdf') {
        setPdfLoading(false);
      } else {
        setCsvLoading(false);
      }
    }
  };

  return (
    <>
      <SectionCard
        title="Exportacion de informes"
        subtitle="Generacion documental real con persistencia de archivos y trazabilidad de exportacion."
      >
        <Stack spacing={2}>
          <Typography color="text.secondary">
            El informe exportado incluira los datos consultados, score IA, alertas, justificaciones,
            timestamp de emision y soporte futuro para firma digital opcional.
          </Typography>
          <Alert severity="info">
            Las exportaciones PDF y CSV ahora se generan desde backend, quedan registradas en auditoria y se
            descargan desde archivos persistidos.
          </Alert>
          <List dense disablePadding>
            {[
              'Datos consultados del caso',
              'Score IA y clasificacion resultante',
              'Alertas antifraude activas',
              'Justificaciones y resumen analitico',
              'Timestamp de exportacion',
              'Firma digital opcional a futuro'
            ].map((item) => (
              <ListItem key={item} disableGutters>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <VerifiedRoundedIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={item} />
              </ListItem>
            ))}
          </List>
          <ExportButtonGroup
            pdfLoading={pdfLoading}
            csvLoading={csvLoading}
            onExportPdf={() => void handleExport('pdf')}
            onExportCsv={() => void handleExport('csv')}
          />
        </Stack>
      </SectionCard>
      <Snackbar
        open={feedback?.open ?? false}
        autoHideDuration={3500}
        onClose={() => setFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setFeedback(null)} severity={feedback?.severity ?? 'success'} variant="filled">
          {feedback?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
