import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DisplayModeProvider, useDisplayMode, getMaxWidth } from "@/hooks/use-display-mode";
import { useAutoScheduler } from "@/hooks/use-auto-scheduler";
import { BottomNav } from "@/components/layout/bottom-nav";
import NotFound from "@/pages/not-found";

import Login from "@/pages/login";
import Beranda from "@/pages/beranda";
import Riwayat from "@/pages/riwayat";
import NonTunai from "@/pages/non-tunai";
import Catatan from "@/pages/catatan";
import Laporan from "@/pages/laporan";
import Owner from "@/pages/owner";
import Nota from "@/pages/nota";
import Lainnya from "@/pages/lainnya";
import Kalender from "@/pages/kalender";
import PrinterPage from "@/pages/printer";
import { useEffect, lazy, Suspense } from "react";

const VisualInspector = import.meta.env.DEV 
  ? lazy(() => import("@/components/dev/visual-inspector").then(module => ({ default: module.VisualInspector })))
  : () => null;


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {
  const { user, firebaseUser, firebaseLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (firebaseLoading) return;
    if (!firebaseUser || !user) {
      setLocation("/");
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {
      setLocation(user.role === "owner" ? "/owner" : "/beranda");
    }
  }, [user, firebaseUser, firebaseLoading, setLocation, allowedRoles]);

  if (firebaseLoading || !firebaseUser || !user) return null;
  return <Component />;
}

function Router() {
  const { mode, theme } = useDisplayMode();
  const { user } = useAuth();
  const maxW = getMaxWidth(mode);
  useAutoScheduler(!!user);

  const shadowClass = theme === "light" ? "shadow-[0_0_40px_rgba(0,0,0,0.05)]" : "shadow-none";

  return (
    <div className={`pb-20 ${maxW} mx-auto min-h-[100dvh] bg-background ${shadowClass}`}>

      <Switch>
        <Route path="/">
          <Login />
        </Route>
        <Route path="/beranda">
          <ProtectedRoute component={Beranda} />
        </Route>
        <Route path="/riwayat">
          <ProtectedRoute component={Riwayat} />
        </Route>
        <Route path="/non-tunai">
          <ProtectedRoute component={NonTunai} />
        </Route>
        <Route path="/catatan">
          <ProtectedRoute component={Catatan} />
        </Route>
        <Route path="/laporan">
          <ProtectedRoute component={Laporan} />
        </Route>
        <Route path="/owner">
          <ProtectedRoute component={Owner} allowedRoles={["owner"]} />
        </Route>
        <Route path="/nota">
          <ProtectedRoute component={Nota} />
        </Route>
        <Route path="/lainnya">
          <ProtectedRoute component={Lainnya} />
        </Route>
        <Route path="/kalender">
          <ProtectedRoute component={Kalender} />
        </Route>
        <Route path="/printer">
          <ProtectedRoute component={PrinterPage} />
        </Route>
        <Route>
          <NotFound />
        </Route>
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <DisplayModeProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
              <VisualInspector />
            </Suspense>
          </TooltipProvider>
        </DisplayModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
