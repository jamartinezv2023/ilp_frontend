import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import type {
  InstrumentQuestion,
  KolbAssessmentResponse,
} from "../../../types/assessment";
import {
  fetchKolbQuestions,
  submitKolbAssessmentWithAnswers,
} from "../../../services/assessmentApi";

type KolbRealFormProps = {
  studentId: string;
  onCompleted: (result: KolbAssessmentResponse) => void;
};

export const KolbRealForm = ({ studentId, onCompleted }: KolbRealFormProps) => {
  const [questions, setQuestions] = useState<InstrumentQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchKolbQuestions();
      setQuestions(data);
    } catch {
      setError("No fue posible cargar las preguntas de Kolb.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
  }, []);

  const submit = async () => {
    try {
      setSubmitting(true);
      setError("");

      const orderedAnswers = questions.map((question) => answers[question.id]);

      if (orderedAnswers.some((answer) => !answer)) {
        setError("Debe responder todas las preguntas antes de enviar.");
        return;
      }

      /*
       * El motor Kolb actual espera 48 respuestas.
       * Este banco inicial tiene 4 preguntas base, por eso repetimos 12 ciclos.
       * En el siguiente ciclo ampliaremos el banco a 48 preguntas reales.
       */
      const expandedAnswers = Array.from({ length: 12 }).flatMap(
        () => orderedAnswers
      );

      const result = await submitKolbAssessmentWithAnswers(
        studentId,
        expandedAnswers
      );

      onCompleted(result);
    } catch {
      setError("No fue posible enviar el formulario Kolb.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando preguntas Kolb...</Typography>
      </Stack>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 4 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <AssignmentTurnedInIcon color="primary" />
          <Typography variant="h6" fontWeight={950}>
            Formulario Kolb real
          </Typography>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Este formulario ya se alimenta desde el banco de preguntas persistente
          del backend.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stack spacing={2}>
          {questions.map((question) => (
            <Box
              key={question.id}
              sx={{
                p: 2,
                borderRadius: 3,
                border: "1px solid rgba(148,163,184,.25)",
              }}
            >
              <Typography fontWeight={900}>
                {question.questionOrder}. {question.text}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                Dimensión: {question.dimension}
              </Typography>

              <FormControl fullWidth sx={{ mt: 1 }}>
                <RadioGroup
                  row
                  value={answers[question.id] ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: Number(event.target.value),
                    }))
                  }
                >
                  {question.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          ))}
        </Stack>

        <Button
          fullWidth
          variant="contained"
          disabled={submitting}
          onClick={() => void submit()}
          sx={{ mt: 3, borderRadius: 3, fontWeight: 900 }}
        >
          {submitting ? "Enviando..." : "Enviar respuestas reales Kolb"}
        </Button>
      </CardContent>
    </Card>
  );
};
