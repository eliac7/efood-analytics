import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
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
import { UserContextProvider } from "./Services/UserContext/UserContext";
function App() {
  const [colorScheme, setColorScheme] = useLocalStorage<ColorScheme>({
    key: "mantine-color-scheme",
    defaultValue: "light",
    getInitialValueInEffect: true,
  });

  const toggleColorScheme = (value?: ColorScheme) => {
    setColorScheme(value || (colorScheme === "dark" ? "light" : "dark"));
    document.documentElement.classList.toggle("dark", colorScheme === "dark");
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", colorScheme === "dark");
  }, [colorScheme]);

  return (
    <ColorSchemeProvider
      colorScheme={colorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          fontFamily: "Roboto, sans-serif",
          colorScheme,
        }}
      >
        <NotificationsProvider position="bottom-right" transitionDuration={200}>
          <UserContextProvider>
            <Router>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Router>
          </UserContextProvider>
        </NotificationsProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
}

export default App;
