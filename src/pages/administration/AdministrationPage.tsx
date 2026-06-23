import { Box, Card, CardContent, Typography } from "@mui/material";

export const AdministrationPage = () => (
  <Box>
    <Card sx={{ borderRadius: 5 }}>
      <CardContent sx={{ p: 4 }}>
        <Typography variant="h3" fontWeight={950}>Administration</Typography>
        <Typography color="text.secondary">
          Administración de usuarios, roles, permisos y configuración institucional.
        </Typography>
      </CardContent>
    </Card>
  </Box>
);

