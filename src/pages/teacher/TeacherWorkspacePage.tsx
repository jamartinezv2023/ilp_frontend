import { Box, Card, CardContent, Typography } from "@mui/material";

export const TeacherWorkspacePage = () => (
  <Box>
    <Card sx={{ borderRadius: 5 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h3" fontWeight={950}>Teacher Workspace</Typography>
        <Typography color="text.secondary">
          Espacio docente para consultar estudiantes, recomendaciones pedagógicas,
          estrategias DUA y seguimiento de aula.
        </Typography>
      </CardContent>
    </Card>
  </Box>
);
