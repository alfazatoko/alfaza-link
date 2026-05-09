import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { AddSaldoModal } from "@/components/modals/add-saldo-modal";
import { getBalance, createTransaction, getSettings, type BalanceRecord, type SettingsRecord } from "@/lib/firestore";
import { formatRupiah, formatThousands, parseThousands, getWibDate, forceUpdateApp } from "@/lib/utils";
import { Landmark, Wallet, ArrowDownToLine, Gem, RefreshCw, Send, Lock, Save, Settings, SlidersHorizontal, SmartphoneNfc, NotebookPen, ListPlus, Receipt, X, Home, FileText, Ticket, CalendarDays, CalendarCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_QUOTES = [
  "Kerja keras hari ini, kemudahan esok hari",
  "Semangat adalah kunci keberhasilan",
  "Pelayanan terbaik adalah investasi terbaik",
];

const CATEGORIES = [
  { id: "BANK", label: "Bank", icon: Landmark, activeColor: "bg-primary text-white shadow-primary/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },
  { id: "FLIP", label: "Flip", icon: RefreshCw, activeColor: "bg-orange-500 text-white shadow-orange-500/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },
  { id: "APP PULSA", label: "App", icon: Send, activeColor: "bg-purple-600 text-white shadow-purple-600/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },
  { id: "DANA", label: "Dana", icon: Wallet, activeColor: "bg-sky-500 text-white shadow-sky-500/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },
  { id: "TARIK TUNAI", label: "Tarik", icon: ArrowDownToLine, activeColor: "bg-emerald-600 text-white shadow-emerald-600/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },
  { id: "AKSESORIS", label: "Aks", icon: Gem, activeColor: "bg-rose-500 text-white shadow-rose-500/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },
];

export default function Beranda() {
  const { user, shift } = useAuth();
  const [, setLocation] = useLocation();
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
  const [category, setCategory] = useState("BANK");
  const [nominalDisplay, setNominalDisplay] = useState("");
  const [adminDisplay, setAdminDisplay] = useState("");
  const [isAdminNonTunai, setIsAdminNonTunai] = useState(false);
  const [keterangan, setKeterangan] = useState("");
  const [balance, setBalance] = useState<BalanceRecord | null>(null);
  const [shopSettings, setShopSettings] = useState<SettingsRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [isPenyesuaianModalOpen, setIsPenyesuaianModalOpen] = useState(false);
  const [showLainnyaMenu, setShowLainnyaMenu] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const nominalRef = useRef<HTMLInputElement>(null);
  const adminRef = useRef<HTMLInputElement>(null);
  const ketRef = useRef<HTMLInputElement>(null);
  const nonTunaiRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  const loadBalance = useCallback(async () => {
    if (!user?.name) return;
    try {
      const bal = await getBalance(user.name);
      setBalance(bal);
    } catch {}
  }, [user?.name]);

  useEffect(() => {
    loadBalance();
    getSettings().then(setShopSettings).catch(() => {});
    
    const openIsiSaldo = () => setIsSaldoModalOpen(true);
    window.addEventListener("open-isi-saldo", openIsiSaldo);

    // MENGUBAH REFRESH OTOMATIS MENJADI 1 MENIT (Sebelumnya 5 detik, bikin kuota cepat habis!)
    const interval = setInterval(loadBalance, 60000);

    const onUpdate = () => setUpdateAvailable(true);
    window.addEventListener("pwa-update-available", onUpdate);

    // Refresh saldo segera setelah tambah saldo berhasil
    const onSaldoUpdated = () => loadBalance();
    window.addEventListener("saldo-updated", onSaldoUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener("open-isi-saldo", openIsiSaldo);
      window.removeEventListener("pwa-update-available", onUpdate);
      window.removeEventListener("saldo-updated", onSaldoUpdated);
    };
  }, [loadBalance]);

  const [mutiaraIndex] = useState(() => Math.floor(Math.random() * 100));

  const getMutiaraQuote = () => {
    const quotesStr = shopSettings?.mutiaraQuotes || "";
    const customQuotes = quotesStr.split("\n").map(q => q.trim()).filter(q => q.length > 0);
    const allQuotes = customQuotes.length > 0 ? customQuotes : DEFAULT_QUOTES;
    return allQuotes[mutiaraIndex % allQuotes.length];
  };
  
  const handleProses = useCallback(async () => {
    if (!user) return;
    const now = new Date();
    const dateStr = getWibDate();
    const timeStr = now.toTimeString().substring(0, 5);
    const n = parseInt(parseThousands(nominalDisplay));
    const a = parseInt(parseThousands(adminDisplay)) || 0;
    if (!n || n <= 0) {
      toast({ title: "Nominal harus diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await createTransaction({
        kasirName: user.name,
        category,
        keterangan,
        transDate: dateStr,
        transTime: timeStr,
        paymentMethod: "tunai",
        shift: shift || "NORMAL",
        nominal: n,
        admin: a,
        adminNonTunai: isAdminNonTunai,
        nominalTunai: n,
        adminTunai: a,
      });
      toast({ title: "Transaksi berhasil disimpan" });
      setNominalDisplay("");
      setAdminDisplay("");
      setIsAdminNonTunai(false);
      setKeterangan("");
      ketRef.current?.focus();
      await loadBalance();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan transaksi", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, nominalDisplay, adminDisplay, isAdminNonTunai, category, keterangan, toast, loadBalance]);

  const handleUpdate = useCallback(() => {
    if (confirm("Perbarui aplikasi ke versi terbaru? Halaman akan dibersihkan dan dimuat ulang secara paksa.")) {
      forceUpdateApp();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;
      if (isInput) return;

      const catIdx = CATEGORIES.findIndex(c => c.id === category);
      if (e.key === "ArrowLeft" && catIdx > 0) {
        e.preventDefault();
        setCategory(CATEGORIES[catIdx - 1].id);
      } else if (e.key === "ArrowRight" && catIdx < CATEGORIES.length - 1) {
        e.preventDefault();
        setCategory(CATEGORIES[catIdx + 1].id);
      } else if (e.key === "ArrowUp" && catIdx >= 3) {
        e.preventDefault();
        setCategory(CATEGORIES[catIdx - 3].id);
      } else if (e.key === "ArrowDown" && catIdx + 3 < CATEGORIES.length) {
        e.preventDefault();
        setCategory(CATEGORIES[catIdx + 3].id);
      } else if (e.key === "Tab") {
        e.preventDefault();
        const nextIdx = (catIdx + 1) % CATEGORIES.length;
        setCategory(CATEGORIES[nextIdx].id);
      } else if (e.key === "Enter") {
        e.preventDefault();
        ketRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [category]);

  return (
    <div className="px-3 pt-3 pb-2">
      <Header />

      {shopSettings?.runningText && (
        <div className="overflow-hidden mb-3">
          <div className="running-text text-red-600 text-sm font-bold text-center">
            {shopSettings.runningText}
          </div>
        </div>
      )}

      {/* Main Balance Card (Bank & Cash) */}
      <div 
        className="rounded-3xl p-4 text-gray-950 shadow-lg relative overflow-hidden mb-4 border border-blue-200/30"
        style={{ 
          background: (shopSettings?.balanceColors?.bank && shopSettings?.balanceColors?.bank !== '#ffffff') || (shopSettings?.balanceColors?.cash && shopSettings?.balanceColors?.cash !== '#ffffff')
            ? `linear-gradient(135deg, ${shopSettings?.balanceColors?.bank || '#3b82f6'}, ${shopSettings?.balanceColors?.cash || shopSettings?.balanceColors?.bank || '#60a5fa'})`
            : 'linear-gradient(135deg, #3b82f6, #60a5fa, #fb923c)',
          backgroundImage: (!shopSettings?.balanceColors?.bank || shopSettings?.balanceColors?.bank === '#ffffff') && (!shopSettings?.balanceColors?.cash || shopSettings?.balanceColors?.cash === '#ffffff')
            ? undefined 
            : undefined // Always use background style for gradients
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-orange-200/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Top 2 Main Balances */}
        <div className="grid grid-cols-2 gap-0 relative z-10">
          <div className="p-2">
            <p className="text-[10px] font-bold text-gray-800/80 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
              <Landmark className="w-3.5 h-3.5" /> Saldo Bank
            </p>
            <h3 className="text-xl font-black tracking-tighter whitespace-nowrap">{(balance?.bank || 0).toLocaleString('id-ID')}</h3>
          </div>
          <div className="p-2 pl-4 border-l border-black/10">
            <p className="text-[10px] font-bold text-gray-800/80 mb-1 flex items-center gap-1.5 uppercase tracking-wide">
              <Wallet className="w-3.5 h-3.5" /> Saldo Cash
            </p>
            <h3 className="text-xl font-black tracking-tighter whitespace-nowrap">{(balance?.cash || 0).toLocaleString('id-ID')}</h3>
          </div>
        </div>

        {/* Bottom 3 Secondary Balances */}
        <div className="grid grid-cols-3 gap-0 pt-3 border-t border-black/10 relative z-10 mt-2">
          <div className="p-1 px-1.5">
            <span className="text-[8px] font-bold text-gray-700/80 uppercase flex items-center gap-1 mb-1">
              <ArrowDownToLine className="w-2.5 h-2.5" /> Tarik Tunai
            </span>
            <span className="text-[10px] font-black whitespace-nowrap">{formatRupiah(balance?.tarik || 0)}</span>
          </div>
          <div className="p-1 px-1.5 pl-3 border-l border-black/10">
            <span className="text-[8px] font-bold text-gray-700/80 uppercase flex items-center gap-1 mb-1">
              <Gem className="w-2.5 h-2.5" /> Aksesoris
            </span>
            <span className="text-[10px] font-black whitespace-nowrap">{formatRupiah(balance?.aks || 0)}</span>
          </div>
          <div className="p-1 px-1.5 pl-3 border-l border-black/10">
            <span className="text-[8px] font-bold text-gray-700/80 uppercase flex items-center gap-1 mb-1">
              <RefreshCw className="w-2.5 h-2.5" /> Admin
            </span>
            <span className="text-[10px] font-black whitespace-nowrap">
              {formatRupiah(balance?.adminTotal || 0)}
              {balance?.adminNonTunaiTotal ? (
                <span className="text-purple-700"> / {(balance.adminNonTunaiTotal).toLocaleString('id-ID')}</span>
              ) : null}
            </span>
          </div>
        </div>
      </div>


      <div className="grid grid-cols-5 gap-2 mb-4">
        <button 
          onClick={() => setIsPenyesuaianModalOpen(true)} 
          className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md border border-gray-100"
        >
          <SlidersHorizontal className="w-5 h-5 text-[#1a5276] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          <span className="text-[8px] font-bold text-[#1a5276] uppercase tracking-wide">Sesuaian</span>
        </button>
        <button 
          onClick={() => setLocation("/non-tunai")} 
          className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md border border-gray-100"
        >
          <SmartphoneNfc className="w-5 h-5 text-[#1e8449] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          <span className="text-[8px] font-bold text-[#1e8449] uppercase tracking-wide">Non Tunai</span>
        </button>
        <button 
          onClick={() => setLocation("/catatan")} 
          className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md border border-gray-100"
        >
          <NotebookPen className="w-5 h-5 text-[#d35400] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          <span className="text-[8px] font-bold text-[#d35400] uppercase tracking-wide">Catatan</span>
        </button>
        <button 
          onClick={() => setLocation("/absen")} 
          className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md border border-gray-100"
        >
          <CalendarCheck className="w-5 h-5 text-[#b71c1c] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          <span className="text-[8px] font-bold text-[#b71c1c] uppercase tracking-wide">Absen</span>
        </button>
        <button 
          onClick={() => setShowLainnyaMenu(!showLainnyaMenu)} 
          className={`flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md ring-2 ring-offset-1 ${showLainnyaMenu ? 'ring-[#7d3c98]/60 bg-purple-50' : 'ring-transparent border border-gray-100'}`}
        >
          <ListPlus className="w-5 h-5 text-[#7d3c98] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
          <span className="text-[8px] font-bold text-[#7d3c98] uppercase tracking-wide">Lainnya</span>
        </button>
      </div>

      {showLainnyaMenu && (
        <div className="mb-4 p-2 bg-purple-50/80 backdrop-blur-sm rounded-2xl border-2 border-[#7d3c98]/15 shadow-inner">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[9px] font-black text-[#7d3c98] uppercase tracking-widest">Menu Lainnya</span>
            <button onClick={() => setShowLainnyaMenu(false)} className="p-0.5 rounded-full hover:bg-purple-200/60 transition">
              <X className="w-3.5 h-3.5 text-[#7d3c98]" />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            <button
              onClick={() => { setLocation("/beranda"); setShowLainnyaMenu(false); }}
              className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md ring-2 ring-blue-200 ring-offset-1"
            >
              <Home className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" strokeWidth={1.8} />
              <span className="text-[8px] font-bold text-blue-600 uppercase tracking-wide">Beranda</span>
            </button>
            <button
              onClick={() => { setLocation("/nota"); setShowLainnyaMenu(false); }}
              className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md ring-2 ring-[#b71c1c]/20 ring-offset-1"
            >
              <FileText className="w-5 h-5 text-[#b71c1c] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
              <span className="text-[8px] font-bold text-[#b71c1c] uppercase tracking-wide">Nota</span>
            </button>
            <button
              onClick={() => { setLocation("/stok-voucher"); setShowLainnyaMenu(false); }}
              className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md ring-2 ring-emerald-200 ring-offset-1"
            >
              <Ticket className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" strokeWidth={1.8} />
              <span className="text-[8px] font-bold text-emerald-600 uppercase tracking-wide">Stok Voucher</span>
            </button>
            <button
              onClick={() => { setLocation("/kalender"); setShowLainnyaMenu(false); }}
              className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md ring-2 ring-orange-200 ring-offset-1"
            >
              <CalendarDays className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" strokeWidth={1.8} />
              <span className="text-[8px] font-bold text-orange-600 uppercase tracking-wide">Kalender</span>
            </button>
            <button
              onClick={() => { handleUpdate(); setShowLainnyaMenu(false); }}
              className="flex flex-col items-center justify-center gap-1.5 h-[65px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md ring-2 ring-gray-200 ring-offset-1 bg-gray-50"
            >
              <RefreshCw className="w-5 h-5 text-gray-600 group-hover:scale-110 transition-transform" strokeWidth={1.8} />
              <span className="text-[8px] font-bold text-gray-600 uppercase tracking-wide">Perbarui</span>
            </button>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white text-center py-2 rounded-xl mb-3 text-[11px] font-bold">
        {getMutiaraQuote()}
      </div>

      <div className="grid grid-cols-6 gap-2 mb-3 px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setCategory(cat.id);
                  // Optional: auto-focus Keterangan on click might be too aggressive, 
                  // but user asked for Enter functionality.
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setCategory(cat.id);
                    ketRef.current?.focus();
                  }
                }}
                className="flex flex-col items-center gap-1 transition-all outline-none"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all duration-300 ${isActive ? cat.activeColor + ' shadow-lg scale-110' : 'bg-white text-gray-400 border border-gray-100 hover:border-gray-300'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 1.8} />
                </div>
                <span className={`text-[10px] font-black tracking-tight transition-colors ${isActive ? 'text-gray-900' : 'text-gray-400'}`}>{cat.label}</span>
              </button>
            );
          })}
      </div>

      {user?.role === "owner" && (
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border text-center">
          <button
            onClick={() => setLocation("/owner")}
            className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition"
          >
            <Settings className="w-4 h-4" />
            BUKA PANEL OWNER
          </button>
        </div>
      )}

      <div className={`rounded-3xl p-5 shadow-xl border-2 transition-all duration-500 mt-3 ${
        category === 'BANK' ? 'bg-blue-50/40 border-blue-200 shadow-blue-500/5' :
        category === 'FLIP' ? 'bg-orange-50/40 border-orange-200 shadow-orange-500/5' :
        category === 'APP PULSA' ? 'bg-purple-50/40 border-purple-200 shadow-purple-600/5' :
        category === 'DANA' ? 'bg-sky-50/40 border-sky-200 shadow-sky-500/5' :
        category === 'TARIK TUNAI' ? 'bg-emerald-50/40 border-emerald-200 shadow-emerald-600/5' :
        category === 'AKSESORIS' ? 'bg-rose-50/40 border-rose-200 shadow-rose-500/5' :
        'bg-card border-border'
      }`}>
        <div className="space-y-3.5 mb-5">
          <div className="flex items-center gap-3 border border-black/10 rounded-2xl px-4 h-12 bg-white/80 backdrop-blur-sm shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="text-blue-500 text-lg">📝</span>
            <input
              ref={ketRef}
              placeholder="Keterangan transaksi..."
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); nominalRef.current?.focus(); } }}
              className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>
          <div className="flex items-center gap-3 border border-black/10 rounded-2xl px-4 h-14 bg-white/80 backdrop-blur-sm shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="text-primary font-black text-lg">Rp</span>
            <input
              ref={nominalRef}
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={nominalDisplay}
              onChange={(e) => setNominalDisplay(formatThousands(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adminRef.current?.focus(); } }}
              className="flex-1 bg-transparent outline-none text-xl font-black text-gray-900 placeholder:text-gray-300 placeholder:font-normal"
            />
          </div>
          <div className="flex items-center justify-between border border-black/10 rounded-2xl pr-3 h-12 bg-white/80 backdrop-blur-sm shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all overflow-hidden">
            <div className="flex items-center gap-3 px-4 flex-1 h-full">
              <span className="text-amber-500 font-black text-lg">Rp</span>
              <input
                ref={adminRef}
                type="text"
                inputMode="numeric"
                placeholder="Admin"
                value={adminDisplay}
                onChange={(e) => setAdminDisplay(formatThousands(e.target.value))}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); nonTunaiRef.current?.focus(); } }}
                className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal w-full h-full"
              />
            </div>
            <label className="flex items-center gap-2 border-l border-black/10 pl-4 cursor-pointer h-full group active:bg-gray-100 transition-colors">
              <span className="text-[10px] font-black text-purple-700 uppercase tracking-tighter">Non Tunai</span>
              <input 
                ref={nonTunaiRef}
                type="checkbox" 
                checked={isAdminNonTunai}
                onChange={e => setIsAdminNonTunai(e.target.checked)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleProses(); } }}
                className="w-4.5 h-4.5 rounded-lg border-gray-300 text-purple-600 focus:ring-purple-500 transition-all cursor-pointer"
              />
            </label>
          </div>
        </div>

        <button
          onClick={handleProses}
          disabled={saving}
          className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "MEMPROSES..." : "SIMPAN TRANSAKSI"}
        </button>

        {updateAvailable && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleUpdate}
              className="w-full h-12 rounded-2xl font-black text-sm bg-red-600 text-white shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition animate-bounce border-2 border-white"
            >
              <RefreshCw className="w-4 h-4" />
              PERBAHARUI APLIKASI
            </button>
          </div>
        )}
      </div>

      <AddSaldoModal
        open={isSaldoModalOpen}
        onOpenChange={setIsSaldoModalOpen}
        kasirName={user?.name || ""}
        isOwner={user?.role === "owner"}
        mode="isi-saldo"
        onSuccess={loadBalance}
      />

      <AddSaldoModal
        open={isPenyesuaianModalOpen}
        onOpenChange={setIsPenyesuaianModalOpen}
        kasirName={user?.name || ""}
        isOwner={user?.role === "owner"}
        mode="penyesuaian"
        onSuccess={loadBalance}
      />
    </div>
  );
}
