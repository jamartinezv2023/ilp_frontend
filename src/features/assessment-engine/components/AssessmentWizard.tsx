import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import type { AssessmentDefinition } from "../../../types/assessmentDefinition";
import { IpsativeRankingQuestion } from "./IpsativeRankingQuestion";
import { validateIpsativeAnswer } from "./ipsativeValidation";

type IpsativeAnswer = Record<string, number>;
type AssessmentAnswers = Record<string, IpsativeAnswer>;

type AssessmentWizardProps = {
  definition: AssessmentDefinition;
};

export const AssessmentWizard = ({ definition }: AssessmentWizardProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [completed, setCompleted] = useState(false);

  const questions = definition.questions;
  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentQuestion.id] ?? {};

  const validQuestionIds = useMemo(
    () =>
      questions
        .filter((question) => validateIpsativeAnswer(answers[question.id] ?? {}))
        .map((question) => question.id),
    [answers, questions]
  );

  const completedCount = validQuestionIds.length;
  const progress = Math.round((completedCount / questions.length) * 100);
  const currentIsValid = validateIpsativeAnswer(currentAnswer);
  const isLastQuestion = currentIndex === questions.length - 1;
  const canFinish = completedCount === questions.length;

  const updateCurrentAnswer = (value: IpsativeAnswer) => {
    setAnswers((current) => ({
      ...current,
      [currentQuestion.id]: value,
    }));
  };

  const next = () => {
    if (!currentIsValid) return;
    setCurrentIndex((current) => Math.min(current + 1, questions.length - 1));
  };

  const previous = () => {
    setCurrentIndex((current) => Math.max(current - 1, 0));
  };

  const finish = () => {
    if (!canFinish) return;
    setCompleted(true);
  };

  const flattenedAnswers = questions.flatMap((question) =>
    question.options.map((option) => answers[question.id]?.[option.id] ?? 0)
  );

  return (
    <Stack spacing={3}>
      <Card
        sx={{
          borderRadius: 5,
          boxShadow: "0 20px 55px rgba(15,23,42,.10)",
          border: "1px solid rgba(148,163,184,.24)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h4" fontWeight={950}>
                {definition.name}
              </Typography>
              <Typography color="text.secondary">
                {definition.description}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={definition.code} color="primary" />
              <Chip label={definition.assessmentType} variant="outlined" />
              <Chip label={`v${definition.version}`} variant="outlined" />
            </Stack>
          </Stack>

          <Alert severity="info" sx={{ mb: 3 }}>
            {definition.instructions}
          </Alert>

          <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography fontWeight={900}>
              Pregunta {currentIndex + 1} de {questions.length}
            </Typography>
            <Typography fontWeight={900}>{progress}% completado</Typography>
          </Stack>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ height: 10, borderRadius: 8 }}
          />
        </CardContent>
      </Card>

      {!completed && (
        <>
          <IpsativeRankingQuestion
            question={currentQuestion}
            value={currentAnswer}
            onChange={updateCurrentAnswer}
          />

          <Stack
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              disabled={currentIndex === 0}
              onClick={previous}
              sx={{ borderRadius: 4, fontWeight: 900 }}
            >
              Anterior
            </Button>

            {!isLastQuestion && (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                disabled={!currentIsValid}
                onClick={next}
                sx={{ borderRadius: 4, fontWeight: 900 }}
              >
                Siguiente
              </Button>
            )}

            {isLastQuestion && (
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                disabled={!canFinish}
                onClick={finish}
                sx={{ borderRadius: 4, fontWeight: 900 }}
              >
                Finalizar instrumento
              </Button>
            )}
          </Stack>
        </>
      )}

      {completed && (
        <Card
          sx={{
            borderRadius: 5,
            border: "1px solid rgba(34,197,94,.35)",
            bgcolor: "rgba(240,253,244,.75)",
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <CheckCircleIcon color="success" />
                <Typography variant="h5" fontWeight={950}>
                  Instrumento completado correctamente
                </Typography>
              </Stack>

              <Typography color="text.secondary">
                Las respuestas ipsativas son válidas. En el siguiente ciclo se
                conectarán con el Assessment Response Engine para persistencia,
                histórico longitudinal y dataset ML/DL.
              </Typography>

              <Alert severity="success">
                Total de respuestas generadas: {flattenedAnswers.length}
              </Alert>

              <Box
                component="pre"
                sx={{
                  p: 2,
                  borderRadius: 3,
                  overflow: "auto",
                  bgcolor: "rgba(15,23,42,.92)",
                  color: "white",
                  fontSize: 12,
                }}
              >
                {JSON.stringify(flattenedAnswers, null, 2)}
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};





