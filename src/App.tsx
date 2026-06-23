import { LoginPage } from "./features/auth/pages/LoginPage";
import { AppShell } from "./layouts/AppShell";
import { useAppSelector } from "./store/hooks";

function App() {
  const accessToken = useAppSelector((state) => state.auth.accessToken);

  return accessToken ? <AppShell /> : <LoginPage />;
}

export default App;

