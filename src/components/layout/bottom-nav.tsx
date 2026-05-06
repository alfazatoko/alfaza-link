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
        "fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-background border-t border-border z-50 flex justify-between items-center transition-all duration-300",
        "px-2 pt-1.5 pb-[calc(2px+env(safe-area-inset-bottom,0px))]",
        maxW
      )}
    >
      {navItems.map((item, idx) => {
        const isActive = item.href !== "logout" && location === item.href;
        const isLogout = (item as any).isLogout;
        const isFAB = (item as any).isModal;

        const content = (
          <>
            <item.icon size={20} className={cn(isActive ? "text-primary" : isLogout ? "text-red-500" : "text-muted-foreground")} />
            <span className={cn(
              "text-[9px] font-bold",
              isActive ? "text-primary" : isLogout ? "text-red-500" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </>
        );

        return (
          <div key={idx} className="flex-1 flex justify-center">
            {isLogout ? (
              <button onClick={handleLogout} className="flex flex-col items-center gap-0.5">
                {content}
              </button>
            ) : isFAB ? (
              <div className="relative bottom-4">
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent("open-isi-saldo"))}
                  className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white shadow-lg border-4 border-background transition-transform active:scale-90"
                >
                  <item.icon size={24} />
                </button>
              </div>
            ) : (
              <Link href={item.href} className="flex flex-col items-center gap-0.5">
                {content}
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}
