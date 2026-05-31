import { Box, Card, CardContent, Typography } from "@mui/material";

export const StudentSupportPage = () => (
  <Box>
    <Card sx={{ borderRadius: 5 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h3" fontWeight={950}>Student Support</Typography>
        <Typography color="text.secondary">
          Perfil educativo del estudiante: caracterización, estilos de aprendizaje,
          orientación vocacional, apoyos e historial longitudinal.
        </Typography>
      </CardContent>
    </Card>
  </Box>
);
