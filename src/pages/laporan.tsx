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
import { Download, Share2, Loader2, ChevronDown, ChevronUp, ChevronRight, MoreVertical } from "lucide-react";
import * as htmlToImage from "html-to-image";
import jsPDF from "jspdf";

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
  const [showPenjualan, setShowPenjualan] = useState(true);
  const [showSaldoAkhir, setShowSaldoAkhir] = useState(true);
  const [showNonTunai, setShowNonTunai] = useState(true);
  const [showRincianKategori, setShowRincianKategori] = useState(true);

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

      // 1. Ambil Rekap dan Notes terlebih dahulu
      const [rekap, kasirRekaps, notes] = await Promise.all([
        (!kname) ? getDailyRekap(date).catch(() => null) : Promise.resolve(null),
        (!kname) ? getAllRekapKasirByRange(date, date).catch(() => []) : getRekapKasirByRange(kname!, date, date).catch(() => []),
        getDailyNotes(kname || user.name, date).catch(() => ({ sisaSaldoBank: 0, saldoRealApp: 0 }))
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

      // 2. Ambil Transaksi dan Saldo History HANYA jika diperlukan (fallback untuk data lama) atau cukup 1 untuk saldo akhir
      let txs: any[] = [];
      let saldo: any[] = [];
      
      const isRekapValid = agg && Object.keys(agg).length > 0;
      
      if (isRekapValid) {
        // Jika Rekap sudah ada, kita cuma butuh 1 transaksi terbaru untuk dapat saldoBankAfter
        txs = await getTransactions({ kasirName: kname, startDate: date, endDate: date, limit: 1 }).catch(() => []);
      } else {
        // Jika tidak ada rekap (data di hari-hari lama), terpaksa fetch full sebagai fallback
        const [fullTxs, fullSaldo] = await Promise.all([
          getTransactions({ kasirName: kname, startDate: date, endDate: date }).catch(() => []),
          getSaldoHistory({ kasirName: kname, startDate: date, endDate: date }).catch(() => [])
        ]);
        txs = fullTxs;
        saldo = fullSaldo;
      }

      setDailyRekap(agg || null);
      setDailyNotes(notes as DailyNoteRecord);
      setTransactions(txs);
      setSaldoHistory(saldo);
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
  const sCash = txList[0]?.saldoCashAfter ?? 0;
  const sReal = dailyNotes?.saldoRealApp || 0;
  const selisih = sReal - sBank;

  const totalTxCount = dailyRekap 
    ? ((dailyRekap.count_bank || 0) + (dailyRekap.count_flip || 0) + (dailyRekap.count_app || 0) + (dailyRekap.count_dana || 0) + (dailyRekap.count_tarik || 0) + (dailyRekap.count_aks || 0) + (dailyRekap.count_closing || 0))
    : txList.length;

  const prepareCapture = async () => {
    setShowRincianKategori(true);
    setShowJurnal(true);
    setShowSelisih(true);
    setShowPenjualan(true);
    setShowSaldoAkhir(true);
    setShowNonTunai(true);
    // Tunggu sedikit agar state React merender elemennya secara full
    await new Promise(r => setTimeout(r, 250));
  };

  const generatePDFBlob = async () => {
    const el = document.getElementById("laporan-capture");
    if (!el) throw new Error("Gagal menemukan elemen laporan");
    
    const imgData = await htmlToImage.toJpeg(el, { quality: 0.95, backgroundColor: "#f9fafb" });
    const pdfWidth = 210;
    const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
    
    const pdf = new jsPDF({
      orientation: "p",
      unit: "mm",
      format: [pdfWidth, pdfHeight < 297 ? 297 : pdfHeight]
    });
    
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    return pdf.output("blob");
  };

  const handleDownloadPDF = async () => {
    toast({ title: "Membangun PDF..." });
    await prepareCapture();
    try {
      const blob = await generatePDFBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Laporan-${date}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF berhasil diunduh" });
    } catch (e: any) {
      toast({ title: "Gagal membuat PDF", description: String(e), variant: "destructive" });
    }
  };

  const handleShare = async () => {
    toast({ title: "Menyiapkan Share..." });
    await prepareCapture();
    try {
      const blob = await generatePDFBlob();
      const file = new File([blob], `Laporan-${date}.pdf`, { type: "application/pdf" });
      
      if (navigator.share) {
        await navigator.share({
          title: `Laporan ${date}`,
          files: [file]
        }).catch(() => {});
      } else {
        toast({ title: "Browser tidak mendukung share..." });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Laporan-${date}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (e: any) {
      toast({ title: "Gagal share", description: String(e), variant: "destructive" });
    }
  };

  const handleDownloadExcel = async () => {
    toast({ title: "Menyiapkan Excel..." });
    try {
      const XLSX = await import("xlsx");
      
      const data = [
        ["LAPORAN HARIAN ALFAZA LINK", ""],
        ["Tanggal", date],
        ["", ""],
        ["RINCIAN KATEGORI", ""],
        ["Bank", tBank],
        ["Flip", tFlip],
        ["Dana", tDana],
        ["App", tApp],
        ["Tarik Tunai", tTarik],
        ["Aksesoris", tAks],
        ["", ""],
        ["TOTAL PENJUALAN", tPenjualan],
        ["SISA CASH PENJUALAN", sisaCashTotal],
        ["", ""],
        ["NON TUNAI", ""],
        ["Admin Non Tunai", tAdminNT],
        ["Non Tunai", tNT],
        ["Transaksi Closing", tClosing],
        ["TOTAL NON TUNAI", tAdminNT + tNT + tClosing],
        ["", ""],
        ["SALDO AKHIR PERIODE", ""],
        ["Saldo Bank", sBank],
        ["Saldo Cash", sCash],
        ["", ""],
        ["JURNAL PENYESUAIAN", ""],
        ["Isi Saldo Bank", tIsiBank],
        ["Sisa Saldo Bank", sBank],
        ["", ""],
        ["SALDO & SELISIH", ""],
        ["Catatan Bank", sBank],
        ["Real Aplikasi", sReal],
        ["Selisih", selisih]
      ];

      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `Laporan-${date}.xlsx`);
      toast({ title: "Excel berhasil diunduh" });
    } catch (e) {
      toast({ title: "Gagal membuat Excel", variant: "destructive" });
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
      <p className="text-[10px] font-bold text-gray-400 uppercase">Sinkronisasi Data...</p>
    </div>
  );

  return (
    <div className="px-3 pt-3 pb-20 bg-gray-50 min-h-screen">
      <div id="laporan-capture" className="bg-gray-50 pb-2">
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

      <div className="rounded-[14px] border border-gray-100 overflow-hidden mb-5 bg-white shadow-sm flex flex-col">
        <div className="bg-white">
        <div onClick={() => setShowRincianKategori(!showRincianKategori)} className="bg-[#1877F2] px-3 py-1.5 flex justify-between items-center cursor-pointer">
          <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-sm">📊</span> RINCIAN KATEGORI
          </h3>
          {showRincianKategori ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
        </div>
        {showRincianKategori && (
          <div className="px-3 py-0 space-y-0 divide-y divide-gray-100">
            {tBank > 0 && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5"><span className="text-blue-600 font-bold text-[11px]">B</span> BANK <span className="text-gray-400 font-medium">({countVal("count_bank", "BANK")}x)</span></span>
                <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(tBank)}</span>
              </div>
            )}
            {tFlip > 0 && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5"><span className="text-blue-600 font-bold text-[11px]">⇄</span> FLIP <span className="text-gray-400 font-medium">({countVal("count_flip", "FLIP")}x)</span></span>
                <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(tFlip)}</span>
              </div>
            )}
            {tDana > 0 && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5"><span className="text-blue-600 font-bold text-[11px]">D</span> DANA <span className="text-gray-400 font-medium">({countVal("count_dana", "DANA")}x)</span></span>
                <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(tDana)}</span>
              </div>
            )}
            {tApp > 0 && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5"><span className="text-blue-600 font-bold text-[11px]">A</span> APP <span className="text-gray-400 font-medium">({countVal("count_app", "APP PULSA")}x)</span></span>
                <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(tApp)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white">
        <div onClick={() => setShowPenjualan(!showPenjualan)} className="bg-[#10B981] px-3 py-1.5 flex justify-between items-center cursor-pointer">
          <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-sm">📈</span> TOTAL PENJUALAN
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-white font-black text-[12px]">{formatRupiah(tPenjualan)}</span>
            {showPenjualan ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
          </div>
        </div>
        {showPenjualan && (
          <div className="px-3 py-0 divide-y divide-gray-100">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5"><span className="text-[11px]">💰</span> TARIK TUNAI ({countVal("count_tarik", "TARIK TUNAI")}X)</span>
              <span className="font-bold text-red-500 text-[11px]">-{formatRupiah(tTarik)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5"><span className="text-[11px]">💰</span> SISA CASH PENJUALAN</span>
              <span className="font-bold text-emerald-600 text-[11px]">{formatRupiah(tPenjualan - tTarik)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5"><span className="text-[11px]">📱</span> ADMIN</span>
              <span className="font-bold text-orange-500 text-[11px]">{formatRupiah(tAdmin)}</span>
            </div>
            {tAks > 0 && (
              <div className="flex justify-between items-center py-0.5">
                <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5"><span className="text-[11px]">🎧</span> AKSESORIS ({countVal("count_aks", "AKSESORIS")}X)</span>
                <span className="font-bold text-red-400 text-[11px]">{formatRupiah(tAks)}</span>
              </div>
            )}
            
            <div className="bg-[#FEF3C7] -mx-3 px-3 py-1.5 flex justify-between items-start border-t border-amber-200/60 mt-0.5">
              <div>
                <h3 className="text-black font-black text-[11px] uppercase tracking-wide flex items-center gap-1">
                  <span className="text-sm">💰</span> TOTAL UANG CASH
                </h3>
                <p className="text-[9px] text-gray-700 mt-0.5">Sisa Cash: {formatRupiah(tPenjualan - tTarik)} + Admin: {formatRupiah(tAdmin)} + Aks: {formatRupiah(tAks)}</p>
                <p className="text-[9px] text-gray-700">Total Transaksi: {totalTxCount} entri riwayat</p>
              </div>
              <span className="text-black font-black text-[12px]">{formatRupiah(sisaCashTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {(tAdminNT > 0 || tNT > 0 || tClosing > 0) && (
        <div className="bg-white">
          <div onClick={() => setShowNonTunai(!showNonTunai)} className="bg-purple-400 px-3 py-1.5 flex justify-between items-center cursor-pointer">
            <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
              <span className="text-sm">💳</span> TOTAL NON TUNAI
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-white font-black text-[12px]">{formatRupiah(tAdminNT + tNT + tClosing)}</span>
              {showNonTunai ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
            </div>
          </div>
          {showNonTunai && (
            <div className="px-3 py-0 divide-y divide-gray-100">
              {tAdminNT > 0 && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5"><span className="text-[11px]">📱</span> Admin Non Tunai</span>
                  <span className="font-bold text-purple-700 text-[11px]">{formatRupiah(tAdminNT)}</span>
                </div>
              )}
              {tNT > 0 && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5"><span className="text-[11px]">🏷️</span> Non Tunai</span>
                  <span className="font-bold text-purple-700 text-[11px]">{formatRupiah(tNT)}</span>
                </div>
              )}
              {tClosing > 0 && (
                <div className="flex justify-between items-center py-0.5">
                  <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5"><span className="text-[11px]">📒</span> Transaksi Closing</span>
                  <span className="font-bold text-purple-700 text-[11px]">{formatRupiah(tClosing)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white">
        <div onClick={() => setShowSaldoAkhir(!showSaldoAkhir)} className="bg-[#1877F2] px-3 py-1.5 flex justify-between items-center cursor-pointer">
          <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-sm">🏁</span> SALDO AKHIR PERIODE
          </h3>
          {showSaldoAkhir ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
        </div>
        {showSaldoAkhir && (
          <div className="px-3 py-1">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-gray-700">Saldo Bank</span>
              <span className="font-bold text-blue-600 text-xs">{formatRupiah(sBank)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-gray-700">Saldo Cash</span>
              <span className="font-bold text-emerald-600 text-xs">{formatRupiah(sCash)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white">
        <div onClick={() => setShowJurnal(!showJurnal)} className="bg-[#8B5CF6] px-3 py-1.5 flex justify-between items-center cursor-pointer">
          <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-sm">📒</span> JURNAL PENYESUAIAN
          </h3>
          {showJurnal ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
        </div>
        {showJurnal && (
          <div className="px-3 py-1">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-gray-700">Isi Saldo Bank</span>
              <span className="font-bold text-blue-600 text-xs">{formatRupiah(tIsiBank)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-gray-700">Sisa Saldo Bank</span>
              <span className="font-bold text-red-500 text-xs">{formatRupiah(sBank)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white">
        <div onClick={() => setShowSelisih(!showSelisih)} className="bg-[#10B981] px-3 py-1.5 flex justify-between items-center cursor-pointer">
          <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">
            <span className="text-sm">🧮</span> SALDO & SELISIH
          </h3>
          {showSelisih ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
        </div>
        {showSelisih && (
          <div className="px-3 py-1.5">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-gray-700">Catatan Bank</span>
              <span className="font-bold text-black text-xs">{formatRupiah(sBank)}</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-xs text-gray-700">Real Aplikasi</span>
              <span className="font-bold text-red-500 text-xs">{formatRupiah(sReal)}</span>
            </div>
            <div className="flex justify-between items-center py-1 mt-0.5 border-t border-gray-100">
              <span className="font-bold text-black text-xs">Selisih</span>
              <span className={`font-bold text-xs ${selisih >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{formatRupiah(selisih)}</span>
            </div>
          </div>
        )}
      </div>
      </div>
      </div>

      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <button onClick={handleDownloadPDF} className="bg-[#EF4444] text-white py-3 rounded-[12px] font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"><Download className="w-4 h-4" /> PDF</button>
        <button onClick={handleDownloadExcel} className="bg-[#10B981] text-white py-3 rounded-[12px] font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"><Download className="w-4 h-4" /> EXCEL</button>
        <button onClick={handleShare} className="bg-[#1877F2] text-white py-3 rounded-[12px] font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"><Share2 className="w-4 h-4" /> SHARE</button>
      </div>
    </div>
  );
}
