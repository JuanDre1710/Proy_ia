import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GppBadRoundedIcon from '@mui/icons-material/GppBadRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import { Alert, Button, Snackbar, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { SectionCard } from '../../../components/shared/SectionCard';
import { CaseDecisionAction, CaseEvaluation } from '../../../models/cases';

interface CaseDecisionCardProps {
  caseData: CaseEvaluation;
  onDecision: (action: CaseDecisionAction) => Promise<void>;
}

type FeedbackState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
} | null;

const DECISION_LABEL: Record<CaseDecisionAction, string> = {
  accept: 'Aceptar caso',
  deny: 'Denegar caso'
};

function formatTimestamp(value?: string): string | null {
  if (!value) {
    return null;
  }

  return value.replace('T', ' ').slice(0, 16);
}

export function CaseDecisionCard({ caseData, onDecision }: CaseDecisionCardProps): JSX.Element {
  const [loadingAction, setLoadingAction] = useState<CaseDecisionAction | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  const resolution = caseData.resolution ?? { status: 'Pendiente' as const };
  const isResolved = resolution.status !== 'Pendiente';

  const handleDecision = async (action: CaseDecisionAction): Promise<void> => {
    setLoadingAction(action);

    try {
      await onDecision(action);
      setFeedback({
        open: true,
        severity: 'success',
        message: action === 'accept' ? 'El caso fue aceptado correctamente.' : 'El caso fue denegado correctamente.'
      });
    } catch (_error) {
      setFeedback({
        open: true,
        severity: 'error',
        message: `No se pudo ${action === 'accept' ? 'aceptar' : 'denegar'} el caso.`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <SectionCard
        title="Resolucion del caso"
        subtitle="Flujo mock para aceptar o denegar casos en revision manual o con sospecha de fraude."
      >
        <Stack spacing={2}>
          <Alert severity={isResolved ? (resolution.status === 'Aceptado' ? 'success' : 'error') : 'warning'}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
              <Typography fontWeight={700}>Estado de resolucion: {resolution.status}</Typography>
              {resolution.decidedBy ? <Typography>Resuelto por: {resolution.decidedBy}</Typography> : null}
              {resolution.decidedAt ? <Typography>Fecha: {formatTimestamp(resolution.decidedAt)}</Typography> : null}
            </Stack>
          </Alert>
          <Typography color="text.secondary">
            {isResolved
              ? 'La decision ya fue registrada en el mock actual. Para cambiarla sera necesario reconectar este flujo con una API real o reiniciar el estado mock.'
              : 'Usa estas acciones para cerrar el caso luego de la revision analitica y documental.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleRoundedIcon />}
              disabled={isResolved || loadingAction !== null}
              onClick={() => void handleDecision('accept')}
            >
              {loadingAction === 'accept' ? 'Aceptando...' : DECISION_LABEL.accept}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<GppBadRoundedIcon />}
              disabled={isResolved || loadingAction !== null}
              onClick={() => void handleDecision('deny')}
            >
              {loadingAction === 'deny' ? 'Denegando...' : DECISION_LABEL.deny}
            </Button>
            <Button variant="text" color="inherit" startIcon={<PendingActionsRoundedIcon />} disabled>
              Auditoria backend pendiente
            </Button>
          </Stack>
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
