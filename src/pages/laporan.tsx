import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import {
  getTransactions, getSaldoHistory, getDailySnapshot, getDailyNotes,
  lockReport, resetBalance,
  type TransactionRecord, type SaldoHistoryRecord, type DailyNoteRecord
} from "@/lib/firestore";
import { formatRupiah, getWibDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Lock, Download, Share2, Loader2, RotateCcw } from "lucide-react";

export default function Laporan() {
  const { user, shift } = useAuth();
  const { toast } = useToast();
  const today = getWibDate();

  const [date, setDate] = useState(today);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [saldoHistory, setSaldoHistory] = useState<SaldoHistoryRecord[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [dailyNotes, setDailyNotes] = useState<DailyNoteRecord>({ sisaSaldoBank: 0, saldoRealApp: 0 });

  const reportRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const kasirName = user.role === "owner" ? undefined : user.name;
      const [txs, saldo, snap, notes] = await Promise.all([
        getTransactions({ kasirName, startDate: date, endDate: date }),
        getSaldoHistory({ kasirName, startDate: date, endDate: date }),
        getDailySnapshot(user.name, date),
        getDailyNotes(user.name, date),
      ]);
      setTransactions(txs);
      setSaldoHistory(saldo);
      setIsLocked(snap?.locked || false);
      setDailyNotes(notes);
    } catch {} finally {
      setLoading(false);
    }
  }, [user, date]);

  useEffect(() => { loadData(); }, [loadData]);

  const bankTx = transactions.filter(t => t.category === "BANK");
  const flipTx = transactions.filter(t => t.category === "FLIP");
  const appTx = transactions.filter(t => t.category === "APP PULSA");
  const danaTx = transactions.filter(t => t.category === "DANA");
  const tarikTx = transactions.filter(t => t.category === "TARIK TUNAI");
  const aksTx = transactions.filter(t => t.category === "AKSESORIS");
  const nonTunaiTx = transactions.filter(t => (t.paymentMethod || "").toLowerCase().includes("non-tunai") || t.category === "NON TUNAI");

  const sumNominal = (list: TransactionRecord[]) => list.reduce((s, t) => s + (t.nominal || 0), 0);
  const sumAdmin = (list: TransactionRecord[]) => list.reduce((s, t) => s + (t.admin || 0), 0);

  const totalBank = sumNominal(bankTx);
  const totalFlip = sumNominal(flipTx);
  const totalApp = sumNominal(appTx);
  const totalDana = sumNominal(danaTx);
  const totalTarik = sumNominal(tarikTx);
  const totalAks = sumNominal(aksTx);
  const totalAdmin = sumAdmin(transactions);
  const totalNonTunai = sumNominal(nonTunaiTx);

  const totalPenjualan = totalBank + totalFlip + totalApp + totalDana;
  const sisaCashPenjualan = totalPenjualan - totalTarik;
  const sisaCashTotal = sisaCashPenjualan + totalAdmin + totalAks;

  const saldoBankHistory = saldoHistory.filter(s => s.jenis === "Bank");
  const totalIsiSaldoBank = saldoBankHistory.reduce((s, h) => s + h.nominal, 0);

  const sisaSaldoBank = dailyNotes.sisaSaldoBank || 0;
  const saldoRealApp = dailyNotes.saldoRealApp || 0;
  const selisih = saldoRealApp - sisaSaldoBank;

  const categoryItems = [
    { label: "BANK", count: bankTx.length, total: totalBank },
    { label: "FLIP", count: flipTx.length, total: totalFlip },
    { label: "DANA", count: danaTx.length, total: totalDana },
    { label: "APP PULSA", count: appTx.length, total: totalApp },
  ].filter(c => c.count > 0);

  const handleResetSaldo = async () => {
    if (!confirm("Reset saldo kasir ini ke Rp 0? Tindakan tidak bisa dibatalkan.")) return;
    setResetting(true);
    try {
      await resetBalance(user!.name);
      toast({ title: "Saldo berhasil direset ke Rp 0" });
    } catch {
      toast({ title: "Gagal reset saldo", variant: "destructive" });
    } finally {
      setResetting(false);
    }
  };

  const handleLock = async () => {
    if (!confirm("Kunci laporan hari ini? Data tidak bisa diubah lagi.")) return;
    setLocking(true);
    try {
      await lockReport(user!.name, date);
      setIsLocked(true);
      toast({ title: "Laporan dikunci" });
    } catch {
      toast({ title: "Gagal mengunci", variant: "destructive" });
    } finally {
      setLocking(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const wsData: any[][] = [
        ["ALFAZA CELL - Laporan Harian"],
        [`Kasir: ${user?.name}`, `Shift: ${shift}`, `Tanggal: ${date}`],
        [],
        ["#", "Jam", "Kategori", "Nominal", "Admin", "Keterangan", "Pembayaran"],
      ];
      transactions.forEach((tx, i) => {
        wsData.push([String(i + 1), tx.transTime || "", tx.category, tx.nominal || 0, tx.admin || 0, tx.keterangan || "", tx.paymentMethod || "tunai"]);
      });
      wsData.push([]);
      wsData.push(["Ringkasan"]);
      categoryItems.forEach(c => wsData.push([c.label, c.total]));
      wsData.push(["Total Penjualan", totalPenjualan]);
      wsData.push(["Tarik Tunai", totalTarik]);
      wsData.push(["Sisa Cash Penjualan", sisaCashPenjualan]);
      wsData.push(["Admin", totalAdmin]);
      wsData.push(["Aksesoris", totalAks]);
      wsData.push(["Non Tunai", totalNonTunai]);
      wsData.push(["Sisa Cash Total", sisaCashTotal]);
      wsData.push([]);
      wsData.push(["Saldo & Selisih"]);
      wsData.push(["Sisa Saldo Bank (Catatan)", sisaSaldoBank]);
      wsData.push(["Saldo Real App", saldoRealApp]);
      wsData.push(["Selisih", selisih]);

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");
      XLSX.writeFile(wb, `laporan_${user?.name}_${date}.xlsx`);
      toast({ title: "Excel berhasil diunduh" });
    } catch {
      toast({ title: "Gagal membuat Excel", variant: "destructive" });
    }
  };

  const buildPdf = async () => {
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF("p", "mm", "a4");
    const margin = 15;
    let y = margin;
    pdf.setFontSize(16); pdf.setFont("helvetica", "bold");
    pdf.text("ALFAZA CELL - Laporan Harian", margin, y); y += 8;
    pdf.setFontSize(10); pdf.setFont("helvetica", "normal");
    pdf.text(`Kasir: ${user?.name || "-"}  |  Shift: ${shift || "-"}  |  Tanggal: ${date}`, margin, y); y += 10;
    pdf.setFontSize(11); pdf.setFont("helvetica", "bold");
    pdf.text("Rincian Kategori", margin, y); y += 6;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
    categoryItems.forEach(c => { pdf.text(`${c.label} (${c.count}x)`, margin, y); pdf.text(formatRupiah(c.total), 120, y); y += 5; });
    y += 3;
    pdf.setFontSize(11); pdf.setFont("helvetica", "bold");
    pdf.text("Total Penjualan", margin, y); pdf.text(formatRupiah(totalPenjualan), 120, y); y += 6;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
    if (tarikTx.length > 0) { pdf.text(`Tarik Tunai (${tarikTx.length}x)`, margin, y); pdf.text(`-${formatRupiah(totalTarik)}`, 120, y); y += 5; }
    pdf.text("Sisa Cash Penjualan", margin, y); pdf.text(formatRupiah(sisaCashPenjualan), 120, y); y += 5;
    pdf.text("Admin", margin, y); pdf.text(formatRupiah(totalAdmin), 120, y); y += 5;
    if (aksTx.length > 0) { pdf.text(`Aksesoris (${aksTx.length}x)`, margin, y); pdf.text(formatRupiah(totalAks), 120, y); y += 5; }
    pdf.text("Non Tunai", margin, y); pdf.text(formatRupiah(totalNonTunai), 120, y); y += 8;
    pdf.setFontSize(11); pdf.setFont("helvetica", "bold");
    pdf.text("TOTAL UANG CASH", margin, y); pdf.text(formatRupiah(sisaCashTotal), 120, y); y += 8;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
    pdf.text(`Sisa Cash: ${formatRupiah(sisaCashPenjualan)} + Admin: ${formatRupiah(totalAdmin)} + Aks: ${formatRupiah(totalAks)}`, margin, y); y += 8;
    pdf.setFontSize(11); pdf.setFont("helvetica", "bold");
    pdf.text("Jurnal Penyesuaian", margin, y); y += 6;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
    pdf.text("Total Tambah/Isi Saldo Bank", margin, y); pdf.text(formatRupiah(totalIsiSaldoBank), 120, y); y += 5;
    pdf.text("Sisa Saldo Bank (Catatan)", margin, y); pdf.text(formatRupiah(sisaSaldoBank), 120, y); y += 5;
    pdf.text("Total Penjualan", margin, y); pdf.text(formatRupiah(totalPenjualan), 120, y); y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Total", margin, y); pdf.text(formatRupiah(sisaSaldoBank + totalPenjualan), 120, y); y += 5;
    pdf.text("Selisih", margin, y); pdf.text(formatRupiah(totalIsiSaldoBank - (sisaSaldoBank + totalPenjualan)), 120, y); y += 8;
    pdf.setFontSize(11);
    pdf.text("Saldo & Selisih", margin, y); y += 6;
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal");
    pdf.text("Sisa Saldo Bank (Catatan)", margin, y); pdf.text(formatRupiah(sisaSaldoBank), 120, y); y += 5;
    pdf.text("Saldo Real App", margin, y); pdf.text(formatRupiah(saldoRealApp), 120, y); y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Selisih", margin, y); pdf.text(formatRupiah(selisih), 120, y);
    return pdf;
  };

  const handleExportPDF = async () => {
    try {
      const pdf = await buildPdf();
      pdf.save(`laporan-${user?.name}-${date}.pdf`);
    } catch { toast({ title: "Gagal export PDF", variant: "destructive" }); }
  };

  const handleBagikan = async () => {
    try {
      const pdf = await buildPdf();
      const blob = pdf.output("blob");
      const file = new File([blob], `laporan-${user?.name}-${date}.pdf`, { type: "application/pdf" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: "Laporan Harian Alfaza Cell" });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = file.name; a.click();
        URL.revokeObjectURL(url);
      }
    } catch { toast({ title: "Gagal bagikan PDF", variant: "destructive" }); }
  };

  if (loading) {
    return (
      <div className="px-3 pt-3">
        <Header />
        <div className="flex flex-col items-center gap-3 py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-sm text-gray-400">Memuat laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pt-3 pb-24">
      <Header />

      <div className="flex items-center gap-2 mb-3">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-xs bg-white outline-none"
        />
        <button
          onClick={() => loadData()}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-bold active:scale-95 transition"
        >
          Tampilkan
        </button>
      </div>

      {/* GRUP 1: Rincian + Total Penjualan + Total Uang Cash */}
      <div ref={reportRef} className="rounded-2xl border-2 border-gray-900 overflow-hidden mb-3">
        {categoryItems.length > 0 && (
          <>
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2.5">
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">📊 Rincian Kategori</h3>
            </div>
            <div className="px-4 py-3 bg-white space-y-2 border-b-2 border-gray-900">
              {categoryItems.map(c => (
                <div key={c.label} className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">{c.label} <span className="text-gray-400 font-normal">({c.count}x)</span></span>
                  <span className="text-sm font-bold text-blue-700">{formatRupiah(c.total)}</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 px-4 py-2.5 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">📈 TOTAL PENJUALAN</h3>
          <span className="text-white font-extrabold text-base">{formatRupiah(totalPenjualan)}</span>
        </div>
        <div className="bg-white px-4 space-y-0 border-b-2 border-gray-900">
          {tarikTx.length > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-700 flex items-center gap-1">💸 <strong className="text-emerald-700">Tarik Tunai</strong><span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold ml-1">{tarikTx.length}x</span></span>
              <span className="text-sm font-bold text-red-500">-{formatRupiah(totalTarik)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-700 flex items-center gap-1">💰 <strong className="text-emerald-700">Sisa Cash Penjualan</strong></span>
            <span className="text-sm font-bold text-emerald-700">{formatRupiah(sisaCashPenjualan)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-sm text-gray-700 flex items-center gap-1">📱 <strong className="text-amber-600">Admin</strong></span>
            <span className="text-sm font-bold text-amber-600">{formatRupiah(totalAdmin)}</span>
          </div>
          {aksTx.length > 0 && (
            <div className="flex justify-between items-center py-2 border-b border-gray-200">
              <span className="text-sm text-gray-700 flex items-center gap-1">🎧 <strong className="text-rose-500">Aksesoris</strong><span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-bold ml-1">{aksTx.length}x</span></span>
              <span className="text-sm font-bold text-rose-500">{formatRupiah(totalAks)}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-700 flex items-center gap-1">🏷️ <strong className="text-purple-600">Non Tunai</strong></span>
            <span className="text-sm font-bold text-purple-600">{formatRupiah(totalNonTunai)}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-3">
          <div className="flex justify-between items-center mb-1">
            <h3 className="text-gray-900 font-extrabold text-sm flex items-center gap-1.5">💰 TOTAL UANG CASH</h3>
            <span className="text-gray-900 font-extrabold text-xl">{formatRupiah(sisaCashTotal)}</span>
          </div>
          <p className="text-[10px] text-gray-800">Sisa Cash: {formatRupiah(sisaCashPenjualan)} + Admin: {formatRupiah(totalAdmin)} + Aks: {formatRupiah(totalAks)}</p>
        </div>
      </div>

      {/* GRUP 2: Jurnal Penyesuaian + Saldo & Selisih */}
      <div className="rounded-2xl border-2 border-gray-900 overflow-hidden mb-4">
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-4 py-2.5">
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">📒 Jurnal Penyesuaian</h3>
        </div>
        <div className="bg-white px-4 space-y-0 border-b-2 border-gray-900">
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">
            <span className="text-sm text-gray-700">💳 <strong>Total Tambah/Isi Saldo Bank</strong></span>
            <span className="text-sm font-extrabold text-blue-700">{formatRupiah(totalIsiSaldoBank)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-300">
            <span className="text-sm text-gray-700">Sisa Saldo Bank (Catatan)</span>
            <span className="text-sm font-bold text-gray-800">{formatRupiah(sisaSaldoBank)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">
            <span className="text-sm text-gray-700">Total Penjualan</span>
            <span className="text-sm font-bold text-gray-800">{formatRupiah(totalPenjualan)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">
            <span className="text-sm font-bold text-gray-900">Total</span>
            <span className="text-sm font-extrabold text-gray-900">{formatRupiah(sisaSaldoBank + totalPenjualan)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-bold text-gray-700">Selisih</span>
            <span className={`text-sm font-extrabold ${(totalIsiSaldoBank - (sisaSaldoBank + totalPenjualan)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(totalIsiSaldoBank - (sisaSaldoBank + totalPenjualan))}</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-700 to-green-500 px-4 py-2.5">
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">🏦 Saldo & Selisih</h3>
        </div>
        <div className="bg-white px-4 space-y-0">
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">
            <span className="text-sm text-gray-700 flex items-center gap-1">🏛️ <strong>Sisa Saldo Bank (Catatan)</strong></span>
            <span className="text-sm font-extrabold text-blue-700">{formatRupiah(sisaSaldoBank)}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">
            <span className="text-sm text-gray-700 flex items-center gap-1">📱 <strong>Saldo Real App</strong></span>
            <span className="text-sm font-extrabold text-red-600">{formatRupiah(saldoRealApp)}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-700 flex items-center gap-1">🔄 <strong>Selisih</strong></span>
            <span className={`text-sm font-extrabold ${selisih >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(selisih)}</span>
          </div>
        </div>
      </div>

      {/* Tombol aksi */}
      <div className="space-y-2.5 mt-2">
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={handleExportPDF} className="flex items-center justify-center gap-1.5 bg-red-500 text-white py-3 rounded-2xl font-bold text-xs shadow active:scale-95 transition">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-1.5 bg-green-600 text-white py-3 rounded-2xl font-bold text-xs shadow active:scale-95 transition">
            <Download className="w-4 h-4" /> Excel
          </button>
        </div>
        <button onClick={handleBagikan} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm shadow active:scale-95 transition">
          <Share2 className="w-4 h-4" /> BAGIKAN (PDF)
        </button>
        <button onClick={handleResetSaldo} disabled={resetting} className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm shadow active:scale-95 transition disabled:opacity-50">
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} RESET SALDO (MANUAL)
        </button>
      </div>
    </div>
  );
}
