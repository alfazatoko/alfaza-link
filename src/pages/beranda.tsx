import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { AddSaldoModal } from "@/components/modals/add-saldo-modal";
import { getBalance, createTransaction, getSettings, type BalanceRecord, type SettingsRecord } from "@/lib/firestore";
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";
import { Landmark, Wallet, ArrowDownToLine, Gem, RefreshCw, Send, Plus, Lock, Save, ClipboardList, BookUser, Settings, Camera, ImageIcon, X, Loader2 } from "lucide-react";
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
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);
  const [category, setCategory] = useState("BANK");
  const [nominalDisplay, setNominalDisplay] = useState("");
  const [adminDisplay, setAdminDisplay] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [balance, setBalance] = useState<BalanceRecord | null>(null);
  const [shopSettings, setShopSettings] = useState<SettingsRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isPenyesuaianModalOpen, setIsPenyesuaianModalOpen] = useState(false);

  const nominalRef = useRef<HTMLInputElement>(null);
  const adminRef = useRef<HTMLInputElement>(null);
  const ketRef = useRef<HTMLInputElement>(null);

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

    const interval = setInterval(loadBalance, 5000);
    return () => {
      clearInterval(interval);
      window.removeEventListener("open-isi-saldo", openIsiSaldo);
    };
  }, [loadBalance]);

  const [mutiaraIndex] = useState(() => Math.floor(Math.random() * 100));

  const getMutiaraQuote = () => {
    const quotesStr = shopSettings?.mutiaraQuotes || "";
    const customQuotes = quotesStr.split("\n").map(q => q.trim()).filter(q => q.length > 0);
    const allQuotes = customQuotes.length > 0 ? customQuotes : DEFAULT_QUOTES;
    return allQuotes[mutiaraIndex % allQuotes.length];
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsCapturing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        
        if (w > h) {
          if (w > maxDim) { h = (h * maxDim) / w; w = maxDim; }
        } else {
          if (h > maxDim) { w = (w * maxDim) / h; h = maxDim; }
        }
        
        canvas.width = w;
        canvas.height = h;
        ctx?.drawImage(img, 0, 0, w, h);
        
        const compressed = canvas.toDataURL("image/jpeg", 0.7);
        setPhotoUrl(compressed);
        setIsCapturing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
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
        nominal: n,
        admin: a,
        nominalTunai: n,
        adminTunai: a,
        photoUrl: photoUrl || undefined,
      });
      toast({ title: "Transaksi berhasil disimpan" });
      setNominalDisplay("");
      setAdminDisplay("");
      setKeterangan("");
      setPhotoUrl("");
      nominalRef.current?.focus();
      await loadBalance();
    } catch (err: any) {
      toast({ title: "Gagal menyimpan transaksi", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [user, nominalDisplay, adminDisplay, category, keterangan, photoUrl, toast, loadBalance]);

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

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <div className="bg-gradient-to-br from-blue-900 to-primary rounded-2xl p-3 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-3 -top-3 w-12 h-12 bg-white/10 rounded-full" />
          <p className="text-[10px] font-semibold opacity-90 mb-0.5 flex items-center gap-1">
            <Landmark className="w-3 h-3" /> SALDO BANK
          </p>
          <h3 className="text-xl font-extrabold">{formatRupiah(balance?.bank || 0)}</h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-500 rounded-2xl p-3 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-white/10 rounded-full" />
          <p className="text-[10px] font-semibold opacity-90 mb-0.5 flex items-center gap-1">
            <Wallet className="w-3 h-3" /> SALDO CASH
          </p>
          <h3 className="text-xl font-extrabold">{formatRupiah(balance?.cash || 0)}</h3>
        </div>
      </div>

      <div className="flex gap-2.5 mb-3">
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl py-3 px-2 text-center shadow-sm">
          <span className="text-[9px] font-bold text-gray-500 block uppercase flex items-center justify-center gap-1 mb-1">
            <ArrowDownToLine className="w-3 h-3 text-emerald-600" /> Tarik Tunai
          </span>
          <span className="text-sm font-extrabold text-gray-900 block">{formatRupiah(balance?.tarik || 0)}</span>
        </div>
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl py-3 px-2 text-center shadow-sm">
          <span className="text-[9px] font-bold text-gray-500 block uppercase flex items-center justify-center gap-1 mb-1">
            <Gem className="w-3 h-3 text-rose-500" /> Aksesoris
          </span>
          <span className="text-sm font-extrabold text-gray-900 block">{formatRupiah(balance?.aks || 0)}</span>
        </div>
        <div className="flex-1 bg-white border border-gray-100 rounded-2xl py-3 px-2 text-center shadow-sm">
          <span className="text-[9px] font-bold text-gray-500 block uppercase flex items-center justify-center gap-1 mb-1">
            <Lock className="w-3 h-3 text-amber-500" /> Admin
          </span>
          <span className="text-sm font-extrabold text-gray-900 block">{formatRupiah(balance?.adminTotal || 0)}</span>
        </div>
      </div>


      <div className="flex gap-2 mb-4">
        <button 
          onClick={() => setIsPenyesuaianModalOpen(true)} 
          className="flex-1 bg-[#00b894] text-white py-3.5 rounded-3xl text-sm font-bold shadow-lg shadow-emerald-500/20 active:scale-95 transition"
        >
          Penyesuaian
        </button>
        <button 
          onClick={() => setLocation("/non-tunai")} 
          className="flex-1 bg-[#0984e3] text-white py-3.5 rounded-3xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition"
        >
          Nontunai
        </button>
        <button 
          onClick={() => setLocation("/catatan")} 
          className="flex-1 bg-[#00cec9] text-white py-3.5 rounded-3xl text-sm font-bold shadow-lg shadow-teal-500/20 active:scale-95 transition"
        >
          Catatan
        </button>
      </div>

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
                onClick={() => setCategory(cat.id)}
                className="flex flex-col items-center gap-1 transition-all"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all ${isActive ? cat.activeColor + ' shadow-lg scale-110' : 'bg-card text-muted-foreground border border-border'}`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />
                </div>
                <span className={`text-[10px] font-bold ${isActive ? 'text-primary' : 'text-foreground opacity-80'}`}>{cat.label}</span>
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

      <div className="bg-card rounded-2xl p-4 shadow-sm border border-border mt-3">
        <div className="space-y-3 mb-4">
          <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-12 bg-muted/30">
            <span className="text-primary font-bold text-sm">Rp</span>
            <input
              ref={nominalRef}
              type="text"
              inputMode="numeric"
              placeholder="Nominal"
              value={nominalDisplay}
              onChange={(e) => setNominalDisplay(formatThousands(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adminRef.current?.focus(); } }}
              className="flex-1 bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground placeholder:font-normal"
            />
          </div>
          <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-muted/30">
            <span className="text-amber-500 font-bold text-sm">%</span>
            <input
              ref={adminRef}
              type="text"
              inputMode="numeric"
              placeholder="Admin"
              value={adminDisplay}
              onChange={(e) => setAdminDisplay(formatThousands(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ketRef.current?.focus(); } }}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-muted/30">
            <span className="text-blue-400 text-sm">📝</span>
            <input
              ref={ketRef}
              placeholder="Keterangan"
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleProses(); } }}
              className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <label className="flex-1 flex items-center justify-center gap-2 bg-blue-50 border-2 border-blue-100 rounded-xl py-2.5 cursor-pointer hover:bg-blue-100 transition active:scale-95">
                {isCapturing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <Camera className="w-4 h-4 text-blue-600" />
                )}
                <span className="text-[10px] font-bold text-blue-700">Kamera Live</span>
                <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} className="hidden" />
              </label>
              <label className="flex-1 flex items-center justify-center gap-2 bg-gray-50 border-2 border-gray-100 rounded-xl py-2.5 cursor-pointer hover:bg-gray-100 transition active:scale-95">
                <ImageIcon className="w-4 h-4 text-gray-400" />
                <span className="text-[10px] font-bold text-gray-500">Galeri</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              </label>
            </div>
            {photoUrl && (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border bg-muted/20">
                <img src={photoUrl} alt="Preview" className="w-full h-full object-contain" />
                <button onClick={() => setPhotoUrl("")} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-lg active:scale-90 transition">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
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
      </div>

      <AddSaldoModal
        open={isSaldoModalOpen}
        onOpenChange={setIsSaldoModalOpen}
        kasirName={user?.name || ""}
        isOwner={user?.role === "owner"}
        mode="isi-saldo"
      />

      <AddSaldoModal
        open={isPenyesuaianModalOpen}
        onOpenChange={setIsPenyesuaianModalOpen}
        kasirName={user?.name || ""}
        isOwner={user?.role === "owner"}
        mode="penyesuaian"
      />
    </div>
  );
}
