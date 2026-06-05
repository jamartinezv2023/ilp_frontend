import {
  Alert,
  Box,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material";
import type { AssessmentQuestion } from "../../../types/assessmentDefinition";

type IpsativeAnswer = Record<string, number>;

type IpsativeRankingQuestionProps = {
  question: AssessmentQuestion;
  value: IpsativeAnswer;
  onChange: (value: IpsativeAnswer) => void;
};

const requiredRanks = [1, 2, 3, 4];

const isValidIpsativeAnswer = (answer: IpsativeAnswer): boolean => {
  const values = Object.values(answer);

  return (
    values.length === 4 &&
    requiredRanks.every((rank) => values.includes(rank)) &&
    new Set(values).size === 4
  );
};

export const IpsativeRankingQuestion = ({
  question,
  value,
  onChange,
}: IpsativeRankingQuestionProps) => {
  const selectedValues = Object.values(value);
  const valid = isValidIpsativeAnswer(value);

  const handleChange = (optionId: string, event: SelectChangeEvent<number>) => {
    onChange({
      ...value,
      [optionId]: Number(event.target.value),
    });
  };

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 5,
        borderColor: valid ? "rgba(34,197,94,.45)" : "rgba(148,163,184,.35)",
      }}
    >
      <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6" fontWeight={950}>
              {question.questionNumber}. {question.text}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {question.helpText}
            </Typography>
          </Box>

          <Alert severity="info" variant="outlined">
            Asigne 4 a la opción que más lo representa y 1 a la que menos lo
            representa. No repita valores.
          </Alert>

          <Stack spacing={1.5}>
            {question.options.map((option) => {
              const currentValue = value[option.id];
              const duplicated =
                currentValue !== undefined &&
                selectedValues.filter((item) => item === currentValue).length > 1;

              return (
                <Card
                  key={option.id}
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    borderColor: duplicated
                      ? "rgba(239,68,68,.65)"
                      : "rgba(148,163,184,.28)",
                    bgcolor: "rgba(248,250,252,.75)",
                  }}
                >
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      alignItems={{ xs: "stretch", md: "center" }}
                      justifyContent="space-between"
                    >
                      <Box>
                        <Typography fontWeight={900}>{option.label}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Dimensión: {option.value}
                        </Typography>
                      </Box>

                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id={`${option.id}-rank-label`}>
                          Ranking
                        </InputLabel>
                        <Select
                          labelId={`${option.id}-rank-label`}
                          label="Ranking"
                          value={currentValue ?? ""}
                          onChange={(event) => handleChange(option.id, event)}
                        >
                          {requiredRanks.map((rank) => (
                            <MenuItem key={rank} value={rank}>
                              {rank}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>

          {!valid && (
            <Alert severity="warning" variant="outlined">
              Para continuar debe usar exactamente una vez los valores 1, 2, 3 y 4.
            </Alert>
          )}

          {valid && (
            <Alert severity="success" variant="outlined">
              Respuesta válida para esta pregunta.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export const validateIpsativeAnswer = isValidIpsativeAnswer;

