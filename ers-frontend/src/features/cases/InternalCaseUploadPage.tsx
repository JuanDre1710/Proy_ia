import { ChangeEvent, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import UploadFileRoundedIcon from '@mui/icons-material/UploadFileRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import DescriptionRoundedIcon from '@mui/icons-material/DescriptionRounded';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/shared/PageHeader';
import { SectionCard } from '../../components/shared/SectionCard';
import { useAuth } from '../../state/AuthContext';
import { caseService } from '../../services/caseService';

const sampleJson = `{
  "identifier": "30111245",
  "subject": {
    "fullName": "Marcela Quiroga",
    "birthDate": "1986-09-14",
    "age": 39,
    "email": "marcela.quiroga@demo.local",
    "phone": "+54 9 351 555 1010",
    "address": "Av. Colon 1450",
    "locality": "Cordoba",
    "province": "Cordoba",
    "verified": true,
    "deceased": false
  },
  "financialInfo": {
    "creditScore": 612,
    "debtRatio": 0.46,
    "bancarizationLevel": "Media",
    "activeLoans": 2,
    "bouncedChecks": 1,
    "monthlyIncomeEstimate": "900000-1200000",
    "observation": "Cliente con actividad bancaria regular."
  },
  "laborFiscalInfo": {
    "taxStatus": "Monotributo",
    "mainActivity": "Comercio minorista",
    "employerOrCompany": "MQ Hogar",
    "incomeBracket": "Medio",
    "registeredEmployees": 1,
    "fiscalObservation": "Actividad consistente con la declaracion del siniestro.",
    "declaredProvince": "Cordoba"
  },
  "claim": {
    "claimReference": "SIN-2026-00045",
    "claimDate": "2026-03-28",
    "claimType": "Robo parcial",
    "claimedAmount": 185000,
    "previousClaimsCount": 2,
    "customerAntiquityMonths": 28,
    "suspiciousImages": false,
    "sharedPhoneWithOtherCustomer": false,
    "repeatedProvider": true,
    "confirmedFraudHistory": false,
    "highRiskZone": false,
    "notes": "Carga demo para probar instancia 1 con datos internos."
  },
  "inconsistencies": [
    "La factura adjunta no tiene validacion definitiva."
  ],
  "missingEvidence": [
    "Falta informe pericial final."
  ],
  "evidenceForReview": [
    "Proveedor repetido en dos siniestros recientes."
  ],
  "evidenceAgainstFraud": [
    "Identidad y domicilio consistentes en el sistema core."
  ]
}`;

export function InternalCaseUploadPage(): JSX.Element {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [jsonText, setJsonText] = useState(sampleJson);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentActorId = useMemo(() => session.user?.id ?? 'usr-admin', [session.user?.id]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const nextText = await file.text();
      setJsonText(nextText);
      setFileName(file.name);
      setError(null);
      setSuccessMessage(null);
    } catch (_error) {
      setError('No se pudo leer el archivo seleccionado.');
    } finally {
      event.target.value = '';
    }
  };

  const handleUseSample = (): void => {
    setJsonText(sampleJson);
    setFileName('sample-internal-case.txt');
    setError(null);
    setSuccessMessage(null);
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(jsonText) as Record<string, unknown>;
    } catch (_error) {
      setSubmitting(false);
      setError('El contenido no es JSON valido.');
      return;
    }

    const response = await caseService.uploadInternalJsonCase({
      requestedBy: currentActorId,
      sourceChannel: 'frontend-upload',
      caseData: payload
    });

    setSubmitting(false);

    if (response.status !== 'success' || !response.data) {
      setError(response.error ?? 'No se pudo crear el caso desde el archivo cargado.');
      return;
    }

    setSuccessMessage(response.data.message);
    navigate(`/cases/${response.data.caseId}`);
  };

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Carga de caso interno"
        subtitle="Subi un .txt o .json con datos internos del siniestro para ejecutar la instancia 1 del analisis, sin providers externos."
      />

      <Stack direction="row" gap={1} flexWrap="wrap">
        <Chip label="Instancia 1: datos internos" variant="outlined" />
        <Chip label="Instancia 2: enrichment condicional futuro" variant="outlined" />
      </Stack>

      {error ? <Alert severity="error">{error}</Alert> : null}
      {successMessage ? <Alert severity="success">{successMessage}</Alert> : null}

      <SectionCard
        title="Archivo de entrada"
        subtitle="La UI acepta un archivo .txt o .json con el mismo payload que el endpoint /cases/evaluate/internal-json."
      >
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} gap={1.5}>
            <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />}>
              Subir archivo
              <input hidden type="file" accept=".txt,.json" onChange={handleFileChange} />
            </Button>
            <Button variant="text" startIcon={<DescriptionRoundedIcon />} onClick={handleUseSample}>
              Cargar ejemplo demo
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowRoundedIcon />}
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              Ejecutar caso
            </Button>
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {fileName ? `Archivo cargado: ${fileName}` : 'Sin archivo cargado. Podes pegar JSON manualmente o usar el ejemplo.'}
            </Typography>
          </Box>

          <TextField
            label="JSON del caso interno"
            value={jsonText}
            onChange={(event) => setJsonText(event.target.value)}
            minRows={20}
            multiline
            fullWidth
          />
        </Stack>
      </SectionCard>
    </Stack>
  );
}
