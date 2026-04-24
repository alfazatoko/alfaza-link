export interface Holiday {
  date: number; // 1-31
  month: number; // 0-11
  year: number;
  name: string;
  type: "merah" | "cuti";
}

// Sample data from the reference photo
const HOLIDAYS: Holiday[] = [
  { date: 1, month: 4, year: 2026, name: "Hari Buruh International", type: "merah" },
  { date: 14, month: 4, year: 2026, name: "Kenaikan Yesus Kristus", type: "merah" },
  { date: 15, month: 4, year: 2026, name: "Cuti Bersama Kenaikan Yesus Kristus", type: "cuti" },
  { date: 27, month: 4, year: 2026, name: "Hari Raya Idul Adha 1447 H", type: "merah" },
  { date: 28, month: 4, year: 2026, name: "Cuti Bersama Hari Raya Idul Adha 1447 H", type: "cuti" },
  { date: 31, month: 4, year: 2026, name: "Hari Raya Waisak Tahun 2570 BE", type: "merah" },
];

export function getHolidays(year: number, month: number): Holiday[] {
  return HOLIDAYS.filter(h => h.year === year && h.month === month);
}

export function getHijriDate(date: Date): { day: number; month: string; year: number } {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  // Custom mapping for 2026 specifically, to match the requested Indonesian Hijri calendar
  if (y === 2026) {
    // We use May 18, 2026 as epoch for 1 Dzulhijjah 1447
    const epoch = Date.UTC(2026, 4, 18);
    const current = Date.UTC(y, m, d);
    const diff = Math.floor((current - epoch) / 86400000);
    
    // Dzulkaidah 1447 (Month before epoch): ends on May 17 with 29 days.
    if (diff >= 0 && diff <= 29) {
      // Dzulhijjah 1447
      return { day: diff + 1, month: "Dzulhijjah", year: 1447 };
    } else if (diff < 0 && diff >= -29) {
      // Dzulkaidah 1447
      return { day: 30 + diff, month: "Dzulkaidah", year: 1447 };
    }
  }

  // Fallback for other dates using standard Intl.DateTimeFormat with a 1-day offset
  try {
    const offsetDate = new Date(date.getTime() - 86400000);
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const parts = formatter.formatToParts(offsetDate);
    let day = 1;
    let month = "";
    let year = 1447;
    for (const part of parts) {
      if (part.type === 'day') day = parseInt(part.value, 10);
      if (part.type === 'month') month = part.value;
      if (part.type === 'year') year = parseInt(part.value.replace(/\D/g, ''), 10);
    }
    
    // Normalize some common month names for consistency with photo if possible
    if (month.toLowerCase().includes("zulkaidah")) month = "Dzulkaidah";
    if (month.toLowerCase().includes("zulhijah") || month.toLowerCase().includes("zulhijjah")) month = "Dzulhijjah";

    return { day, month, year };
  } catch (e) {
    return { day: date.getDate(), month: "Unknown", year: 1400 };
  }
}
