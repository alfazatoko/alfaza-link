import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getSettings, type SettingsRecord } from "@/lib/firestore";
import { User, Clock, CalendarDays, Sun, Moon, Fingerprint, Monitor, Tablet, Smartphone, Cloud, Leaf, Sunset } from "lucide-react";
import { useDisplayMode } from "@/hooks/use-display-mode";

export function Header() {
  const { user, shift, loginTime, absenTime } = useAuth();
  const [clock, setClock] = useState("");
  const { mode, setMode, theme, toggleTheme, currentPrimaryColor } = useDisplayMode();

  const [settings, setSettings] = useState<SettingsRecord | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toTimeString().substring(0, 8).replace(/:/g, "."));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!user) return null;

  const today = new Date();
  const dayName = format(today, "EEEE", { locale: id });
  const dateStr = format(today, "d MMMM yyyy", { locale: id });

  const getGreeting = () => {
    const lt = loginTime || "";
    const hour = lt ? parseInt(lt.split(":")[0] || lt.split(".")[0], 10) : new Date().getHours();
    if (isNaN(hour)) return "Pagi";
    if (hour >= 3 && hour < 11) return "Pagi";
    if (hour >= 11 && hour < 15) return "Siang";
    if (hour >= 15 && hour < 18) return "Sore";
    return "Malam";
  };
  const shiftLabel = getGreeting();

  const displayModes = [
    { id: "hp" as const, icon: Smartphone, label: "HP" },
    { id: "tablet" as const, icon: Tablet, label: "Tab" },
    { id: "pc" as const, icon: Monitor, label: "PC" },
  ];

  const getThemeIcon = () => {
    switch (theme) {
      case "light": return <Sun className="w-3.5 h-3.5" />;
      case "dark": return <Moon className="w-3.5 h-3.5" />;
      case "sky-blue": return <Cloud className="w-3.5 h-3.5" />;
      case "soft-green": return <Leaf className="w-3.5 h-3.5" />;
      case "sunset-orange": return <Sunset className="w-3.5 h-3.5" />;
      default: return <Sun className="w-3.5 h-3.5" />;
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case "light": return "Mode Terang";
      case "dark": return "Mode Gelap";
      case "sky-blue": return "Mode Biru Langit";
      case "soft-green": return "Mode Soft Hijau";
      case "sunset-orange": return "Mode Sunset Orange";
      default: return "Ganti Mode";
    }
  };

  return (
    <div 
      style={{ 
        background: `linear-gradient(135deg, #004a8f 0%, #003d79 100%)`,
        boxShadow: `0 10px 25px -5px #003d7940`
      }}
      className="rounded-3xl p-4 mb-4 text-white relative overflow-hidden transition-all duration-500"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/40">
              <img src={settings?.profilePhotoUrl || `${import.meta.env.BASE_URL}alfaza-logo.png`} alt="Alfaza" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-wide leading-tight">
                {settings?.shopName || "ALFAZA LINK"}
              </h1>
              <p className="text-[10px] font-medium text-white/70 -mt-0.5">Sistem Kasir Pro</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xl font-extrabold font-mono tracking-wider">{clock}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5" />
            <span className="font-bold text-sm">{user.name}</span>
          </div>
          <div className="flex items-center gap-1 text-white/70 text-[10px]">
            <Clock className="w-3 h-3" />
            <span>Login: {loginTime || "--:--"}</span>
          </div>
          <div className="ml-auto bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
            <Fingerprint className="w-3 h-3" />
            Absen: {absenTime || "--:--"}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-[11px] text-white/80">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{dayName}, {dateStr}</span>
            </div>
            <div className="flex items-center gap-1">
              {shiftLabel === "Pagi" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              <span>{shiftLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all rounded-full w-8 h-8 border border-white/10 shadow-inner"
              title={getThemeTitle()}
            >
              {getThemeIcon()}
            </button>

            <button
              onClick={() => {
                const modes: ("hp" | "tablet" | "pc")[] = ["hp", "tablet", "pc"];
                const nextIndex = (modes.indexOf(mode) + 1) % modes.length;
                setMode(modes[nextIndex]);
              }}
              className="flex items-center justify-center bg-black/10 hover:bg-black/20 transition-all rounded-full w-8 h-8 border border-white/10 shadow-inner"
              title={`Ukuran: ${mode === 'hp' ? 'Kecil' : mode === 'tablet' ? 'Sedang' : 'Besar'}`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
