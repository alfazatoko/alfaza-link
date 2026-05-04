import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/layout/header";
import { getAttendance, createAttendance } from "@/lib/firestore";
import { db } from "@/lib/firebase";
import { getWibDate } from "@/lib/utils";
import { Clock, MapPin, Camera, CheckCircle2, History, Timer, LogOut, LogIn, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";

export default function Absen() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [attendanceToday, setAttendanceToday] = useState<any>(null);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadAttendance = useCallback(async () => {
    if (!user?.name) return;
    setLoading(true);
    try {
      const today = getWibDate();
      
      // Load history
      const history = await getAttendance({ kasirName: user.name });
      setRecentAttendance(history.slice(0, 7)); // Get last 7 days

      // Find today's specific entry
      const todayEntry = history.find(a => a.tanggal === today);
      setAttendanceToday(todayEntry || null);
    } catch (err) {
      console.error("Load attendance error:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.name]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const handleClockIn = async (shift: string) => {
    if (!user?.name) return;
    setSaving(true);
    try {
      const today = getWibDate();
      const now = new Date();
      const jamMasuk = now.toTimeString().substring(0, 5);

      await createAttendance({
        kasirName: user.name,
        tanggal: today,
        shift: shift,
        jamMasuk: jamMasuk,
      });

      toast({ title: "Absen Masuk Berhasil!", description: `Shift ${shift} - ${jamMasuk}` });
      loadAttendance();
      window.dispatchEvent(new CustomEvent("absen-updated"));
    } catch (err: any) {
      toast({ title: "Gagal Absen", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleClockOut = async () => {
    if (!attendanceToday) return;
    setSaving(true);
    try {
      const now = new Date();
      const jamPulang = now.toTimeString().substring(0, 5);
      
      const docRef = doc(db, "attendance", attendanceToday.id);
      await updateDoc(docRef, { jamPulang });

      toast({ title: "Absen Pulang Berhasil!", description: `Pukul ${jamPulang}` });
      loadAttendance();
      window.dispatchEvent(new CustomEvent("absen-updated"));
    } catch (err: any) {
      toast({ title: "Gagal Absen Pulang", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const timeString = currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateString = currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="px-3 pt-3 pb-24">
      <Header />

      {/* Hero Clock Card */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[32px] p-6 text-white shadow-xl shadow-blue-500/20 mb-6 relative overflow-hidden">
        <button 
          onClick={() => setLocation("/beranda")}
          className="absolute left-4 top-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90"
        >
          <X className="w-5 h-5 text-white" strokeWidth={3} />
        </button>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 pt-8">
          <p className="text-blue-100 text-sm font-medium mb-1">{dateString}</p>
          <h2 className="text-5xl font-black tracking-tighter mb-4">{timeString}</h2>
          
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 w-fit border border-white/10">
            <MapPin className="w-4 h-4 text-blue-200" />
            <span className="text-xs font-semibold">Alfaza Link Official</span>
          </div>
        </div>
      </div>

      {/* Main Action Card */}
      <div className="bg-white rounded-[28px] p-5 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-gray-800">Status Kehadiran</h3>
            <p className="text-xs text-gray-400">Kasir: <span className="font-semibold text-gray-600">{user?.name}</span></p>
          </div>
          {attendanceToday?.jamMasuk && (
            <div className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border border-green-100">
              <CheckCircle2 className="w-3 h-3" /> SUDAH ABSEN
            </div>
          )}
        </div>

        {!attendanceToday ? (
          <div className="space-y-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">PILIH SHIFT MASUK</p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => handleClockIn("PAGI")}
                disabled={saving}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-orange-50 border-2 border-orange-100 text-orange-700 active:scale-95 transition-all disabled:opacity-50"
              >
                <LogIn className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">Absen Pagi</span>
              </button>
              <button 
                onClick={() => handleClockIn("SIANG")}
                disabled={saving}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-indigo-700 active:scale-95 transition-all disabled:opacity-50"
              >
                <LogIn className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">Absen Siang</span>
              </button>
              <button 
                onClick={() => handleClockIn("FULL")}
                disabled={saving}
                className="col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-100 text-emerald-700 active:scale-95 transition-all disabled:opacity-50"
              >
                <LogIn className="w-6 h-6" />
                <span className="text-xs font-bold uppercase">Absen Full Day</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Jam Masuk</p>
                <p className="text-lg font-black text-gray-800">{attendanceToday.jamMasuk}</p>
                <p className="text-[10px] text-gray-500 font-medium">Shift {attendanceToday.shift}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Jam Pulang</p>
                <p className="text-lg font-black text-gray-800">{attendanceToday.jamPulang || "--:--"}</p>
                {attendanceToday.jamPulang && <p className="text-[10px] text-green-500 font-medium italic">Selesai Kerja</p>}
              </div>
            </div>

            {!attendanceToday.jamPulang && (
              <button 
                onClick={handleClockOut}
                disabled={saving}
                className="w-full h-14 rounded-2xl bg-red-600 text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50"
              >
                <LogOut className="w-5 h-5" />
                ABSEN PULANG SEKARANG
              </button>
            )}
            
            {attendanceToday.jamPulang && (
              <div className="bg-blue-50 p-4 rounded-2xl text-center border border-blue-100">
                <p className="text-xs text-blue-700 font-semibold italic">Terima kasih untuk kerja keras hari ini! ✨</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <History className="w-4 h-4 text-gray-400" />
          <h3 className="font-bold text-gray-800 text-sm">Riwayat Terakhir</h3>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-8 text-gray-400 text-xs">Memuat riwayat...</div>
          ) : recentAttendance.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs bg-white rounded-2xl border border-dashed">Belum ada riwayat absen.</div>
          ) : (
            recentAttendance.map((item, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700">{item.tanggal}</p>
                  <p className="text-[10px] text-gray-400 font-medium">Shift {item.shift}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-300 uppercase">Masuk</p>
                      <p className="text-xs font-black text-blue-600">{item.jamMasuk}</p>
                    </div>
                    <div className="h-6 w-px bg-gray-100" />
                    <div className="text-center">
                      <p className="text-[8px] font-bold text-gray-300 uppercase">Pulang</p>
                      <p className="text-xs font-black text-gray-800">{item.jamPulang || "--:--"}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
