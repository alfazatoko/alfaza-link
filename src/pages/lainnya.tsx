import { useLocation } from "wouter";
import { ArrowLeft, Printer, Package, Ticket, CalendarDays } from "lucide-react";

export default function Lainnya() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 text-white p-4 shadow-lg">
        <div className="flex items-center gap-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="text-lg font-black tracking-tight">MENU LAINNYA</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        <div className="grid grid-cols-5 gap-2">
          {/* Stok Barang */}
          <button 
            onClick={() => {}}
            className="flex flex-col items-center justify-center gap-1.5 h-[60px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md"
            style={{ backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #1e8449, #27ae60)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', border: '2px solid transparent' }}
          >
            <Package className="w-6 h-6 text-[#1e8449] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
            <span className="text-[8px] font-bold text-[#1e8449] uppercase tracking-wide text-center leading-[1.1]">Stok<br/>Barang</span>
          </button>

          {/* Stok Voucher */}
          <button 
            onClick={() => setLocation("/stok-voucher")}
            className="flex flex-col items-center justify-center gap-1.5 h-[60px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md"
            style={{ backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #d35400, #f39c12)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', border: '2px solid transparent' }}
          >
            <Ticket className="w-6 h-6 text-[#d35400] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
            <span className="text-[8px] font-bold text-[#d35400] uppercase tracking-wide text-center leading-[1.1]">Stok<br/>Voucher</span>
          </button>

          {/* Kalender Hijri */}
          <button 
            onClick={() => setLocation("/kalender")}
            className="flex flex-col items-center justify-center gap-1.5 h-[60px] rounded-2xl bg-white shadow-sm active:scale-95 transition-all group hover:shadow-md"
            style={{ backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #2980b9, #3498db)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', border: '2px solid transparent' }}
          >
            <CalendarDays className="w-6 h-6 text-[#2980b9] group-hover:scale-110 transition-transform" strokeWidth={1.8} />
            <span className="text-[8px] font-bold text-[#2980b9] uppercase tracking-wide text-center leading-[1.1]">Kalender<br/>Hijri</span>
          </button>
        </div>
      </div>
    </div>
  );
}
