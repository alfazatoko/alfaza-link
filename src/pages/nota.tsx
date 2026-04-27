import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Printer, Share2, Plus, Trash2, Edit2, Save, Loader2, Download } from "lucide-react";
import { getSettings, type SettingsRecord } from "@/lib/firestore";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { printToBluetooth } from "@/lib/bluetooth-print";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toPng } from "html-to-image";

interface NotaItem {
  nama: string;
  harga: string;
  jumlah: string;
}

export default function Nota() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [settings, setSettings] = useState<SettingsRecord | null>(null);
  const [editingAddress, setEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState("");
  
  const [items, setItems] = useState<NotaItem[]>([]);
  const [currentItem, setCurrentItem] = useState<NotaItem>({ nama: "", harga: "", jumlah: "" });
  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);

  const [isPreview, setIsPreview] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings).catch(() => {});

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        getSettings().then(setSettings).catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleSimpanItem = () => {
    if (!currentItem.nama || !currentItem.harga || !currentItem.jumlah) return;
    setItems([...items, currentItem]);
    setCurrentItem({ nama: "", harga: "", jumlah: "" });
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateCurrentItem = (field: keyof NotaItem, value: string) => {
    if (field === 'harga') {
      const numericValue = value.replace(/\D/g, '');
      const formattedValue = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      setCurrentItem({ ...currentItem, [field]: formattedValue });
    } else {
      setCurrentItem({ ...currentItem, [field]: value });
    }
  };

  const handlePrint = () => {
    setIsPreview(true);
  };

  const executePrint = async () => {
    if (isPrinting) return;
    
    setIsPrinting(true);
    try {
      await printToBluetooth({
        shopName: settings?.shopName || "ALFAZA CELL",
        address: settings?.address || "",
        items: items,
        total: calculateTotal(),
        tanggal: tanggal,
        hari: getDayName(tanggal)
      });
      toast({ title: "Berhasil mencetak ke Bluetooth" });
    } catch (err: any) {
      console.error(err);
      toast({ 
        title: "Gagal mencetak Bluetooth", 
        description: err.message || "Pastikan Bluetooth aktif dan printer terhubung.",
        variant: "destructive" 
      });
    } finally {
      setIsPrinting(false);
    }
  };


  const handleShare = async () => {
    if (items.length === 0) {
      toast({ title: "Daftar barang kosong", variant: "destructive" });
      return;
    }

    if (isSharing) return;
    setIsSharing(true);

    try {
      const element = printRef.current;
      if (!element) throw new Error("Element not found");

      // Wait a bit for images to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Capture element as PNG (filtering out no-print elements)
      const dataUrl = await toPng(element, {
        quality: 1,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
        filter: (node: any) => {
          return !node.classList?.contains('no-print');
        }
      });
      
      // Create PDF - Using custom size to feel more like a receipt
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [80, 150] // Receipt style width
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Auto-adjust page height if content is longer
      if (pdfHeight > 150) {
        pdf.addPage([80, pdfHeight + 20]);
        pdf.deletePage(1);
      }

      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      
      const pdfBlob = pdf.output("blob");
      const fileName = `Nota_${settings?.shopName || "ALFAZA"}_${tanggal}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      // Share using Web Share API
      const nav = navigator as any;
      const canShare = nav.share && nav.canShare && nav.canShare({ files: [file] });

      if (canShare) {
        try {
          await navigator.share({
            files: [file],
            title: `Nota ${settings?.shopName}`,
            text: `Nota transaksi dari ${settings?.shopName} tanggal ${tanggal}`
          });
          toast({ title: "Berhasil dibagikan" });
        } catch (shareErr: any) {
          if (shareErr.name !== "AbortError") {
            throw shareErr;
          }
        }
      } else {
        // Fallback: Download
        pdf.save(fileName);
        toast({ title: "Berhasil diunduh (Sharing tidak didukung)" });
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast({ 
        title: "Gagal membagikan PDF", 
        description: error.message || "Terjadi kesalahan saat memproses file.",
        variant: "destructive" 
      });
    } finally {
      setIsSharing(false);
    }
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const harga = parseFloat(item.harga.replace(/\./g, '')) || 0;
      const jumlah = parseFloat(item.jumlah) || 0;
      return total + (harga * jumlah);
    }, 0);
  };

  const getDayName = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "EEEE", { locale: id });
    } catch {
      return "";
    }
  };

  const handleAddressEdit = () => {
    if (editingAddress) {
      setSettings(prev => prev ? { ...prev, address: tempAddress } : null);
      setEditingAddress(false);
    } else {
      setTempAddress(settings?.address || "");
      setEditingAddress(true);
    }
  };

  // Jika dalam mode Preview, tampilkan halaman Review
  if (isPreview) {
    return (
      <div className="min-h-screen bg-white">
        {/* Floating Action Buttons untuk Preview */}
        <div className="fixed top-4 left-4 right-4 flex justify-between z-50 no-print">
          <button
            onClick={() => setIsPreview(false)}
            className="px-4 py-2 bg-gray-800 text-white rounded-full font-bold shadow-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Batal
          </button>
          <button
            onClick={executePrint}
            disabled={isPrinting}
            className="px-6 py-2 bg-blue-600 text-white rounded-full font-black shadow-lg flex items-center gap-2 disabled:opacity-50"
          >
            {isPrinting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Printer className="w-5 h-5" />}
            {isPrinting ? "MENCETAK..." : "CETAK SEKARANG"}
          </button>
        </div>

        {/* Tampilan Review Full 1 Halaman */}
        <div className="pt-20 px-4 pb-4 w-full h-full min-h-screen flex flex-col font-black text-black">
          <div className="text-center mb-4 pb-4">
            <img 
              src={settings?.profilePhotoUrl || `${import.meta.env.BASE_URL}alfaza-logo.png`} 
              alt="Logo" 
              className="w-32 h-32 mx-auto mb-1 object-contain grayscale"
            />
            <h2 className="text-3xl font-black text-black mb-0">
              {settings?.shopName || "ALFAZA CELL"}
            </h2>
            <p className="text-lg font-black text-black">
              {settings?.address || "Alamat Toko Belum Diatur"}
            </p>
          </div>

          {/* Rincian Barang Review */}
          <div className="flex-grow bg-white">
            <h3 className="text-2xl font-black text-black mb-3 text-center">RINCIAN BARANG</h3>
            
            <div className="mb-3 text-lg">
              <p className="font-black text-black">
                Hari: {getDayName(tanggal)}
              </p>
              <p className="font-black text-black">
                Tanggal: {tanggal}
              </p>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border-b border-black pb-2">
                  <p className="font-black text-black text-base">{index + 1}. {item.nama || '-'}</p>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="font-black text-black">Harga: Rp {item.harga || '0'}</span>
                    <span className="font-black text-black">Jumlah: {item.jumlah || '0'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3">
              <p className="text-2xl font-black text-black text-center">
                TOTAL: Rp {calculateTotal().toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Footer Review */}
          <div className="mt-2">
            <div className="text-right mb-2">
              <p className="text-sm font-black text-black mb-0 leading-none">Tertanda,</p>
              <div className="h-4"></div>
              <p className="text-lg font-black text-black leading-none">
                {settings?.shopName || "ALFAZA CELL"}
              </p>
            </div>
            <div className="text-center pt-1">
              <p className="text-lg font-black text-black leading-tight">TERIMA KASIH</p>
              <p className="text-sm font-black text-black leading-none mt-0">Atas Kepercayaan Anda</p>
            </div>
          </div>
        </div>

        {/* Global Print Style for Preview Page */}
        <style>{`
          @media print {
            @page { margin: 5mm !important; size: auto; }
            body, html { width: 100% !important; height: 100% !important; margin: 0; padding: 0; background: white; }
            .no-print { display: none !important; }
            * { color: black !important; font-weight: 900 !important; }
            img { filter: grayscale(100%) !important; -webkit-filter: grayscale(100%) !important; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header - Hidden saat print */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 text-white p-4 shadow-lg no-print">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setLocation("/beranda")}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          <h1 className="text-lg font-black tracking-tight">NOTA</h1>
          <div className="flex gap-2">
            <button
              onClick={handleShare}
              disabled={isSharing}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition disabled:opacity-50"
              title="Bagikan PDF"
            >
              {isSharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Nota Container */}
      <div className="px-4 py-6 nota-container">
        <div 
          ref={printRef}
          className="nota-print-area bg-white rounded-2xl shadow-lg p-6 max-w-2xl mx-auto"
        >
          {/* Header Nota */}
          <div className="text-center mb-6 pb-6">
            <img 
              src={settings?.profilePhotoUrl || `${import.meta.env.BASE_URL}alfaza-logo.png`} 
              alt="Logo" 
              className="w-24 h-24 mx-auto mb-3 object-contain"
            />
            <h2 className="text-2xl font-black text-gray-800 mb-2">
              {settings?.shopName || "ALFAZA CELL"}
            </h2>
            
            {/* Alamat Toko */}
            <div className="flex items-center justify-center gap-2">
              {editingAddress ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={tempAddress}
                    onChange={(e) => setTempAddress(e.target.value)}
                    className="text-sm font-bold text-gray-600 border-b-2 border-blue-500 bg-gray-50 px-2 py-1 w-64"
                    placeholder="Masukkan alamat toko"
                  />
                  <button
                    onClick={handleAddressEdit}
                    className="p-1 bg-green-500 text-white rounded-full hover:bg-green-600"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-base font-bold text-gray-600">
                    {settings?.address || "Alamat Toko Belum Diatur"}
                  </p>
                  <button
                    onClick={handleAddressEdit}
                    className="p-1 text-blue-500 hover:text-blue-700 no-print"
                    title="Edit Alamat"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Form Input - Hidden saat print */}
          <div className="mb-6 space-y-4 no-print">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Tanggal</label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-lg font-bold border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
              <p className="mt-1 text-sm font-bold text-blue-600">
                {getDayName(tanggal)}
              </p>
            </div>

            {/* Form Input Item */}
            <div className="space-y-2">
              {/* Baris 1: Nama Barang */}
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Nama Barang"
                  value={currentItem.nama}
                  onChange={(e) => updateCurrentItem('nama', e.target.value)}
                  className="flex-1 text-base font-bold border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
              {/* Baris 2: Harga dan Jumlah */}
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Harga"
                  value={currentItem.harga}
                  onChange={(e) => updateCurrentItem('harga', e.target.value)}
                  className="w-full text-base font-bold border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Jumlah"
                  value={currentItem.jumlah}
                  onChange={(e) => updateCurrentItem('jumlah', e.target.value)}
                  className="w-full text-base font-bold border-2 border-gray-300 rounded-lg px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSimpanItem}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition"
            >
              <Save className="w-5 h-5" />
              SIMPAN
            </button>
          </div>

          {/* Rincian Barang */}
          <div className="rincian-barang mt-4 bg-white">
            <h3 className="text-lg font-black text-black mb-3 text-center">RINCIAN BARANG</h3>
            
            {/* Info Tanggal dan Hari */}
            <div className="mb-3 text-sm">
              <p className="font-bold text-black">
                Hari: <span className="text-blue-700">{getDayName(tanggal)}</span>
              </p>
              <p className="font-bold text-black">
                Tanggal: <span className="text-blue-700">{tanggal}</span>
              </p>
            </div>

            {/* Tabel Rincian */}
            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-center text-sm text-gray-500 italic py-2">Belum ada barang</p>
              )}
              {items.map((item, index) => (
                <div key={index} className="border-b border-gray-400 pb-2">
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-black">{index + 1}. {item.nama || '-'}</p>
                    <button onClick={() => removeItem(index)} className="no-print p-1 text-red-500 hover:bg-red-100 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-800">Harga: Rp {item.harga || '0'}</span>
                    <span className="text-gray-800">Jumlah: {item.jumlah || '0'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-3 pt-2">
              <p className="text-lg font-black text-blue-700 text-center">
                TOTAL: Rp {calculateTotal().toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Tertanda */}
          <div className="flex justify-end mb-6">
            <div className="text-right">
              <p className="text-base font-bold text-gray-500 mb-1">Tertanda</p>
              <p className="text-xl font-black text-gray-800">
                {settings?.shopName || "ALFAZA CELL"}
              </p>
            </div>
          </div>

          {/* Terima Kasih */}
          <div className="text-center pt-4">
            <p className="text-xl font-black text-gray-800">
              TERIMA KASIH
            </p>
            <p className="text-base font-bold text-gray-600 mt-1">
              Atas Kepercayaan Anda
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          @page {
            margin: 5mm !important;
            padding: 0 !important;
            size: auto;
          }
          
          * {
            background-color: white !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-weight: 900 !important;
            color: #000 !important;
          }
          
          .rincian-barang, .rincian-barang *,
          .bg-white, .bg-white * {
            background-color: white !important;
          }
          
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            text-align: center !important;
            font-size: 14pt !important;
          }
          
          .no-print,
          .bg-gradient-to-r,
          nav,
          .bottom-nav,
          [role="navigation"],
          .fixed,
          .sticky,
          header:not(.nota-header),
          footer,
          button,
          .btn,
          [type="button"],
          [type="submit"],
          input,
          select,
          textarea {
            display: none !important;
            visibility: hidden !important;
          }
          
          html, body {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          
          .nota-container {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          
          .nota-print-area {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            padding: 5mm !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
          
          .rincian-barang {
            width: 100% !important;
            max-width: 100% !important;
            margin: 5px 0 !important;
            padding: 2mm 0 !important;
            box-sizing: border-box !important;
            text-align: left !important;
            flex-grow: 1 !important;
          }
          
          .rincian-barang p {
            text-align: left !important;
            width: 100% !important;
          }
          
          .border-gray-400,
          .border-gray-500,
          .border-gray-300 {
            border-color: #000 !important;
            border-width: 2px !important;
          }
          
          img {
            margin: 0 auto 15px auto !important;
            display: block !important;
            width: 140px !important;
            height: auto !important;
            filter: grayscale(100%) !important;
            -webkit-filter: grayscale(100%) !important;
          }
          
          h2 { font-size: 28pt !important; margin-bottom: 10px !important; font-weight: 900 !important; }
          h3 { font-size: 22pt !important; margin-bottom: 15px !important; font-weight: 900 !important; }
          .text-2xl { font-size: 26pt !important; font-weight: 900 !important; }
          .text-xl { font-size: 22pt !important; font-weight: 900 !important; }
          .text-lg { font-size: 20pt !important; font-weight: 900 !important; }
          .text-base { font-size: 16pt !important; font-weight: 900 !important; }
          .text-sm { font-size: 14pt !important; font-weight: 900 !important; }
          
          .text-lg.font-black.text-blue-700 {
            font-size: 24pt !important;
            margin-top: 10px !important;
            font-weight: 900 !important;
          }
          
          .flex.justify-between {
            display: flex !important;
            justify-content: space-between !important;
            width: 100% !important;
          }
          
          .flex.justify-end {
            display: flex !important;
            justify-content: flex-end !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
