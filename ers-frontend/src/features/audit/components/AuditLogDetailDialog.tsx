import { Dialog, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material';
import { AuditLogEntry } from '../../../models/audit';

interface AuditLogDetailDialogProps {
  open: boolean;
  entry: AuditLogEntry | null;
  onClose: () => void;
}

export function AuditLogDetailDialog({
  open,
  entry,
  onClose
}: AuditLogDetailDialogProps): JSX.Element {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Detalle del log</DialogTitle>
      <DialogContent dividers>
        {entry ? (
          <Stack spacing={1.5}>
            <Typography><strong>Fecha / hora:</strong> {new Date(entry.fechaHora).toLocaleString()}</Typography>
            <Typography><strong>Usuario:</strong> {entry.usuario}</Typography>
            <Typography><strong>Rol:</strong> {entry.rol}</Typography>
            <Typography><strong>Accion:</strong> {entry.accion}</Typography>
            <Typography><strong>Identificador:</strong> {entry.identificadorConsultado}</Typography>
            <Typography><strong>Resultado:</strong> {entry.resultado}</Typography>
            <Typography><strong>IP:</strong> {entry.ip}</Typography>
            <Divider />
            <Typography variant="subtitle2">Detalle</Typography>
            <Typography color="text.secondary">{entry.detalle}</Typography>
          </Stack>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
