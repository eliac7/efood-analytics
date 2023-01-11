import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  MantineProvider,
  ColorSchemeProvider,
  ColorScheme,
} from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { useLocalStorage } from "@mantine/hooks";
import Home from "./Pages/Home/Home";
import Dashboard from "./Pages/Dashboard/Dashboard";
import NotFound from "./Pages/404/404";
import ProtectedRoutes from "./Hooks/ProtectedRoutes/ProtectedRoute";
import Background from "./Components/Background/Background";

function App() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", colorScheme === "dark");
  }, [colorScheme]);

  return (
    <MantineProvider
      withGlobalStyles
      withNormalizeCSS
      theme={{
        fontFamily: "Manrope, sans-serif",
        colorScheme,
      }}
    >
      <ColorSchemeProvider
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
      >
        <NotificationsProvider position="bottom-right" transitionDuration={200}>
          <Background />

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/" element={<ProtectedRoutes />}>
              <Route path="dashboard" element={<Dashboard />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </NotificationsProvider>
      </ColorSchemeProvider>
    </MantineProvider>
  );
}

export default App;
