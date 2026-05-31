import { Box, Card, CardContent, Typography } from "@mui/material";

export const InclusionPiarPage = () => (
  <Box>
    <Card sx={{ borderRadius: 5 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h3" fontWeight={950}>Inclusion & PIAR</Typography>
        <Typography color="text.secondary">
          Centro de inclusión para gestionar ajustes razonables, estrategias DUA,
          PIAR, evidencias pedagógicas y seguimiento de intervención.
        </Typography>
      </CardContent>
    </Card>
  </Box>
);
