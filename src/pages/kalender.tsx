import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchHolidays, getHijriDate, Holiday } from "@/lib/calendar-utils";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const DAY_NAMES = [
  { short: "M", full: "MINGGU", isWeekend: true },
  { short: "S", full: "SENIN", isWeekend: false },
  { short: "S", full: "SELASA", isWeekend: false },
  { short: "R", full: "RABU", isWeekend: false },
  { short: "K", full: "KAMIS", isWeekend: false },
  { short: "J", full: "JUMAT", isWeekend: false },
  { short: "S", full: "SABTU", isWeekend: false }
];

export default function Kalender() {
  const [, setLocation] = useLocation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  // Compute days in month
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) to 6 (Sat)
  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

  const { data: yearHolidays = [], isLoading } = useQuery({
    queryKey: ["holidays", currentYear],
    queryFn: () => fetchHolidays(currentYear),
    staleTime: 1000 * 60 * 60 * 24, // 24 hours
  });

  const holidays = useMemo(() => {
    return yearHolidays.filter(h => h.month === currentMonth);
  }, [yearHolidays, currentMonth]);

  // Compute hijri dates for the first and last day to show in header
  const firstHijri = getHijriDate(firstDayOfMonth);
  const lastHijri = getHijriDate(lastDayOfMonth);

  const prevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };
  const goToday = () => {
    const today = new Date();
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const renderCells = () => {
    const cells = [];
    
    // Previous month cells
    for (let i = 0; i < startingDayOfWeek; i++) {
      const dayNum = prevMonthLastDay - startingDayOfWeek + i + 1;
      cells.push(
        <div key={`prev-${i}`} className="border-b border-r border-gray-300 p-1 bg-gray-50 flex flex-col justify-between items-center h-[60px]">
          <span className="text-3xl font-bold text-gray-300 mt-0">{dayNum}</span>
        </div>
      );
    }

    // Current month cells
    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = new Date(currentYear, currentMonth, i);
      const isSunday = dateObj.getDay() === 0;
      const holiday = holidays.find(h => h.date === i);
      
      let gregorianColor = "text-black";
      if (isSunday || holiday?.type === "merah") {
        gregorianColor = "text-red-600";
      } else if (holiday?.type === "cuti") {
        gregorianColor = "text-amber-500";
      }

      const hijri = getHijriDate(dateObj);
      const hijriColor = hijri.month === firstHijri.month ? "text-emerald-600" : "text-blue-700";

      const isToday = i === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
      const isSelected = selectedDate?.getDate() === i && selectedDate?.getMonth() === currentMonth && selectedDate?.getFullYear() === currentYear;

      let cellBg = "bg-white";
      if (isSelected) {
        cellBg = "bg-sky-100 ring-inset ring-2 ring-sky-500 z-10 cursor-pointer";
      } else if (isToday) {
        cellBg = "bg-yellow-100 cursor-pointer hover:bg-yellow-200 transition";
      } else {
        cellBg = "bg-white cursor-pointer hover:bg-gray-50 transition";
      }

      cells.push(
        <div 
          key={`curr-${i}`} 
          onClick={() => setSelectedDate(dateObj)}
          className={`border-b border-r border-gray-300 p-1 flex flex-col items-center justify-between h-[60px] relative ${cellBg}`}
        >
          <span className={`text-3xl font-black mt-0 tracking-tighter ${gregorianColor}`}>{i}</span>
          <div className="flex flex-col items-center mb-0.5">
            <span className={`text-[10px] leading-none font-black ${hijriColor}`}>
              {hijri.day}
            </span>
          </div>
        </div>
      );
    }

    // Next month cells
    const totalCells = cells.length;
    const remainingCells = (7 - (totalCells % 7)) % 7;
    for (let i = 1; i <= remainingCells; i++) {
      cells.push(
        <div key={`next-${i}`} className="border-b border-r border-gray-300 p-1 bg-gray-50 flex flex-col justify-between items-center h-[60px]">
          <span className="text-3xl font-bold text-gray-300 mt-0">{i}</span>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      <div className="bg-white border-b flex items-center p-3 gap-3">
        <button className="border border-gray-300 rounded p-1 hover:bg-gray-50 transition" onClick={() => window.history.back()}>
          <ArrowLeft className="w-6 h-6 text-gray-600" strokeWidth={1.5} />
        </button>
        <h1 className="text-xl font-black flex-1 text-center pr-8">Kalender Masehi Hijriah</h1>
        <select 
          className="border border-gray-400 rounded px-2 py-1 font-bold text-lg focus:outline-none"
          value={currentYear}
          onChange={(e) => setCurrentDate(new Date(parseInt(e.target.value), currentMonth, 1))}
        >
          {Array.from({length: 15}).map((_, i) => {
            const y = 2020 + i;
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
      </div>

      <div className="bg-white mx-auto max-w-2xl shadow-sm">
        <div className="flex justify-between items-center px-4 py-2 bg-[#f0f0f0] border-b border-gray-300">
          <div className="text-center font-black">
            <div className="text-lg">{firstHijri.month}</div>
            <div className="text-base">{firstHijri.year}</div>
          </div>
          <div className="text-center font-black">
            <div className="text-xl">{MONTH_NAMES[currentMonth]}</div>
            <div className="text-lg">{currentYear}</div>
          </div>
          <div className="text-center font-black">
            <div className="text-lg">{firstHijri.month !== lastHijri.month ? lastHijri.month : ""}</div>
            <div className="text-base">{firstHijri.month !== lastHijri.month ? lastHijri.year : ""}</div>
          </div>
        </div>

        <div className="flex bg-[#5bc0de] text-white divide-x divide-white/40 border-b border-gray-300">
          <button onClick={prevMonth} className="flex-1 py-2 font-bold text-base text-center hover:bg-[#46b8da] transition">
            &lt;---
          </button>
          <button onClick={goToday} className="flex-1 py-2 font-black text-base text-center hover:bg-[#46b8da] transition tracking-widest">
            &lt;&lt;---&gt;&gt;
          </button>
          <button onClick={nextMonth} className="flex-1 py-2 font-bold text-base text-center hover:bg-[#46b8da] transition">
            ---&gt;
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-t border-black bg-white">
          {DAY_NAMES.map((d, i) => (
            <div key={i} className="flex flex-col items-center justify-center py-1 border-r border-gray-300 last:border-r-0">
              <span className={`text-[32px] leading-none font-black tracking-tighter ${d.isWeekend ? 'text-red-600' : 'text-black'}`}>{d.short}</span>
              <span className={`text-[9px] font-black ${d.isWeekend ? 'text-red-600' : 'text-black'}`}>{d.full}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 border-l border-t-0 border-gray-300 bg-white">
          {renderCells()}
        </div>

        {holidays.length > 0 && (
          <div className="px-4 py-3 bg-white border-t border-gray-300 space-y-1">
            {holidays.map((h, i) => (
              <div key={i} className={`font-bold text-[15px] ${h.type === "merah" ? "text-red-600" : "text-amber-500"}`}>
                {h.date} {MONTH_NAMES[h.month]} : {h.name}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
