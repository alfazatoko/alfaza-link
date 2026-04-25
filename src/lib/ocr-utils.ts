import Tesseract from "tesseract.js";

// ===== OCR Engine =====
export async function recognizeText(
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  const result = await Tesseract.recognize(imageFile, "ind+eng", {
    logger: (m) => {
      if (m.status === "recognizing text" && onProgress) {
        onProgress(Math.round(m.progress * 100));
      }
    },
  });
  return result.data.text;
}

export async function recognizeWithGemini(file: File, apiKey: string, type: "transfer" | "token"): Promise<any> {
  const cleanApiKey = apiKey.trim();
  if (!cleanApiKey) throw new Error("API Key kosong.");

  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });

  const prompt = type === "transfer" 
    ? `Anda adalah sistem OCR paling cerdas yang dikhususkan untuk struk transfer bank Indonesia. 
Tugas: Ekstrak data dari gambar struk dan kembalikan HANYA JSON.

LOGIKA ANALISA (PENTING):
1. BRI: "Sumber Dana" adalah Pengirim, "Tujuan" adalah Penerima.
2. BCA: "Dari" adalah Pengirim, "Ke" adalah Penerima.
3. MANDIRI: "Dari Rekening" adalah Pengirim, "Rekening Tujuan" adalah Penerima.
4. BNI: Nama di bagian atas biasanya Pengirim, Nama di bawah "Tujuan" adalah Penerima.
5. E-WALLET (DANA/OVO/GOPAY): Ambil nama akun yang tertulis sebagai tujuan transfer.
6. STRUK TANPA LABEL (UOB/Lainnya): Data pertama/atas = Pengirim, Data kedua/bawah = Penerima.

FORMAT JSON HARUS PERSIS:
{
  "tanggal": "DD/MM/YYYY",
  "waktu": "HH:MM:SS",
  "referensi": "nomor referensi/ID transaksi",
  "bankTujuan": "Nama Bank",
  "rekPenerima": "nomor rekening tanpa spasi",
  "namaPenerima": "NAMA PENERIMA LENGKAP",
  "namaPengirim": "NAMA PENGIRIM LENGKAP",
  "metode": "BI-FAST / ONLINE / QRIS",
  "nominal": angka_murni_tanpa_titik
}
Penting: Jika data tidak ditemukan, gunakan "-". Nominal harus angka murni (misal: 50000).`
    : `Ekstrak data dari gambar struk token PLN ini dan kembalikan HANYA dalam format JSON. 
Format: {"idPln": "nomor", "nama": "nama pelanggan", "tarifDaya": "R1M/900VA", "nominal": angka_tanpa_titik, "jmlDaya": "string_kwh", "tokenNumber": "20 digit angka tanpa spasi", "tokenLine1": "10 digit pertama", "tokenLine2": "10 digit terakhir"}
Penting: Pastikan tokenNumber hanya berisi angka. nominal harus angka murni tanpa Rp atau titik/koma.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${cleanApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type || "image/jpeg", data: base64 } }
          ]
        }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => null);
      console.error("Gemini API Error:", err);
      const errMsg = err?.error?.message || "Gagal menghubungi server Gemini.";
      throw new Error(`API Error: ${errMsg}`);
    }

    const data = await response.json();
    let jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Kadang Gemini membungkus hasil dalam markdown ```json ... ```
    jsonStr = jsonStr.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("recognizeWithGemini Error:", error);
    throw error;
  }
}

// ===== TRANSFER DATA INTERFACE =====
export interface TransferData {
  tanggal: string;
  waktu: string;
  referensi: string;
  bankTujuan: string;
  rekPenerima: string;
  namaPenerima: string;
  namaPengirim: string;
  metode: string;
  nominal: number;
}

// ===== TOKEN DATA INTERFACE =====
export interface TokenData {
  idTrx: string;
  idPln: string;
  produk: string;
  nama: string;
  tarifDaya: string;
  jmlDaya: string;
  nominal: number;
  tokenNumber: string;
  tokenLine1: string;
  tokenLine2: string;
}

// ===== REGEX PARSERS =====

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Specifically cleans a string that is expected to be a numeric token
 * Handles common OCR misinterpretations
 */
function cleanToken(s: string): string {
  if (!s) return "";
  return s
    .toUpperCase()
    .replace(/O/g, "0")
    .replace(/[IL|!]/g, "1")
    .replace(/S/g, "5")
    .replace(/B/g, "8")
    .replace(/[^0-9]/g, "");
}

function findMatch(text: string, patterns: RegExp[], validate?: (s: string) => boolean): string {
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const val = clean(m[1] || m[0]);
      if (!validate || validate(val)) return val;
    }
  }
  return "";
}

function extractNominal(text: string): number {
  // Match various Rupiah formats: Rp 800.000, Rp800,000, 800000, etc
  const patterns = [
    /(?:Rp\.?\s?)(\d{1,3}(?:[.,]\d{3})+)/gi,
    /(?:nominal|amount|jumlah|total|bayar)\s*:?\s*(?:Rp\.?\s?)?(\d{1,3}(?:[.,]\d{3})+)/gi,
    /(\d{1,3}(?:\.\d{3})+)/g,
  ];

  const allNominals: number[] = [];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(text)) !== null) {
      const numStr = (m[1] || m[0]).replace(/[Rp.\s]/g, "").replace(/,/g, "");
      const num = parseInt(numStr, 10);
      if (num >= 5000) allNominals.push(num);
    }
  }

  // Return the largest nominal found
  if (allNominals.length > 0) {
    allNominals.sort((a, b) => b - a);
    return allNominals[0];
  }
  return 0;
}

export function parseTransferData(rawText: string): TransferData {
  const text = rawText.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  // Date: various formats
  const tanggal = findMatch(fullText, [
    /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,
    /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,
    /(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|Mei|May|Jun|Jul|Agu|Aug|Sep|Okt|Oct|Nov|Des|Dec)\w*\s+\d{4})/i,
  ]) || new Date().toLocaleDateString("id-ID");

  // Time
  const waktu = findMatch(fullText, [
    /(\d{2}:\d{2}:\d{2})/,
    /(\d{2}:\d{2})\s?(?:WIB|WITA|WIT)?/i,
  ]) || new Date().toTimeString().substring(0, 8);

  // Reference number
  const referensi = findMatch(fullText, [
    /(?:ref(?:erensi)?|referenc|no\.?\s*ref|kode\s*trx|trx\s*id)\s*:?\s*(\w{8,25})/i,
    /(\d{12,25})/,
  ]);

  // Bank name
  const bankTujuan = findMatch(fullText, [
    /(?:bank\s*tujuan|ke\s*bank|bank\s*penerima|tujuan|bank)\s*:?\s*([A-Z]{2,15})/i,
    /\b(BCA|BNI|BRI|MANDIRI|BSI|CIMB|DANAMON|PERMATA|BTN|MEGA|OCBC|PANIN|JENIUS|JAGO|SEA\s?BANK|BANK\s?NEO|SHOPEEPAY|GOPAY|OVO|DANA)\b/i,
  ]);

  // Account number
  const rekPenerima = findMatch(fullText, [
    /(?:no\.?\s*rek(?:ening)?|rekening|account|id\s?pel|no\.?\s?pel)\s*[:=]?\s*([\d\s\-]{8,20})/i,
    /tujuan.*?\b(\d{3,4}\s?\d{3,4}\s?\d{3,4}\s?\d{1,4})\b/i, // Specific to BRI layout
    /(\d{4}\s\d{4}\s\d{4}\s\d{3,4})/,
    /(\d{3}\s?\d{3}\s?\d{3}\s?\d{1,4})/,
  ]);

  // Recipient name
  const nameValidate = (s: string) => {
    const trimmed = s.trim().toUpperCase();
    if (!trimmed || trimmed.length < 2) return false;
    const forbidden = ["TRANSAKSI", "BERHASIL", "STATUS", "KATEGORI", "DETAIL", "RINCIAN", "STRUK", "SALDO", "BANK"];
    return !forbidden.some(f => trimmed === f || trimmed.includes(f + " "));
  };

  const namaPenerima = findMatch(fullText, [
    /(?:nama\s*penerima|penerima|atas\s*nama|ke\s*nama|\ba\.?n\.?)\s*[:=]\s*([A-Z][A-Z0-9\s.]{2,40})/i,
    /(?:nama\s*penerima|penerima|atas\s*nama|ke\s*nama|\ba\.?n\.?)\s+([A-Z][A-Z0-9\s.]{2,40})/i,
    /tujuan\s+(?:[A-Z]{2}\s+)?([A-Z\s.]{3,30}?)\s*(?:BANK\b|\d{4})/i, // BRI layout
  ], nameValidate);

  // Sender name
  const namaPengirim = findMatch(fullText, [
    /(?:nama\s*pengirim|pengirim|dari|from|sumber\s*dana|sumber|oleh)\s*[:=]\s*([A-Z][A-Z0-9\s.]{2,40})/i,
    /sumber\s*dana\s+(?:[A-Z]{2}\s+)?([A-Z\s.]{3,30}?)\s*(?:BANK\b|\d{4})/i, // BRI layout
    /(?:nama\s*pengirim|pengirim|dari|from|sumber\s*dana|sumber|oleh)\s+([A-Z][A-Z0-9\s.]{2,40})/i,
  ], nameValidate);


  // Transfer method
  const metode = findMatch(fullText, [
    /\b(BI[\s-]?FAST|RTGS|SKN|ONLINE|KLIRING|TRANSFER|QRIS)\b/i,
  ]) || "TRANSFER";

  const nominal = extractNominal(fullText);

  return {
    tanggal,
    waktu,
    referensi: referensi || Math.random().toString(36).substring(2, 12).toUpperCase(),
    bankTujuan: bankTujuan ? bankTujuan.toUpperCase() : "BANK",
    rekPenerima: rekPenerima || "-",
    namaPenerima: namaPenerima ? namaPenerima.toUpperCase() : "-",
    namaPengirim: namaPengirim ? namaPengirim.toUpperCase() : "-",
    metode: metode.toUpperCase(),
    nominal,
  };
}

export function parseTokenData(rawText: string): TokenData {
  const text = rawText.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const fullText = lines.join(" ");

  // 1. IMPROVED TOKEN DETECTION
  let rawToken = findMatch(fullText, [
    /([0-9OIISlB]{4}[ \-][0-9OIISlB]{4}[ \-][0-9OIISlB]{4}[ \-][0-9OIISlB]{4}[ \-][0-9OIISlB]{4})/i,
    /([0-9OIISlB]{20})/i,
    /(?:token|stroom|serial|no\.?\s?token)\s*:?\s*([0-9\s\-OIISlB]{15,30})/i,
  ]);

  const tokenDigits = cleanToken(rawToken);
  let finalToken = "-";
  let tokenLine1 = "-";
  let tokenLine2 = "-";

  if (tokenDigits && tokenDigits.length >= 20) {
    const d = tokenDigits.substring(0, 20);
    // Format as 4-4-4-4-4
    finalToken = `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 12)} ${d.slice(12, 16)} ${d.slice(16, 20)}`;
    // Split for 2-line display: 10 digits each for better balance
    // Line 1: 4 + 4 + 2
    tokenLine1 = `${d.slice(0, 4)} ${d.slice(4, 8)} ${d.slice(8, 10)}`;
    // Line 2: 2 + 4 + 4
    tokenLine2 = `${d.slice(10, 12)} ${d.slice(12, 16)} ${d.slice(16, 20)}`;
  }

  // ID PLN / Meter number
  const idPln = findMatch(fullText, [
    /(?:id\s*pel(?:anggan)?|no\.?\s*meter|id\s*pln|meter|nopel)\s*:?\s*(\d{9,15})/i,
    /(\d{11,12})/,
  ]);

  // Transaction ID
  const idTrx = findMatch(fullText, [
    /(?:id\s*trx|ref|no\.?\s*trx|trx|kode\s*trx)\s*:?\s*(\w{8,20})/i,
  ]);

  // Customer name
  const nameValidate = (s: string) => {
    const trimmed = s.trim().toUpperCase();
    if (!trimmed || trimmed.length < 2) return false;
    const forbidden = ["TRANSAKSI", "BERHASIL", "TOKEN", "PLN", "PREPAID", "POSTPAID", "STRUK", "LUNAS", "PEMBAYARAN", "NOMOR", "SERIAL", "INFO", "BIAYA", "ADMIN", "TOTAL", "HARGA", "RP", "RINCIAN", "KATEGORI", "STATUS", "PILIHAN"];
    return !forbidden.some(f => trimmed === f || trimmed.includes(f + " "));
  };
  
  const nama = findMatch(fullText, [
    /(?:nama\s*pelanggan|pelanggan|nama|customer|an\.?|a\.n\.?)\s*[:=]\s*([A-Z0-9\s.\/'-]{2,40})/i,
    /(?:nama\s*pelanggan|pelanggan|nama|customer|an\.?|a\.n\.?)\s+([A-Z0-9\s.\/'-]{2,40})/i,
    /([A-Z0-9\s.\/'-]{3,30})(?=\s+(?:R\d|B\d|S\d|I\d|P\d)\s*[\/\-]\s*\d+)/, // Name before Tariff
    /([A-Z0-9\s.\/'-]{3,30})(?=\s+\d{11,12})/, // Name before ID PEL
  ], nameValidate);

  // Tariff/Power
  const tarifDaya = findMatch(fullText, [
    /(?:tarif|daya|golongan|gol)\s*(?:\/\s*daya)?\s*:?\s*([A-Z0-9\s\/\-]{3,15})/i,
    /([RBSIMLP]\d[A-Z\w\s\/\-]*\d+\s*VA)/i,
    /(\d+\s*VA)/i,
  ]);

  // KWH
  const jmlDaya = findMatch(fullText, [
    /(\d+[.,]\d+)\s*KWH/i,
    /(?:kwh|jumlah\s*kwh|jml\s*kwh|daya)\s*:?\s*(\d+[.,]?\d*)\s*(?:kwh)?/i,
  ]);

  // Product name
  const produk = findMatch(fullText, [
    /(?:produk|product|paket)\s*:?\s*(Token\s*PLN[\w\s.]*)/i,
    /(Token\s*(?:PLN\s*)?\d+[.\d]*)/i,
  ]) || "TOKEN PLN";

  const nominal = extractNominal(fullText);

  return {
    idTrx: idTrx || Math.random().toString(36).substring(2, 10).toUpperCase(),
    idPln: idPln || "-",
    produk: produk.toUpperCase(),
    nama: nama ? nama.toUpperCase() : "-",
    tarifDaya: tarifDaya ? tarifDaya.toUpperCase() : "-",
    jmlDaya: jmlDaya ? `${jmlDaya} KWH` : "-",
    nominal,
    tokenNumber: finalToken,
    tokenLine1,
    tokenLine2,
  };
}

