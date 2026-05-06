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
        "fixed bottom-0 left-0 right-0 mx-auto bg-white flex justify-evenly items-center z-50 transition-all duration-300 ease-in-out overflow-hidden",
        "rounded-t-[28px] shadow-[0_-4px_18px_rgba(0,0,0,.08)]",
        "h-[82px] pb-[env(safe-area-inset-bottom,0px)]",
        "landscape:h-[56px] landscape:pb-0 landscape:rounded-none landscape:shadow-[0_-2px_10px_rgba(0,0,0,.05)]",
        maxW
      )}
    >
      {navItems.map((item, idx) => {
        const isActive = item.href !== "logout" && location === item.href;
        const isLogout = (item as any).isLogout;
        const isBeranda = item.href === "/beranda" || item.href === "/owner";

        if (!isNavVisible && !isBeranda) {
          return <div key={idx} className="flex-1 pointer-events-none" />;
        }

        return (
          <div key={idx} className="flex-1 overflow-hidden">
            {isLogout ? (
              <button
                onClick={handleLogout}
                className="w-full flex flex-col landscape:flex-row items-center justify-center gap-[6px] landscape:gap-[5px] overflow-hidden whitespace-nowrap"
              >
                <item.icon className="shrink-0 w-[26px] h-[26px] landscape:w-[18px] landscape:h-[18px] text-[#ff3152]" strokeWidth={2} />
                <span className="overflow-hidden text-ellipsis text-[14px] landscape:text-[11px] font-semibold text-[#ff3152]">{item.label}</span>
              </button>
            ) : (item as any).isModal ? (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-isi-saldo"))}
                className="w-full flex flex-col landscape:flex-row items-center justify-center gap-[6px] landscape:gap-[5px] overflow-hidden whitespace-nowrap"
              >
                <item.icon className="shrink-0 w-[26px] h-[26px] landscape:w-[18px] landscape:h-[18px] text-[#777]" strokeWidth={2} />
                <span className="overflow-hidden text-ellipsis text-[14px] landscape:text-[11px] font-semibold text-[#777]">{item.label}</span>
              </button>
            ) : (
              <Link href={item.href} className="block overflow-hidden">
                <div 
                  className="flex flex-col landscape:flex-row items-center justify-center gap-[6px] landscape:gap-[5px] transition-all overflow-hidden whitespace-nowrap"
                  onClick={isBeranda ? handleBerandaClick : undefined}
                >
                  <item.icon 
                    className={cn(
                      "shrink-0 w-[26px] h-[26px] landscape:w-[18px] landscape:h-[18px] transition-colors",
                      isActive ? "text-[#2f7cff]" : "text-[#777]"
                    )} 
                    strokeWidth={2}
                  />
                  <span className={cn(
                    "overflow-hidden text-ellipsis text-[14px] landscape:text-[11px] font-semibold transition-colors",
                    isActive ? "text-[#2f7cff]" : "text-[#777]"
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
