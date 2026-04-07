import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GppBadRoundedIcon from '@mui/icons-material/GppBadRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import { Alert, Button, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { SectionCard } from '../../../components/shared/SectionCard';
import { CaseDecisionAction, CaseEvaluation } from '../../../models/cases';

interface CaseDecisionCardProps {
  caseData: CaseEvaluation;
  onDecision: (action: CaseDecisionAction, comment: string) => Promise<void>;
  currentUser?: string;
}

type FeedbackState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
} | null;

const DECISION_LABEL: Record<CaseDecisionAction, string> = {
  accept: 'Aceptar caso',
  deny: 'Denegar caso',
  escalate: 'Escalar caso'
};

function translatePriorityLabel(value?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'): string {
  switch (value) {
    case 'LOW':
      return 'Baja';
    case 'MEDIUM':
      return 'Media';
    case 'HIGH':
      return 'Alta';
    case 'CRITICAL':
      return 'Critica';
    default:
      return 'N/D';
  }
}

function formatTimestamp(value?: string): string | null {
  if (!value) {
    return null;
  }

  return value.replace('T', ' ').slice(0, 16);
}

export function CaseDecisionCard({ caseData, onDecision, currentUser }: CaseDecisionCardProps): JSX.Element {
  const [loadingAction, setLoadingAction] = useState<CaseDecisionAction | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [comment, setComment] = useState('');

  const resolution = caseData.resolution ?? { status: 'Pendiente' as const };
  const isResolved = resolution.status !== 'Pendiente';
  const isCommentValid = comment.trim().length > 0;

  const handleDecision = async (action: CaseDecisionAction): Promise<void> => {
    if (!isCommentValid) {
      setFeedback({
        open: true,
        severity: 'error',
        message: 'El comentario es obligatorio para registrar la decision.'
      });
      return;
    }

    setLoadingAction(action);

    try {
      await onDecision(action, comment.trim());
      setFeedback({
        open: true,
        severity: 'success',
        message:
          action === 'accept'
            ? 'El caso fue aceptado correctamente.'
            : action === 'deny'
              ? 'El caso fue denegado correctamente.'
              : 'El caso fue escalado correctamente.'
      });
    } catch (_error) {
      setFeedback({
        open: true,
        severity: 'error',
        message: `No se pudo ${action === 'accept' ? 'aceptar' : action === 'deny' ? 'denegar' : 'escalar'} el caso.`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <>
      <SectionCard
        title="Resolucion del caso"
        subtitle="Resolucion operativa auditable a partir de la evaluacion final del pipeline."
      >
        <Stack spacing={2}>
          <Alert
            severity={
              isResolved
                ? resolution.status === 'Aceptado'
                  ? 'success'
                  : resolution.status === 'Escalado'
                    ? 'warning'
                    : 'error'
                : 'warning'
            }
          >
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
              <Typography fontWeight={700}>Estado de resolucion: {resolution.status}</Typography>
              {resolution.decidedBy ? <Typography>Resuelto por: {resolution.decidedBy}</Typography> : null}
              {resolution.decidedByRole ? <Typography>Rol: {resolution.decidedByRole}</Typography> : null}
              {resolution.decidedAt ? <Typography>Fecha: {formatTimestamp(resolution.decidedAt)}</Typography> : null}
            </Stack>
          </Alert>
          <Typography color="text.secondary">
            {isResolved
              ? 'La decision ya fue registrada y quedo persistida en el backend.'
              : 'Usa estas acciones para cerrar el caso luego de la revision analitica y documental.'}
          </Typography>
          <Alert severity="info">
            <Stack spacing={0.5}>
              <Typography fontWeight={700}>
                Recomendacion operativa: {caseData.finalAssessment?.recommendedAction ?? 'N/D'}
              </Typography>
              <Typography>
                Prioridad: {translatePriorityLabel(caseData.finalAssessment?.finalPriority)} | Calidad de evidencia:{' '}
                {caseData.finalAssessment?.evidenceQuality ?? 'N/D'}
              </Typography>
              {currentUser ? <Typography>Usuario actual: {currentUser}</Typography> : null}
            </Stack>
          </Alert>
          <TextField
            label="Comentario obligatorio"
            placeholder="Deja trazabilidad de la decision operativa."
            value={isResolved ? resolution.comment ?? '' : comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={isResolved || loadingAction !== null}
            minRows={3}
            multiline
            required
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleRoundedIcon />}
              disabled={isResolved || loadingAction !== null || !isCommentValid}
              onClick={() => void handleDecision('accept')}
            >
              {loadingAction === 'accept' ? 'Aceptando...' : DECISION_LABEL.accept}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<GppBadRoundedIcon />}
              disabled={isResolved || loadingAction !== null || !isCommentValid}
              onClick={() => void handleDecision('deny')}
            >
              {loadingAction === 'deny' ? 'Denegando...' : DECISION_LABEL.deny}
            </Button>
            <Button
              variant="text"
              color="inherit"
              startIcon={<PendingActionsRoundedIcon />}
              disabled={isResolved || loadingAction !== null || !isCommentValid}
              onClick={() => void handleDecision('escalate')}
            >
              {loadingAction === 'escalate' ? 'Escalando...' : DECISION_LABEL.escalate}
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
