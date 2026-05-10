import {
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,
  setDoc, query, where, writeBatch, increment, limit,
  getDocsFromCache, getDocFromCache,
  type Query, type DocumentReference
} from "firebase/firestore";
import { db } from "./firebase";
import { getWibDate } from "./utils";

// ── Smart Data Fetching Helpers ──
// Mencoba ambil data terbaru dari Server. Jika offline/gagal, otomatis ambil dari Cache lokal.
async function smartGetDocs<T>(q: Query, forceServer = false): Promise<import("firebase/firestore").QuerySnapshot<T>> {
  if (forceServer) return getDocs(q) as any;
  try {
    // getDocs secara default akan mencoba ke server, lalu fallback ke cache jika offline.
    return await getDocs(q) as any;
  } catch (err) {
    console.warn("[smartGetDocs] Server fetch failed, trying cache...", err);
    return await getDocsFromCache(q as any) as any;
  }
}

async function smartGetDoc(ref: DocumentReference) {
  try {
    return await getDoc(ref);
  } catch (err) {
    console.warn("[smartGetDoc] Server fetch failed, trying cache...", err);
    return await getDocFromCache(ref);
  }
}

export interface UserRecord {
  id: string;
  name: string;
  role: string;
  pin: string;
  isActive: boolean;
  lastLogin?: string;
  lastLoginTime?: string;
}

export interface CategoryLabels {
  BANK: { name: string; visible: boolean };
  FLIP: { name: string; visible: boolean };
  APP: { name: string; visible: boolean };
  DANA: { name: string; visible: boolean };
  AKS: { name: string; visible: boolean };
  TARIK: { name: string; visible: boolean };
}

export interface SettingsRecord {
  shopName: string;
  logoUrl: string;
  profilePhotoUrl: string;

  mutiaraQuotes: string;
  runningText: string;
  pinEnabled: boolean;
  categoryLabels: CategoryLabels;
  themeColors?: {
    light: string;
    dark: string;
    "sky-blue": string;
    "soft-green": string;
    "sunset-orange": string;
  };
  balanceColors?: {
    bank?: string;
    cash?: string;
    tarik?: string;
    aks?: string;
    admin?: string;
  };
  lastLockDate?: string;
  lastResetDate?: string;
  address?: string;
}


export interface TransactionRecord {
  id: string;
  kasirName: string;
  category: string;
  nominal: number;
  admin: number;
  keterangan: string;
  transDate: string;
  transTime: string;
  shift: string;
  paymentMethod: string;
  nominalTunai?: number;
  adminTunai?: number;
  nominalNonTunai?: number;
  adminNonTunai?: number | boolean;
  createdAt: any;
  photoUrl?: string;
  saldoBankAfter?: number;
  saldoCashAfter?: number;
  isEdited?: boolean;
  originalNominal?: number;
  originalAdmin?: number;
}

export interface SaldoHistoryRecord {
  id: string;
  kasirName: string;
  jenis: string;
  nominal: number;
  keterangan: string;
  saldoDate: string;
  saldoTime: string;
  createdAt: any;
  saldoBankAfter?: number;
  saldoCashAfter?: number;
}

export interface BalanceRecord {
  bank: number;
  cash: number;
  tarik: number;
  aks: number;
  adminTotal: number;
  bankNonTunai: number;
  cashNonTunai: number;
  tarikNonTunai: number;
  aksNonTunai: number;
  adminNonTunaiTotal: number;
  lastUpdateDate?: string;
}

export interface HutangRecord {
  id: string;
  nama: string;
  nominal: number;
  keterangan?: string;
  tanggal: string;
  lunas: boolean;
  tglLunas?: string;
  createdBy?: string;
  photoUrl?: string;
}

export interface KontakRecord {
  id: string;
  nama: string;
  nomor?: string;
  keterangan?: string;
  createdBy?: string;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  kasirName: string;
  tanggal: string;
  shift: string;
  jamMasuk: string;
  jamPulang?: string;
  createdAt: any;
}

export interface IzinRecord {
  id: string;
  nama: string;
  tanggal: string;
  alasan: string;
  status: string;
  createdAt: any;
}

export interface DailyNoteRecord {
  sisaSaldoBank: number;
  saldoRealApp: number;
}

export interface DailySnapshotRecord {
  locked: boolean;
  lockedAt?: any;
}

export interface DailyRekapRecord {
  total_bank: number;
  count_bank: number;
  total_flip: number;
  count_flip: number;
  total_app: number;
  count_app: number;
  total_dana: number;
  count_dana: number;
  total_tarik: number;
  count_tarik: number;
  total_aks: number;
  count_aks: number;
  total_admin: number;
  total_admin_non_tunai: number;
  total_non_tunai: number;
  total_isi_bank: number;
  total_isi_cash: number;
  total_closing: number;
  count_closing: number;
  total_nota_nominal: number;
  count_nota: number;
}

export interface KasirRekapRecord extends DailyRekapRecord {
  kasirName: string;
  date: string;
  total_nominal: number;
  total_admin: number;
  count_tx: number;
  count_absen_masuk: number;
  count_absen_pulang: number;
  total_v_tunai: number;
  total_v_qris: number;
  count_v_laku: number;
}

// Helper to update both global and per-kasir rekap
async function updateRekap(batch: any, date: string, kasirName: string | null, increments: any, rawData?: { nominal?: number, admin?: number, count?: number }) {
  // Global
  const globalRef = doc(db, "rekap_harian", date);
  batch.set(globalRef, increments, { merge: true });

  // Per Kasir (jika ada)
  if (kasirName && kasirName !== "owner") {
    const kasirRef = doc(db, "rekap_kasir", `${kasirName}_${date}`);
    
    // Build increments object explicitly to avoid spread issues with increment() sentinels
    const kasirData: any = { 
      ...increments,
      kasirName, 
      date 
    };
    
    if (rawData) {
      if (rawData.nominal) kasirData.total_nominal = increment(rawData.nominal);
      if (rawData.admin) kasirData.total_admin = increment(rawData.admin);
      if (rawData.count) kasirData.count_tx = increment(rawData.count);
    }

    batch.set(kasirRef, kasirData, { merge: true });
  }
}

export async function getUsers(): Promise<UserRecord[]> {
  const snap = await smartGetDocs(query(collection(db, "users")));
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as UserRecord));
}

export async function createUser(data: Omit<UserRecord, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "users"), data);
  return ref.id;
}

export async function updateUser(id: string, data: Partial<UserRecord>): Promise<void> {
  await updateDoc(doc(db, "users", id), data as any);
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(db, "users", id));
}

export async function getSettings(): Promise<SettingsRecord> {
  const ref = doc(db, "settings", "main");
  try {
    const snap = await smartGetDoc(ref);
    if (!snap.exists()) {
      const defaults: SettingsRecord = {
        shopName: "ALFAZA LINK",
        logoUrl: "",
        profilePhotoUrl: "",

        mutiaraQuotes: "Kesuksesan berawal dari kedisiplinan dan kejujuran.",
        runningText: "Selamat Datang di Alfaza Link",
        pinEnabled: false,
        categoryLabels: {
          BANK: { name: "BANK", visible: true },
          FLIP: { name: "FLIP", visible: true },
          APP: { name: "APP", visible: true },
          DANA: { name: "DANA", visible: true },
          AKS: { name: "AKS", visible: true },
          TARIK: { name: "TARIK", visible: true },
        },
        lastLockDate: "",
        lastResetDate: "",
      };

      await setDoc(ref, defaults).catch(() => {});
      return defaults;
    }
    return snap.data() as SettingsRecord;
  } catch (err) {
    console.error("Error getting settings:", err);
    return {
      shopName: "ALFAZA LINK",
      logoUrl: "",
      profilePhotoUrl: "",

      mutiaraQuotes: "Kesuksesan berawal dari kedisiplinan dan kejujuran.",
      runningText: "Selamat Datang di Alfaza Link",
      pinEnabled: false,
      categoryLabels: {
        BANK: { name: "BANK", visible: true },
        FLIP: { name: "FLIP", visible: true },
        APP: { name: "APP", visible: true },
        DANA: { name: "DANA", visible: true },
        AKS: { name: "AKS", visible: true },
        TARIK: { name: "TARIK", visible: true },
      },
      lastLockDate: "",
      lastResetDate: "",
    };
  }
}

export async function updateSettings(data: Partial<SettingsRecord>): Promise<void> {
  const ref = doc(db, "settings", "main");
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, data);
  } else {
    await updateDoc(ref, data as any);
  }
}

export async function getTransactions(params: {
  kasirName?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  forceServer?: boolean;
}): Promise<TransactionRecord[]> {
  const colRef = collection(db, "transactions");
  let q = query(colRef);

  // Filter server-side
  if (params.startDate) {
    q = query(q, where("transDate", ">=", params.startDate));
  }
  if (params.endDate) {
    q = query(q, where("transDate", "<=", params.endDate));
  }

  // Filter server-side
  if (params.kasirName && params.kasirName !== "Semua") {
    q = query(q, where("kasirName", "==", params.kasirName));
  }

  if (params.limit) {
    q = query(q, limit(params.limit));
  }
  
  const snap = await smartGetDocs(q, params.forceServer);
  let results = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as TransactionRecord));

  // Filter kasirName di memori aplikasi
  if (params.kasirName && params.kasirName !== "Semua") {
    results = results.filter(tx => tx.kasirName === params.kasirName);
  }

  results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return results;
}

export async function createTransaction(data: Omit<TransactionRecord, "id" | "createdAt" | "saldoBankAfter" | "saldoCashAfter">): Promise<string> {
  const { bal: newBal } = await updateBalance(data.kasirName, data);

  const batch = writeBatch(db);
  const transRef = doc(collection(db, "transactions"));
  const createdAt = new Date().toISOString();
  
  batch.set(transRef, {
    ...data,
    createdAt,
    saldoBankAfter: newBal.bank,
    saldoCashAfter: newBal.cash,
  });

  // Update Rekap Harian
  const rekapRef = doc(db, "rekap_harian", data.transDate);
  const isNonTunai = data.paymentMethod && data.paymentMethod.toLowerCase().includes("non-tunai");
  const nominal = data.nominal || 0;
  const admin = data.admin || 0;

  const increments: any = {};

  if (data.category === "BANK") {
    increments.total_bank = increment(nominal);
    increments.count_bank = increment(1);
  } else if (data.category === "FLIP") {
    increments.total_flip = increment(nominal);
    increments.count_flip = increment(1);
  } else if (data.category === "APP PULSA") {
    increments.total_app = increment(nominal);
    increments.count_app = increment(1);
  } else if (data.category === "DANA") {
    increments.total_dana = increment(nominal);
    increments.count_dana = increment(1);
  } else if (data.category === "TARIK TUNAI") {
    increments.total_tarik = increment(nominal);
    increments.count_tarik = increment(1);
  } else if (data.category === "AKSESORIS") {
    increments.total_aks = increment(nominal);
    increments.count_aks = increment(1);
  } else if (data.category === "CLOSING") {
    increments.total_closing = increment(nominal);
    increments.count_closing = increment(1);
  }

  if (data.category === "NON TUNAI" || isNonTunai) {
    increments.total_non_tunai = increment(nominal);
  }

  if (!(data.category === "NON TUNAI" || isNonTunai || data.adminNonTunai)) {
    increments.total_admin = increment(admin);
  }
  if (data.adminNonTunai) {
    increments.total_admin_non_tunai = increment(admin);
  }

  await updateRekap(batch, data.transDate, data.kasirName, increments, {
    nominal: data.nominal,
    admin: data.admin,
    count: 1
  });
  await batch.commit();

  return transRef.id;
}

export async function updateTransaction(id: string, data: Partial<TransactionRecord>): Promise<void> {
  // Logic for updateTransaction is complex for rekap because it involves reversing old and adding new.
  // For now, let's just reverse and re-add which is what the current code does but with rekap support.
  const oldSnap = await getDoc(doc(db, "transactions", id));
  if (oldSnap.exists()) {
    const oldTx = oldSnap.data() as TransactionRecord;
    await deleteTransaction(id); // Use delete to handle rekap reversal
    await createTransaction({ ...oldTx, ...data } as any); // Use create to handle rekap addition
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  const snap = await getDoc(doc(db, "transactions", id));
  if (!snap.exists()) return;
  
  const txData = snap.data() as TransactionRecord;
  const today = getWibDate();

  // Reverse Balance
  await reverseBalance(txData.kasirName, txData);

  const batch = writeBatch(db);
  batch.delete(doc(db, "transactions", id));

  // Reverse Rekap Harian (Only if it's from today or we track historical rekap)
  const rekapRef = doc(db, "rekap_harian", txData.transDate);
  const isNonTunai = txData.paymentMethod && txData.paymentMethod.toLowerCase().includes("non-tunai");
  const nominal = txData.nominal || 0;
  const admin = txData.admin || 0;

  const decrements: any = {};

  if (txData.category === "BANK") {
    decrements.total_bank = increment(-nominal);
    decrements.count_bank = increment(-1);
  } else if (txData.category === "FLIP") {
    decrements.total_flip = increment(-nominal);
    decrements.count_flip = increment(-1);
  } else if (txData.category === "APP PULSA") {
    decrements.total_app = increment(-nominal);
    decrements.count_app = increment(-1);
  } else if (txData.category === "DANA") {
    decrements.total_dana = increment(-nominal);
    decrements.count_dana = increment(-1);
  } else if (txData.category === "TARIK TUNAI") {
    decrements.total_tarik = increment(-nominal);
    decrements.count_tarik = increment(-1);
  } else if (txData.category === "AKSESORIS") {
    decrements.total_aks = increment(-nominal);
    decrements.count_aks = increment(-1);
  } else if (txData.category === "CLOSING") {
    decrements.total_closing = increment(-nominal);
    decrements.count_closing = increment(-1);
  }

  if (txData.category === "NON TUNAI" || isNonTunai) {
    decrements.total_non_tunai = increment(-nominal);
  }

  if (!(txData.category === "NON TUNAI" || isNonTunai || txData.adminNonTunai)) {
    decrements.total_admin = increment(-admin);
  }
  if (txData.adminNonTunai) {
    decrements.total_admin_non_tunai = increment(-admin);
  }

  await updateRekap(batch, txData.transDate, txData.kasirName, decrements, {
    nominal: -nominal,
    admin: -admin,
    count: -1
  });
  await batch.commit();
}

async function updateBalance(kasirName: string, tx: Omit<TransactionRecord, "id" | "createdAt">) {
  const ref = doc(db, "balances", kasirName);
  const snap = await getDoc(ref);
  const today = getWibDate();
  
  const emptyBal: BalanceRecord = { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0, adminNonTunaiTotal: 0, lastUpdateDate: today };
  let bal: BalanceRecord;

  if (snap.exists()) {
    bal = snap.data() as BalanceRecord;
    if (bal.lastUpdateDate !== today) {
      bal = { ...emptyBal };
    }
  } else {
    bal = { ...emptyBal };
  }

  const isNonTunai = tx.paymentMethod && tx.paymentMethod.toLowerCase().includes("non-tunai");
  const nominal = tx.nominal || 0;
  const admin = tx.admin || 0;

  if (tx.category === "NON TUNAI" || isNonTunai) {
    bal.bankNonTunai += nominal;
  } else if (["BANK", "FLIP", "APP PULSA", "DANA"].includes(tx.category)) {
    bal.cash += nominal;
    bal.bank -= nominal;
  } else if (tx.category === "TARIK TUNAI") {
    bal.tarik += nominal;
    bal.cash -= nominal;
  } else if (tx.category === "AKSESORIS") {
    bal.aks += nominal;
  }

  if (!(tx.category === "NON TUNAI" || isNonTunai || tx.adminNonTunai)) {
    bal.adminTotal += admin;
  }
  if (tx.adminNonTunai) {
    bal.adminNonTunaiTotal = (bal.adminNonTunaiTotal || 0) + admin;
  }

  bal.lastUpdateDate = today;

  if (snap.exists()) {
    await updateDoc(ref, bal as any);
  } else {
    await setDoc(ref, bal);
  }

  return { bal };
}

async function reverseBalance(kasirName: string, tx: TransactionRecord) {
  const ref = doc(db, "balances", kasirName);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const bal = snap.data() as BalanceRecord;
  
  const today = getWibDate();
  // Hanya balikkan jika transaksi terjadi hari ini untuk menjaga integritas running balance
  if (tx.transDate !== today) return;

  const isNonTunai = tx.paymentMethod && tx.paymentMethod.toLowerCase().includes("non-tunai");
  const nominal = tx.nominal || 0;
  const admin = tx.admin || 0;

  if (tx.category === "NON TUNAI" || isNonTunai) {
    bal.bankNonTunai -= nominal;
  } else if (["BANK", "FLIP", "APP PULSA", "DANA"].includes(tx.category)) {
    bal.cash -= nominal;
    bal.bank += nominal;
  } else if (tx.category === "TARIK TUNAI") {
    bal.tarik -= nominal;
    bal.cash += nominal;
  } else if (tx.category === "AKSESORIS") {
    bal.aks -= nominal;
  }

  if (!(tx.category === "NON TUNAI" || isNonTunai || tx.adminNonTunai)) {
    bal.adminTotal -= admin;
  }
  if (tx.adminNonTunai) {
    bal.adminNonTunaiTotal = (bal.adminNonTunaiTotal || 0) - admin;
  }

  await updateDoc(ref, bal as any);
}

export async function getBalance(kasirName: string): Promise<BalanceRecord> {
  const ref = doc(db, "balances", kasirName);
  const snap = await smartGetDoc(ref);
  const today = getWibDate();

  const emptyBal: BalanceRecord = { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0, adminNonTunaiTotal: 0, lastUpdateDate: today };

  if (!snap.exists()) {
    console.log(`[getBalance] ${kasirName}: dokumen tidak ada di Firestore`);
    return emptyBal;
  }
  
  const bal = snap.data() as BalanceRecord;
  console.log(`[getBalance] ${kasirName}: lastUpdateDate=${bal.lastUpdateDate}, today=${today}, bank=${bal.bank}, cash=${bal.cash}`);
  
  // Reset harian jika tanggal berbeda
  if (bal.lastUpdateDate !== today) {
    console.warn(`[getBalance] ${kasirName}: lastUpdateDate (${bal.lastUpdateDate}) != today (${today}) → saldo tampil 0`);
    return emptyBal;
  }
  
  return bal;
}

export async function getDailyRekap(date: string): Promise<DailyRekapRecord | null> {
  const ref = doc(db, "rekap_harian", date);
  const snap = await smartGetDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as DailyRekapRecord;
}

export async function getRekapKasir(kasirName: string, date: string): Promise<KasirRekapRecord | null> {
  const ref = doc(db, "rekap_kasir", `${kasirName}_${date}`);
  const snap = await smartGetDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as KasirRekapRecord;
}

export async function getDailyRekapByRange(startDate: string, endDate: string): Promise<DailyRekapRecord[]> {
  const colRef = collection(db, "rekap_harian");
  const q = query(colRef, where("__name__", ">=", startDate), where("__name__", "<=", endDate));
  const snap = await smartGetDocs(q);
  return snap.docs.map(d => ({ date: d.id, ...(d.data() as any) } as any));
}

export async function getRekapKasirByRange(kasirName: string, startDate: string, endDate: string): Promise<KasirRekapRecord[]> {
  const colRef = collection(db, "rekap_kasir");
  const q = query(colRef, 
    where("kasirName", "==", kasirName),
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await smartGetDocs(q);
  return snap.docs.map(d => d.data() as KasirRekapRecord);
}

export async function getAllRekapKasirByRange(startDate: string, endDate: string): Promise<KasirRekapRecord[]> {
  const colRef = collection(db, "rekap_kasir");
  const q = query(colRef, 
    where("date", ">=", startDate),
    where("date", "<=", endDate)
  );
  const snap = await smartGetDocs(q);
  return snap.docs.map(d => d.data() as KasirRekapRecord);
}

export async function resetBalance(kasirName: string): Promise<void> {
  const ref = doc(db, "balances", kasirName);
  const today = getWibDate();
  await setDoc(ref, { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0, adminNonTunaiTotal: 0, lastUpdateDate: today });
}

export async function getSaldoHistory(params: {
  kasirName?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  forceServer?: boolean;
}): Promise<SaldoHistoryRecord[]> {
  const colRef = collection(db, "saldo_history");
  let q = query(colRef);

  // Filter server-side
  if (params.startDate) {
    q = query(q, where("saldoDate", ">=", params.startDate));
  }
  if (params.endDate) {
    q = query(q, where("saldoDate", "<=", params.endDate));
  }

  // Filter server-side
  if (params.kasirName && params.kasirName !== "Semua") {
    q = query(q, where("kasirName", "==", params.kasirName));
  }

  if (params.limit) {
    q = query(q, limit(params.limit));
  }

  const snap = await smartGetDocs(q, params.forceServer);
  let results = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) } as SaldoHistoryRecord));

  // Filter kasirName di memori aplikasi
  if (params.kasirName && params.kasirName !== "Semua") {
    results = results.filter(s => s.kasirName === params.kasirName);
  }

  results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return results;
}

export async function addSaldo(kasirName: string, data: {
  jenis: string;
  nominal: number;
  keterangan?: string;
}): Promise<string> {
  const now = new Date();
  const saldoDate = getWibDate();
  const saldoTime = now.toTimeString().substring(0, 5);

  const balRef = doc(db, "balances", kasirName);
  const balSnap = await getDoc(balRef);
  const today = getWibDate();
  
  const emptyBal: BalanceRecord = { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0, adminNonTunaiTotal: 0, lastUpdateDate: today };
  let bal: BalanceRecord;

  if (balSnap.exists()) {
    bal = balSnap.data() as BalanceRecord;
    if (bal.lastUpdateDate !== today) {
      bal = { ...emptyBal };
    }
  } else {
    bal = { ...emptyBal };
  }

  if (data.jenis === "Bank") {
    bal.bank += data.nominal;
  } else if (data.jenis === "Cash") {
    bal.cash += data.nominal;
  }

  bal.lastUpdateDate = saldoDate;

  const batch = writeBatch(db);
  
  if (balSnap.exists()) {
    batch.update(balRef, bal as any);
  } else {
    batch.set(balRef, bal);
  }

  const historyRef = doc(collection(db, "saldo_history"));
  batch.set(historyRef, {
    kasirName,
    jenis: data.jenis,
    nominal: data.nominal,
    keterangan: data.keterangan || `Tambah Saldo ${data.jenis}`,
    saldoDate,
    saldoTime,
    createdAt: new Date().toISOString(),
    saldoBankAfter: bal.bank,
    saldoCashAfter: bal.cash,
  });

  // Update Rekap Harian
  const rekapRef = doc(db, "rekap_harian", saldoDate);
  if (data.jenis === "Bank") {
    batch.set(rekapRef, { total_isi_bank: increment(data.nominal) }, { merge: true });
  } else if (data.jenis === "Cash") {
    batch.set(rekapRef, { total_isi_cash: increment(data.nominal) }, { merge: true });
  } else if (data.jenis === "Real App") {
    // If user wants Real App to also show up in rekap or update balances, we can add it here.
    // For now, we just ensure it's recorded in history with snapshots.
    batch.set(rekapRef, { total_isi_real: increment(data.nominal) }, { merge: true });
  }

  await batch.commit();

  return historyRef.id;
}

export async function updateSaldoHistory(id: string, kasirName: string, data: {
  nominal: number;
  keterangan?: string;
}): Promise<void> {
  // Ambil data lama
  const ref = doc(db, "saldo_history", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Data tidak ditemukan");
  const old = snap.data() as SaldoHistoryRecord;

  // Hitung selisih nominal (hanya Bank/Cash yang mempengaruhi balance)
  const diff = data.nominal - old.nominal;

  // Update balance jika jenis adalah Bank atau Cash
  if ((old.jenis === "Bank" || old.jenis === "Cash") && diff !== 0) {
    const balRef = doc(db, "balances", kasirName);
    const balSnap = await getDoc(balRef);
    if (balSnap.exists()) {
      const bal = balSnap.data() as BalanceRecord;
      if (old.jenis === "Bank") bal.bank += diff;
      if (old.jenis === "Cash") bal.cash += diff;
      await updateDoc(balRef, bal as any);
    }
  }

  // Update history record
  await updateDoc(ref, {
    nominal: data.nominal,
    keterangan: data.keterangan || old.keterangan,
  } as any);
}

export async function deleteSaldoHistory(id: string, kasirName: string): Promise<void> {
  const ref = doc(db, "saldo_history", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Data tidak ditemukan");
  const old = snap.data() as SaldoHistoryRecord;

  const batch = writeBatch(db);

  // Balikkan efek ke balance (hanya Bank/Cash)
  if (old.jenis === "Bank" || old.jenis === "Cash") {
    const balRef = doc(db, "balances", kasirName);
    const balSnap = await getDoc(balRef);
    if (balSnap.exists()) {
      const bal = balSnap.data() as BalanceRecord;
      if (old.jenis === "Bank") bal.bank -= old.nominal;
      if (old.jenis === "Cash") bal.cash -= old.nominal;
      batch.update(balRef, bal as any);
    }
  }

  // Reverse Rekap Harian
  const rekapRef = doc(db, "rekap_harian", old.saldoDate);
  if (old.jenis === "Bank") {
    batch.set(rekapRef, { total_isi_bank: increment(-old.nominal) }, { merge: true });
  } else if (old.jenis === "Cash") {
    batch.set(rekapRef, { total_isi_cash: increment(-old.nominal) }, { merge: true });
  }

  batch.delete(ref);
  await batch.commit();
}

export async function addSaldoHistoryOnly(kasirName: string, data: {
  jenis: string;
  nominal: number;
  keterangan?: string;
}): Promise<string> {
  const now = new Date();
  const saldoDate = getWibDate();
  const saldoTime = now.toTimeString().substring(0, 5);

  const balRef = doc(db, "balances", kasirName);
  const balSnap = await getDoc(balRef);
  let currentBank = 0;
  let currentCash = 0;
  
  if (balSnap.exists()) {
    const bal = balSnap.data() as BalanceRecord;
    if (bal.lastUpdateDate === saldoDate) {
      currentBank = bal.bank || 0;
      currentCash = bal.cash || 0;
    }
  }

  const ref = await addDoc(collection(db, "saldo_history"), {
    kasirName,
    jenis: data.jenis,
    nominal: data.nominal,
    keterangan: data.keterangan || `Tambah ${data.jenis}`,
    saldoDate,
    saldoTime,
    createdAt: new Date().toISOString(),
    saldoBankAfter: currentBank,
    saldoCashAfter: currentCash,
  });
  return ref.id;
}

export async function getHutangList(): Promise<HutangRecord[]> {
  const snap = await getDocs(collection(db, "hutang"));
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as HutangRecord));
  results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  return results;
}

export async function createHutang(data: Omit<HutangRecord, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "hutang"), data);
  return ref.id;
}

export async function updateHutang(id: string, data: Partial<HutangRecord>): Promise<void> {
  await updateDoc(doc(db, "hutang", id), data as any);
}

export async function deleteHutang(id: string): Promise<void> {
  await deleteDoc(doc(db, "hutang", id));
}

export async function getKontakList(): Promise<KontakRecord[]> {
  const snap = await getDocs(collection(db, "kontak"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KontakRecord));
}

export async function createKontak(data: Omit<KontakRecord, "id">): Promise<string> {
  const ref = await addDoc(collection(db, "kontak"), data);
  return ref.id;
}

export async function updateKontak(id: string, data: Partial<KontakRecord>): Promise<void> {
  await updateDoc(doc(db, "kontak", id), data as any);
}

export async function deleteKontak(id: string): Promise<void> {
  await deleteDoc(doc(db, "kontak", id));
}

export async function getAttendance(params: {
  kasirName?: string;
  month?: string;
}): Promise<AttendanceRecord[]> {
  let q = query(collection(db, "attendance"));
  
  if (params.month) {
    // params.month is YYYY-MM
    const startStr = `${params.month}-01`;
    const endStr = `${params.month}-31`; 
    q = query(q, where("tanggal", ">=", startStr), where("tanggal", "<=", endStr));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));

  if (params.kasirName) {
    results = results.filter(a => a.kasirName === params.kasirName);
  }

  results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  return results;
}

export async function getTodayAttendance(kasirName: string): Promise<AttendanceRecord | null> {
  const today = getWibDate();
  const q = query(collection(db, "attendance"), where("tanggal", "==", today));
  const snap = await getDocs(q);
  const existing = snap.docs
    .map(d => ({ id: d.id, ...d.data() } as AttendanceRecord))
    .filter(a => a.kasirName === kasirName)
    .sort((a, b) => (a.jamMasuk || "").localeCompare(b.jamMasuk || ""));
  
  return existing[0] || null;
}

export async function createAttendance(data: Omit<AttendanceRecord, "id" | "createdAt">): Promise<string> {
  const batch = writeBatch(db);
  const ref = doc(collection(db, "attendance"));
  batch.set(ref, {
    ...data,
    createdAt: new Date().toISOString(),
  });

  // Update Rekap Harian (Global & Kasir)
  await updateRekap(batch, data.tanggal, data.kasirName, { count_absen_masuk: increment(1) });

  await batch.commit();
  return ref.id;
}

export async function getIzinList(params?: {
  month?: string;
  nama?: string;
}): Promise<IzinRecord[]> {
  let q = query(collection(db, "izin"));
  
  if (params?.month) {
    const startStr = `${params.month}-01`;
    const endStr = `${params.month}-31`; 
    q = query(q, where("tanggal", ">=", startStr), where("tanggal", "<=", endStr));
  }

  const snap = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as IzinRecord));

  if (params?.nama && params.nama !== "Semua") {
    results = results.filter(i => i.nama === params.nama);
  }
  
  results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));
  return results;
}

export async function createIzin(data: Omit<IzinRecord, "id" | "createdAt">): Promise<string> {
  const batch = writeBatch(db);
  const ref = doc(collection(db, "izin"));
  batch.set(ref, {
    ...data,
    createdAt: new Date().toISOString(),
  });

  // Update Rekap Harian
  const rekapRef = doc(db, "rekap_harian", data.tanggal);
  batch.set(rekapRef, { count_izin: increment(1) }, { merge: true });

  await batch.commit();
  return ref.id;
}

export async function updateIzin(id: string, data: Partial<IzinRecord>): Promise<void> {
  await updateDoc(doc(db, "izin", id), data as any);
}

export async function getDailyNotes(kasirName: string, date: string): Promise<DailyNoteRecord> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "daily_notes", docId);
  const snap = await smartGetDoc(ref);
  if (!snap.exists()) {
    return { sisaSaldoBank: 0, saldoRealApp: 0 };
  }
  return snap.data() as DailyNoteRecord;
}

export async function updateDailyNote(
  kasirName: string,
  date: string,
  field: "sisaSaldoBank" | "saldoRealApp",
  amount: number
): Promise<DailyNoteRecord> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "daily_notes", docId);
  const snap = await getDoc(ref);
  const current: DailyNoteRecord = snap.exists()
    ? (snap.data() as DailyNoteRecord)
    : { sisaSaldoBank: 0, saldoRealApp: 0 };

  current[field] = (current[field] || 0) + amount;

  if (snap.exists()) {
    await updateDoc(ref, current as any);
  } else {
    await setDoc(ref, current);
  }
  return current;
}

export async function setDailyNote(
  kasirName: string,
  date: string,
  field: "sisaSaldoBank" | "saldoRealApp",
  value: number
): Promise<DailyNoteRecord> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "daily_notes", docId);
  const snap = await getDoc(ref);
  const current: DailyNoteRecord = snap.exists()
    ? (snap.data() as DailyNoteRecord)
    : { sisaSaldoBank: 0, saldoRealApp: 0 };

  current[field] = value;

  const batch = writeBatch(db);
  if (snap.exists()) {
    batch.update(ref, current as any);
  } else {
    batch.set(ref, current);
  }

  // Juga simpan ke rekap harian global jika ini adalah owner atau "Semua"
  // Note: Halaman Catatan biasanya per kasir. Kita simpan di rekap_harian sebagai catatan global.
  // Tapi di sini field nya sisaSaldoBank/saldoRealApp.
  
  await batch.commit();
  return current;
}

export async function getDailySnapshot(kasirName: string, date: string): Promise<DailySnapshotRecord | null> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "daily_snapshots", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as DailySnapshotRecord;
}

export async function lockReport(kasirName: string, date: string): Promise<void> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "daily_snapshots", docId);
  await setDoc(ref, { locked: true, lockedAt: new Date().toISOString() }, { merge: true });
}

export async function unlockReport(kasirName: string, date: string): Promise<void> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "daily_snapshots", docId);
  await setDoc(ref, { locked: false }, { merge: true });
}

export async function resetAllData(): Promise<void> {
  const colNames = ["transactions", "saldo_history", "balances", "hutang", "kontak", "attendance", "izin", "daily_notes", "daily_snapshots"];
  for (const col of colNames) {
    const snap = await getDocs(collection(db, col));
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }
}

export async function loginUser(name: string, pin?: string, shift?: string, deviceTime?: string): Promise<{
  success: boolean;
  user?: UserRecord;
  role?: string;
  absenTime?: string;
  message?: string;
}> {
  const users = await getUsers();
  const user = users.find(u => u.name === name && u.isActive);
  if (!user) return { success: false, message: "User tidak ditemukan" };

  const settings = await getSettings();
  if (settings.pinEnabled && user.role !== "owner") {
    if (!pin || pin !== user.pin) {
      return { success: false, message: "PIN salah" };
    }
  }

  let finalAbsenTime = "";
  const today = getWibDate();
  const now = new Date();
  const currentTime = deviceTime || now.toTimeString().substring(0, 5);

  try {
    // Fetch only today's attendance for the whole shop, instead of all history for this user
    // This is much smaller (e.g. 3-5 docs) compared to a user's lifetime attendance
    const q = query(
      collection(db, "attendance"),
      where("tanggal", "==", today)
    );
    
    const snap = await getDocs(q);
    // Find the first attendance record for today and this user
    const existing = snap.docs
      .map(d => d.data())
      .filter(d => d.kasirName === name)
      .sort((a, b) => (a.jamMasuk || "").localeCompare(b.jamMasuk || ""))[0];

    if (!existing) {
      // First time today
      const batch = writeBatch(db);
      const ref = doc(collection(db, "attendance"));
      batch.set(ref, {
        kasirName: name,
        tanggal: today,
        shift: shift || "NORMAL",
        jamMasuk: currentTime,
      });

      // Update Rekap Harian (Global & Kasir)
      await updateRekap(batch, today, name, { count_absen_masuk: increment(1) });

      await batch.commit();
      finalAbsenTime = currentTime;
      console.log(`[Attendance] First login today: ${currentTime}`);
    } else {
      // Already exists today, use the very first one
      finalAbsenTime = existing.jamMasuk;
      console.log(`[Attendance] Already logged in today at: ${finalAbsenTime}`);
    }
  } catch (err) {
    console.error("[Attendance] Error checking/creating:", err);
    finalAbsenTime = currentTime;
  }

  // Update last login in user document
  const userRef = doc(db, "users", user.id);
  const lastLoginDate = getWibDate();
  const lastLoginTime = now.toTimeString().substring(0, 8);
  
  await updateDoc(userRef, {
    lastLogin: lastLoginDate,
    lastLoginTime: lastLoginTime
  }).catch(err => console.error("Error updating last login:", err));

  return {
    success: true,
    user: { ...user, lastLogin: lastLoginDate, lastLoginTime: lastLoginTime },
    role: user.role,
    absenTime: finalAbsenTime,
  };
}

export interface StokVoucherRecord {
  kasirName: string;
  date?: string;
  dataVoucher: Record<string, any>;
  dataQris: any[];
  updatedAt: string;
}

export async function getStokVoucher(kasirName: string, date: string): Promise<StokVoucherRecord | null> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "stok_voucher", docId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data() as StokVoucherRecord;
}

export async function syncStokVoucher(kasirName: string, date: string, dataVoucher: any, dataQris: any): Promise<void> {
  const docId = `${kasirName}_${date}`;
  const ref = doc(db, "stok_voucher", docId);
  
  // Ambil data lama untuk hitung selisih rekap
  const oldSnap = await getDoc(ref);
  let diffTunai = 0;
  let diffQris = 0;
  let diffLaku = 0;

  const calculateSales = (v: any, q: any[]) => {
    let tunai = 0;
    let qris = 0;
    let laku = 0;
    if (q) q.forEach(item => { qris += (item.harga * item.qty); });
    if (v) Object.values(v).forEach((items: any) => {
      items.forEach((item: any) => {
        const itemLaku = Math.max(0, item.awal - item.akhir);
        laku += itemLaku;
        tunai += (itemLaku * item.price);
      });
    });
    return { tunai: tunai - qris, qris, laku };
  };

  const currentSales = calculateSales(dataVoucher, dataQris);
  
  if (oldSnap.exists()) {
    const oldData = oldSnap.data() as StokVoucherRecord;
    const oldSales = calculateSales(oldData.dataVoucher, oldData.dataQris);
    diffTunai = currentSales.tunai - oldSales.tunai;
    diffQris = currentSales.qris - oldSales.qris;
    diffLaku = currentSales.laku - oldSales.laku;
  } else {
    diffTunai = currentSales.tunai;
    diffQris = currentSales.qris;
    diffLaku = currentSales.laku;
  }

  const batch = writeBatch(db);
  batch.set(ref, {
    kasirName,
    date,
    dataVoucher,
    dataQris,
    updatedAt: new Date().toISOString()
  });

  // 4. Update Rekap Harian (Global & Kasir)
  if (diffTunai !== 0 || diffQris !== 0 || diffLaku !== 0) {
    await updateRekap(batch, date, kasirName, {
      total_v_tunai: increment(diffTunai),
      total_v_qris: increment(diffQris),
      count_v_laku: increment(diffLaku)
    });
  }

  await batch.commit();
}

export async function getStokVoucherByRange(kasirName: string | undefined, startDate: string, endDate: string): Promise<StokVoucherRecord[]> {
  const colRef = collection(db, "stok_voucher");
  let q = query(colRef, 
    where("date", ">=", startDate), 
    where("date", "<=", endDate)
  );
  
  if (kasirName && kasirName !== "Semua") {
    q = query(q, where("kasirName", "==", kasirName));
  }

  const snap = await getDocs(q);
  return snap.docs.map(d => d.data() as StokVoucherRecord);
}
