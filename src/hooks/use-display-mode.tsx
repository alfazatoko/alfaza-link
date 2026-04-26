import { useState, useEffect, createContext, useContext } from "react";

type DisplayMode = "hp" | "tablet" | "pc";
type Theme = "light" | "dark" | "sky-blue" | "soft-green" | "sunset-orange";

type ThemeColors = {
  "light": string;
  "dark": string;
  "sky-blue": string;
  "soft-green": string;
  "sunset-orange": string;
};

const defaultThemeColors: ThemeColors = {
  "light": "#3b82f6",
  "dark": "#3b82f6",
  "sky-blue": "#0ea5e9",
  "soft-green": "#22c55e",
  "sunset-orange": "#f97316"
};

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  themeColors: ThemeColors;
  setThemeColor: (theme: Theme, color: string) => void;
  currentPrimaryColor: string;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  mode: "hp",
  setMode: () => {},
  theme: "light",
  toggleTheme: () => {},
  themeColors: defaultThemeColors,
  setThemeColor: () => {},
  currentPrimaryColor: "#3b82f6",
});

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem("alfaza_display_mode") as DisplayMode) || "hp";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("alfaza_theme") as Theme) || "light";
  });

  const [themeColors, setThemeColors] = useState<ThemeColors>(() => {
    const saved = localStorage.getItem("alfaza_theme_colors");
    if (saved) {
      try {
        return { ...defaultThemeColors, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaultThemeColors;
  });

  useEffect(() => {
    localStorage.setItem("alfaza_display_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("alfaza_theme", theme);
    const root = document.documentElement;
    root.classList.remove("light", "dark", "sky-blue", "soft-green", "sunset-orange");
    root.classList.add(theme);
  }, [theme]);

  const currentPrimaryColor = themeColors[theme] || defaultThemeColors[theme];

  useEffect(() => {
    document.documentElement.style.setProperty("--primary-hex", currentPrimaryColor);
  }, [currentPrimaryColor]);

  const toggleTheme = () => {
    const themes: Theme[] = ["light", "dark", "sky-blue", "soft-green", "sunset-orange"];
    setTheme(prev => {
      const currentIndex = themes.indexOf(prev);
      const nextIndex = (currentIndex + 1) % themes.length;
      return themes[nextIndex];
    });
  };

  const setThemeColor = (t: Theme, color: string) => {
    setThemeColors(prev => {
      const next = { ...prev, [t]: color };
      localStorage.setItem("alfaza_theme_colors", JSON.stringify(next));
      return next;
    });
  };

  return (
    <DisplayModeContext.Provider value={{ 
      mode, setMode, 
      theme, toggleTheme, 
      themeColors, setThemeColor,
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
