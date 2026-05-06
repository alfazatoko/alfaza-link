import { Link, useLocation } from "wouter";
import { Home, Clock, CreditCard, BarChart3, Settings, LogOut, History, ArrowLeft, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useDisplayMode, getMaxWidth } from "@/hooks/use-display-mode";

export function BottomNav() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { mode } = useDisplayMode();
  const maxW = getMaxWidth(mode);

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

  const navItems = isOwnerMode ? ownerNav : kasirNav;

  const handleLogout = () => {
    logout();
    window.location.href = import.meta.env.BASE_URL || "/";
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-background border-t border-border z-[9999] flex justify-between items-center",
        "px-2 pt-0.5 pb-[max(2px,env(safe-area-inset-bottom,0px))] landscape:pb-0 landscape:-mb-8", 
        maxW
      )}
    >
      {navItems.map((item, idx) => {
        const isActive = item.href !== "logout" && location === item.href;
        const isLogout = (item as any).isLogout;
        const isFAB = (item as any).isModal;

        const content = (
          <>
            <div className={cn(
              "flex items-center justify-center rounded-full transition-all",
              isActive ? "w-9 h-9 bg-primary -translate-y-1" : "w-7 h-7"
            )}>
              <item.icon size={16} className={cn(isActive ? "text-white" : isLogout ? "text-red-500" : "text-black")} />
            </div>
            <span className={cn(
              "text-[9px] font-bold mt-0.5",
              isActive ? "text-primary" : isLogout ? "text-red-500" : "text-black"
            )}>
              {item.label}
            </span>
          </>
        );

        return (
          <div key={idx} className="flex-1 flex justify-center">
            {isLogout ? (
              <button onClick={handleLogout} className="flex flex-col items-center justify-center w-full">
                {content}
              </button>
            ) : isFAB ? (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent("open-isi-saldo"))}
                className="flex flex-col items-center justify-center w-full"
              >
                <div className="w-7 h-7 flex items-center justify-center">
                  <item.icon size={16} className="text-black" />
                </div>
                <span className="text-[9px] font-bold mt-0.5 text-black">Isi Saldo</span>
              </button>
            ) : (
              <Link href={item.href} className="flex flex-col items-center justify-center w-full">
                {content}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
