import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) return;
        installingWorker.onstatechange = () => {
          if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent("pwa-update-available"));
            toast({
              title: "Pembaruan Tersedia",
              description: "Versi terbaru KasLink Pro tersedia. Klik muat ulang untuk memperbarui.",
              action: (
                <ToastAction altText="Muat Ulang" onClick={() => window.location.reload()}>
                  Muat Ulang
                </ToastAction>
              ),
              duration: 100000,
            });
          }
        };
      };
    }).catch(() => {});
    
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        window.location.reload();
        refreshing = true;
      }
    });
  });
}
