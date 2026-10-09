import { useSuiteText } from "../../../i18n/useSuiteText";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import HistoryIcon from "@mui/icons-material/History";
import type {
  InstrumentQuestion,
  KolbAssessmentResponse,
} from "../../../types/assessment";
import {
  isAssessmentSubmissionInvalid,
  isAssessmentSubmissionBlocked,
  kolbTimestampMatches,
  fetchKolbAssessmentHistory,
  fetchKolbQuestions,
  submitKolbAssessmentWithConfirmation,
} from "../../../services/assessmentApi";

import { useI18n } from "../../../i18n/I18nProvider";

type KolbRealFormProps = {
  studentId: string;
  onCompleted: (result: KolbAssessmentResponse) => void;
};

type IpsativeAnswers = Record<string, Record<number, number>>;

const rankOptions = [4, 3, 2, 1];

export const KolbRealForm = ({ studentId, onCompleted }: KolbRealFormProps) => {
  const ui = useSuiteText();
  const { t, locale } = useI18n();
  const [submissionRejected, setSubmissionRejected] = useState(false);
  const [questions, setQuestions] = useState<InstrumentQuestion[]>([]);
  const [answers, setAnswers] = useState<IpsativeAnswers>({});
  const [history, setHistory] = useState<KolbAssessmentResponse[]>([]);
  const [latestResult, setLatestResult] = useState<KolbAssessmentResponse | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingResult, setPendingResult] = useState<KolbAssessmentResponse | null>(null);
  const [submissionUncertain, setSubmissionUncertain] = useState(false);
  const [error, setError] = useState("");
  const currentStudentId = useRef(studentId);
  const submissionInFlight = useRef(false);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      setQuestions(await fetchKolbQuestions());
    } catch {
      setError("No fue posible cargar las preguntas de Kolb.");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistory(await fetchKolbAssessmentHistory(studentId));
    } catch {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    void loadQuestions();
  }, []);

  useEffect(() => {
    currentStudentId.current = studentId;
    setAnswers({});
    setHistory([]);
    setLatestResult(null);
    setPendingResult(null);
    setSubmissionUncertain(false);
    setSubmissionRejected(false);
    setSubmitting(false);
    void loadHistory();
  }, [studentId, loadHistory]);

  const usedRanksByQuestion = useMemo(() => {
    const result: Record<string, number[]> = {};

    questions.forEach((question) => {
      result[question.id] = Object.values(answers[question.id] ?? {}).filter(
        (rank) => rankOptions.includes(rank)
      );
    });

    return result;
  }, [answers, questions]);

  const updateRank = (
    questionId: string,
    optionIndex: number,
    rank: number
  ) => {
    const currentQuestionAnswers = answers[questionId] ?? {};

    const duplicatedRank = Object.entries(currentQuestionAnswers).some(
      ([index, selectedRank]) =>
        Number(index) !== optionIndex && selectedRank === rank
    );

    if (duplicatedRank) {
      setError(`En este grupo, el valor ${rank} ya fue usado.`);
      return;
    }

    setError("");

    setAnswers((current) => ({
      ...current,
      [questionId]: {
        ...(current[questionId] ?? {}),
        [optionIndex]: rank,
      },
    }));
  };

  const questionIsComplete = (question: InstrumentQuestion): boolean => {
    const selectedRanks = question.options.map(
      (_, index) => answers[question.id]?.[index]
    );

    return (
      selectedRanks.length === 4 &&
      selectedRanks.every((rank) => rankOptions.includes(rank)) &&
      new Set(selectedRanks).size === 4
    );
  };

  const allQuestionsComplete =
    questions.length > 0 && questions.every(questionIsComplete);

  const buildPayload = (): number[] => {
    return questions.flatMap((question) =>
      question.options.map((_, index) => answers[question.id][index])
    );
  };

  const handleSubmissionError = (caught: unknown) => {
    if (isAssessmentSubmissionBlocked(caught)) {
      setSubmissionUncertain(false);
      setError(locale === "en"
        ? "Submission is disabled pending institutional and instrument approval. No successful submission was confirmed."
        : "El envío está deshabilitado hasta aprobar la institución y el instrumento. No se confirmó un envío exitoso.");
      return;
    }
    if (isAssessmentSubmissionInvalid(caught)) {
      setSubmissionRejected(true);
      setSubmissionUncertain(false);
      return;
    }
    setSubmissionUncertain(true);
    setError(
      "El estado del envío es incierto. Consulte el historial y no repita el envío hasta verificarlo."
    );
  };

  const submit = async () => {
    if (submissionInFlight.current || pendingResult || submissionUncertain) return;
    if (!allQuestionsComplete) {
      setError(
        "Debe completar todos los grupos usando exactamente una vez los valores 4, 3, 2 y 1."
      );
      return;
    }
    const submittedStudentId = studentId;
    submissionInFlight.current = true;
    setSubmissionRejected(false);
    setSubmitting(true);
    setError("");
    try {
      const { result, history: persistedHistory, confirmed } =
        await submitKolbAssessmentWithConfirmation(
          submittedStudentId,
          buildPayload()
        );
      if (currentStudentId.current !== submittedStudentId) return;
      if (!confirmed) {
        setPendingResult(result);
        setError(
          `Se recibió la evaluación ${result.assessmentId || "(sin ID)"}, pero no se confirmó en el historial. Consulte el historial antes de cualquier nuevo envío.`
        );
        return;
      }
      setHistory(persistedHistory);
      setLatestResult(result);
      onCompleted(result);
    } catch (caught) {
      if (currentStudentId.current === submittedStudentId) {
        handleSubmissionError(caught);
      }
    } finally {
      submissionInFlight.current = false;
      if (currentStudentId.current === submittedStudentId) {
        setSubmitting(false);
      }
    }
  };
  const checkPendingHistory = async () => {
    if (!pendingResult) return;
    const submittedStudentId = studentId;
    try {
      setHistoryLoading(true);
      const persistedHistory =
        await fetchKolbAssessmentHistory(submittedStudentId);
      if (currentStudentId.current !== submittedStudentId) return;
      setHistory(persistedHistory);
      const confirmed = persistedHistory.some(
        (item) =>
          item.assessmentId === pendingResult.assessmentId &&
          item.studentId === submittedStudentId &&
          item.instrumentVersion === pendingResult.instrumentVersion &&
          kolbTimestampMatches(item.createdAt, pendingResult.createdAt)
      );
      if (confirmed) {
        setLatestResult(pendingResult);
        setPendingResult(null);
        setError("");
        onCompleted(pendingResult);
      } else {
        setError("El registro aún no aparece en el historial. No lo vuelva a enviar.");
      }
    } catch {
      if (currentStudentId.current === submittedStudentId) {
        setError("No fue posible consultar el historial. No vuelva a enviar.");
      }
    } finally {
      if (currentStudentId.current === submittedStudentId) {
        setHistoryLoading(false);
      }
    }
  };  if (loading) {
    return (
      <Stack alignItems="center" sx={{ py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{ui("Cargando preguntas Kolb...")}</Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <AssignmentTurnedInIcon color="primary" />
            <Typography variant="h6" fontWeight={950}>
              {ui("Formulario Kolb real")}
            </Typography>
          </Stack>

          <Alert severity="info" sx={{ mb: 2 }}>
            {ui("En cada grupo debe asignar 4, 3, 2 y 1 una sola vez. Use 4 para la frase que más lo representa y 1 para la que menos lo representa.")}
          </Alert>

          {(error || submissionRejected) && (
            <Alert severity="error" role="alert" sx={{ mb: 2 }}>
              {submissionRejected ? t("assessment.submission.invalid") : error}
            </Alert>
          )}

          {latestResult && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {ui("Registro confirmado en historial:")} {latestResult.assessmentId} · Kolb {latestResult.instrumentVersion} · {latestResult.learningStyle}. CE:{" "}
              {latestResult.scoreCE}, RO: {latestResult.scoreRO}, AC:{" "}
              {latestResult.scoreAC}, AE: {latestResult.scoreAE}.
            </Alert>
          )}

          <Stack spacing={2}>
            {questions.map((question) => {
              const usedRanks = usedRanksByQuestion[question.id] ?? [];
              const complete = questionIsComplete(question);

              return (
                <Box
                  key={question.id}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: complete
                      ? "1px solid rgba(34,197,94,.55)"
                      : "1px solid rgba(148,163,184,.35)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography fontWeight={900}>
                      {ui("Grupo")} {question.questionOrder}. {question.text}
                    </Typography>

                    <Chip
                      size="small"
                      color={complete ? "success" : "warning"}
                      label={complete ? "Completo" : "Pendiente"}
                    />
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    {ui("Valores usados:")}{" "}
                    {usedRanks.length ? usedRanks.join(", ") : "ninguno"}
                  </Typography>

                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {question.options.map((option, index) => {
                      const currentValue: number | "" =
                        answers[question.id]?.[index] ?? "";

                      return (
                        <TextField
                          key={`${question.id}-${index}`}
                          select
                          fullWidth
                          label={option}
                          value={currentValue}
                          helperText={ui("Seleccione un valor no repetido en este grupo.")}
                          onChange={(event) =>
                            updateRank(
                              question.id,
                              index,
                              Number(event.target.value)
                            )
                          }
                        >
                          {rankOptions.map((rank) => (
                            <MenuItem
                              key={rank}
                              value={rank}
                              disabled={
                                usedRanks.includes(rank) &&
                                currentValue !== rank
                              }
                            >
                              {rank}
                            </MenuItem>
                          ))}
                        </TextField>
                      );
                    })}
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          {submissionUncertain && (
            <Button
              variant="outlined"
              disabled={historyLoading}
              onClick={() => void loadHistory()}
              sx={{ mb: 2 }}
            >
              {ui("Consultar historial sin volver a enviar")}
            </Button>
          )}
          {pendingResult && (
            <Button
              variant="outlined"
              disabled={historyLoading}
              onClick={() => void checkPendingHistory()}
              sx={{ mb: 2 }}
            >
              {ui("Comprobar historial sin volver a enviar")}
            </Button>
          )}
          <Button
            fullWidth
            variant="contained"
            disabled={
              submitting ||
              !!pendingResult ||
              submissionUncertain ||
              !allQuestionsComplete
            }
            onClick={() => void submit()}
            sx={{ mt: 3, borderRadius: 3, fontWeight: 900 }}
          >
            {submitting ? "Enviando..." : "Enviar respuestas reales Kolb"}
          </Button>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 4 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
            <HistoryIcon color="primary" />
            <Typography variant="h6" fontWeight={950}>
              {ui("Historial de evaluaciones Kolb")}
            </Typography>
          </Stack>

          {historyLoading ? (
            <Stack alignItems="center" sx={{ py: 2 }}>
              <CircularProgress size={24} />
              <Typography variant="body2" sx={{ mt: 1 }}>
                {ui("Cargando historial...")}
              </Typography>
            </Stack>
          ) : history.length === 0 ? (
            <Alert severity="warning">
              {ui("Este estudiante aún no tiene evaluaciones Kolb registradas.")}
            </Alert>
          ) : (
            <Stack spacing={2}>
              {history.map((item, index) => (
                <Box
                  key={item.assessmentId}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    border: "1px solid rgba(148,163,184,.35)",
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    gap={1}
                  >
                    <Typography fontWeight={900}>
                      {index + 1}. {item.learningStyle}
                    </Typography>

                    <Chip
                      size="small"
                      label={item.instrumentVersion}
                      color="primary"
                      variant="outlined"
                    />
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    ID: {item.assessmentId} {ui("· Fecha:")}{" "}
                    {new Date(item.createdAt).toLocaleString()}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip label={`CE: ${item.scoreCE}`} />
                    <Chip label={`RO: ${item.scoreRO}`} />
                    <Chip label={`AC: ${item.scoreAC}`} />
                    <Chip label={`AE: ${item.scoreAE}`} />
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
};

