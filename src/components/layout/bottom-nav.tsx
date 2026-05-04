import { Link, useLocation } from "wouter";
import { Home, Clock, CreditCard, BarChart3, Settings, LogOut, History, ArrowLeft, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { LogoutConfirmModal } from "@/components/auth/logout-confirm-modal";
import { useDisplayMode, getMaxWidth } from "@/hooks/use-display-mode";

export function BottomNav() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
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

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 mx-auto bg-card border-t border-border flex justify-around px-1 py-0.5 pb-1 shadow-[0_-2px_15px_rgba(0,0,0,0.06)] dark:shadow-none z-50 transition-colors duration-300",
      maxW
    )}>
      {navItems.map((item, idx) => {
        const isActive = item.href !== "logout" && location === item.href;
        const isLogout = (item as any).isLogout;
        return (
          <div key={idx} className="flex-1">
            {isLogout ? (
              <button
                onClick={handleLogout}
                className="w-full flex flex-col items-center justify-center py-0.5 gap-0"
              >
                <div className="p-1 rounded-xl transform -translate-y-1">
                  <item.icon className="w-5 h-5 text-red-500" strokeWidth={2.5} />
                </div>
                <span className="text-[9px] font-bold text-red-500 -mt-1">{item.label}</span>
              </button>
            ) : (item as any).isModal ? (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("open-isi-saldo"))}
                className="w-full flex flex-col items-center justify-center py-0.5 gap-0"
              >
                <div className="p-1 rounded-xl text-foreground opacity-70 transform -translate-y-1">
                  <item.icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <span className="text-[9px] font-medium text-foreground opacity-70 -mt-1">{item.label}</span>
              </button>
            ) : (
              <Link href={item.href} className="block">
                <div
                  className={cn(
                    "flex flex-col items-center justify-center py-0.5 gap-0 rounded-xl transition-all",
                    isActive ? "text-primary" : "text-foreground opacity-70"
                  )}
                >
                  <div
                    className={cn(
                      "p-1 rounded-xl transition-all transform",
                      isActive ? "bg-primary/10 text-primary -translate-y-2.5 scale-110 shadow-sm" : "-translate-y-1"
                    )}
                  >
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  </div>
                  <span className={cn("text-[9px] font-medium -mt-1", isActive && "font-bold text-primary translate-y-[-2px]")}>
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
