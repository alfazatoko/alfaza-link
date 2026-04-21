import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { addSaldo, addSaldoHistoryOnly, updateDailyNote, getUsers, type UserRecord } from "@/lib/firestore";
import { useQueryClient } from "@tanstack/react-query";
import { formatThousands, parseThousands, formatRupiah, getWibDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Building2, Wallet, Smartphone, Landmark, User } from "lucide-react";

const JENIS_TABS = [
  { id: "Bank", label: "Bank", icon: Building2, color: "bg-primary" },
  { id: "Cash", label: "Cash", icon: Wallet, color: "bg-emerald-600" },
  { id: "Real App", label: "Real App", icon: Smartphone, color: "bg-purple-600" },
  { id: "Sisa Saldo", label: "Sisa Saldo", icon: Landmark, color: "bg-amber-600" },
];

interface AddSaldoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kasirName: string;
  isOwner?: boolean;
}

export function AddSaldoModal({ open, onOpenChange, kasirName, isOwner }: AddSaldoModalProps) {
  const [jenis, setJenis] = useState("Bank");
  const [nominalDisplay, setNominalDisplay] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [saving, setSaving] = useState(false);
  const [kasirOptions, setKasirOptions] = useState<UserRecord[]>([]);
  const [targetKasir, setTargetKasir] = useState<string>("");
  const nominalRef = useRef<HTMLInputElement>(null);
  const ketRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const today = getWibDate();

  const isNoteOnly = jenis === "Real App" || jenis === "Sisa Saldo";

  useEffect(() => {
    if (open && isOwner) {
      getUsers()
        .then(us => {
          const list = us.filter(u => u.role !== "owner" && u.isActive);
          setKasirOptions(list);
          if (!targetKasir && list.length > 0) setTargetKasir(list[0].name);
        })
        .catch(() => {});
    }
  }, [open, isOwner]);

  const effectiveKasir = isOwner ? targetKasir : kasirName;

  const handleSubmit = async () => {
    const n = parseInt(parseThousands(nominalDisplay));
    if (!n || n <= 0) {
      toast({ title: "Nominal harus diisi", variant: "destructive" });
      return;
    }

    if (!effectiveKasir) {
      toast({ title: "Pilih kasir tujuan", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (jenis === "Sisa Saldo" || jenis === "Real App") {
        const field = jenis === "Sisa Saldo" ? "sisaSaldoBank" : "saldoRealApp";
        const label = jenis === "Sisa Saldo" ? "Sisa Saldo Bank" : "Saldo Real App";
        const result = await updateDailyNote(effectiveKasir, today, field as any, n);
        const newVal = field === "sisaSaldoBank" ? result.sisaSaldoBank : result.saldoRealApp;
        await addSaldoHistoryOnly(effectiveKasir, {
          jenis: jenis === "Sisa Saldo" ? "Sisa Saldo" : "Real App",
          nominal: n,
          keterangan: keterangan || label,
        });
        toast({ title: `${label} ${effectiveKasir}: ${formatRupiah(newVal)}` });
        queryClient.invalidateQueries();
      } else {
        await addSaldo(effectiveKasir, {
          jenis,
          nominal: n,
          keterangan: keterangan || `Tambah Saldo ${jenis}`,
        });
        toast({ title: `Saldo ${effectiveKasir} ditambahkan` });
        queryClient.invalidateQueries();
      }
      setNominalDisplay("");
      setKeterangan("");
      onOpenChange(false);
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getPlaceholder = () => {
    if (jenis === "Sisa Saldo") return "Sisa Saldo Bank";
    if (jenis === "Real App") return "Nominal Real App";
    return "Nominal Saldo";
  };

  const getButtonText = () => {
    if (saving) return "MEMPROSES...";
    if (jenis === "Sisa Saldo") return "SIMPAN SISA SALDO";
    if (jenis === "Real App") return "SIMPAN REAL APP";
    return "TAMBAH SALDO";
  };

  const getInfoText = () => {
    if (jenis === "Sisa Saldo") return "Catat sisa saldo bank (catatan manual). Nilai akan diakumulasi dan tampil di laporan.";
    if (jenis === "Real App") return "Catat saldo real app (catatan manual). Nilai akan diakumulasi dan tampil di laporan.";
    return "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl max-w-sm mx-auto p-0 overflow-hidden">
        <DialogHeader className="bg-primary text-white p-4 pb-3">
          <DialogTitle className="text-lg font-extrabold">+ Tambah Saldo</DialogTitle>
          <p className="text-white/70 text-[11px]">Kasir: {isOwner ? (effectiveKasir || "Pilih kasir") : kasirName}</p>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {isOwner && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1"><User className="w-3 h-3" /> Pilih Kasir Tujuan</label>
              <select
                value={targetKasir}
                onChange={e => setTargetKasir(e.target.value)}
                className="w-full border-2 border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold bg-white outline-none"
              >
                {kasirOptions.length === 0 && <option value="">— Tidak ada kasir aktif —</option>}
                {kasirOptions.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}
              </select>
            </div>
          )}
          <div className="grid grid-cols-4 gap-2">
            {JENIS_TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = jenis === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setJenis(tab.id)}
                  className={`py-3 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1.5 border-2 transition-all ${
                    isActive
                      ? `${tab.color} text-white border-transparent shadow-md`
                      : "bg-white text-gray-500 border-gray-200"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {isNoteOnly && (
            <div className={`${jenis === "Sisa Saldo" ? "bg-amber-50 border-amber-200" : "bg-purple-50 border-purple-200"} border rounded-xl px-3 py-2`}>
              <p className={`text-[11px] ${jenis === "Sisa Saldo" ? "text-amber-700" : "text-purple-700"} font-semibold`}>{getInfoText()}</p>
            </div>
          )}

          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 h-14 bg-gray-50/50">
            <span className="text-primary font-bold text-sm">Rp</span>
            <input
              ref={nominalRef}
              type="text"
              inputMode="numeric"
              placeholder={getPlaceholder()}
              value={nominalDisplay}
              onChange={(e) => setNominalDisplay(formatThousands(e.target.value))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); isNoteOnly ? handleSubmit() : ketRef.current?.focus(); } }}
              className="flex-1 bg-transparent outline-none text-xl font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal placeholder:text-base"
            />
          </div>

          {!isNoteOnly && (
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 h-11 bg-gray-50/50">
              <span className="text-blue-400 text-sm">📝</span>
              <input
                ref={ketRef}
                placeholder="Keterangan (opsional)"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"
              />
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full h-12 rounded-2xl font-bold text-sm bg-primary text-white shadow-lg shadow-primary/30 active:scale-[0.98] transition disabled:opacity-50"
          >
            {getButtonText()}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
