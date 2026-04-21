import { useState, useEffect, createContext, useContext } from "react";

type DisplayMode = "hp" | "tablet" | "pc";
type Theme = "light" | "dark";

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  primaryColorDark: string;
  setPrimaryColorDark: (color: string) => void;
  currentPrimaryColor: string;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  mode: "hp",
  setMode: () => {},
  theme: "light",
  toggleTheme: () => {},
  primaryColor: "#3b82f6",
  setPrimaryColor: () => {},
  primaryColorDark: "#3b82f6",
  setPrimaryColorDark: () => {},
  currentPrimaryColor: "#3b82f6",
});

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem("alfaza_display_mode") as DisplayMode) || "hp";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("alfaza_theme") as Theme) || "light";
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem("alfaza_primary_color") || "#3b82f6";
  });

  const [primaryColorDark, setPrimaryColorDark] = useState(() => {
    return localStorage.getItem("alfaza_primary_color_dark") || "#60a5fa";
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

  const currentPrimaryColor = theme === "dark" ? primaryColorDark : primaryColor;

  useEffect(() => {
    localStorage.setItem("alfaza_primary_color", primaryColor);
    localStorage.setItem("alfaza_primary_color_dark", primaryColorDark);
    
    document.documentElement.style.setProperty("--primary-hex", currentPrimaryColor);
  }, [primaryColor, primaryColorDark, theme, currentPrimaryColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <DisplayModeContext.Provider value={{ 
      mode, setMode, 
      theme, toggleTheme, 
      primaryColor, setPrimaryColor,
      primaryColorDark, setPrimaryColorDark,
      currentPrimaryColor
    }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  return useContext(DisplayModeContext);
}

export function getMaxWidth(mode: DisplayMode): string {
  switch (mode) {
    case "hp": return "max-w-[450px]";
    case "tablet": return "max-w-[768px]";
    case "pc": return "max-w-full";
    default: return "max-w-[450px]";
  }
}
