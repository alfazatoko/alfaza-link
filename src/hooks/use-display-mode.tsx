import { useState, useEffect, createContext, useContext } from "react";

type DisplayMode = "hp" | "tablet" | "pc";
type Theme = "light" | "dark";

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  mode: "hp",
  setMode: () => {},
  theme: "light",
  toggleTheme: () => {},
});

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem("alfaza_display_mode") as DisplayMode) || "hp";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("alfaza_theme") as Theme) || "light";
  });

  useEffect(() => {
    localStorage.setItem("alfaza_display_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("alfaza_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <DisplayModeContext.Provider value={{ mode, setMode, theme, toggleTheme }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  return useContext(DisplayModeContext);
}

export function getMaxWidth(mode: DisplayMode): string {
  switch (mode) {
    case "hp": return "max-w-[500px]";
    case "tablet": return "max-w-[768px]";
    case "pc": return "max-w-[1200px]";
    default: return "max-w-[500px]";
  }
}

