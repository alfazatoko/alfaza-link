import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Home, Clock, CreditCard, BarChart3, Settings, LogOut, History, ArrowLeft, PlusCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useDisplayMode, getMaxWidth } from "@/hooks/use-display-mode";

export function BottomNav() {
  const [location] = useLocation();
  const { logout } = useAuth();
  const { mode } = useDisplayMode();
  const maxW = getMaxWidth(mode);
  const [isHidden, setIsHidden] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
    <>
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full bg-background border-t border-border z-[9999] flex justify-between items-center transition-transform duration-300",
          isHidden ? "translate-y-full" : "translate-y-0",
          "px-2 pt-0.5 pb-[max(2px,env(safe-area-inset-bottom,0px))] landscape:pb-0 landscape:-mb-8", 
          maxW
        )}
      >
        {/* Tombol Sembunyikan Melayang di Kanan Atas Navigasi */}
        <button 
          onClick={() => setIsHidden(true)}
          className="absolute -top-7 right-2 w-7 h-7 bg-white dark:bg-card border border-border rounded-full flex items-center justify-center shadow-md text-muted-foreground hover:text-primary z-50 transition-colors"
          title="Sembunyikan Navigasi"
        >
          <ChevronDown size={16} />
        </button>

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
                <button onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center justify-center w-full">
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

      {/* Tombol Tampilkan Kembali Saat Disembunyikan */}
      {isHidden && (
        <div className={cn("fixed bottom-4 left-1/2 -translate-x-1/2 w-full z-[9999] pointer-events-none", maxW)}>
          <div className="absolute bottom-0 right-4 pointer-events-auto">
            <button
              onClick={() => setIsHidden(false)}
              className="w-10 h-10 bg-white dark:bg-card border border-border text-primary rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
              title="Tampilkan Navigasi"
            >
              <ChevronUp size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Keluar */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className={cn("bg-background rounded-2xl p-6 w-full shadow-2xl text-center border border-border/50", maxW)}>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut size={28} />
            </div>
            <h3 className="text-lg font-bold mb-2">Konfirmasi Keluar</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Apakah Anda yakin ingin keluar dari sesi ini? Anda harus masuk kembali untuk melanjutkan.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 px-4 rounded-xl font-semibold border border-border hover:bg-accent transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 py-3 px-4 rounded-xl font-semibold bg-red-500 text-white shadow-md hover:bg-red-600 transition-colors"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
