import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import {
  MantineProvider,
  createTheme,
  type MantineColorSchemeManager,
} from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import Home from "./Pages/Home/Home";
import Dashboard from "./Pages/Dashboard/Dashboard";
import NotFound from "./Pages/404/404";
import ProtectedRoutes from "./Hooks/ProtectedRoutes/ProtectedRoute";
import Background from "./Components/Background/Background";

const theme = createTheme({
  fontFamily: "Manrope, sans-serif",
});

const colorSchemeManager: MantineColorSchemeManager = {
  get: () => {
    if (typeof window === "undefined") return "light";
    return (localStorage.getItem("mantine-color-scheme") as "light" | "dark") || "light";
  },
  set: (value) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mantine-color-scheme", value);
    }
  },
  subscribe: () => () => { },
  unsubscribe: () => { },
  clear: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("mantine-color-scheme");
    }
  },
};

function App() {
  useEffect(() => {
    const storedScheme = localStorage.getItem("mantine-color-scheme") || "light";
    document.documentElement.classList.toggle("dark", storedScheme === "dark");
  }, []);

  return (
    <MantineProvider
      theme={theme}
      colorSchemeManager={colorSchemeManager}
    >
      <Notifications position="bottom-right" />
      <Background />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/" element={<ProtectedRoutes />}>
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MantineProvider>
  );
}

export default App;
