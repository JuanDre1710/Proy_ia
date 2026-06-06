import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import GppBadRoundedIcon from '@mui/icons-material/GppBadRounded';
import PendingActionsRoundedIcon from '@mui/icons-material/PendingActionsRounded';
import VerifiedUserRoundedIcon from '@mui/icons-material/VerifiedUserRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import { Alert, Button, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { useState } from 'react';
import { SectionCard } from '../../../components/shared/SectionCard';
import { CaseDecisionAction, CaseEvaluation } from '../../../models/cases';

interface CaseDecisionCardProps {
  caseData: CaseEvaluation;
  onDecision: (action: CaseDecisionAction, comment: string) => Promise<void>;
  onFinalResolution: (fraudeConfirmado: boolean, comment: string) => Promise<void>;
  currentUser?: string;
}

type FeedbackState = {
  open: boolean;
  severity: 'success' | 'error';
  message: string;
} | null;

const DECISION_LABEL: Record<CaseDecisionAction, string> = {
  accept: 'Aceptar',
  deny: 'Denegar',
  review: 'Revisar'
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

export function CaseDecisionCard({ caseData, onDecision, onFinalResolution, currentUser }: CaseDecisionCardProps): JSX.Element {
  const [loadingAction, setLoadingAction] = useState<CaseDecisionAction | null>(null);
  const [loadingResolution, setLoadingResolution] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [comment, setComment] = useState('');

  const resolution = caseData.resolution ?? { status: 'Pendiente' as const };
  const isClosed = resolution.status === 'Cerrado' || caseData.operationalCaseStatus?.toLowerCase() === 'cerrado';

  const resolvedSeverity = resolution.status === 'Cerrado' ? 'success' : resolution.status === 'En revision' ? 'warning' : 'info';

  const handleDecision = async (action: CaseDecisionAction): Promise<void> => {
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
              : 'El caso quedo enviado a revision.'
      });
    } catch (_error) {
      setFeedback({
        open: true,
        severity: 'error',
        message: `No se pudo ${action === 'accept' ? 'aceptar' : action === 'deny' ? 'denegar' : 'marcar para revision'} el caso.`
      });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleFinalResolution = async (fraudeConfirmado: boolean): Promise<void> => {
    setLoadingResolution(fraudeConfirmado);

    try {
      await onFinalResolution(fraudeConfirmado, comment.trim());
      setFeedback({
        open: true,
        severity: 'success',
        message: fraudeConfirmado
          ? 'El caso fue marcado como fraude.'
          : 'El caso fue marcado como no fraude.'
      });
    } catch (_error) {
      setFeedback({
        open: true,
        severity: 'error',
        message: fraudeConfirmado
          ? 'No se pudo registrar el resultado final FRAUDE.'
          : 'No se pudo registrar el resultado final NO FRAUDE.'
      });
    } finally {
      setLoadingResolution(null);
    }
  };

  return (
    <>
      <SectionCard
        title="Resolucion del caso"
        subtitle="Resolucion operativa auditable a partir de la evaluacion final del pipeline."
      >
        <Stack spacing={2}>
          <Alert severity={resolvedSeverity}>
            <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5} alignItems={{ md: 'center' }}>
              <Typography fontWeight={700}>Estado operativo: {resolution.status}</Typography>
              {resolution.decision ? <Typography>Decision: {resolution.decision}</Typography> : null}
              {resolution.fraudOutcome ? <Typography>Resultado final: {resolution.fraudOutcome}</Typography> : null}
              {resolution.decidedBy ? <Typography>Resuelto por: {resolution.decidedBy}</Typography> : null}
              {resolution.decidedByRole ? <Typography>Rol: {resolution.decidedByRole}</Typography> : null}
              {resolution.decidedAt ? <Typography>Fecha: {formatTimestamp(resolution.decidedAt)}</Typography> : null}
            </Stack>
          </Alert>
          <Typography color="text.secondary">
            {resolution.status === 'Cerrado'
              ? 'La decision ya fue registrada y el caso quedo cerrado.'
              : resolution.status === 'En revision'
                ? 'El caso quedo en revision operativa y puede continuar con seguimiento humano.'
                : 'Usa estas acciones para registrar una decision operativa sobre el caso.'}
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
            label="Comentario opcional"
            placeholder="Agrega contexto si queres dejar trazabilidad de la decision operativa."
            value={isClosed ? resolution.comment ?? '' : comment}
            onChange={(event) => setComment(event.target.value)}
            disabled={isClosed || loadingAction !== null || loadingResolution !== null}
            minRows={3}
            multiline
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="success"
              startIcon={<CheckCircleRoundedIcon />}
              disabled={isClosed || loadingAction !== null || loadingResolution !== null}
              onClick={() => void handleDecision('accept')}
            >
              {loadingAction === 'accept' ? 'Aceptando...' : DECISION_LABEL.accept}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<GppBadRoundedIcon />}
              disabled={isClosed || loadingAction !== null || loadingResolution !== null}
              onClick={() => void handleDecision('deny')}
            >
              {loadingAction === 'deny' ? 'Denegando...' : DECISION_LABEL.deny}
            </Button>
            <Button
              variant="text"
              color="inherit"
              startIcon={<PendingActionsRoundedIcon />}
              disabled={resolution.status === 'En revision' || isClosed || loadingAction !== null || loadingResolution !== null}
              onClick={() => void handleDecision('review')}
            >
              {loadingAction === 'review' ? 'Enviando...' : DECISION_LABEL.review}
            </Button>
          </Stack>
          <Alert severity={resolution.fraudOutcome === 'FRAUDE' ? 'error' : resolution.fraudOutcome === 'NO FRAUDE' ? 'success' : 'info'}>
            <Typography fontWeight={700}>
              Resultado final: {resolution.fraudOutcome ?? 'Pendiente de resolucion final'}
            </Typography>
          </Alert>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              color="error"
              startIcon={<ShieldOutlinedIcon />}
              disabled={isClosed || loadingAction !== null || loadingResolution !== null}
              onClick={() => void handleFinalResolution(true)}
            >
              {loadingResolution === true ? 'Confirmando...' : 'Confirmar fraude'}
            </Button>
            <Button
              variant="outlined"
              color="success"
              startIcon={<VerifiedUserRoundedIcon />}
              disabled={isClosed || loadingAction !== null || loadingResolution !== null}
              onClick={() => void handleFinalResolution(false)}
            >
              {loadingResolution === false ? 'Registrando...' : 'Marcar como no fraude'}
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
