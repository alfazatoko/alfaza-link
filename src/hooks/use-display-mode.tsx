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
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  mode: "hp",
  setMode: () => {},
  theme: "light",
  toggleTheme: () => {},
  primaryColor: "#3b82f6",
  setPrimaryColor: () => {},
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

  useEffect(() => {
    localStorage.setItem("alfaza_primary_color", primaryColor);
    // Apply primary color to CSS variable
    // We need to convert hex to HSL if we want to follow the existing tailwind pattern exactly,
    // but we can also just set the variable directly if we change index.css to use it.
    document.documentElement.style.setProperty("--primary-hex", primaryColor);
    
    // For tailwind HSL support, we'll just use a simple hex to hsl conversion if needed, 
    // but setting it as a direct color is easier for "warna sesuka hati".
  }, [primaryColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <DisplayModeContext.Provider value={{ mode, setMode, theme, toggleTheme, primaryColor, setPrimaryColor }}>
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
