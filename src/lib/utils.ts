import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWibDate(): string {
  const now = new Date();
  // Menggunakan zona waktu Banjarmasin (WITA / UTC+8)
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Makassar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}

export function getWibDateTime(): Date {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Makassar" }));
}

export function formatRupiah(amount: number | string | undefined): string {
  if (amount === undefined || amount === null) return "Rp 0";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "Rp 0";

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const formatted = absNum.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${isNegative ? "-" : ""}Rp ${formatted}`;
}

export function formatThousands(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseThousands(formatted: string): string {
  return formatted.replace(/\./g, "");
}

export function generateUniqueId() {
  return Math.random().toString(36).substring(2, 9).toUpperCase();
}

/**
 * Memaksa aplikasi untuk update ke versi terbaru dengan cara:
 * 1. Menghapus Service Worker
 * 2. Membersihkan Cache Storage (PWA)
 * 3. Hard Reload dengan query string untuk mem-bypass cache browser
 */
export async function forceUpdateApp() {
  try {
    // 1. Unregister Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }

    // 2. Clear Cache Storage
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    }

    // 3. Clear Session Storage
    sessionStorage.clear();

    // 4. Hard Reload ke Origin (Beranda/Login) dengan cache-buster
    const url = new URL(window.location.origin);
    url.searchParams.set('update', Date.now().toString());
    window.location.href = url.toString();
  } catch (err) {
    console.error("Critical Update Error:", err);
    window.location.reload();
  }
}
