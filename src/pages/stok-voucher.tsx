import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Pencil, X, CreditCard, Plus, Minus, Cloud, CloudUpload, Loader2, Calendar } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getStokVoucher, syncStokVoucher, getSettings, getDailyRekap, getUsers, getStokVoucherByRange, type DailyRekapRecord, type UserRecord, type StokVoucherRecord } from "@/lib/firestore";
import { getWibDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

interface VoucherItem {
  id: number;
  name: string;
  price: number;
  awal: number;
  akhir: number;
}

interface QrisItem {
  id: number;
  provider: string;
  nama: string;
  harga: number;
  qty: number;
}

const initialDataVoucher: Record<string, VoucherItem[]> = {
  'TRI': [{ id: 101, name: 'AON 1.5GB', price: 15000, awal: 10, akhir: 10 }],
  'TELKOMSEL': [{ id: 201, name: '4GB-1H', price: 8000, awal: 10, akhir: 10 }],
  'AXIS': [
      { id: 301, name: '2GB-1H', price: 8000, awal: 5, akhir: 4 },
      { id: 302, name: '5GB-5H', price: 10000, awal: 5, akhir: 5 },
      { id: 303, name: '3GB-3H', price: 9000, awal: 7, akhir: 7 }
  ],
  'XL': [{ id: 401, name: 'Xtra Combo 5GB', price: 25000, awal: 5, akhir: 5 }],
  'SMARTFREN': [{ id: 501, name: 'Unlimited Harian', price: 15000, awal: 8, akhir: 8 }],
  'IM3': [{ id: 601, name: 'Freedom 3GB', price: 15000, awal: 10, akhir: 10 }]
};

export default function StokVoucher() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const kasirName = user?.name || "Kasir";
  const [shopName, setShopName] = useState("ALFAZA LINK");
  const [selectedDate, setSelectedDate] = useState(getWibDate());

  // Derive storage keys from kasirName and selectedDate
  const storageKeyVoucher = `alfaza_stok_voucher_${kasirName}_${selectedDate}`;
  const storageKeyQris = `alfaza_stok_qris_${kasirName}_${selectedDate}`;

  // State initialization depends on useEffect to handle date changes cleanly
  const [dataVoucher, setDataVoucher] = useState<Record<string, VoucherItem[]>>(initialDataVoucher);
  const [dataQris, setDataQris] = useState<QrisItem[]>([]);

  const [providersEditState, setProvidersEditState] = useState<Record<string, boolean>>({
    'TRI': false, 'TELKOMSEL': false, 'AXIS': false, 'XL': false, 'SMARTFREN': false, 'IM3': false
  });
  const [activeEditingCell, setActiveEditingCell] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<{ [key: string]: { name: string, price: string, awal: string } }>({});
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [dailyRekap, setDailyRekap] = useState<DailyRekapRecord | null>(null);
  const [kasirFilter, setKasirFilter] = useState(kasirName);
  const [kasirList, setKasirList] = useState<UserRecord[]>([]);

  useEffect(() => {
    getSettings().then(s => setShopName(s.shopName)).catch(() => {});
    if (user?.role === "owner") {
      getUsers().then(list => setKasirList(list.filter(u => u.role !== "owner"))).catch(() => {});
    }
  }, [user]);

  const isOwner = user?.role === "owner";

  // Load data when selectedDate changes
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const isInstantMode = kasirFilter === "Semua Kasir";

      // Reset data jika ganti mode
      if (isInstantMode) {
        setDataVoucher({});
        setDataQris([]);
      }

      try {
        const [cloudData, rekap, allVouchers] = await Promise.all([
          isInstantMode ? Promise.resolve(null) : getStokVoucher(kasirFilter, selectedDate),
          getDailyRekap(selectedDate),
          isInstantMode ? getStokVoucherByRange(undefined, selectedDate, selectedDate) : Promise.resolve([])
        ]);

        if (isInstantMode) {
          // Agregasi data dari semua kasir untuk tampilan tabel jika "Semua Kasir"
          const aggregatedVoucher: Record<string, VoucherItem[]> = {};
          const aggregatedQris: QrisItem[] = [];
          
          allVouchers.forEach(sv => {
            // Gabungkan dataVoucher
            Object.keys(sv.dataVoucher).forEach(provider => {
              if (!aggregatedVoucher[provider]) aggregatedVoucher[provider] = [];
              sv.dataVoucher[provider].forEach((item: any) => {
                const existing = aggregatedVoucher[provider].find(v => v.name === item.name);
                if (existing) {
                  existing.awal += item.awal;
                  existing.akhir += item.akhir;
                } else {
                  aggregatedVoucher[provider].push({ ...item });
                }
              });
            });
            // Gabungkan dataQris
            sv.dataQris.forEach((q: any) => {
              const existing = aggregatedQris.find(x => x.nama === q.nama && x.provider === q.provider);
              if (existing) {
                existing.qty += q.qty;
              } else {
                aggregatedQris.push({ ...q });
              }
            });
          });
          setDataVoucher(aggregatedVoucher);
          setDataQris(aggregatedQris);
        } else if (cloudData) {
          setDataVoucher(cloudData.dataVoucher);
          setDataQris(cloudData.dataQris);
          setLastSync(new Date(cloudData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } else {
          setDataVoucher(initialDataVoucher);
          setDataQris([]);
          setLastSync(null);
        }
        setDailyRekap(rekap);
      } catch (error) {
        console.error("Failed to fetch stok voucher:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [selectedDate, kasirFilter]);

  // Save to LocalStorage on every change (0 lag) - Hanya jika mode kasir tunggal
  useEffect(() => {
    if (isLoading || kasirFilter === "Semua Kasir") return;
    localStorage.setItem(storageKeyVoucher, JSON.stringify(dataVoucher));
  }, [dataVoucher, storageKeyVoucher, isLoading, kasirFilter]);

  useEffect(() => {
    if (isLoading || kasirFilter === "Semua Kasir") return;
    localStorage.setItem(storageKeyQris, JSON.stringify(dataQris));
  }, [dataQris, storageKeyQris, isLoading, kasirFilter]);

  // Sync to Firebase function
  const handleSync = useCallback(async (manual = false) => {
    if (isSyncing || isLoading) return;
    setIsSyncing(true);
    try {
      await syncStokVoucher(kasirName, selectedDate, dataVoucher, dataQris);
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSync(timeStr);
      if (manual) {
        toast({ title: "Berhasil", description: `Data berhasil disinkronisasi ke cloud.` });
      }
    } catch (error) {
      console.error("Sync failed:", error);
      if (manual) {
        toast({ title: "Gagal", description: "Gagal sinkronisasi data ke cloud.", variant: "destructive" });
      }
    } finally {
      setIsSyncing(false);
    }
  }, [kasirName, selectedDate, dataVoucher, dataQris, isSyncing, isLoading, toast]);

  const autoSyncTimeout = React.useRef<NodeJS.Timeout | null>(null);

  // Auto-sync every time data changes (with 2 seconds debounce)
  useEffect(() => {
    if (isLoading || kasirFilter === "Semua Kasir") return;
    
    if (autoSyncTimeout.current) {
      clearTimeout(autoSyncTimeout.current);
    }
    
    autoSyncTimeout.current = setTimeout(async () => {
      try {
        await syncStokVoucher(kasirFilter, selectedDate, dataVoucher, dataQris);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setLastSync(timeStr);
      } catch (error) {
        console.error("Auto-sync failed:", error);
      }
    }, 2000);

    return () => {
      if (autoSyncTimeout.current) {
        clearTimeout(autoSyncTimeout.current);
      }
    };
  }, [dataVoucher, dataQris, kasirFilter, selectedDate, isLoading]);
  
  const { totalQtyLakuKeseluruhan, totalUangKeseluruhan, totalUangQris } = useMemo(() => {
    let qty = 0;
    let uang = 0;
    let qris = 0;
    
    Object.values(dataVoucher).forEach(items => {
      items.forEach(item => {
        const laku = Math.max(0, item.awal - item.akhir);
        qty += laku;
        uang += laku * item.price;
      });
    });
    
    dataQris.forEach(item => {
      qris += item.harga * item.qty;
    });
    
    return { 
      totalQtyLakuKeseluruhan: qty, 
      totalUangKeseluruhan: uang, 
      totalUangQris: qris 
    };
  }, [dataVoucher, dataQris]);

  const toggleEditProvider = (provider: string) => {
    setProvidersEditState(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const updateProductDetail = (provider: string, index: number, field: keyof VoucherItem, value: string | number) => {
    setDataVoucher(prev => {
      const newData = { ...prev };
      const item = { ...newData[provider][index] };
      if (field === 'price') {
        const parsedVal = parseInt(value as string);
        item.price = isNaN(parsedVal) ? 0 : parsedVal;
      } else if (field === 'name') {
        item.name = value as string;
      }
      newData[provider][index] = item;
      return newData;
    });
  };

  const updateStok = (provider: string, index: number, field: 'awal' | 'akhir', change: number) => {
    setDataVoucher(prev => {
      const newData = { ...prev };
      const item = { ...newData[provider][index] };
      const val = item[field] + change;
      item[field] = val < 0 ? 0 : val;
      newData[provider][index] = item;
      return newData;
    });
  };

  const jualQris = (provider: string, idx: number) => {
    const item = dataVoucher[provider][idx];
    if (item.akhir > 0) {
      setDataVoucher(prev => {
        const newData = { ...prev };
        newData[provider][idx] = { ...newData[provider][idx], akhir: newData[provider][idx].akhir - 1 };
        return newData;
      });

      setDataQris(prev => {
        const existingIdx = prev.findIndex(q => q.nama === item.name && q.provider === provider);
        if (existingIdx >= 0) {
          const newData = [...prev];
          newData[existingIdx] = { ...newData[existingIdx], qty: newData[existingIdx].qty + 1 };
          return newData;
        } else {
          return [...prev, { id: Date.now(), provider, nama: item.name, harga: item.price, qty: 1 }];
        }
      });
    } else {
      alert("Stok produk ini sudah habis (0)!");
    }
  };

  const editQris = (id: number) => {
    const q = dataQris.find(x => x.id === id);
    if (!q) return;

    const input = prompt(`Edit Jumlah (Qty) untuk ${q.nama}\nKetik 0 jika ingin menghapus (batal):`, q.qty.toString());
    if (input === null || input === "") return;

    const newQty = parseInt(input);
    if (isNaN(newQty) || newQty < 0) {
      alert("Jumlah yang dimasukkan tidak valid!");
      return;
    }

    const item = dataVoucher[q.provider]?.find(v => v.name === q.nama);

    if (newQty === 0) {
      if (item) {
        setDataVoucher(prev => {
          const newData = { ...prev };
          const pData = [...newData[q.provider]];
          const iIdx = pData.findIndex(v => v.name === q.nama);
          if (iIdx >= 0) pData[iIdx] = { ...pData[iIdx], akhir: pData[iIdx].akhir + q.qty };
          newData[q.provider] = pData;
          return newData;
        });
      }
      setDataQris(prev => prev.filter(x => x.id !== id));
    } else {
      const selisih = newQty - q.qty;
      if (item) {
        if (item.akhir - selisih < 0) {
          alert("Stok produk tidak mencukupi!");
          return;
        }
        setDataVoucher(prev => {
          const newData = { ...prev };
          const pData = [...newData[q.provider]];
          const iIdx = pData.findIndex(v => v.name === q.nama);
          if (iIdx >= 0) pData[iIdx] = { ...pData[iIdx], akhir: pData[iIdx].akhir - selisih };
          newData[q.provider] = pData;
          return newData;
        });
      }
      setDataQris(prev => {
        const newData = [...prev];
        const idx = newData.findIndex(x => x.id === id);
        if (idx >= 0) newData[idx] = { ...newData[idx], qty: newQty };
        return newData;
      });
    }
  };

  const tambahProduk = (provider: string) => {
    const prodData = newProduct[provider] || { name: '', price: '', awal: '' };
    const name = prodData.name;
    const price = parseInt(prodData.price);
    const awal = parseInt(prodData.awal);

    if (!name || isNaN(price)) return alert("Isi nama & harga");

    setDataVoucher(prev => ({
      ...prev,
      [provider]: [...prev[provider], { id: Date.now(), name, price, awal: isNaN(awal) ? 0 : awal, akhir: isNaN(awal) ? 0 : awal }]
    }));
    
    setNewProduct(prev => ({ ...prev, [provider]: { name: '', price: '', awal: '' } }));
  };

  const updateNewProductField = (provider: string, field: 'name' | 'price' | 'awal', value: string) => {
    setNewProduct(prev => ({
      ...prev,
      [provider]: { ...(prev[provider] || { name: '', price: '', awal: '' }), [field]: value }
    }));
  };

  const handleClickOutside = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.editable-cell')) {
      setActiveEditingCell(null);
    }
  };

  const totalUangTunaiFisik = (dailyRekap && kasirFilter === "Semua Kasir") 
    ? (dailyRekap.total_v_tunai || 0) 
    : (totalUangKeseluruhan - totalUangQris);

  const totalDisplayLaku = (dailyRekap && kasirFilter === "Semua Kasir")
    ? (dailyRekap.count_v_laku || 0)
    : totalQtyLakuKeseluruhan;

  const totalDisplayQris = (dailyRekap && kasirFilter === "Semua Kasir")
    ? (dailyRekap.total_v_qris || 0)
    : totalUangQris;

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'TRI': return 'bg-purple-100 text-purple-900 border-purple-200';
      case 'TELKOMSEL': return 'bg-red-500 text-white border-red-600';
      case 'AXIS': return 'bg-purple-600 text-white border-purple-700';
      case 'XL': return 'bg-blue-800 text-white border-blue-900';
      case 'SMARTFREN': return 'bg-pink-200 text-pink-900 border-pink-300';
      case 'IM3': return 'bg-yellow-300 text-yellow-900 border-yellow-400';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  // Format date for display
  const dateObj = new Date(selectedDate);
  const formattedDate = new Intl.DateTimeFormat('id-ID', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  }).format(dateObj);

  return (
    <div className="min-h-screen bg-gray-50 pb-24" onClick={handleClickOutside}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 text-white shadow-lg sticky top-0 z-10">
        <div className="p-4 flex flex-col gap-3">
          <div className="flex justify-between items-start relative">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocation("/beranda")}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-sm font-black text-blue-200 tracking-wider uppercase">{shopName}</h1>
                <h2 className="text-xl font-black tracking-tight leading-none mt-0.5">STOK VOUCHER</h2>
                <p className="text-[10px] md:text-xs text-blue-100 font-medium">{kasirFilter}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {kasirFilter !== "Semua Kasir" && (
                <button 
                  onClick={() => handleSync(true)}
                  disabled={isSyncing || isLoading}
                  className="flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors border border-white/20"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin mb-0.5" /> : <CloudUpload className="w-4 h-4 mb-0.5" />}
                  <span className="text-[8px] font-medium leading-none">{lastSync ? `Sync: ${lastSync}` : 'Auto Sync'}</span>
                </button>
              )}
              <button
                onClick={() => setLocation("/beranda")}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all active:scale-90"
              >
                <X className="w-5 h-5 text-white" strokeWidth={3} />
              </button>
            </div>
          </div>

          {isOwner && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              <button onClick={() => setKasirFilter("Semua Kasir")} className={`rounded-full px-3 py-1 text-[10px] font-bold border ${kasirFilter === "Semua Kasir" ? 'bg-white text-blue-700 border-white' : 'bg-white/20 text-white border-white/30'}`}>Semua Kasir</button>
              {kasirList.map(k => (
                <button key={k.name} onClick={() => setKasirFilter(k.name)} className={`rounded-full px-3 py-1 text-[10px] font-bold border ${kasirFilter === k.name ? 'bg-white text-blue-700 border-white' : 'bg-white/20 text-white border-white/30'}`}>{k.name}</button>
              ))}
            </div>
          )}
          
          <div className="flex items-center justify-between bg-white/10 p-2.5 rounded-xl border border-white/10">
            <div className="flex flex-col">
              <span className="text-[10px] text-blue-200 font-semibold uppercase">TANGGAL PEMBUKUAN</span>
              <span className="text-sm font-bold">{formattedDate}</span>
            </div>
            <div className="relative">
              <input 
                id="date-picker-stok"
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ WebkitAppearance: 'none' }}
                onClick={(e) => {
                   try { (e.target as HTMLInputElement).showPicker(); } catch(err) {}
                }}
              />
              <button 
                className="bg-white hover:bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all pointer-events-none"
              >
                <Calendar className="w-3.5 h-3.5" /> Ubah
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 space-y-3 max-w-full overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* Top Summary */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white border border-gray-200 rounded-xl p-2 text-center shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Laku</div>
                <div className="text-lg font-black text-gray-800">{totalDisplayLaku}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-2 text-center shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">Tunai</div>
                <div className="text-sm font-black text-emerald-500 truncate">{formatRupiah(totalUangTunaiFisik)}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-2 text-center shadow-sm">
                <div className="text-[10px] text-gray-500 font-bold uppercase mb-1">QRIS</div>
                <div className="text-sm font-black text-sky-500 truncate">{formatRupiah(totalDisplayQris)}</div>
              </div>
            </div>

            {/* Voucher Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[300px]">
                  <thead>
                    <tr className="bg-gray-100/80 border-b-2 border-gray-200">
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase w-2/5">Produk</th>
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase text-center">Awal</th>
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase text-center">Akhir</th>
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase text-right">Harga</th>
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase text-center">Laku</th>
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase text-right">Total</th>
                      <th className="p-2 text-[10px] font-bold text-gray-600 uppercase text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(dataVoucher).map(provider => {
                      const isEditing = providersEditState[provider];
                      return (
                        <React.Fragment key={provider}>
                          <tr className={`${getProviderColor(provider)}`}>
                            <td colSpan={7} className="p-0">
                              <div 
                                className="flex items-center gap-2 p-2 cursor-pointer hover:bg-black/5 transition-colors"
                                onClick={() => toggleEditProvider(provider)}
                              >
                                <span className="bg-white/30 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
                                  {isEditing ? <><X className="w-3 h-3"/> Tutup</> : <><Pencil className="w-3 h-3"/> Edit</>}
                                </span>
                                <span className="font-bold text-xs tracking-wider">{provider}</span>
                              </div>
                            </td>
                          </tr>

                          {dataVoucher[provider].map((item, idx) => {
                            const laku = Math.max(0, item.awal - item.akhir);
                            const total = laku * item.price;
                            const rowColor = idx % 2 === 0 ? 'bg-blue-100' : 'bg-slate-200';

                            const renderStokCell = (field: 'awal' | 'akhir', value: number) => {
                              const cellId = `${provider}-${idx}-${field}`;
                              if (kasirFilter === "Semua Kasir") {
                                return <span className="font-bold text-xs">{value}</span>;
                              }
                              if (activeEditingCell === cellId) {
                                return (
                                  <div className="flex items-center justify-center border border-gray-300 rounded overflow-hidden h-6 bg-white editable-cell">
                                    <button className="bg-gray-100 px-1.5 h-full text-gray-600 font-bold" onClick={() => updateStok(provider, idx, field, -1)}><Minus className="w-3 h-3"/></button>
                                    <span className="text-xs font-bold w-6 text-center">{value}</span>
                                    <button className="bg-gray-100 px-1.5 h-full text-gray-600 font-bold" onClick={() => updateStok(provider, idx, field, 1)}><Plus className="w-3 h-3"/></button>
                                  </div>
                                );
                              }
                              return (
                                <span 
                                  className="font-bold text-xs bg-white border border-gray-200 px-2 py-0.5 rounded cursor-pointer hover:bg-gray-50 editable-cell block mx-auto w-max"
                                  onClick={(e) => { e.stopPropagation(); setActiveEditingCell(cellId); }}
                                >
                                  {value}
                                </span>
                              );
                            };

                            return (
                              <tr key={item.id} className={`${rowColor} border-b border-gray-100 last:border-b-0`}>
                                <td className="p-2 align-middle">
                                  {isEditing ? (
                                    <input 
                                      type="text" 
                                      className="w-full text-xs font-bold border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      value={item.name}
                                      onChange={(e) => updateProductDetail(provider, idx, 'name', e.target.value)}
                                    />
                                  ) : (
                                    <span className="text-xs font-bold leading-tight">{item.name}</span>
                                  )}
                                </td>
                                <td className="p-1 align-middle text-center">{renderStokCell('awal', item.awal)}</td>
                                <td className="p-1 align-middle text-center">{renderStokCell('akhir', item.akhir)}</td>
                                <td className="p-2 align-middle text-right">
                                  {isEditing ? (
                                    <input 
                                      type="number" 
                                      className="w-full min-w-[50px] text-xs font-bold border border-blue-300 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500 text-right"
                                      value={item.price}
                                      onChange={(e) => updateProductDetail(provider, idx, 'price', e.target.value)}
                                    />
                                  ) : (
                                    <span className="text-[10px] text-gray-500 font-semibold">{item.price / 1000}k</span>
                                  )}
                                </td>
                                <td className="p-2 align-middle text-center font-black text-blue-600 text-xs">{laku}</td>
                                <td className="p-2 align-middle text-right font-black text-emerald-600 text-[10px] whitespace-nowrap">
                                  {laku > 0 ? formatRupiah(total) : '-'}
                                </td>
                                <td className="p-2 align-middle text-center">
                                  {!isEditing && kasirFilter !== "Semua Kasir" && (
                                    <button 
                                      className="bg-sky-500 text-white text-[9px] font-black px-1.5 py-1 rounded shadow-sm active:scale-95 transition-transform mx-auto block"
                                      onClick={() => jualQris(provider, idx)}
                                    >
                                      QRIS
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}

                          {isEditing && (
                            <tr className="bg-gray-200/50">
                              <td colSpan={2} className="p-1.5">
                                <input 
                                  type="text" 
                                  placeholder="Nama" 
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                                  value={newProduct[provider]?.name || ''}
                                  onChange={(e) => updateNewProductField(provider, 'name', e.target.value)}
                                />
                              </td>
                              <td className="p-1.5">
                                <input 
                                  type="number" 
                                  placeholder="Stok" 
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-center"
                                  value={newProduct[provider]?.awal || ''}
                                  onChange={(e) => updateNewProductField(provider, 'awal', e.target.value)}
                                />
                              </td>
                              <td className="p-1.5">
                                <input 
                                  type="number" 
                                  placeholder="Harga" 
                                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 text-right"
                                  value={newProduct[provider]?.price || ''}
                                  onChange={(e) => updateNewProductField(provider, 'price', e.target.value)}
                                />
                              </td>
                              <td colSpan={3} className="p-1.5">
                                <button 
                                  className="w-full bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded active:bg-blue-700 transition-colors"
                                  onClick={() => tambahProduk(provider)}
                                >
                                  Tambah
                                </button>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* QRIS Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-4 mb-20">
              <div className="bg-gray-100 border-b border-gray-200 p-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-600" />
                <h2 className="font-bold text-xs text-gray-700 uppercase tracking-wide">Riwayat Non-Tunai (QRIS)</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="p-2 text-[10px] font-bold text-gray-500 uppercase">Produk</th>
                      <th className="p-2 text-[10px] font-bold text-gray-500 uppercase text-center">Qty</th>
                      <th className="p-2 text-[10px] font-bold text-gray-500 uppercase text-right">Subtotal</th>
                      <th className="p-2 text-[10px] font-bold text-gray-500 uppercase text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dataQris.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-xs text-gray-400 italic">
                          Belum ada penjualan non-tunai.
                        </td>
                      </tr>
                    ) : (
                      dataQris.map(item => (
                        <tr key={item.id} className="border-b border-gray-50 last:border-0">
                          <td className="p-2 text-xs font-bold text-gray-700">{item.nama}</td>
                          <td className="p-2 text-xs font-bold text-center">{item.qty}</td>
                          <td className="p-2 text-[11px] font-black text-sky-500 text-right">{formatRupiah(item.harga * item.qty)}</td>
                          <td className="p-2 text-center">
                            {kasirFilter !== "Semua Kasir" && (
                              <button 
                                className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-1 rounded transition-colors flex items-center gap-1 mx-auto"
                                onClick={() => editQris(item.id)}
                              >
                                <Pencil className="w-3 h-3" /> Edit
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="bg-gray-50 border-t-2 border-gray-200 p-3 text-right">
                 <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Total Keseluruhan (Cash + QRIS)</div>
                 <div className="text-lg font-black text-gray-800">{formatRupiah(totalUangKeseluruhan)}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
