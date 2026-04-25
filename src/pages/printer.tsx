import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Upload, Zap, Printer as PrinterIcon, Settings, Save, Loader2 } from "lucide-react";
import { getSettings, type SettingsRecord } from "@/lib/firestore";
import { recognizeText, parseTransferData, parseTokenData, recognizeWithGemini, type TransferData, type TokenData } from "@/lib/ocr-utils";

type Theme = "standar" | "minimalis" | "modern";
type ServiceType = "transfer" | "token" | null;

interface PrinterSettings {
  shopName: string;
  address: string;
  footerMessage: string;
  showAdminFee: boolean;
  adminFee: number;
  tokenFontSize: number;
  geminiApiKey: string;
}

const DEFAULT_SETTINGS: PrinterSettings = {
  shopName: "ALFAZA CELL",
  address: "",
  footerMessage: "TERIMA KASIH",
  showAdminFee: false,
  adminFee: 2500,
  tokenFontSize: 27,
  geminiApiKey: "AIzaSyDgW55lpUFBdyyDGrQs6uZiwxnjn6RGhLg",
};

function formatRupiah(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}


// ===== RECEIPT COMPONENTS =====
function EditableValue({ value, onChange, className = "" }: { value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <div 
      contentEditable 
      suppressContentEditableWarning 
      onBlur={(e) => onChange(e.currentTarget.textContent || "")}
      className={`hover:bg-amber-50 cursor-edit px-1 rounded transition-colors ${className}`}
      title="Klik untuk mengedit"
    >
      {value}
    </div>
  );
}

function TransferReceipt({ settings, theme, data, onUpdate }: { settings: PrinterSettings; theme: Theme; data: TransferData; onUpdate: (d: TransferData) => void }) {
  const update = (key: keyof TransferData, val: any) => {
    onUpdate({ ...data, [key]: val });
  };

  return (
    <div className={`receipt-paper theme-${theme}`}>
      <div className="receipt-center receipt-bold" style={{ fontSize: 15 }}>{settings.shopName.toUpperCase()}</div>
      {settings.address && <div className="receipt-center" style={{ fontSize: 11, marginTop: 4 }}>{settings.address}</div>}
      <div className="receipt-line-double" />
      <div className="receipt-row"><span>TANGGAL</span><EditableValue value={data.tanggal} onChange={v => update("tanggal", v)} /></div>
      <div className="receipt-row"><span>WAKTU</span><EditableValue value={data.waktu} onChange={v => update("waktu", v)} /></div>
      <div className="receipt-line" />
      <div className="receipt-center"><div>KODE REFERENSI</div><div className="receipt-bold"><EditableValue value={data.referensi} onChange={v => update("referensi", v)} /></div></div>
      <div className="receipt-line" />
      <div className="receipt-center receipt-bold" style={{ marginBottom: 8 }}>DATA PENERIMA</div>
      <div className="receipt-row"><span>BANK TUJUAN</span><EditableValue value={data.bankTujuan} onChange={v => update("bankTujuan", v)} /></div>
      <div className="receipt-row"><span>NO REKENING</span><EditableValue value={data.rekPenerima} onChange={v => update("rekPenerima", v)} /></div>
      <div className="receipt-row"><span>NAMA PENERIMA</span><EditableValue value={data.namaPenerima} onChange={v => update("namaPenerima", v)} /></div>
      <div className="receipt-line" />
      <div className="receipt-center receipt-bold" style={{ marginBottom: 8 }}>DATA PENGIRIM</div>
      <div className="receipt-row"><span>NAMA PENGIRIM</span><EditableValue value={data.namaPengirim} onChange={v => update("namaPengirim", v)} /></div>
      <div className="receipt-row"><span>METODE</span><EditableValue value={data.metode} onChange={v => update("metode", v)} /></div>
      <div className="receipt-line" />
      <div className="receipt-row receipt-bold"><span>NOMINAL TRANSFER</span><span>{formatRupiah(data.nominal || 0)}</span></div>
      <div className="receipt-line-double" />
      <div className="receipt-center receipt-bold" style={{ marginTop: 16 }}>** TRANSAKSI BERHASIL **</div>
      <div className="receipt-center" style={{ fontSize: 10, marginTop: 4 }}>SALINAN - ALFAZA LINK</div>
      <div className="receipt-center receipt-bold" style={{ marginTop: 8 }}>{settings.footerMessage.toUpperCase()}</div>
    </div>
  );
}

function TokenReceipt({ settings, theme, data, onUpdate }: { settings: PrinterSettings; theme: Theme; data: TokenData; onUpdate: (d: TokenData) => void }) {
  const adminVal = settings.showAdminFee ? settings.adminFee : 0;
  const totalVal = data.nominal + adminVal;

  const update = (key: keyof TokenData, val: any) => {
    onUpdate({ ...data, [key]: val });
  };

  // Fallback for token lines if they are missing (10-10 split)
  const t1 = data.tokenLine1 && data.tokenLine1 !== "-" ? data.tokenLine1 : data.tokenNumber.replace(/\s/g, "").substring(0, 10).replace(/(\d{4})(\d{4})(\d{2})/, "$1 $2 $3");
  const t2 = data.tokenLine2 && data.tokenLine2 !== "-" ? data.tokenLine2 : data.tokenNumber.replace(/\s/g, "").substring(10, 20).replace(/(\d{2})(\d{4})(\d{4})/, "$1 $2 $3");

  const isModern = theme === "modern";

  return (
    <div className={`receipt-paper theme-${theme}`}>
      <div className="receipt-center receipt-bold" style={{ fontSize: 15 }}>{settings.shopName.toUpperCase()}</div>
      {settings.address && <div className="receipt-center" style={{ fontSize: 11, marginTop: 4 }}>{settings.address}</div>}
      <div className="receipt-line-double" />
      <div className="receipt-center receipt-bold">STRUK TOKEN LISTRIK</div>
      <div className="receipt-line-double" />
      {[
        { l: "ID PELANGGAN", v: data.idPln, k: "idPln" },
        { l: "NAMA PELANGGAN", v: data.nama, k: "nama" },
        { l: "TARIF/DAYA", v: data.tarifDaya, k: "tarifDaya" },
        { l: "JUMLAH KWH", v: data.jmlDaya, k: "jmlDaya" },
        { l: "PILIHAN TOKEN", v: formatRupiah(data.nominal), k: null },
        { l: "BIAYA ADMIN", v: formatRupiah(adminVal), k: null },
        { l: "TOTAL BAYAR", v: formatRupiah(totalVal), k: null },
      ].map((item) => (
        <div key={item.l} className="receipt-list-item">
          <div className="receipt-list-label">{item.l}</div>
          <div className="receipt-list-separator">:</div>
          <div className="receipt-list-value">
            {item.k ? <EditableValue value={item.v} onChange={v => update(item.k as keyof TokenData, v)} /> : item.v}
          </div>
        </div>
      ))}
      <div className="receipt-line" />
      <div className="receipt-center receipt-bold" style={{ marginBottom: 8, fontSize: isModern ? 16 : 14 }}>** NOMOR TOKEN **</div>
      <div className="receipt-center" style={{ 
        fontFamily: "'Consolas', 'Courier New', monospace", 
        fontWeight: 900, 
        fontSize: isModern ? settings.tokenFontSize + 12 : settings.tokenFontSize, 
        letterSpacing: isModern ? 2 : 1, 
        lineHeight: 1.2, 
        margin: "10px 0",
        padding: isModern ? "15px 0" : "5px 0",
        background: isModern ? "#f8fafc" : "transparent",
        borderRadius: isModern ? "8px" : "0",
        border: isModern ? "1px dashed #cbd5e1" : "none"
      }}>
        <EditableValue value={t1} onChange={v => update("tokenLine1", v)} className="inline-block" />
        <br />
        <EditableValue value={t2} onChange={v => update("tokenLine2", v)} className="inline-block" />
      </div>
      <div className="receipt-line" />
      <div className="receipt-center" style={{ fontWeight: "bold", marginTop: 10, lineHeight: 1.4 }}>INPUT TOKEN SERIAL NUMBER<br />PADA MCB PEMILIK METERAN</div>
      <div className="receipt-center receipt-bold" style={{ marginTop: 16 }}>DISINI JUGA MELAYANI<br />BAYAR LISTRIK, BPJS, INTERNET</div>
    </div>
  );
}

// ===== MAIN PAGE =====
export default function PrinterPage() {
  const [screen, setScreen] = useState<"home" | "preview" | "receipt" | "settings">("home");
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [theme, setTheme] = useState<Theme>("standar");
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>(DEFAULT_SETTINGS);
  const [appSettings, setAppSettings] = useState<SettingsRecord | null>(null);
  
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractProgress, setExtractProgress] = useState(0);
  const [transferData, setTransferData] = useState<TransferData | null>(null);
  const [tokenData, setTokenData] = useState<TokenData | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("printer_settings");
    if (saved) {
      try {
        setPrinterSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      } catch (e) {
        console.error("Failed to parse settings", e);
      }
    }
    getSettings().then(s => {
      setAppSettings(s);
      setPrinterSettings(prev => ({ ...prev, shopName: s.shopName || prev.shopName, address: s.address || prev.address }));
    }).catch(() => {});
  }, []);

  const openGallery = (type: ServiceType) => {
    setServiceType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setScreen("preview");
    
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startExtraction = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setExtractProgress(10); // Start progress

    try {
      if (printerSettings.geminiApiKey) {
        // Use Gemini AI for extraction
        setExtractProgress(50); // Mid progress for AI
        const data = await recognizeWithGemini(selectedFile, printerSettings.geminiApiKey, serviceType!);
        
        if (serviceType === "transfer") {
          setTransferData({
            tanggal: data.tanggal || new Date().toLocaleDateString("id-ID"),
            waktu: data.waktu || new Date().toTimeString().substring(0, 8),
            referensi: data.referensi || "-",
            bankTujuan: data.bankTujuan || "-",
            rekPenerima: data.rekPenerima || "-",
            namaPenerima: data.namaPenerima || "-",
            namaPengirim: data.namaPengirim || "-",
            metode: data.metode || "TRANSFER",
            nominal: Number(data.nominal) || 0
          });
        } else if (serviceType === "token") {
          setTokenData({
            idPln: data.idPln || "-",
            nama: data.nama || "-",
            tarifDaya: data.tarifDaya || "-",
            nominal: Number(data.nominal) || 0,
            jmlDaya: data.jmlDaya || "-",
            tokenNumber: data.tokenNumber || "-",
            tokenLine1: data.tokenLine1 || "-",
            tokenLine2: data.tokenLine2 || "-"
          });
        }
        setExtractProgress(100);
      } else {
        // Fallback to local Tesseract OCR
        const extractedText = await recognizeText(selectedFile, (progress) => {
          setExtractProgress(progress);
        });

        if (serviceType === "transfer") {
          setTransferData(parseTransferData(extractedText));
        } else if (serviceType === "token") {
          setTokenData(parseTokenData(extractedText));
        }
      }

      setScreen("receipt");
    } catch (error) {
      console.error("Extraction Failed:", error);
      alert("Gagal membaca gambar. " + (error instanceof Error ? error.message : "Silakan coba lagi."));
      setScreen("home");
    } finally {
      setIsExtracting(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem("printer_settings", JSON.stringify(printerSettings));
    alert("Pengaturan berhasil disimpan!");
  };

  const handlePrint = () => { window.print(); };

  return (
    <>
      <div className="min-h-screen bg-[#f4f5f7] pb-24">
        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileChange} />

        {screen === "home" && (
          <div className="bg-white min-h-screen p-6">
            <div className="flex items-center gap-3 mb-6">
              <button onClick={() => window.history.back()} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-xl font-black flex-1">Generator Struk</h1>
              <button onClick={() => setScreen("settings")} className="p-2 rounded-full bg-indigo-50 hover:bg-indigo-100 transition"><Settings className="w-5 h-5 text-indigo-600" /></button>
            </div>
            <p className="text-gray-500 text-sm mb-8">Pilih layanan yang ingin di-generate</p>

            <button onClick={() => openGallery("transfer")} className="flex items-center w-full bg-white border border-gray-200 p-4 rounded-xl mb-4 hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.98] group">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mr-4 shrink-0 group-hover:bg-indigo-100 transition">
                <Upload className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base">DEPOSIT / Cetak Bukti Transfer</h3>
                <p className="text-xs text-gray-500 mt-1">Generate gambar transfer jadi struk rapi</p>
              </div>
            </button>

            <button onClick={() => openGallery("token")} className="flex items-center w-full bg-white border border-gray-200 p-4 rounded-xl mb-4 hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.98] group">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mr-4 shrink-0 group-hover:bg-amber-100 transition">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-base">Cetak Token Listrik</h3>
                <p className="text-xs text-gray-500 mt-1">Generate resi token PLN dengan font besar</p>
              </div>
            </button>
          </div>
        )}

        {screen === "preview" && previewUrl && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 min-h-[100dvh] flex flex-col bg-black">
            <div className="bg-black/90 backdrop-blur-md text-white p-4 sticky top-0 z-10 flex items-center gap-3">
              <button onClick={() => setScreen("home")} disabled={isExtracting} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="font-bold flex-1 text-lg">Pratinjau Struk</h1>
            </div>
            
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center relative">
              <img src={previewUrl} alt="Preview" className="max-h-[70vh] rounded-xl shadow-2xl border border-white/20 object-contain" />
              
              {isExtracting && (
                <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center backdrop-blur-sm z-20 transition-all duration-500 overflow-hidden">
                  {/* Moving Scan Line */}
                  <div className="absolute inset-0 z-30 pointer-events-none">
                    <div className="w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1,0_0_30px_#6366f1] animate-[scan_2s_linear_infinite] absolute" />
                  </div>

                  <div className="w-24 h-24 relative mb-6 z-40">
                    <div className="absolute inset-0 border-4 border-indigo-500 rounded-full animate-ping opacity-30"></div>
                    <div className="absolute inset-2 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <Zap className="w-10 h-10 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <div className="text-white font-bold text-xl mb-3 text-center px-6 tracking-wide z-40">
                    {printerSettings.geminiApiKey ? "AI Sedang Menganalisa..." : "Membaca Teks Struk..."}
                  </div>
                  <div className="w-64 bg-white/20 rounded-full h-3 mt-2 overflow-hidden shadow-inner z-40">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" style={{ width: `${extractProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-black border-t border-white/10 pb-10">
              <button 
                onClick={startExtraction} 
                disabled={isExtracting}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                  isExtracting ? "bg-indigo-900/50 text-white/30 cursor-not-allowed" : "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-[0_0_30px_rgba(79,70,229,0.5)]"
                }`}
              >
                {isExtracting ? (
                  <>Menganalisa...</>
                ) : (
                  <>
                    <Zap className="w-6 h-6 animate-pulse" /> 
                    {printerSettings.geminiApiKey ? "Analisa Struk (PRO AI)" : "Analisa Struk (Standar)"}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {screen === "receipt" && (
          <div className="min-h-screen p-5" style={{ background: "#f0f0f0", backgroundImage: "radial-gradient(#d1d5db 1px, transparent 1px)", backgroundSize: "20px 20px" }}>
            <div className="flex items-center mb-5 gap-4 no-print">
              <button onClick={() => setScreen("home")} className="bg-white border-none rounded-lg w-9 h-9 flex items-center justify-center shadow cursor-pointer font-bold transition active:scale-90"><ArrowLeft className="w-4 h-4" /></button>
              <h3 className="font-bold text-base flex-1">{serviceType === "transfer" ? "Preview Bukti Transfer" : "Preview Token PLN"}</h3>
              <button onClick={handlePrint} className="bg-indigo-600 text-white px-4 py-2 rounded-full font-bold text-xs shadow-md hover:bg-indigo-700 transition active:scale-95 flex items-center gap-2">
                <PrinterIcon className="w-4 h-4" /> CETAK
              </button>
            </div>

            <div className="flex gap-2.5 mb-5 overflow-x-auto pb-1 no-print">
              {(["standar", "minimalis", "modern"] as Theme[]).map(t => (
                <button key={t} onClick={() => setTheme(t)} className={`px-4 py-2 rounded-full text-[13px] font-bold border whitespace-nowrap transition shadow-sm ${theme === t ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-800 border-transparent hover:border-indigo-300"}`}>
                  {t === "standar" ? "1. Standar" : t === "minimalis" ? "2. Minimalis" : "3. Modern"}
                </button>
              ))}
            </div>

            {serviceType === "transfer" && transferData ? (
              <TransferReceipt settings={printerSettings} theme={theme} data={transferData} onUpdate={setTransferData} />
            ) : serviceType === "token" && tokenData ? (
              <TokenReceipt settings={printerSettings} theme={theme} data={tokenData} onUpdate={setTokenData} />
            ) : (
              <div className="text-center p-8 text-gray-500">Gagal memuat data struk</div>
            )}

            <button onClick={handlePrint} className="w-full bg-indigo-600 text-white border-none py-4 rounded-xl text-base font-bold mt-8 cursor-pointer hover:bg-indigo-700 transition shadow-[0_4px_15px_rgba(79,70,229,0.4)] flex items-center justify-center gap-2 active:scale-[0.98] no-print">
              <PrinterIcon className="w-5 h-5" /> CETAK STRUK SEKARANG
            </button>
          </div>
        )}

        {screen === "settings" && (
          <div className="min-h-screen bg-[#f4f5f7] no-print">
            <div className="bg-white p-4 flex items-center sticky top-0 z-10 border-b border-gray-200">
              <button onClick={() => setScreen("home")} className="bg-white border-none rounded-lg w-9 h-9 flex items-center justify-center shadow cursor-pointer"><ArrowLeft className="w-4 h-4" /></button>
              <h2 className="ml-4 text-lg font-bold">Pengaturan Struk</h2>
            </div>
            <div className="p-4 space-y-4">
              {[
                { label: "Nama Usaha / Toko", value: printerSettings.shopName, key: "shopName", placeholder: "Contoh: ALFAZA CELL" },
                { label: "Alamat / Kontak", value: printerSettings.address, key: "address", placeholder: "Jln. Mawar No. 12..." },
                { label: "Pesan Footer", value: printerSettings.footerMessage, key: "footerMessage", placeholder: "Terima Kasih" },
              ].map(f => (
                <div key={f.key} className="bg-white rounded-xl p-4">
                  <label className="block text-sm font-semibold mb-2">{f.label}</label>
                  <input type="text" value={f.value} onChange={e => setPrinterSettings(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:border-indigo-500 focus:bg-white outline-none" />
                </div>
              ))}

              <div className="bg-white rounded-xl p-4">
                <label className="block text-sm font-semibold mb-2">Ukuran Font Token (PLN)</label>
                <select value={printerSettings.tokenFontSize} onChange={e => setPrinterSettings(p => ({ ...p, tokenFontSize: parseInt(e.target.value) }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none">
                  <option value={22}>Normal (22px)</option>
                  <option value={27}>Besar (27px)</option>
                  <option value={33}>Super Besar (33px)</option>
                </select>
              </div>

              <div className="bg-white rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold">Tampilkan Biaya Admin</span>
                  <label className="relative inline-block w-11 h-6 cursor-pointer">
                    <input type="checkbox" checked={printerSettings.showAdminFee} onChange={e => setPrinterSettings(p => ({ ...p, showAdminFee: e.target.checked }))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-300 peer-checked:bg-indigo-600 rounded-full transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-[18px] after:w-[18px] after:transition-transform peer-checked:after:translate-x-5" />
                  </label>
                </div>
                {printerSettings.showAdminFee && (
                  <div className="mt-3">
                    <label className="block text-sm font-semibold mb-2">Biaya Admin Default (Rp)</label>
                    <input type="number" value={printerSettings.adminFee} onChange={e => setPrinterSettings(p => ({ ...p, adminFee: parseInt(e.target.value) || 0 }))} className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none" />
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mt-8">
                <h4 className="font-bold text-indigo-900 mb-1 flex items-center gap-2"><Zap className="w-4 h-4" /> AI Pintar (Gemini)</h4>
                <p className="text-xs text-indigo-700 mb-3">Masukkan API Key Gemini untuk hasil ekstraksi nama dan nomor rekening 100% akurat dari semua jenis bank.</p>
                <label className="block text-xs font-semibold mb-1 text-indigo-900">API Key (Opsional)</label>
                <input type="password" value={printerSettings.geminiApiKey || ""} onChange={e => setPrinterSettings(p => ({ ...p, geminiApiKey: e.target.value }))} placeholder="AIzaSy..." className="w-full p-3 border border-indigo-200 rounded-lg text-sm bg-white focus:border-indigo-500 outline-none" />
                <p className="text-[10px] text-indigo-600 mt-2">Dapatkan gratis di <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>.</p>
              </div>

              <button onClick={saveSettings} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-base hover:bg-indigo-700 transition flex items-center justify-center gap-2 active:scale-[0.98]">
                <Save className="w-5 h-5" /> Simpan Pengaturan
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .receipt-paper { background-color: #fff; width: 100%; padding: 20px; box-sizing: border-box; font-size: 13px; color: #000; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); position: relative; }
        .receipt-center { text-align: center; }
        .receipt-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .receipt-list-item { display: flex; margin-bottom: 4px; }
        .receipt-list-label { width: 110px; flex-shrink: 0; font-weight: bold; }
        .receipt-list-separator { width: 15px; text-align: center; font-weight: bold; }
        .receipt-list-value { flex-grow: 1; word-break: break-all; font-weight: bold; }

        .theme-standar { font-family: 'Courier New', Courier, monospace; }
        .theme-standar .receipt-bold { font-weight: bold; }
        .theme-standar .receipt-line { border-bottom: 1px dashed #000; margin: 10px 0; }
        .theme-standar .receipt-line-double { border-bottom: 3px double #000; margin: 10px 0; }

        .theme-minimalis { font-family: Arial, Helvetica, sans-serif; color: #374151; }
        .theme-minimalis .receipt-bold { font-weight: bold; color: #111827; }
        .theme-minimalis .receipt-line, .theme-minimalis .receipt-line-double { border-bottom: 1px solid #e5e7eb; margin: 12px 0; }

        .theme-modern { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; border: 1px solid #e2e8f0; border-radius: 8px; }
        .theme-modern .receipt-bold { font-weight: 800; }
        .theme-modern .receipt-line { border-bottom: 2px dashed #cbd5e1; margin: 15px 0; }
        .theme-modern .receipt-line-double { border-bottom: 3px solid #64748b; margin: 12px 0; }

        @media print {
          @page { margin: 0; }
          body { 
            background: white !important; 
            margin: 0; 
            padding: 0; 
            display: flex !important;
            justify-content: center !important;
          }
          .no-print { display: none !important; }
          .min-h-screen { 
            background: white !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            min-height: 0 !important; 
            display: flex !important;
            justify-content: center !important;
            width: 100% !important;
          }
          .receipt-paper { 
            box-shadow: none !important; 
            width: 380px !important; 
            margin: 0 auto !important; 
            padding: 20px !important; 
            border: none !important;
          }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }

        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </>
  );
}
