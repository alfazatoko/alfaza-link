import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import {
  getTransactions, getSaldoHistory, getDailyNotes,
  getUsers, getDailyRekap, getAllRekapKasirByRange, getRekapKasirByRange,
  type TransactionRecord, type SaldoHistoryRecord, type DailyNoteRecord, type UserRecord, type DailyRekapRecord
} from "@/lib/firestore";
import { formatRupiah, getWibDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2, Loader2, ChevronDown } from "lucide-react";

export default function Laporan() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = getWibDate();
  
  const [date, setDate] = useState(today);
  const [kasirFilter, setKasirFilter] = useState("Semua");
  const [kasirList, setKasirList] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [saldoHistory, setSaldoHistory] = useState<SaldoHistoryRecord[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNoteRecord>({ sisaSaldoBank: 0, saldoRealApp: 0 });
  const [dailyRekap, setDailyRekap] = useState<DailyRekapRecord | null>(null);
  
  const [showJurnal, setShowJurnal] = useState(false);
  const [showSelisih, setShowSelisih] = useState(false);

  const isOwner = user?.role === "owner";

  useEffect(() => {
    if (isOwner) {
      getUsers().then(u => setKasirList(u.filter(k => k.role !== "owner" && k.isActive))).catch(() => {});
    }
  }, [isOwner]);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let kname = isOwner ? (kasirFilter === "Semua" ? undefined : kasirFilter) : user.name;

      // Ambil Rekap, Notes, dan Riwayat (TX & Saldo) secara paralel untuk akurasi & kecepatan
      const [rekap, kasirRekaps, notes, txs, saldo] = await Promise.all([
        (!kname) ? getDailyRekap(date).catch(() => null) : Promise.resolve(null),
        (!kname) ? getAllRekapKasirByRange(date, date).catch(() => []) : getRekapKasirByRange(kname!, date, date).catch(() => []),
        getDailyNotes(kname || user.name, date).catch(() => ({ sisaSaldoBank: 0, saldoRealApp: 0 })),
        getTransactions({ kasirName: kname, startDate: date, endDate: date }).catch(() => []),
        getSaldoHistory({ kasirName: kname, startDate: date, endDate: date }).catch(() => [])
      ]);

      let agg: any = rekap;
      if (!agg && Array.isArray(kasirRekaps) && kasirRekaps.length > 0) {
        agg = kasirRekaps.reduce((a: any, c: any) => ({
          total_bank: (a.total_bank || 0) + (c.total_bank || 0),
          total_flip: (a.total_flip || 0) + (c.total_flip || 0),
          total_app: (a.total_app || 0) + (c.total_app || 0),
          total_dana: (a.total_dana || 0) + (c.total_dana || 0),
          total_tarik: (a.total_tarik || 0) + (c.total_tarik || 0),
          total_aks: (a.total_aks || 0) + (c.total_aks || 0),
          total_admin: (a.total_admin || 0) + (c.total_admin || 0),
          total_admin_non_tunai: (a.total_admin_non_tunai || 0) + (c.total_admin_non_tunai || 0),
          total_non_tunai: (a.total_non_tunai || 0) + (c.total_non_tunai || 0),
          total_closing: (a.total_closing || 0) + (c.total_closing || 0),
          total_isi_bank: (a.total_isi_bank || 0) + (c.total_isi_bank || 0),
          count_bank: (a.count_bank || 0) + (c.count_bank || 0),
          count_flip: (a.count_flip || 0) + (c.count_flip || 0),
          count_app: (a.count_app || 0) + (c.count_app || 0),
          count_dana: (a.count_dana || 0) + (c.count_dana || 0),
          count_aks: (a.count_aks || 0) + (c.count_aks || 0),
          count_tarik: (a.count_tarik || 0) + (c.count_tarik || 0),
        }), {});
      }

      setDailyRekap(agg);
      setDailyNotes(notes as DailyNoteRecord);
      setTransactions(txs || []);
      setSaldoHistory(saldo || []);
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isOwner, kasirFilter, date]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Perhitungan Angka Aman ---
  const txList = Array.isArray(transactions) ? transactions : [];
  const shList = Array.isArray(saldoHistory) ? saldoHistory : [];

  const getVal = (key: string, cat: string) => {
    if (dailyRekap && (dailyRekap as any)[key] !== undefined) return (dailyRekap as any)[key] || 0;
    return txList.filter(t => t.category === cat).reduce((s, t) => s + (t.nominal || 0), 0);
  };

  const tBank = getVal("total_bank", "BANK");
  const tFlip = getVal("total_flip", "FLIP");
  const tApp = getVal("total_app", "APP PULSA");
  const tDana = getVal("total_dana", "DANA");
  const tTarik = getVal("total_tarik", "TARIK TUNAI");
  const tAks = getVal("total_aks", "AKSESORIS");
  const tClosing = getVal("total_closing", "CLOSING");
  
  const tAdmin = dailyRekap ? (dailyRekap.total_admin || 0) : txList.reduce((s, t) => s + (!t.adminNonTunai ? (t.admin || 0) : 0), 0);
  const tAdminNT = dailyRekap ? (dailyRekap.total_admin_non_tunai || 0) : txList.reduce((s, t) => s + (t.adminNonTunai ? (t.admin || 0) : 0), 0);
  const tNT = dailyRekap ? (dailyRekap.total_non_tunai || 0) : txList.filter(t => (t.paymentMethod || "").toLowerCase().includes("non-tunai") && t.category !== "CLOSING").reduce((s, t) => s + (t.nominal || 0), 0);

  const tPenjualan = tBank + tFlip + tApp + tDana;
  const sisaCashTotal = tPenjualan - tTarik + tAdmin + tAks;

  const countVal = (key: string, cat: string) => {
    if (dailyRekap && (dailyRekap as any)[key] !== undefined) return (dailyRekap as any)[key] || 0;
    return txList.filter(t => t.category === cat).length;
  };

  const tIsiBank = dailyRekap ? (dailyRekap.total_isi_bank || 0) : shList.filter(s => s.jenis === "Bank").reduce((s, h) => s + (h.nominal || 0), 0);
  const sBank = txList[0]?.saldoBankAfter ?? 0;
  const sReal = dailyNotes?.saldoRealApp || 0;
  const selisih = sReal - sBank;

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <p className="text-[10px] font-bold text-gray-400 uppercase">Sinkronisasi Data...</p>
    </div>
  );

  return (
    <div className="px-3 pt-3 pb-20 bg-gray-50 min-h-screen">
      <Header />
      <div className="mb-4">
        <h1 className="text-lg font-black text-gray-800 uppercase tracking-tight flex items-center gap-2">📋 Rekap Harian</h1>
        <p className="text-[10px] font-bold text-gray-400 uppercase">Analisis transaksi harian</p>
      </div>

      <div className="flex gap-2 mb-4">
        {isOwner && (
          <select value={kasirFilter} onChange={e => setKasirFilter(e.target.value)} className="bg-white border border-black rounded-lg px-2 py-1.5 text-xs font-bold outline-none">
            <option value="Semua">Semua Kasir</option>
            {kasirList.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}
          </select>
        )}
        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1 rounded-lg border border-black px-2 py-1.5 text-xs bg-white outline-none font-bold" />
      </div>

      <div className="rounded-xl border border-black overflow-hidden mb-3 bg-white shadow-sm">
        <div className="bg-blue-600 px-3 py-2 flex justify-between items-center"><h3 className="text-white font-bold text-xs uppercase">📊 Rincian Kategori</h3></div>
        <div className="px-3 py-2 space-y-1">
          {tBank > 0 && <div className="flex justify-between text-xs"><span>BANK ({countVal("count_bank", "BANK")}x)</span><span className="font-bold text-blue-600">{formatRupiah(tBank)}</span></div>}
          {tFlip > 0 && <div className="flex justify-between text-xs"><span>FLIP ({countVal("count_flip", "FLIP")}x)</span><span className="font-bold text-blue-600">{formatRupiah(tFlip)}</span></div>}
          {tDana > 0 && <div className="flex justify-between text-xs"><span>DANA ({countVal("count_dana", "DANA")}x)</span><span className="font-bold text-blue-600">{formatRupiah(tDana)}</span></div>}
          {tApp > 0 && <div className="flex justify-between text-xs"><span>APP ({countVal("count_app", "APP PULSA")}x)</span><span className="font-bold text-blue-600">{formatRupiah(tApp)}</span></div>}
        </div>
        
        <div className="bg-emerald-500 px-3 py-2 flex justify-between items-center border-t border-black">
          <h3 className="text-white font-bold text-xs uppercase">📈 Total Penjualan</h3>
          <span className="text-white font-black text-sm">{formatRupiah(tPenjualan)}</span>
        </div>

        <div className="bg-white px-3 py-2 space-y-1.5 border-t border-black">
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-bold uppercase text-[10px]">💸 Tarik Tunai ({countVal("count_tarik", "TARIK TUNAI")}x)</span>
            <span className="font-bold text-red-500">-{formatRupiah(tTarik)}</span>
          </div>
          <div className="flex justify-between text-xs border-t pt-1 border-dashed">
            <span className="text-gray-500 font-bold uppercase text-[10px]">💰 Sisa Cash Penjualan</span>
            <span className="font-bold text-emerald-600">{formatRupiah(tPenjualan - tTarik)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gray-500 font-bold uppercase text-[10px]">📱 Admin</span>
            <span className="font-bold text-amber-600">{formatRupiah(tAdmin)}</span>
          </div>
          {tAks > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 font-bold uppercase text-[10px]">🎧 Aksesoris ({countVal("count_aks", "AKSESORIS")}x)</span>
              <span className="font-bold text-red-400">{formatRupiah(tAks)}</span>
            </div>
          )}
        </div>

        <div className="bg-amber-400 px-3 py-2.5 border-t border-black">
          <div className="flex justify-between items-center">
            <h3 className="text-black font-black text-xs uppercase">💰 Total Uang Cash</h3>
            <span className="text-black font-black text-lg">{formatRupiah(sisaCashTotal)}</span>
          </div>
          <div className="mt-1 text-[9px] font-bold text-black/70 leading-tight">
            Sisa Cash: {formatRupiah(tPenjualan - tTarik)} + Admin: {formatRupiah(tAdmin)} + Aks: {formatRupiah(tAks)}
            <br />
            Total Transaksi: {txList.length} entri riwayat
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-black overflow-hidden mb-3 bg-white">
        {tAdminNT > 0 && <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100"><span className="text-xs font-bold text-purple-700">💳 Admin Non Tunai</span><span className="text-xs font-black text-purple-700">{formatRupiah(tAdminNT)}</span></div>}
        {tNT > 0 && <div className="flex justify-between items-center px-3 py-2 border-b border-gray-100"><span className="text-xs font-bold text-purple-600">🏷️ Non Tunai</span><span className="text-xs font-black text-purple-600">{formatRupiah(tNT)}</span></div>}
        {tClosing > 0 && <div className="flex justify-between items-center px-3 py-2"><span className="text-xs font-bold text-gray-600">📒 Transaksi Closing</span><span className="text-xs font-black text-gray-800">{formatRupiah(tClosing)}</span></div>}
      </div>

      <div className="rounded-xl border border-black overflow-hidden mb-4 bg-white">
        <div onClick={() => setShowJurnal(!showJurnal)} className="bg-purple-600 px-3 py-2 flex justify-between items-center cursor-pointer border-b border-black"><h3 className="text-white font-bold text-xs uppercase">📒 Jurnal Penyesuaian</h3><ChevronDown className={`w-4 h-4 text-white transition ${showJurnal ? 'rotate-180' : ''}`} /></div>
        {showJurnal && <div className="px-3 py-2 space-y-1 border-b border-black"><div className="flex justify-between text-xs"><span>Isi Saldo Bank</span><span className="font-bold text-blue-600">{formatRupiah(tIsiBank)}</span></div><div className="flex justify-between text-xs"><span>Sisa Saldo Bank</span><span className="font-bold">{formatRupiah(sBank)}</span></div></div>}
        <div onClick={() => setShowSelisih(!showSelisih)} className="bg-emerald-600 px-3 py-2 flex justify-between items-center cursor-pointer"><h3 className="text-white font-bold text-xs uppercase">🏦 Saldo & Selisih</h3><ChevronDown className={`w-4 h-4 text-white transition ${showSelisih ? 'rotate-180' : ''}`} /></div>
        {showSelisih && <div className="px-3 py-2 border-t border-black"><div className="flex justify-between text-xs"><span>Catatan Bank</span><span className="font-bold">{formatRupiah(sBank)}</span></div><div className="flex justify-between text-xs"><span>Real Aplikasi</span><span className="font-bold text-red-600">{formatRupiah(sReal)}</span></div><div className="flex justify-between text-xs font-bold border-t mt-1 pt-1"><span>Selisih</span><span className={selisih >= 0 ? 'text-green-600' : 'text-red-600'}>{formatRupiah(selisih)}</span></div></div>}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4">
        <button onClick={() => toast({ title: "Membangun PDF..." })} className="bg-red-500 text-white py-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" /> PDF</button>
        <button onClick={() => toast({ title: "Export Excel..." })} className="bg-green-600 text-white py-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"><Download className="w-3.5 h-3.5" /> EXCEL</button>
        <button onClick={() => toast({ title: "Menyiapkan file..." })} className="bg-blue-600 text-white py-2.5 rounded-lg font-bold text-[10px] flex items-center justify-center gap-1"><Share2 className="w-3.5 h-3.5" /> SHARE</button>
      </div>
    </div>
  );
}
