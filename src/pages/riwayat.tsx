import { useState, useMemo, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";
import { getTransactions, getSaldoHistory, getUsers, updateTransaction, deleteTransaction, updateSaldoHistory, deleteSaldoHistory, getDailyRekap, type TransactionRecord, type SaldoHistoryRecord, type UserRecord, type DailyRekapRecord } from "@/lib/firestore";
import { Receipt, AlertCircle, X, Lock, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORY_FILTERS = ["Semua", "Bank", "Flip", "App", "Dana", "Tarik", "Aks"];
const CATEGORY_MAP: Record<string, string> = {
  Bank: "BANK", Flip: "FLIP", App: "APP PULSA", Dana: "DANA", Tarik: "TARIK TUNAI", Aks: "AKSESORIS",
};
const SALDO_FILTERS = ["Semua", "Bank", "Cash", "Saldo Real"];

export default function Riwayat() {
  const { user } = useAuth();
  const { toast } = useToast();

  const today = getWibDate();
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [selectedKasir, setSelectedKasir] = useState("Semua Kasir");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedSaldoTab, setSelectedSaldoTab] = useState("Semua");
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [expandedSaldo, setExpandedSaldo] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");

  // Edit transaksi
  const [editTx, setEditTx] = useState<TransactionRecord | null>(null);
  const [editNominal, setEditNominal] = useState("");
  const [editAdmin, setEditAdmin] = useState("");
  const [editKeterangan, setEditKeterangan] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Edit saldo history
  const [editSaldo, setEditSaldo] = useState<SaldoHistoryRecord | null>(null);
  const [editSaldoNominal, setEditSaldoNominal] = useState("");
  const [editSaldoKeterangan, setEditSaldoKeterangan] = useState("");
  const [editSaldoSaving, setEditSaldoSaving] = useState(false);

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [saldoHistory, setSaldoHistory] = useState<SaldoHistoryRecord[]>([]);
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dailyRekap, setDailyRekap] = useState<DailyRekapRecord | null>(null);

  const kasirFilter = selectedKasir === "Semua Kasir" ? undefined : selectedKasir;

  const loadData = useCallback(async () => {
    if (!user?.name) return;
    try {
      const isDailyAll = startDate === endDate && (!kasirFilter || kasirFilter === "Semua Kasir");
      const [txs, saldo, users, rekap] = await Promise.all([
        getTransactions({ 
          kasirName: kasirFilter || (user.role === "owner" ? undefined : user.name), 
          startDate, 
          endDate
        }),
        getSaldoHistory({ 
          kasirName: kasirFilter || (user.role === "owner" ? undefined : user.name), 
          startDate, 
          endDate 
        }),
        getUsers(),
        isDailyAll ? getDailyRekap(startDate) : Promise.resolve(null)
      ]);
      setTransactions(txs || []);
      setSaldoHistory(saldo || []);
      setAllUsers(users || []);
      setDailyRekap(rekap);
    } catch (err) {
      console.error("Riwayat Load Error:", err);
      toast({ title: "Gagal memuat data", variant: "destructive" });
    }
  }, [user?.name, user?.role, kasirFilter, startDate, endDate, today, refreshKey, selectedCategory]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Transaksi CRUD ---
  const handleDelete = async (id: string) => {
    if (!confirm("Hapus transaksi ini?")) return;
    try {
      await deleteTransaction(id);
      toast({ title: "Transaksi dihapus" });
      setRefreshKey(k => k + 1);
    } catch {
      toast({ title: "Gagal menghapus", variant: "destructive" });
    }
  };

  const openEdit = (tx: TransactionRecord) => {
    setEditTx(tx);
    setEditNominal(formatThousands(String(tx.nominal || 0)));
    setEditAdmin(formatThousands(String(tx.admin || 0)));
    setEditKeterangan(tx.keterangan || "");
  };

  const handleEditSave = async () => {
    if (!editTx) return;
    setEditSaving(true);
    
    const parsedNominal = parseInt(parseThousands(editNominal));
    const finalNominal = isNaN(parsedNominal) ? editTx.nominal : parsedNominal;
    
    const parsedAdmin = parseInt(parseThousands(editAdmin));
    const finalAdmin = isNaN(parsedAdmin) ? 0 : parsedAdmin;

    try {
      await updateTransaction(editTx.id, {
        nominal: finalNominal,
        admin: finalAdmin,
        keterangan: editKeterangan,
        isEdited: true,
        originalNominal: editTx.isEdited ? editTx.originalNominal : editTx.nominal,
        originalAdmin: editTx.isEdited ? editTx.originalAdmin : editTx.admin,
      });
      toast({ title: "Diperbarui" });
      setEditTx(null);
      setRefreshKey(k => k + 1);
    } catch {
      toast({ title: "Gagal memperbarui", variant: "destructive" });
    } finally {
      setEditSaving(false);
    }
  };

  // --- Saldo History CRUD (owner only, today only) ---
  const openEditSaldo = (s: SaldoHistoryRecord) => {
    setEditSaldo(s);
    setEditSaldoNominal(formatThousands(String(s.nominal || 0)));
    setEditSaldoKeterangan(s.keterangan || "");
  };

  const handleEditSaldoSave = async () => {
    if (!editSaldo) return;
    setEditSaldoSaving(true);
    try {
      await updateSaldoHistory(editSaldo.id, editSaldo.kasirName, {
        nominal: parseInt(parseThousands(editSaldoNominal)) || editSaldo.nominal,
        keterangan: editSaldoKeterangan,
      });
      toast({ title: "Saldo diperbarui" });
      setEditSaldo(null);
      setRefreshKey(k => k + 1);
      window.dispatchEvent(new CustomEvent("saldo-updated"));
    } catch {
      toast({ title: "Gagal memperbarui saldo", variant: "destructive" });
    } finally {
      setEditSaldoSaving(false);
    }
  };

  const handleDeleteSaldo = async (s: SaldoHistoryRecord) => {
    if (!confirm(`Hapus riwayat tambah saldo ${s.jenis} ${formatRupiah(s.nominal)}?`)) return;
    try {
      await deleteSaldoHistory(s.id, s.kasirName);
      toast({ title: "Riwayat saldo dihapus" });
      setRefreshKey(k => k + 1);
      window.dispatchEvent(new CustomEvent("saldo-updated"));
    } catch {
      toast({ title: "Gagal menghapus saldo", variant: "destructive" });
    }
  };

  // Filter
  const filteredTx = useMemo(() => {
    let result = transactions;
    
    // Filter Category
    if (selectedCategory !== "Semua" && selectedCategory !== "20 Riwayat Terakhir") {
      const mapped = CATEGORY_MAP[selectedCategory];
      if (mapped) result = result.filter(tx => tx.category === mapped);
    }
    
    // Filter Search
    if (searchText.trim()) {
      const q = searchText.toLowerCase().trim();
      result = result.filter(tx =>
        (tx.keterangan || "").toLowerCase().includes(q) ||
        (tx.category || "").toLowerCase().includes(q) ||
        (tx.kasirName || "").toLowerCase().includes(q)
      );
    }
    
    return result;
  }, [transactions, selectedCategory, searchText]);

  // Saldo: hanya tampil hari ini
  const filteredSaldo = saldoHistory.filter(s => {
    if (selectedSaldoTab === "Semua") return true;
    if (selectedSaldoTab === "Bank") return s.jenis === "Bank";
    if (selectedSaldoTab === "Cash") return s.jenis === "Cash";
    if (selectedSaldoTab === "Saldo Real") return s.jenis === "Real App";
    return true;
  });

  const kasirList = allUsers.filter(u => u.role !== "owner");

  const getShortCategory = (cat: string) => {
    if (cat === "TARIK TUNAI") return "TARIK";
    if (cat === "APP PULSA") return "APP";
    if (cat === "AKSESORIS") return "AKS";
    return cat;
  };

  const isNonTunai = (tx: TransactionRecord) => tx.paymentMethod && tx.paymentMethod.toLowerCase().includes("non-tunai");

  const isOwner = user?.role === "owner";

  return (
    <div className="px-3 pt-3 pb-20">
      <Header />

      <div className="relative mb-2.5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>
        <input
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          placeholder="Cari keterangan..."
          className="w-full pl-9 pr-3 py-2 rounded-full border-2 border-gray-200 text-[13px] bg-white outline-none"
        />
      </div>

      <div className="flex gap-1.5 items-center mb-2.5">
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs bg-white outline-none" />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs bg-white outline-none" />
        <button onClick={() => setRefreshKey(k => k + 1)} className="bg-blue-600 text-white border-none rounded-full px-4 py-1.5 font-bold text-xs whitespace-nowrap">Tampilkan</button>
      </div>

      {isOwner && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          <button onClick={() => setSelectedKasir("Semua Kasir")} className={`rounded-full px-3 py-1 text-[11px] font-semibold border-[1.5px] ${selectedKasir === "Semua Kasir" ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-900 border-gray-300'}`}>Semua Kasir</button>
          {kasirList.map(k => (
            <button key={k.name} onClick={() => setSelectedKasir(k.name)} className={`rounded-full px-3 py-1 text-[11px] font-semibold border-[1.5px] ${selectedKasir === k.name ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-900 border-gray-300'}`}>{k.name}</button>
          ))}
        </div>
      )}

      <div className="mb-3">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full bg-white border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700 outline-none focus:border-blue-500 transition-colors"
        >
          {CATEGORY_FILTERS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Header Transaksi */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-600 rounded-t-[14px] px-3.5 py-2.5 flex items-center justify-between">
        <span className="text-white font-bold text-[13px]">RIWAYAT TRANSAKSI</span>
        <div className="flex items-center gap-2">
          <span className="text-blue-200 text-[10px] font-semibold">
            {startDate === endDate ? `Tanggal · ${startDate}` : `${startDate} s/d ${endDate}`}
          </span>
        </div>
      </div>

      {/* Tabel Transaksi */}
      <div className="bg-white rounded-b-[14px] overflow-hidden shadow-sm mb-3.5">
        <div className="grid gap-0.5 px-1.5 py-1.5 border-b-2 border-gray-200 text-[9px] font-bold text-gray-500" style={{ gridTemplateColumns: '20px 36px 48px 1fr 52px 1fr 18px' }}>
          <span>#</span><span>Jam</span><span>Tipe</span><span>Nominal</span><span>Admin</span><span>Ket</span><span></span>
        </div>

        {filteredTx.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-xs">
            <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            {searchText ? `Tidak ditemukan "${searchText}"` : "Tidak ada transaksi"}
          </div>
        ) : (
          filteredTx.map((tx, i) => {
            const nt = isNonTunai(tx);
            const isExpanded = expandedTx === tx.id;
            const ketText = tx.keterangan || "";
            return (
              <div key={tx.id}>
                <div onClick={() => setExpandedTx(isExpanded ? null : tx.id)} className="grid gap-0.5 px-1.5 py-1.5 border-b border-gray-100 text-[9px] items-center cursor-pointer" style={{ gridTemplateColumns: '20px 36px 48px 1fr 52px 1fr 18px' }}>
                  <span className="text-gray-400">{i + 1}</span>
                  <span>{(tx.transTime || "").slice(0, 5)}</span>
                  <span className={`font-bold truncate ${nt ? 'text-purple-600' : 'text-blue-900'}`}>{getShortCategory(tx.category)}</span>
                  <span className={`font-bold truncate ${nt ? 'text-purple-600' : 'text-blue-600'}`}>{formatRupiah(tx.nominal)}</span>
                  <span className={`truncate font-semibold ${tx.adminNonTunai ? 'text-purple-600' : 'text-gray-900'}`}>{formatRupiah(tx.admin || 0)}</span>
                  <span className="text-gray-500 truncate">{nt ? "💳 " : ""}{ketText}</span>
                  <span className="text-gray-400 text-[10px] text-center">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {isExpanded && (
                  <div className="px-3.5 py-2.5 bg-slate-50 border-b border-gray-200">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex gap-2 text-[10px] text-gray-500 font-medium">
                        <span>📅 {tx.transDate}</span>
                        <span className="text-gray-300">|</span>
                        <span>👤 {tx.kasirName || "-"}</span>
                      </div>
                      <div className={`text-[9px] font-black px-2 py-0.5 rounded-full ${nt ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                        {nt ? "NON TUNAI" : "TUNAI"}
                      </div>
                    </div>

                    {ketText && (
                      <div className="text-[11px] text-gray-700 mb-2 bg-white px-2.5 py-1.5 rounded-lg border border-gray-200 flex gap-2 items-start">
                        <span>📝</span> <span>{ketText}</span>
                      </div>
                    )}

                    {tx.isEdited && (
                      <div className="text-[10px] text-orange-600 font-bold mb-2 flex items-center gap-1.5 bg-orange-50 w-full px-2.5 py-1.5 rounded-lg border border-orange-200">
                        <span>👁️</span> Data Awal: Nominal {formatRupiah(tx.originalNominal || 0)}, Admin {formatRupiah(tx.originalAdmin || 0)}
                      </div>
                    )}

                    <div className="flex justify-between items-center bg-blue-50/50 rounded-xl border border-black p-2.5">
                      <div className="flex gap-4 text-[10px]">
                        <div>
                          <p className="font-bold text-blue-400 uppercase mb-0.5">Saldo Bank</p>
                          <p className="font-black text-blue-700">{formatRupiah(tx.saldoBankAfter || 0)}</p>
                        </div>
                        <div className="pl-4 border-l border-blue-100">
                          <p className="font-bold text-orange-400 uppercase mb-0.5">Saldo Cash</p>
                          <p className="font-black text-orange-600">{formatRupiah(tx.saldoCashAfter || 0)}</p>
                        </div>
                      </div>
                      <div>
                        {tx.transDate === today ? (
                          <button onClick={e => { e.stopPropagation(); openEdit(tx); }} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-all active:scale-95">
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1.5 rounded-lg">
                            <Lock className="w-3 h-3" /> Terkunci
                          </div>
                        )}
                      </div>
                    </div>
                    {tx.photoUrl && (
                      <div className="mt-2.5">
                        <p className="text-[9px] font-bold text-gray-400 mb-1 uppercase">Foto Struk:</p>
                        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-white overflow-hidden cursor-pointer shadow-sm active:scale-95 transition" onClick={() => setPreviewImage(tx.photoUrl!)}>
                          <img src={tx.photoUrl} alt="Struk" className="w-full h-full object-cover" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}

        {filteredTx.length > 0 && (
          <div className="border-t border-gray-200 px-3 py-3 text-[11px] bg-gray-50/50">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-gray-700">
                {dailyRekap 
                  ? ((dailyRekap.count_bank || 0) + (dailyRekap.count_flip || 0) + (dailyRekap.count_app || 0) + (dailyRekap.count_dana || 0) + (dailyRekap.count_tarik || 0) + (dailyRekap.count_aks || 0)) 
                  : filteredTx.length} transaksi
              </span>
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-gray-800">
                  Total: {dailyRekap 
                    ? formatRupiah((dailyRekap.total_bank || 0) + (dailyRekap.total_flip || 0) + (dailyRekap.total_app || 0) + (dailyRekap.total_dana || 0)) 
                    : formatRupiah(filteredTx.reduce((sum, tx) => sum + (tx.nominal || 0), 0))}
                </span>
                <span className="text-gray-500 font-medium border-l border-gray-300 pl-2.5">
                  Admin: {dailyRekap 
                    ? formatRupiah(dailyRekap.total_admin || 0) 
                    : formatRupiah(filteredTx.reduce((sum, tx) => sum + (!tx.adminNonTunai ? (tx.admin || 0) : 0), 0))}
                  {((dailyRekap ? (dailyRekap.total_admin_non_tunai || 0) : filteredTx.reduce((sum, tx) => sum + (tx.adminNonTunai ? (tx.admin || 0) : 0), 0))) > 0 && (
                    <> / <span className="text-purple-600">{(dailyRekap ? (dailyRekap.total_admin_non_tunai || 0) : filteredTx.reduce((sum, tx) => sum + (tx.adminNonTunai ? (tx.admin || 0) : 0), 0)).toLocaleString('id-ID')}</span></>
                  )}
                </span>
              </div>
            </div>
            <div className="text-right text-blue-700 font-bold border-t border-gray-200 border-dashed pt-2 mt-1 flex justify-end gap-1 items-center">
              🏛️ <span>Sisa Saldo Bank (Catatan) : {formatRupiah(transactions[0]?.saldoBankAfter || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabel Saldo History — hanya hari ini */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-600 rounded-t-[14px] px-3.5 py-2.5 flex items-center justify-between">
        <span className="text-white font-bold text-[13px]">RIWAYAT TAMBAH SALDO</span>
        <div className="flex items-center gap-2">
          {isOwner && <span className="bg-amber-400 text-amber-900 text-[9px] font-black px-2 py-0.5 rounded-full">OWNER</span>}
          <span className="text-blue-200 text-[10px] font-semibold">
            {startDate === endDate ? `Tanggal · ${startDate}` : `${startDate} s/d ${endDate}`}
          </span>
        </div>
      </div>
      <div className="bg-white rounded-b-[14px] shadow-sm mb-4">
        <div className="flex gap-1.5 px-2.5 py-2 border-b border-gray-200">
          {SALDO_FILTERS.map(f => (
            <button key={f} onClick={() => setSelectedSaldoTab(f)} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold border-[1.5px] ${selectedSaldoTab === f ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-700 border-gray-300'}`}>{f}</button>
          ))}
        </div>

        {/* Header kolom — pakai inline style agar tidak bergantung Tailwind JIT */}
        <div
          className="grid px-2.5 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500"
          style={{ gridTemplateColumns: isOwner ? '28px 36px 50px 1fr 1fr 18px 64px' : '28px 36px 50px 1fr 1fr 18px' }}
        >
          <span>#</span><span>Jam</span><span>Jenis</span><span>Nominal</span><span>Ket</span><span></span>
          {isOwner && <span className="text-center">Aksi</span>}
        </div>

        {filteredSaldo.length === 0 ? (
          <div className="text-center py-5 text-gray-400 text-xs">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            Tidak ada riwayat tambah saldo hari ini
          </div>
        ) : (
          filteredSaldo.map((s, i) => {
            const isExpanded = expandedSaldo === s.id;
            return (
              <div key={s.id}>
                <div
                  onClick={() => setExpandedSaldo(isExpanded ? null : s.id)}
                  className="grid px-2.5 py-2 border-b border-gray-100 text-[10px] items-center cursor-pointer active:bg-gray-50"
                  style={{ gridTemplateColumns: isOwner ? '28px 36px 50px 1fr 1fr 18px 64px' : '28px 36px 50px 1fr 1fr 18px' }}
                >
                  <span className="text-gray-400">{i + 1}</span>
                  <span>{s.saldoTime}</span>
                  <span className={`font-semibold truncate ${s.jenis === "Bank" ? "text-blue-700" : s.jenis === "Cash" ? "text-emerald-700" : "text-purple-600"}`}>{s.jenis}</span>
                  <span className="font-bold text-gray-800">{formatRupiah(s.nominal)}</span>
                  <span className="text-gray-500 truncate">{s.keterangan || ""}</span>
                  <span className="text-gray-400 text-[8px] text-center">{isExpanded ? "▲" : "▼"}</span>
                  {isOwner && (
                    <div className="flex gap-1 justify-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => openEditSaldo(s)}
                        className="p-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-600 active:scale-90 transition"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSaldo(s)}
                        className="p-1.5 rounded-lg bg-red-50 border border-red-200 text-red-500 active:scale-90 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="px-3.5 py-2.5 bg-blue-50/30 border-b border-gray-100">
                    <div className="flex justify-between items-center bg-white rounded-xl border border-blue-100 p-2.5 shadow-sm">
                      <div className="flex gap-4 text-[10px]">
                        <div>
                          <p className="font-bold text-blue-400 uppercase mb-0.5 text-[8px]">Saldo Bank</p>
                          <p className="font-black text-blue-700">{formatRupiah(s.saldoBankAfter || 0)}</p>
                        </div>
                        <div className="pl-4 border-l border-blue-100">
                          <p className="font-bold text-orange-400 uppercase mb-0.5 text-[8px]">Saldo Cash</p>
                          <p className="font-black text-orange-600">{formatRupiah(s.saldoCashAfter || 0)}</p>
                        </div>
                      </div>
                      <div className="text-[9px] text-gray-400 font-medium">
                        Sisa Akhir 🏛️
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {filteredSaldo.length > 0 && (
          <div className="border-t border-gray-100 px-3 py-2 text-[10px] text-gray-500 flex justify-between">
            <span>{filteredSaldo.length} entri</span>
            <span>Total: {formatRupiah(filteredSaldo.reduce((s, r) => s + (r.nominal || 0), 0))}</span>
          </div>
        )}
      </div>

      {/* Modal Edit Transaksi */}
      {editTx && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditTx(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-3.5">
              <h3 className="font-bold text-base">Edit Transaksi</h3>
              <button onClick={() => setEditTx(null)} className="text-xl text-gray-400">&times;</button>
            </div>
            <div className="mb-2">
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Nominal</label>
              <input value={editNominal} onChange={e => setEditNominal(formatThousands(e.target.value))} inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div className="mb-2">
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Admin</label>
              <input value={editAdmin} onChange={e => setEditAdmin(formatThousands(e.target.value))} inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <div className="mb-3.5">
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Keterangan</label>
              <input value={editKeterangan} onChange={e => setEditKeterangan(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <button onClick={handleEditSave} disabled={editSaving} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-full text-sm disabled:opacity-60">
              {editSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </div>
      )}

      {/* Modal Edit Saldo History (Owner only) */}
      {editSaldo && isOwner && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditSaldo(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-1">
              <h3 className="font-bold text-base">Edit Saldo {editSaldo.jenis}</h3>
              <button onClick={() => setEditSaldo(null)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <p className="text-[11px] text-gray-400 mb-4">Kasir: <strong>{editSaldo.kasirName}</strong> · {editSaldo.saldoTime}</p>
            <div className="mb-2">
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Nominal</label>
              <div className="flex items-center border-2 border-blue-200 rounded-xl px-3 h-12">
                <span className="text-blue-600 font-bold mr-2">Rp</span>
                <input
                  value={editSaldoNominal}
                  onChange={e => setEditSaldoNominal(formatThousands(e.target.value))}
                  inputMode="numeric"
                  className="flex-1 outline-none text-base font-bold"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Keterangan</label>
              <input value={editSaldoKeterangan} onChange={e => setEditSaldoKeterangan(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />
            </div>
            <button onClick={handleEditSaldoSave} disabled={editSaldoSaving} className="w-full bg-gradient-to-r from-blue-700 to-blue-500 text-white font-bold py-3 rounded-full text-sm disabled:opacity-60">
              {editSaldoSaving ? "Menyimpan..." : "Simpan Perubahan Saldo"}
            </button>
          </div>
        </div>
      )}

      {/* Preview Foto */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setPreviewImage(null)}>
          <button className="absolute top-6 right-6 text-white bg-white/20 p-2 rounded-full backdrop-blur-md">
            <X className="w-6 h-6" />
          </button>
          <img src={previewImage} alt="Large preview" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
        </div>
      )}
    </div>
  );
}
