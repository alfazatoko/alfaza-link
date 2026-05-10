import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";
import { getSaldoHistory, updateSaldoHistory, deleteSaldoHistory, type SaldoHistoryRecord } from "@/lib/firestore";
import { 
  History, 
  Search, 
  Calendar, 
  ArrowLeft, 
  Filter, 
  Building2, 
  Wallet, 
  Smartphone, 
  MoreVertical, 
  Trash2, 
  Pencil, 
  X,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

const SALDO_FILTERS = [
  { id: "Semua", label: "Semua", icon: History, color: "bg-gray-100 text-gray-600" },
  { id: "Bank", label: "Bank", icon: Building2, color: "bg-blue-100 text-blue-600" },
  { id: "Cash", label: "Cash", icon: Wallet, color: "bg-emerald-100 text-emerald-600" },
  { id: "Saldo Real", label: "Real App", icon: Smartphone, color: "bg-purple-100 text-purple-600" },
];

export default function RiwayatSaldo() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const today = getWibDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedTab, setSelectedTab] = useState("Semua");
  const [searchText, setSearchText] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Edit State
  const [editItem, setEditItem] = useState<SaldoHistoryRecord | null>(null);
  const [editNominal, setEditNominal] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [history, setHistory] = useState<SaldoHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.name) return;
    setIsLoading(true);
    try {
      const data = await getSaldoHistory({
        kasirName: user.role === "owner" ? undefined : user.name,
        startDate,
        endDate,
        forceServer: refreshKey > 0
      });
      setHistory(data || []);
    } catch (err: any) {
      toast({ title: "Gagal memuat data", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [user?.name, user?.role, startDate, endDate, refreshKey, toast]);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredHistory = useMemo(() => {
    let result = history;
    
    // Filter by Tab
    if (selectedTab === "Bank") result = result.filter(h => h.jenis === "Bank");
    else if (selectedTab === "Cash") result = result.filter(h => h.jenis === "Cash");
    else if (selectedTab === "Saldo Real") result = result.filter(h => h.jenis === "Real App");

    // Filter by Search
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter(h => 
        (h.keterangan || "").toLowerCase().includes(q) ||
        (h.kasirName || "").toLowerCase().includes(q)
      );
    }

    return result;
  }, [history, selectedTab, searchText]);

  const handleEditSave = async () => {
    if (!editItem) return;
    setIsSaving(true);
    try {
      await updateSaldoHistory(editItem.id, editItem.kasirName, {
        nominal: parseInt(parseThousands(editNominal)) || editItem.nominal,
        keterangan: editKeterangan,
      });
      toast({ title: "Berhasil diperbarui" });
      setEditItem(null);
      setRefreshKey(k => k + 1);
      window.dispatchEvent(new CustomEvent("saldo-updated"));
    } catch {
      toast({ title: "Gagal memperbarui", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (item: SaldoHistoryRecord) => {
    if (!confirm(`Hapus riwayat ${item.jenis} senilai ${formatRupiah(item.nominal)}?`)) return;
    try {
      await deleteSaldoHistory(item.id, item.kasirName);
      toast({ title: "Riwayat berhasil dihapus" });
      setRefreshKey(k => k + 1);
      window.dispatchEvent(new CustomEvent("saldo-updated"));
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const isOwner = user?.role === "owner";

  return (
    <div className="flex flex-col min-h-screen bg-[#f8fafc] pb-20">
      <div className="bg-white px-5 pt-7 pb-4 shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-5">
          <button onClick={() => setLocation("/beranda")} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 active:scale-90 transition shadow-sm border border-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Riwayat Tambah Saldo</h1>
        </div>

        {/* Search & Date Filter */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari keterangan atau kasir..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-2 text-[11px] font-bold outline-none"
              />
            </div>
            <div className="flex-1 relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-2 text-[11px] font-bold outline-none"
              />
            </div>
            <button 
              onClick={() => setRefreshKey(k => k + 1)}
              className="bg-blue-600 text-white px-4 rounded-xl font-black text-[11px] uppercase shadow-lg shadow-blue-600/20 active:scale-95 transition"
            >
              Cari
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 py-4 overflow-x-auto hide-scrollbar">
        <div className="flex gap-3">
          {SALDO_FILTERS.map(tab => {
            const Icon = tab.icon;
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs whitespace-nowrap transition-all border ${
                  isActive 
                    ? "bg-blue-900 text-white border-blue-900 shadow-lg shadow-blue-900/20" 
                    : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-300" : "text-slate-400"}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="px-5 space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300 animate-pulse">
            <History className="w-16 h-16 mb-4" />
            <p className="text-sm font-bold">Memuat data...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-300">
            <AlertCircle className="w-16 h-16 mb-4" />
            <p className="text-sm font-bold">Tidak ada riwayat saldo</p>
            <p className="text-xs">Coba ubah tanggal atau filter</p>
          </div>
        ) : (
          filteredHistory.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            const isBank = item.jenis === "Bank";
            const isCash = item.jenis === "Cash";
            
            return (
              <div 
                key={item.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all duration-300"
              >
                <div 
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-5 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${
                      isBank ? 'bg-blue-50 text-blue-600' : isCash ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {isBank ? <Building2 className="w-6 h-6" /> : isCash ? <Wallet className="w-6 h-6" /> : <Smartphone className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${
                          isBank ? 'bg-blue-100 text-blue-700' : isCash ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {item.jenis}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tight">{item.saldoTime}</span>
                      </div>
                      <h3 className="text-lg font-black text-slate-800 leading-tight">{formatRupiah(item.nominal)}</h3>
                      <p className="text-xs text-slate-400 font-medium truncate max-w-[150px]">{item.keterangan || "-"}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {isOwner && (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                         <button 
                          onClick={() => {
                            setEditItem(item);
                            setEditNominal(formatThousands(String(item.nominal)));
                            setEditKeterangan(item.keterangan || "");
                          }}
                          className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-blue-600 border border-slate-100 shadow-sm"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item)}
                          className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-400 hover:text-red-600 border border-red-100 shadow-sm"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                    <ChevronDown className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-50 bg-slate-50/30">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-blue-400 uppercase mb-1 tracking-widest">Saldo Bank</p>
                        <p className="text-sm font-black text-slate-800">{formatRupiah(item.saldoBankAfter || 0)}</p>
                      </div>
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
                        <p className="text-[9px] font-black text-emerald-400 uppercase mb-1 tracking-widest">Saldo Cash</p>
                        <p className="text-sm font-black text-slate-800">{formatRupiah(item.saldoCashAfter || 0)}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-tighter px-1">
                      <span>👤 Kasir: {item.kasirName}</span>
                      <span>📅 {item.saldoDate}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-5" onClick={() => setEditItem(null)}>
          <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl p-7 border border-white/20 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-slate-800">Edit Riwayat</h3>
              <button onClick={() => setEditItem(null)} className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Nominal Tambah</label>
                <div className="flex items-center gap-3 border-2 border-blue-100 rounded-3xl px-5 h-16 bg-slate-50/50 focus-within:border-blue-500 transition-all">
                  <span className="text-blue-600 font-black text-lg">Rp</span>
                  <input 
                    type="text" 
                    inputMode="numeric"
                    value={editNominal}
                    onChange={e => setEditNominal(formatThousands(e.target.value))}
                    className="flex-1 bg-transparent outline-none text-2xl font-black text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Keterangan</label>
                <div className="flex items-center gap-3 border-2 border-slate-100 rounded-2xl px-5 h-14 bg-slate-50/50 focus-within:border-blue-500 transition-all">
                  <input 
                    type="text"
                    value={editKeterangan}
                    onChange={e => setEditKeterangan(e.target.value)}
                    placeholder="Contoh: Setoran awal pagi"
                    className="flex-1 bg-transparent outline-none text-sm font-bold text-slate-700"
                  />
                </div>
              </div>

              <button 
                onClick={handleEditSave}
                disabled={isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[1.5rem] shadow-xl shadow-blue-600/30 active:scale-95 transition-all disabled:opacity-50 mt-2"
              >
                {isSaving ? "MENYIMPAN..." : "SIMPAN PERUBAHAN"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
