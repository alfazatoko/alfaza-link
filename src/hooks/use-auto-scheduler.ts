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
        const lockTotalMinutes = settings.autoLockHour * 60 + settings.autoLockMinute;
        if (currentTotalMinutes >= lockTotalMinutes && settings.lastLockDate !== today) {
          // Perform Lock
          const users = await getUsers();
          const kasirList = users.filter(u => u.role !== "owner" && u.isActive);
          for (const k of kasirList) {
            try {
              await lockReport(k.name, today);
            } catch {}
          }
          // Mark as done for today
          await updateSettings({ lastLockDate: today });
        }

        // --- AUTO RESET ---
        const resetTotalMinutes = settings.autoResetHour * 60 + settings.autoResetMinute;
        if (currentTotalMinutes >= resetTotalMinutes && settings.lastResetDate !== today) {
          // Perform Reset
          const users = await getUsers();
          const kasirList = users.filter(u => u.role !== "owner" && u.isActive);
          for (const k of kasirList) {
            try {
              await resetBalance(k.name);
            } catch {}
          }
          // Mark as done for today
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

