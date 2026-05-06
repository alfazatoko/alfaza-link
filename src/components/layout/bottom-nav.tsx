import { Link, useLocation } from "wouter";
import { Home, Clock, CreditCard, BarChart3, Settings, LogOut, History, ArrowLeft, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { LogoutConfirmModal } from "@/components/auth/logout-confirm-modal";
import { useDisplayMode, getMaxWidth } from "@/hooks/use-display-mode";

export function BottomNav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { mode } = useDisplayMode();
  const maxW = getMaxWidth(mode);

  const [isNavVisible, setIsNavVisible] = useState(true);
  const [lastClickTime, setLastClickTime] = useState(0);

  useEffect(() => {
    if (location !== "/beranda" && location !== "/owner") {
      setIsNavVisible(true);
    }
  }, [location]);

  if (location === "/") return null;

  const isOwnerMode = location.startsWith("/owner");

  const kasirNav = [
    { icon: Home, label: "Beranda", href: "/beranda" },
    { icon: Clock, label: "Riwayat", href: "/riwayat" },
    { icon: PlusCircle, label: "Isi Saldo", href: "isi-saldo", isModal: true },
    { icon: BarChart3, label: "Laporan", href: "/laporan" },
    { icon: LogOut, label: "Keluar", href: "logout", isLogout: true },
  ];

  const ownerNav = [
    { icon: Home, label: "Home", href: "/owner" },
    { icon: History, label: "Riwayat", href: "/riwayat" },
    { icon: ArrowLeft, label: "Kembali", href: "/beranda" },
    { icon: LogOut, label: "Keluar", href: "logout", isLogout: true },
  ];

  const navItems = isOwnerMode ? ownerNav : kasirNav.filter(item => {
    if (item.href === "/non-tunai" && user?.role === "owner") return false;
    return true;
  });

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  const handleBerandaClick = () => {
    const currentTime = new Date().getTime();
    if (currentTime - lastClickTime < 400) {
      setIsNavVisible(prev => !prev);
    }
    setLastClickTime(currentTime);
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 mx-auto bg-transparent flex justify-around items-end px-2 z-50 transition-colors duration-300",
        "landscape:translate-y-[2px]",
        maxW
      )}
      style={{ paddingTop: '2px', paddingBottom: 'calc(0px + env(safe-area-inset-bottom, 0px))' }}
    >
      {navItems.map((item, idx) => {
        const isActive = item.href !== "logout" && location === item.href;
        const isLogout = (item as any).isLogout;
        const isBeranda = item.href === "/beranda" || item.href === "/owner";

        if (!isNavVisible && !isBeranda) {
          return <div key={idx} className="flex-1 pointer-events-none" />;
        }

        return (
          <div key={idx} className="flex-1">
            {isLogout ? (
              <button
                onClick={handleLogout}
                className="w-full flex flex-col items-center justify-center gap-0.5"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-all">
                  <item.icon className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-bold text-red-500">{item.label}</span>
              </button>
            ) : (item as any).isModal ? (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-isi-saldo"))}
                className="w-full flex flex-col items-center justify-center gap-0.5"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/60 transition-all active:bg-gray-100">
                  <item.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-[9px] font-medium text-foreground/60">{item.label}</span>
              </button>
            ) : (
              <Link href={item.href} className="block">
                <div 
                  className="flex flex-col items-center justify-center gap-0.5 transition-all"
                  onClick={isBeranda ? handleBerandaClick : undefined}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      isActive
                        ? "bg-primary text-white -translate-y-2 scale-110 shadow-lg shadow-primary/30"
                        : "text-foreground/60 active:bg-gray-100"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive && "w-[22px] h-[22px]")} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    "text-[9px] font-medium transition-all",
                    isActive ? "font-bold text-primary" : "text-foreground/60"
                  )}>
                    {item.label}
                  </span>
                </div>
              </Link>
            )}
          </div>
        );
      })}
      
      <LogoutConfirmModal 
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={confirmLogout}
        title="Konfirmasi Keluar"
        description="Apakah Anda yakin ingin keluar dari akun ini?"
      />
    </div>

  );
}
