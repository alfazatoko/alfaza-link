import { useEffect, useRef } from "react";
import { getSettings, getUsers, lockReport, resetBalance, updateSettings } from "@/lib/firestore";

import { getWibDate } from "@/lib/utils";

function getWibNow(): { hour: number; minute: number } {
  const now = new Date();
  const wibOffset = 7 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const wibMinutes = (utcMinutes + wibOffset) % (24 * 60);
  return { hour: Math.floor(wibMinutes / 60), minute: wibMinutes % 60 };
}

export function useAutoScheduler(isLoggedIn: boolean) {
  const isRunning = useRef(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const checkSchedules = async () => {
      if (isRunning.current) return;
      isRunning.current = true;

      try {
        const settings = await getSettings();
        const { hour, minute } = getWibNow();
        const today = getWibDate();

        const currentTotalMinutes = hour * 60 + minute;

        // --- AUTO LOCK ---
        // PENTING: Hanya jalankan dalam jendela 2 menit dari waktu yang ditentukan.
        // Ini mencegah reset terjadi setiap kali app dibuka setelah jam reset lewat.
        const lockTotalMinutes = settings.autoLockHour * 60 + settings.autoLockMinute;
        const isInLockWindow =
          currentTotalMinutes >= lockTotalMinutes &&
          currentTotalMinutes < lockTotalMinutes + 2;
        if (isInLockWindow && settings.lastLockDate !== today) {
          console.log(
            `[Scheduler] Auto Lock berjalan pukul ${hour}:${String(minute).padStart(2, "0")} WIB`
          );
          const users = await getUsers();
          const kasirList = users.filter((u) => u.role !== "owner" && u.isActive);
          for (const k of kasirList) {
            try {
              await lockReport(k.name, today);
            } catch {}
          }
          await updateSettings({ lastLockDate: today });
        }

        // --- AUTO RESET ---
        // PENTING: Hanya jalankan dalam jendela 2 menit dari waktu yang ditentukan.
        // Ini mencegah reset saldo terjadi setiap kali app dibuka setelah jam reset lewat.
        const resetTotalMinutes = settings.autoResetHour * 60 + settings.autoResetMinute;
        const isInResetWindow =
          currentTotalMinutes >= resetTotalMinutes &&
          currentTotalMinutes < resetTotalMinutes + 2;
        if (isInResetWindow && settings.lastResetDate !== today) {
          console.log(
            `[Scheduler] Auto Reset berjalan pukul ${hour}:${String(minute).padStart(2, "0")} WIB`
          );
          const users = await getUsers();
          const kasirList = users.filter((u) => u.role !== "owner" && u.isActive);
          for (const k of kasirList) {
            try {
              await resetBalance(k.name);
            } catch {}
          }
          await updateSettings({ lastResetDate: today });
        }
      } catch (err) {
        console.error("Scheduler Error:", err);
      } finally {
        isRunning.current = false;
      }
    };

    checkSchedules();
    const interval = setInterval(checkSchedules, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isLoggedIn]);
}
