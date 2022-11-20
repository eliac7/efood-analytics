import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { NotificationsProvider } from "@mantine/notifications";
import { useState, useEffect, useMemo } from "react";
import Home from "./Pages/Home/Home";
import Results from "./Pages/Results/Results";
import NotFound from "./Pages/404/404";
import { ThemeContext } from "./Services/Context/ThemeContext";

function App() {
  const [theme, setTheme] = useState("light");
  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setTheme("dark");
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          fontFamily: "Monrope, sans-serif",
          colorScheme: theme === "dark" ? "dark" : "light",
        }}
      >
        <NotificationsProvider position="bottom-right" transitionDuration={200}>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/results" element={<Results />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </NotificationsProvider>
      </MantineProvider>
    </ThemeContext.Provider>
  );
}

export default App;
