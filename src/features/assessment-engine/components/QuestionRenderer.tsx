import {
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import type { AssessmentQuestion } from "../../../types/assessmentDefinition";

type QuestionRendererProps = {
  question: AssessmentQuestion;
};

export const QuestionRenderer = ({ question }: QuestionRendererProps) => {
  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 4,
        borderColor: "rgba(148,163,184,.35)",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Chip
              label={`Question ${question.questionNumber}`}
              color="primary"
              size="small"
            />
            <Chip
              label={question.questionType}
              variant="outlined"
              size="small"
            />
            <Chip
              label={question.dimension}
              variant="outlined"
              size="small"
            />
          </Stack>

          <Typography variant="h6" fontWeight={950}>
            {question.text}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {question.helpText}
          </Typography>

          <Stack spacing={1}>
            {question.options.map((option) => (
              <Card
                key={option.id}
                variant="outlined"
                sx={{ borderRadius: 3, bgcolor: "rgba(248,250,252,.8)" }}
              >
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    spacing={2}
                    alignItems="center"
                  >
                    <Typography fontWeight={800}>{option.label}</Typography>
                    <Chip label={option.value} size="small" />
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
};

