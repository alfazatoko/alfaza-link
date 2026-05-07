import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import {
  getTransactions, getSaldoHistory, getDailyNotes,
  getUsers, getDailyRekap, getAllRekapKasirByRange, getRekapKasirByRange,
  type TransactionRecord, type SaldoHistoryRecord, type DailyNoteRecord, type UserRecord, type DailyRekapRecord
} from "@/lib/firestore";
import { formatRupiah, getWibDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Download, Share2, Loader2, ChevronDown, ChevronUp, ChevronRight, Eye } from "lucide-react";

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
  
  const [showRincianKategori, setShowRincianKategori] = useState(true);
  const [showJurnal, setShowJurnal] = useState(true);
  const [showSelisih, setShowSelisih] = useState(true);
  const [showPenjualan, setShowPenjualan] = useState(true);
  const [showSaldoAkhir, setShowSaldoAkhir] = useState(true);
  const [showNonTunai, setShowNonTunai] = useState(true);
  
  const [viewMode, setViewMode] = useState<'ringkasan' | 'detail'>('ringkasan');
  const [isDetailsLoaded, setIsDetailsLoaded] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  const isOwner = user?.role === "owner";

  const viewModeRef = useRef(viewMode);
  const txCacheRef = useRef<TransactionRecord[]>([]);
  const saldoCacheRef = useRef<SaldoHistoryRecord[]>([]);
  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

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

      setDailyNotes(notes as DailyNoteRecord);
      
      // Reset details & cache when date or kasir changes
      setIsDetailsLoaded(false);
      setTransactions([]);
      setSaldoHistory([]);
      txCacheRef.current = [];
      saldoCacheRef.current = [];

      if (agg) {
        // Rekap exists → langsung pakai (ringan)
        setDailyRekap(agg);
      } else {
        // Tidak ada rekap → load transaksi, buat rekap sintetis, cache hasilnya
        const [txs, saldos] = await Promise.all([
          getTransactions({ kasirName: kname, startDate: date, endDate: date }).catch(() => []),
          getSaldoHistory({ kasirName: kname, startDate: date, endDate: date }).catch(() => [])
        ]);
        // Cache untuk dipakai tab Detail nanti
        txCacheRef.current = txs;
        saldoCacheRef.current = saldos;
        // Ambil saldo dari aktivitas terbaru (bandingkan Transaksi vs Tambah Saldo)
        const latestTx = txs[0];
        const latestSh = saldos[0];
        let sBankLast = 0;
        let sCashLast = 0;

        if (latestTx && latestSh) {
          if ((latestTx.createdAt || "") > (latestSh.createdAt || "")) {
            sBankLast = latestTx.saldoBankAfter ?? 0;
            sCashLast = latestTx.saldoCashAfter ?? 0;
          } else {
            sBankLast = latestSh.saldoBankAfter ?? 0;
            sCashLast = latestSh.saldoCashAfter ?? 0;
          }
        } else if (latestTx) {
          sBankLast = latestTx.saldoBankAfter ?? 0;
          sCashLast = latestTx.saldoCashAfter ?? 0;
        } else if (latestSh) {
          sBankLast = latestSh.saldoBankAfter ?? 0;
          sCashLast = latestSh.saldoCashAfter ?? 0;
        }

        const synth: any = {
          total_bank: txs.filter(t => t.category === "BANK").reduce((s, t) => s + (t.nominal || 0), 0),
          total_flip: txs.filter(t => t.category === "FLIP").reduce((s, t) => s + (t.nominal || 0), 0),
          total_app: txs.filter(t => t.category === "APP PULSA").reduce((s, t) => s + (t.nominal || 0), 0),
          total_dana: txs.filter(t => t.category === "DANA").reduce((s, t) => s + (t.nominal || 0), 0),
          total_tarik: txs.filter(t => t.category === "TARIK TUNAI").reduce((s, t) => s + (t.nominal || 0), 0),
          total_aks: txs.filter(t => t.category === "AKSESORIS").reduce((s, t) => s + (t.nominal || 0), 0),
          total_closing: txs.filter(t => t.category === "CLOSING").reduce((s, t) => s + (t.nominal || 0), 0),
          total_admin: txs.reduce((s, t) => s + (!t.adminNonTunai ? (t.admin || 0) : 0), 0),
          total_admin_non_tunai: txs.reduce((s, t) => s + (t.adminNonTunai ? (t.admin || 0) : 0), 0),
          total_non_tunai: txs.filter(t => (t.paymentMethod || "").toLowerCase().includes("non-tunai") && t.category !== "CLOSING").reduce((s, t) => s + (t.nominal || 0), 0),
          total_isi_bank: saldos.filter(s => s.jenis === "Bank").reduce((s, h) => s + (h.nominal || 0), 0),
          count_bank: txs.filter(t => t.category === "BANK").length,
          count_flip: txs.filter(t => t.category === "FLIP").length,
          count_app: txs.filter(t => t.category === "APP PULSA").length,
          count_dana: txs.filter(t => t.category === "DANA").length,
          count_aks: txs.filter(t => t.category === "AKSESORIS").length,
          count_tarik: txs.filter(t => t.category === "TARIK TUNAI").length,
          count_closing: txs.filter(t => t.category === "CLOSING").length,
          saldo_bank_last: sBankLast,
          saldo_cash_last: sCashLast,
        };
        setDailyRekap(synth);
      }

      // Auto-load details jika user sudah di tab detail
      if (viewModeRef.current === 'detail') {
        if (txCacheRef.current.length > 0) {
          setTransactions(txCacheRef.current);
          setSaldoHistory(saldoCacheRef.current);
          setIsDetailsLoaded(true);
        } else {
          loadFullDetails(kname, true);
        }
      }
    } catch (err) {
      console.error("Load Error:", err);
    } finally {
      setLoading(false);
    }
  }, [user, isOwner, kasirFilter, date]);

  const loadFullDetails = async (forcedKname?: string, force: boolean = false) => {
    if (!user || loadingDetails) return;
    if (!force && isDetailsLoaded) return;
    // Cek cache dulu — kalau sudah pernah load, langsung pakai
    if (txCacheRef.current.length > 0) {
      setTransactions(txCacheRef.current);
      setSaldoHistory(saldoCacheRef.current);
      setIsDetailsLoaded(true);
      return;
    }
    setLoadingDetails(true);
    try {
      let kname = forcedKname || (isOwner ? (kasirFilter === "Semua" ? undefined : kasirFilter) : user.name);
      const [fullTxs, fullSaldo] = await Promise.all([
        getTransactions({ kasirName: kname, startDate: date, endDate: date }).catch(() => []),
        getSaldoHistory({ kasirName: kname, startDate: date, endDate: date }).catch(() => [])
      ]);
      setTransactions(fullTxs);
      setSaldoHistory(fullSaldo);
      txCacheRef.current = fullTxs;
      saldoCacheRef.current = fullSaldo;
      setIsDetailsLoaded(true);
    } catch (err) {
      toast({ title: "Gagal memuat detail", variant: "destructive" });
    } finally {
      setLoadingDetails(false);
    }
  };


  useEffect(() => { loadData(); }, [loadData]);

  const stats = useMemo(() => {
    const txList = Array.isArray(transactions) ? transactions : [];
    const shList = Array.isArray(saldoHistory) ? saldoHistory : [];
    const getVal = (key: string, cat: string) => {
      if (!isDetailsLoaded && dailyRekap && (dailyRekap as any)[key] !== undefined) return (dailyRekap as any)[key] || 0;
      return txList.filter(t => t.category === cat).reduce((s, t) => s + (t.nominal || 0), 0);
    };
    const countVal = (key: string, cat: string) => {
      if (!isDetailsLoaded && dailyRekap && (dailyRekap as any)[key] !== undefined) return (dailyRekap as any)[key] || 0;
      return txList.filter(t => t.category === cat).length;
    };

    const tBank = getVal("total_bank", "BANK");
    const tFlip = getVal("total_flip", "FLIP");
    const tApp = getVal("total_app", "APP PULSA");
    const tDana = getVal("total_dana", "DANA");
    const tTarik = getVal("total_tarik", "TARIK TUNAI");
    const tAks = getVal("total_aks", "AKSESORIS");
    const tClosing = getVal("total_closing", "CLOSING");
    const tAdmin = (!isDetailsLoaded && dailyRekap) ? (dailyRekap.total_admin || 0) : txList.reduce((s, t) => s + (!t.adminNonTunai ? (t.admin || 0) : 0), 0);
    const tAdminNT = (!isDetailsLoaded && dailyRekap) ? (dailyRekap.total_admin_non_tunai || 0) : txList.reduce((s, t) => s + (t.adminNonTunai ? (t.admin || 0) : 0), 0);
    const tNT = (!isDetailsLoaded && dailyRekap) ? (dailyRekap.total_non_tunai || 0) : txList.filter(t => (t.paymentMethod || "").toLowerCase().includes("non-tunai") && t.category !== "CLOSING").reduce((s, t) => s + (t.nominal || 0), 0);
    const tPenjualan = tBank + tFlip + tApp + tDana;
    const sisaCashTotal = tPenjualan - tTarik + tAdmin + tAks;
    const tIsiBank = (!isDetailsLoaded && dailyRekap) ? (dailyRekap.total_isi_bank || 0) : shList.filter(s => s.jenis === "Bank").reduce((s, h) => s + (h.nominal || 0), 0);
    const latestTx = txList[0];
    const latestSh = shList[0];
    let sBankLast = 0;
    let sCashLast = 0;

    if (latestTx && latestSh) {
      if ((latestTx.createdAt || "") > (latestSh.createdAt || "")) {
        sBankLast = latestTx.saldoBankAfter ?? 0;
        sCashLast = latestTx.saldoCashAfter ?? 0;
      } else {
        sBankLast = latestSh.saldoBankAfter ?? 0;
        sCashLast = latestSh.saldoCashAfter ?? 0;
      }
    } else if (latestTx) {
      sBankLast = latestTx.saldoBankAfter ?? 0;
      sCashLast = latestTx.saldoCashAfter ?? 0;
    } else if (latestSh) {
      sBankLast = latestSh.saldoBankAfter ?? 0;
      sCashLast = latestSh.saldoCashAfter ?? 0;
    }

    const sBank = (!isDetailsLoaded && dailyRekap && (dailyRekap as any).saldo_bank_last !== undefined)
      ? (dailyRekap as any).saldo_bank_last
      : sBankLast;
    const sCash = (!isDetailsLoaded && dailyRekap && (dailyRekap as any).saldo_cash_last !== undefined)
      ? (dailyRekap as any).saldo_cash_last
      : sCashLast;
    const sReal = dailyNotes?.saldoRealApp || 0;
    const selisih = sReal - sBank;
    const totalTxCount = (!isDetailsLoaded && dailyRekap)
      ? ((dailyRekap.count_bank || 0) + (dailyRekap.count_flip || 0) + (dailyRekap.count_app || 0) + (dailyRekap.count_dana || 0) + (dailyRekap.count_tarik || 0) + (dailyRekap.count_aks || 0) + (dailyRekap.count_closing || 0))
      : txList.length;

    return {
      tBank, tFlip, tApp, tDana, tTarik, tAks, tClosing,
      tAdmin, tAdminNT, tNT, tPenjualan, sisaCashTotal,
      tIsiBank, sBank, sCash, sReal, selisih, totalTxCount,
      countVal
    };
  }, [dailyRekap, transactions, saldoHistory, dailyNotes, isDetailsLoaded]);

  const {
    tBank, tFlip, tApp, tDana, tTarik, tAks, tClosing,
    tAdmin, tAdminNT, tNT, tPenjualan, sisaCashTotal,
    tIsiBank, sBank, sCash, sReal, selisih, totalTxCount,
    countVal
  } = stats;

  const prepareCapture = async () => {
    if (!isDetailsLoaded) await loadFullDetails();
    setViewMode('detail');
    await new Promise(r => setTimeout(r, 250));
  };

  const generatePDFBlob = async () => {
    // Dynamic Import jsPDF
    const { default: jsPDF } = await import("jspdf");
    const doc = new jsPDF();
    
    const margin = 15;
    let y = 15;
    const pageWidth = doc.internal.pageSize.width;
    const contentWidth = pageWidth - (margin * 2);

    // --- HELPER: Draw Section Title (clean, no colored bar) ---
    const drawSectionTitle = (text: string) => {
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(text.toUpperCase(), margin + 2, y + 1);
      y += 3;
      // Subtle underline
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.4);
      doc.line(margin, y, pageWidth - margin, y);
      doc.setLineWidth(0.2);
      y += 4;
    };

    const drawRow = (label: string, value: string, isBold = false) => {
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(9);
      doc.text(label, margin + 4, y);
      doc.text(value, pageWidth - margin - 4, y, { align: "right" });
      y += 5;
      // Draw thin separator line
      doc.setDrawColor(230, 230, 230);
      doc.line(margin + 4, y - 1, pageWidth - margin - 4, y - 1);
      y += 1.5;
    };

    // --- HEADER (satu-satunya yang berwarna) ---
    doc.setFillColor(59, 130, 246); // Blue
    doc.roundedRect(margin, y, contentWidth, 18, 3, 3, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("ALFAZA CELL", pageWidth / 2, y + 8, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Laporan Harian", pageWidth / 2, y + 13, { align: "center" });
    y += 22;

    // --- SUB-HEADER (Info) ---
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    const infoText = `Kasir: ${kasirFilter === "Semua" ? (user?.name || "-") : kasirFilter}  |  Tanggal: ${date}`;
    doc.text(infoText, pageWidth / 2, y + 2, { align: "center" });
    y += 10;

    // --- SECTION: RINCIAN KATEGORI ---
    drawSectionTitle("Rincian Kategori");
    drawRow(`BANK (${countVal("count_bank", "BANK")}x)`, formatRupiah(tBank));
    drawRow(`FLIP (${countVal("count_flip", "FLIP")}x)`, formatRupiah(tFlip));
    drawRow(`DANA (${countVal("count_dana", "DANA")}x)`, formatRupiah(tDana));
    drawRow(`APP PULSA (${countVal("count_app", "APP PULSA")}x)`, formatRupiah(tApp));
    drawRow(`ISI BANK (History)`, formatRupiah(tIsiBank));
    y += 3;

    // --- SECTION: TOTAL PENJUALAN ---
    drawSectionTitle("Total Penjualan");
    drawRow("Total Penjualan", formatRupiah(tPenjualan), true);
    drawRow(`Tarik Tunai (${countVal("count_tarik", "TARIK TUNAI")}x)`, `-${formatRupiah(tTarik)}`);
    drawRow("Sisa Cash Penjualan", formatRupiah(tPenjualan - tTarik));
    drawRow("Admin", formatRupiah(tAdmin));
    drawRow(`Aksesoris (${countVal("count_aks", "AKSESORIS")}x)`, formatRupiah(tAks));
    drawRow("Non Tunai", formatRupiah(tNT));
    y += 3;

    // --- SECTION: SISA CASH TOTAL (highlighted with light gray bg) ---
    doc.setFillColor(240, 240, 240);
    doc.roundedRect(margin, y, contentWidth, 12, 2, 2, "F");
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SISA CASH TOTAL", margin + 5, y + 7.5);
    doc.text(formatRupiah(sisaCashTotal), pageWidth - margin - 5, y + 7.5, { align: "right" });
    y += 16;

    // --- SECTION: JURNAL PENYESUAIAN ---
    drawSectionTitle("Jurnal Penyesuaian Saldo");
    drawRow("Total Isi Saldo Bank", formatRupiah(tIsiBank));
    drawRow(`S.Akhir(${formatRupiah(sBank)}) + Penjualan(${formatRupiah(tPenjualan)})`, formatRupiah(sBank + tPenjualan));
    drawRow("Total Selisih", formatRupiah((sBank + tPenjualan) - tIsiBank), true);
    y += 3;

    // --- SECTION: SALDO & SELISIH ---
    drawSectionTitle("Saldo & Selisih");
    drawRow("Saldo Akhir Bank", formatRupiah(sBank));
    drawRow("Saldo Real Aplikasi", formatRupiah(sReal));
    drawRow("Selisih", formatRupiah(selisih), true);
    y += 3;

    // --- SECTION: SALDO AKHIR PERIODE ---
    drawSectionTitle("Saldo Akhir Periode");
    drawRow("Saldo Akhir Bank", formatRupiah(sBank));
    drawRow("Saldo Akhir Cash", formatRupiah(sCash));

    // Footer
    y = doc.internal.pageSize.height - 10;
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, margin, y);
    doc.text("Alfaza Link - Sistem Kasir Pintar", pageWidth - margin, y, { align: "right" });

    return doc.output("blob");
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
        await navigator.share({ title: `Laporan ${date}`, files: [file] }).catch(() => {});
      } else {
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
    await prepareCapture();
    try {
      const XLSX = await import("xlsx");
      const data = [
        ["LAPORAN HARIAN ALFAZA LINK", ""],
        ["Tanggal", date],
        ["", ""],
        ["RINCIAN KATEGORI", ""],
        ["Bank", tBank], ["Flip", tFlip], ["Dana", tDana], ["App", tApp], ["Tarik Tunai", tTarik], ["Aksesoris", tAks],
        ["", ""],
        ["TOTAL PENJUALAN", tPenjualan],
        ["SISA CASH PENJUALAN", sisaCashTotal],
        ["", ""],
        ["NON TUNAI", ""],
        ["Admin Non Tunai", tAdminNT], ["Non Tunai", tNT], ["Transaksi Closing", tClosing],
        ["TOTAL NON TUNAI", tAdminNT + tNT + tClosing],
        ["", ""],
        ["SALDO AKHIR PERIODE", ""],
        ["Saldo Bank", sBank], ["Saldo Cash", sCash],
        ["", ""],
        ["JURNAL PENYESUAIAN SALDO", ""],
        ["Total Isi Saldo Bank", tIsiBank], ["Saldo Akhir Bank", sBank], ["Total Penjualan", tPenjualan], ["Total (Sisa + Terjual)", sBank + tPenjualan], ["Total Selisih", (sBank + tPenjualan) - tIsiBank],
        ["", ""],
        ["SALDO & SELISIH", ""],
        ["Saldo Akhir Bank", sBank], ["Saldo Real Aplikasi", sReal], ["Selisih", selisih]
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

        {/* TAB NAVIGATION */}
        <div className="flex bg-gray-200/50 p-1.5 rounded-2xl mb-4 border border-gray-200 shadow-inner">
          <button
            onClick={() => setViewMode('ringkasan')}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${viewMode === 'ringkasan' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📋 Ringkasan
          </button>
          <button
            onClick={() => {
              setViewMode('detail');
              loadFullDetails();
            }}
            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${viewMode === 'detail' ? 'bg-white text-blue-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            📊 Detail Data
          </button>
        </div>

        {/* EXPORT ACTIONS */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={handleDownloadPDF} className="bg-[#EF4444] text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm border border-red-600/20">
            <Download className="w-3.5 h-3.5" /> PDF
          </button>
          <button onClick={handleDownloadExcel} className="bg-[#10B981] text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm border border-emerald-600/20">
            <Download className="w-3.5 h-3.5" /> EXCEL
          </button>
          <button onClick={handleShare} className="bg-[#1877F2] text-white py-2.5 rounded-xl font-bold text-[10px] flex items-center justify-center gap-1.5 active:scale-95 transition shadow-sm border border-blue-600/20">
            <Share2 className="w-3.5 h-3.5" /> SHARE
          </button>
        </div>

        {viewMode === 'ringkasan' ? (
          <div className="animate-in fade-in duration-300">



        {/* 1. RINGKASAN UTAMA (KARTU HIJAU, KUNING, UNGU) */}
        <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
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
              <div className="flex justify-between items-center py-0">
                <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">💰 TARIK TUNAI ({countVal("count_tarik", "TARIK TUNAI")}X)</span>
                <span className="font-bold text-red-500 text-[11px] leading-tight">-{formatRupiah(tTarik)}</span>
              </div>
              <div className="flex justify-between items-center py-0">
                <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">💰 SISA CASH PENJUALAN</span>
                <span className="font-bold text-emerald-600 text-[11px] leading-tight">{formatRupiah(tPenjualan - tTarik)}</span>
              </div>
              <div className="flex justify-between items-center py-0">
                <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">📱 ADMIN</span>
                <span className="font-bold text-orange-500 text-[11px] leading-tight">{formatRupiah(tAdmin)}</span>
              </div>
              <div className="flex justify-between items-center py-0">
                <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">🎧 AKSESORIS ({countVal("count_aks", "AKSESORIS")}X)</span>
                <span className="font-bold text-blue-600 text-[11px] leading-tight">{formatRupiah(tAks)}</span>
              </div>
              <div className="bg-[#FEF3C7] -mx-3 px-3 py-1.5 flex justify-between items-start border-t border-amber-200/60 mt-0.5">
                <div>
                  <h3 className="text-black font-black text-[11px] uppercase tracking-wide flex items-center gap-1">💰 TOTAL UANG CASH</h3>
                  <p className="text-[9px] text-gray-700 mt-0.5">Sisa Cash: {formatRupiah(tPenjualan - tTarik)} + Admin: {formatRupiah(tAdmin)} + Aks: {formatRupiah(tAks)}</p>
                </div>
                <span className="text-black font-black text-[12px]">{formatRupiah(sisaCashTotal)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
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
              <div className="flex justify-between items-center py-0">
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 leading-tight">📱 Admin Non Tunai</span>
                <span className="font-bold text-purple-700 text-[11px] leading-tight">{formatRupiah(tAdminNT)}</span>
              </div>
              <div className="flex justify-between items-center py-0">
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 leading-tight">🏷️ Non Tunai</span>
                <span className="font-bold text-purple-700 text-[11px] leading-tight">{formatRupiah(tNT)}</span>
              </div>
              <div className="flex justify-between items-center py-0">
                <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 leading-tight">📒 Transaksi Closing</span>
                <span className="font-bold text-purple-700 text-[11px] leading-tight">{formatRupiah(tClosing)}</span>
              </div>
            </div>
          )}
        </div>

          </div>
        ) : (
          <div className="animate-in slide-in-from-right-4 fade-in duration-300 pb-10">
            {loadingDetails ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin mb-2" />
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Memuat Detail Transaksi...</span>
              </div>
            ) : (
              <>
                <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
                  <div onClick={() => setShowRincianKategori(!showRincianKategori)} className="bg-[#1877F2] px-3 py-1.5 flex justify-between items-center cursor-pointer">
                    <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">📊 RINCIAN KATEGORI</h3>
                    {showRincianKategori ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
                  </div>
                  {showRincianKategori && (
                    <div className="px-3 py-0 divide-y divide-gray-100">
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5 leading-tight"><span className="text-blue-600 font-bold text-[11px]">B</span> BANK <span className="text-gray-400 font-medium lowercase">({countVal("count_bank", "BANK")}x)</span></span>
                        <span className="font-bold text-blue-600 text-[11px] leading-tight">{formatRupiah(tBank)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5 leading-tight"><span className="text-blue-600 font-bold text-[11px]">F</span> FLIP <span className="text-gray-400 font-medium lowercase">({countVal("count_flip", "FLIP")}x)</span></span>
                        <span className="font-bold text-blue-600 text-[11px] leading-tight">{formatRupiah(tFlip)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5 leading-tight"><span className="text-blue-600 font-bold text-[11px]">D</span> DANA <span className="text-gray-400 font-medium lowercase">({countVal("count_dana", "DANA")}x)</span></span>
                        <span className="font-bold text-blue-600 text-[11px] leading-tight">{formatRupiah(tDana)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-700 uppercase flex items-center gap-1.5 leading-tight"><span className="text-blue-600 font-bold text-[11px]">A</span> APP <span className="text-gray-400 font-medium lowercase">({countVal("count_app", "APP PULSA")}x)</span></span>
                        <span className="font-bold text-blue-600 text-[11px] leading-tight">{formatRupiah(tApp)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
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
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">💰 TARIK TUNAI ({countVal("count_tarik", "TARIK TUNAI")}X)</span>
                        <span className="font-bold text-red-500 text-[11px] leading-tight">-{formatRupiah(tTarik)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">💰 SISA CASH PENJUALAN</span>
                        <span className="font-bold text-emerald-600 text-[11px] leading-tight">{formatRupiah(tPenjualan - tTarik)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">📱 ADMIN</span>
                        <span className="font-bold text-orange-500 text-[11px] leading-tight">{formatRupiah(tAdmin)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[10px] font-bold text-gray-600 uppercase flex items-center gap-1.5 leading-tight">🎧 AKSESORIS ({countVal("count_aks", "AKSESORIS")}X)</span>
                        <span className="font-bold text-blue-600 text-[11px] leading-tight">{formatRupiah(tAks)}</span>
                      </div>
                      <div className="bg-[#FEF3C7] -mx-3 px-3 py-1.5 flex justify-between items-start border-t border-amber-200/60 mt-0.5">
                        <div>
                          <h3 className="text-black font-black text-[11px] uppercase tracking-wide flex items-center gap-1">💰 TOTAL UANG CASH</h3>
                          <p className="text-[9px] text-gray-700 mt-0.5">Sisa Cash: {formatRupiah(tPenjualan - tTarik)} + Admin: {formatRupiah(tAdmin)} + Aks: {formatRupiah(tAks)}</p>
                          <p className="text-[9px] text-gray-700">Total Transaksi: {totalTxCount} entri riwayat</p>
                        </div>
                        <span className="text-black font-black text-[12px]">{formatRupiah(sisaCashTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
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
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 leading-tight">📱 Admin Non Tunai</span>
                        <span className="font-bold text-purple-700 text-[11px] leading-tight">{formatRupiah(tAdminNT)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 leading-tight">🏷️ Non Tunai</span>
                        <span className="font-bold text-purple-700 text-[11px] leading-tight">{formatRupiah(tNT)}</span>
                      </div>
                      <div className="flex justify-between items-center py-0">
                        <span className="text-[11px] font-bold text-purple-700 flex items-center gap-1.5 leading-tight">📒 Transaksi Closing</span>
                        <span className="font-bold text-purple-700 text-[11px] leading-tight">{formatRupiah(tClosing)}</span>
                      </div>
                    </div>
                  )}
                </div>

          <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
            <div onClick={() => setShowSaldoAkhir(!showSaldoAkhir)} className="bg-[#1877F2] px-3 py-1.5 flex justify-between items-center cursor-pointer">
              <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">🏁 SALDO AKHIR PERIODE</h3>
              {showSaldoAkhir ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
            </div>
            {showSaldoAkhir && (
              <div className="px-3 py-1">
                <div className="flex justify-between items-center py-0">
                  <span className="text-[11px] font-medium text-gray-700">Saldo Akhir Bank</span>
                  <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(sBank)}</span>
                </div>
                <div className="flex justify-between items-center py-0">
                  <span className="text-[11px] font-medium text-gray-700">Saldo Akhir Cash</span>
                  <span className="font-bold text-emerald-600 text-[11px]">{formatRupiah(sCash)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
            <div onClick={() => setShowJurnal(!showJurnal)} className="bg-[#8B5CF6] px-3 py-1.5 flex justify-between items-center cursor-pointer">
              <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">📒 JURNAL PENYESUAIAN SALDO</h3>
              {showJurnal ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
            </div>
            {showJurnal && (
              <div className="px-3 py-1">
                <div className="flex justify-between items-center py-0">
                  <span className="text-[11px] font-medium text-gray-700">Total Isi Saldo Bank</span>
                  <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(tIsiBank)}</span>
                </div>

                <div className="border-t border-dashed border-gray-100">
                  <div className="flex justify-between items-center py-0">
                    <div className="flex flex-wrap items-center gap-x-1 text-[10px] text-gray-600 font-medium">
                      <span>Saldo Akhir Bank</span>
                      <span className="text-blue-600 font-bold">{formatRupiah(sBank)}</span>
                      <span>+</span>
                      <span>Total Penjualan</span>
                      <span className="text-emerald-600 font-bold">{formatRupiah(tPenjualan)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-900 font-black text-[11px]">{formatRupiah(sBank + tPenjualan)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center py-0 border-t border-gray-200">
                  <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tighter">Total Selisih</span>
                  <span className={`font-black text-[13px] ${((sBank + tPenjualan) - tIsiBank) < 0 ? "text-red-600" : "text-emerald-600"}`}>
                    {formatRupiah((sBank + tPenjualan) - tIsiBank)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-[14px] border border-gray-100 overflow-hidden mb-2 shadow-sm">
            <div onClick={() => setShowSelisih(!showSelisih)} className="bg-[#10B981] px-3 py-1.5 flex justify-between items-center cursor-pointer">
              <h3 className="text-white font-bold text-[11px] uppercase tracking-wide flex items-center gap-1.5">🧮 SALDO & SELISIH</h3>
              {showSelisih ? <ChevronUp className="w-4 h-4 text-white/80" /> : <ChevronDown className="w-4 h-4 text-white/80" />}
            </div>
            {showSelisih && (
              <div className="px-3 py-1.5">
                <div className="flex justify-between items-center py-0">
                  <span className="text-[11px] font-medium text-gray-700">Saldo Akhir Bank</span>
                  <span className="font-bold text-blue-600 text-[11px]">{formatRupiah(sBank)}</span>
                </div>
                <div className="flex justify-between items-center py-0">
                  <span className="text-[11px] font-medium text-gray-700">Saldo Real Aplikasi</span>
                  <span className="font-bold text-purple-600 text-[11px]">{formatRupiah(sReal)}</span>
                </div>
                <div className="flex justify-between items-center py-1 mt-1 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-800 uppercase tracking-tighter">Total Selisih</span>
                  <span className={`font-black text-[13px] ${selisih === 0 ? "text-emerald-600" : "text-red-600"}`}>{formatRupiah(selisih)}</span>
                </div>
              </div>
            )}
          </div>

          {/* 7. DAFTAR TRANSAKSI DETAIL */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-blue-600 rounded-full"></div>
                <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-wider">Daftar Transaksi</h3>
              </div>
              <span className="text-[9px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{transactions.length} Entri</span>
            </div>
            
            {transactions.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Belum ada data transaksi</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {transactions.map((tx) => (
                  <div key={tx.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center justify-between gap-3 active:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shadow-sm ${
                        tx.category === 'BANK' ? 'bg-blue-50 text-blue-600' :
                        tx.category === 'TARIK TUNAI' ? 'bg-red-50 text-red-600' :
                        tx.category === 'FLIP' ? 'bg-orange-50 text-orange-600' :
                        tx.category === 'DANA' ? 'bg-emerald-50 text-emerald-600' :
                        tx.category === 'AKSESORIS' ? 'bg-purple-50 text-purple-600' :
                        'bg-gray-50 text-gray-600'
                      }`}>
                        {tx.category.substring(0, 1)}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-800 leading-tight uppercase truncate max-w-[140px]">{tx.keterangan || tx.category}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter bg-gray-50 px-1.5 rounded-md border border-gray-100">{tx.transTime}</span>
                          <span className="text-[9px] text-gray-500 font-bold">{tx.kasirName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] font-black text-gray-900 leading-tight">{formatRupiah(tx.nominal)}</p>
                      <p className={`text-[9px] font-bold mt-0.5 ${tx.adminNonTunai ? "text-purple-600" : "text-emerald-600"}`}>
                        {tx.adminNonTunai ? "NT: " : ""}+{formatRupiah(tx.admin)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

              </>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
