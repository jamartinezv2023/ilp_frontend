import { Box, Card, CardContent, Typography } from "@mui/material";

export const FamilyEngagementPage = () => (
  <Box>
    <Card sx={{ borderRadius: 5 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h3" fontWeight={950}>Family Engagement</Typography>
        <Typography color="text.secondary">
          Espacio para comunicar avances, recomendaciones de acompañamiento y
          seguimiento educativo a familias y acudientes.
        </Typography>
      </CardContent>
    </Card>
  </Box>
);
