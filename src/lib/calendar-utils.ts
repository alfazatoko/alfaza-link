import hijriConverter from 'hijri-converter';

export interface Holiday {
  date: number; // 1-31
  month: number; // 0-11
  year: number;
  name: string;
  type: "merah" | "cuti";
}

// Complete 2026 Holidays based on SKB 3 Menteri
const HOLIDAYS: Holiday[] = [
  // Januari
  { date: 1, month: 0, year: 2026, name: "Tahun Baru Masehi", type: "merah" },
  { date: 16, month: 0, year: 2026, name: "Isra Mi'raj Nabi Muhammad S.A.W.", type: "merah" },
  
  // Februari
  { date: 16, month: 1, year: 2026, name: "Cuti Bersama Tahun Baru Imlek 2577 Kongzili", type: "cuti" },
  { date: 17, month: 1, year: 2026, name: "Tahun Baru Imlek 2577 Kongzili", type: "merah" },
  
  // Maret
  { date: 18, month: 2, year: 2026, name: "Cuti Bersama Hari Suci Nyepi (Tahun Baru Saka 1948)", type: "cuti" },
  { date: 19, month: 2, year: 2026, name: "Hari Suci Nyepi (Tahun Baru Saka 1948)", type: "merah" },
  { date: 20, month: 2, year: 2026, name: "Cuti Bersama Idul Fitri 1447 H", type: "cuti" },
  { date: 21, month: 2, year: 2026, name: "Hari Raya Idul Fitri 1447 H", type: "merah" },
  { date: 22, month: 2, year: 2026, name: "Hari Raya Idul Fitri 1447 H", type: "merah" },
  { date: 23, month: 2, year: 2026, name: "Cuti Bersama Idul Fitri 1447 H", type: "cuti" },
  { date: 24, month: 2, year: 2026, name: "Cuti Bersama Idul Fitri 1447 H", type: "cuti" },
  
  // April
  { date: 3, month: 3, year: 2026, name: "Wafat Yesus Kristus", type: "merah" },
  { date: 5, month: 3, year: 2026, name: "Kebangkitan Yesus Kristus (Paskah)", type: "merah" },
  
  // Mei
  { date: 1, month: 4, year: 2026, name: "Hari Buruh Internasional", type: "merah" },
  { date: 14, month: 4, year: 2026, name: "Kenaikan Yesus Kristus", type: "merah" },
  { date: 15, month: 4, year: 2026, name: "Cuti Bersama Kenaikan Yesus Kristus", type: "cuti" },
  { date: 27, month: 4, year: 2026, name: "Hari Raya Idul Adha 1447 H", type: "merah" },
  { date: 28, month: 4, year: 2026, name: "Cuti Bersama Hari Raya Idul Adha 1447 H", type: "cuti" },
  { date: 31, month: 4, year: 2026, name: "Hari Raya Waisak 2570 BE", type: "merah" },
  
  // Juni
  { date: 1, month: 5, year: 2026, name: "Hari Lahir Pancasila", type: "merah" },
  { date: 16, month: 5, year: 2026, name: "Tahun Baru Islam 1448 H", type: "merah" },
  
  // Agustus
  { date: 17, month: 7, year: 2026, name: "Proklamasi Kemerdekaan RI", type: "merah" },
  { date: 25, month: 7, year: 2026, name: "Maulid Nabi Muhammad S.A.W.", type: "merah" },
  
  // Desember
  { date: 24, month: 11, year: 2026, name: "Cuti Bersama Kelahiran Yesus Kristus", type: "cuti" },
  { date: 25, month: 11, year: 2026, name: "Kelahiran Yesus Kristus (Natal)", type: "merah" },
];

const HIJRI_MONTHS = [
  "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
  "Jumadil Awal", "Jumadil Akhir", "Rajab", "Sya'ban",
  "Ramadhan", "Syawal", "Dzulkaidah", "Dzulhijjah"
];

/**
 * Official Kemenag RI anchor table: Gregorian date for the 1st of each Hijri month.
 * Format: [year, month(1-12), day] => Gregorian Date (UTC)
 * Source: Kementerian Agama RI / Ditjen Bimas Islam
 * 
 * When the target date falls within the range covered by this table,
 * we compute the Hijri day by counting days from the nearest anchor.
 * This ensures accuracy matching the Indonesian government calendar.
 */
interface HijriAnchor {
  gregYear: number;
  gregMonth: number; // 1-12
  gregDay: number;
  hijriYear: number;
  hijriMonth: number; // 1-12
}

const KEMENAG_ANCHORS: HijriAnchor[] = [
  // 1447 H
  { gregYear: 2025, gregMonth: 6, gregDay: 26, hijriYear: 1447, hijriMonth: 1 },  // 1 Muharram
  { gregYear: 2025, gregMonth: 7, gregDay: 26, hijriYear: 1447, hijriMonth: 2 },  // 1 Safar
  { gregYear: 2025, gregMonth: 8, gregDay: 24, hijriYear: 1447, hijriMonth: 3 },  // 1 Rabiul Awal
  { gregYear: 2025, gregMonth: 9, gregDay: 23, hijriYear: 1447, hijriMonth: 4 },  // 1 Rabiul Akhir
  { gregYear: 2025, gregMonth: 10, gregDay: 22, hijriYear: 1447, hijriMonth: 5 }, // 1 Jumadil Awal
  { gregYear: 2025, gregMonth: 11, gregDay: 21, hijriYear: 1447, hijriMonth: 6 }, // 1 Jumadil Akhir
  { gregYear: 2025, gregMonth: 12, gregDay: 21, hijriYear: 1447, hijriMonth: 7 }, // 1 Rajab
  { gregYear: 2026, gregMonth: 1, gregDay: 20, hijriYear: 1447, hijriMonth: 8 },  // 1 Sya'ban
  { gregYear: 2026, gregMonth: 2, gregDay: 19, hijriYear: 1447, hijriMonth: 9 },  // 1 Ramadhan
  { gregYear: 2026, gregMonth: 3, gregDay: 21, hijriYear: 1447, hijriMonth: 10 }, // 1 Syawal
  { gregYear: 2026, gregMonth: 4, gregDay: 19, hijriYear: 1447, hijriMonth: 11 }, // 1 Dzulkaidah
  { gregYear: 2026, gregMonth: 5, gregDay: 18, hijriYear: 1447, hijriMonth: 12 }, // 1 Dzulhijjah
  // 1448 H
  { gregYear: 2026, gregMonth: 6, gregDay: 16, hijriYear: 1448, hijriMonth: 1 },  // 1 Muharram
  { gregYear: 2026, gregMonth: 7, gregDay: 16, hijriYear: 1448, hijriMonth: 2 },  // 1 Safar
  { gregYear: 2026, gregMonth: 8, gregDay: 14, hijriYear: 1448, hijriMonth: 3 },  // 1 Rabiul Awal
  { gregYear: 2026, gregMonth: 9, gregDay: 12, hijriYear: 1448, hijriMonth: 4 },  // 1 Rabiul Akhir
  { gregYear: 2026, gregMonth: 10, gregDay: 12, hijriYear: 1448, hijriMonth: 5 }, // 1 Jumadil Awal
  { gregYear: 2026, gregMonth: 11, gregDay: 11, hijriYear: 1448, hijriMonth: 6 }, // 1 Jumadil Akhir
  { gregYear: 2026, gregMonth: 12, gregDay: 10, hijriYear: 1448, hijriMonth: 7 }, // 1 Rajab
  { gregYear: 2027, gregMonth: 1, gregDay: 9, hijriYear: 1448, hijriMonth: 8 },   // 1 Sya'ban
  { gregYear: 2027, gregMonth: 2, gregDay: 8, hijriYear: 1448, hijriMonth: 9 },   // 1 Ramadhan
  { gregYear: 2027, gregMonth: 3, gregDay: 10, hijriYear: 1448, hijriMonth: 10 }, // 1 Syawal
  { gregYear: 2027, gregMonth: 4, gregDay: 8, hijriYear: 1448, hijriMonth: 11 },  // 1 Dzulkaidah
  { gregYear: 2027, gregMonth: 5, gregDay: 8, hijriYear: 1448, hijriMonth: 12 },  // 1 Dzulhijjah
];

// Pre-compute UTC timestamps for anchors
const anchorTimestamps = KEMENAG_ANCHORS.map(a => ({
  ...a,
  timestamp: Date.UTC(a.gregYear, a.gregMonth - 1, a.gregDay)
}));

export function getHolidays(year: number, month: number): Holiday[] {
  return HOLIDAYS.filter(h => h.year === year && h.month === month);
}

export async function fetchHolidays(year: number): Promise<Holiday[]> {
  try {
    const res = await fetch(`https://api-hari-libur.vercel.app/api?year=${year}`);
    if (!res.ok) throw new Error("API response not ok");
    const json = await res.json();
    if (json.status !== 'success' || !Array.isArray(json.data)) {
      throw new Error("Invalid API response format");
    }
    
    return json.data.map((item: any) => {
      const d = new Date(item.date);
      const isCuti = item.description.toLowerCase().includes("cuti bersama");
      return {
        date: d.getDate(),
        month: d.getMonth(),
        year: d.getFullYear(),
        name: item.description,
        type: isCuti ? "cuti" : "merah"
      } as Holiday;
    });
  } catch (e) {
    console.error("Failed to fetch holidays from API, falling back to static data", e);
    return HOLIDAYS.filter(h => h.year === year);
  }
}

export function getHijriDate(date: Date): { day: number; month: string; year: number } {
  try {
    const targetTimestamp = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Find the anchor whose 1st-of-month is <= target date
    // We iterate backwards to find the most recent anchor
    for (let i = anchorTimestamps.length - 1; i >= 0; i--) {
      const anchor = anchorTimestamps[i];
      if (targetTimestamp >= anchor.timestamp) {
        const diffDays = Math.floor((targetTimestamp - anchor.timestamp) / 86400000);
        
        // Hijri months have at most 30 days. If diff > 29, the target date
        // likely falls in the next month but we don't have data for it.
        // In that case, check if the next anchor exists.
        if (diffDays <= 29) {
          return {
            day: diffDays + 1,
            month: HIJRI_MONTHS[anchor.hijriMonth - 1],
            year: anchor.hijriYear
          };
        }
        // diffDays > 29: check next anchor
        if (i + 1 < anchorTimestamps.length) {
          const nextAnchor = anchorTimestamps[i + 1];
          const diffNext = Math.floor((targetTimestamp - nextAnchor.timestamp) / 86400000);
          if (diffNext >= 0 && diffNext <= 29) {
            return {
              day: diffNext + 1,
              month: HIJRI_MONTHS[nextAnchor.hijriMonth - 1],
              year: nextAnchor.hijriYear
            };
          }
        }
        // Still within current month (30-day month)
        return {
          day: diffDays + 1,
          month: HIJRI_MONTHS[anchor.hijriMonth - 1],
          year: anchor.hijriYear
        };
      }
    }
    
    // Date is outside the Kemenag anchor table range — fallback to hijri-converter
    const hijri = hijriConverter.toHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
    return { 
      day: hijri.hd, 
      month: HIJRI_MONTHS[hijri.hm - 1], 
      year: hijri.hy 
    };
  } catch (e) {
    return { day: date.getDate(), month: "Unknown", year: 1400 };
  }
}
