const a=`import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";\r
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";\r
import { Toaster } from "@/components/ui/toaster";\r
import { TooltipProvider } from "@/components/ui/tooltip";\r
import { AuthProvider, useAuth } from "@/lib/auth";\r
import { DisplayModeProvider, useDisplayMode, getMaxWidth } from "@/hooks/use-display-mode";\r
import { useAutoScheduler } from "@/hooks/use-auto-scheduler";\r
import { BottomNav } from "@/components/layout/bottom-nav";\r
import NotFound from "@/pages/not-found";\r
\r
import Login from "@/pages/login";\r
import Beranda from "@/pages/beranda";\r
import Riwayat from "@/pages/riwayat";\r
import NonTunai from "@/pages/non-tunai";\r
import Catatan from "@/pages/catatan";\r
import Laporan from "@/pages/laporan";\r
import Owner from "@/pages/owner";\r
import { useEffect } from "react";\r
\r
const queryClient = new QueryClient({\r
  defaultOptions: {\r
    queries: {\r
      retry: false,\r
      refetchOnWindowFocus: false,\r
    },\r
  },\r
});\r
\r
function ProtectedRoute({ component: Component, allowedRoles }: { component: any, allowedRoles?: string[] }) {\r
  const { user, firebaseUser, firebaseLoading } = useAuth();\r
  const [, setLocation] = useLocation();\r
\r
  useEffect(() => {\r
    if (firebaseLoading) return;\r
    if (!firebaseUser || !user) {\r
      setLocation("/");\r
    } else if (allowedRoles && !allowedRoles.includes(user.role)) {\r
      setLocation(user.role === "owner" ? "/owner" : "/beranda");\r
    }\r
  }, [user, firebaseUser, firebaseLoading, setLocation, allowedRoles]);\r
\r
  if (firebaseLoading || !firebaseUser || !user) return null;\r
  return <Component />;\r
}\r
\r
function Router() {\r
  const { mode } = useDisplayMode();\r
  const { user } = useAuth();\r
  const maxW = getMaxWidth(mode);\r
  useAutoScheduler(!!user);\r
\r
  return (\r
    <div className={\`pb-20 \${maxW} mx-auto min-h-[100dvh] bg-background shadow-[0_0_40px_rgba(0,0,0,0.05)] dark:shadow-none transition-all duration-500 ease-in-out\`}>\r
\r
      <Switch>\r
        <Route path="/" component={Login} />\r
        <Route path="/beranda" component={() => <ProtectedRoute component={Beranda} />} />\r
        <Route path="/riwayat" component={() => <ProtectedRoute component={Riwayat} />} />\r
        <Route path="/non-tunai" component={() => <ProtectedRoute component={NonTunai} />} />\r
        <Route path="/catatan" component={() => <ProtectedRoute component={Catatan} />} />\r
        <Route path="/laporan" component={() => <ProtectedRoute component={Laporan} />} />\r
        <Route path="/owner" component={() => <ProtectedRoute component={Owner} allowedRoles={["owner"]} />} />\r
        <Route component={NotFound} />\r
      </Switch>\r
      <BottomNav />\r
    </div>\r
  );\r
}\r
\r
function App() {\r
  return (\r
    <QueryClientProvider client={queryClient}>\r
      <AuthProvider>\r
        <DisplayModeProvider>\r
          <TooltipProvider>\r
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\\/$/, "")}>\r
              <Router />\r
            </WouterRouter>\r
            <Toaster />\r
          </TooltipProvider>\r
        </DisplayModeProvider>\r
      </AuthProvider>\r
    </QueryClientProvider>\r
  );\r
}\r
\r
export default App;\r
`,o=`import { Link, useLocation } from "wouter";\r
import { Home, Clock, CreditCard, BarChart3, Settings, LogOut, History, ArrowLeft } from "lucide-react";\r
import { cn } from "@/lib/utils";\r
import { useAuth } from "@/lib/auth";\r
\r
export function BottomNav() {\r
  const [location] = useLocation();\r
  const { user, logout } = useAuth();\r
\r
  if (location === "/") return null;\r
\r
  const isOwnerMode = location.startsWith("/owner");\r
\r
  const kasirNav = [\r
    { icon: Home, label: "Beranda", href: "/beranda" },\r
    { icon: Clock, label: "Riwayat", href: "/riwayat" },\r
    { icon: CreditCard, label: "Non Tunai", href: "/non-tunai" },\r
    { icon: BarChart3, label: "Laporan", href: "/laporan" },\r
    { icon: Settings, label: "Owner", href: "/owner", ownerOnly: true },\r
    { icon: LogOut, label: "Keluar", href: "logout", isLogout: true },\r
  ];\r
\r
  const ownerNav = [\r
    { icon: Home, label: "Home", href: "/owner" },\r
    { icon: History, label: "Riwayat", href: "/riwayat" },\r
    { icon: ArrowLeft, label: "Kembali", href: "/beranda" },\r
    { icon: LogOut, label: "Keluar", href: "logout", isLogout: true },\r
  ];\r
\r
  const navItems = isOwnerMode ? ownerNav : kasirNav.filter(item => {\r
    if (item.ownerOnly && user?.role !== "owner") return false;\r
    if (item.href === "/non-tunai" && user?.role === "owner") return false;\r
    return true;\r
  });\r
\r
  const handleLogout = () => {\r
    logout();\r
    window.location.href = import.meta.env.BASE_URL || "/";\r
  };\r
\r
  return (\r
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around px-1 py-1.5 pb-5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-none z-50 transition-colors duration-300">\r
      {navItems.map((item, idx) => {\r
        const isActive = item.href !== "logout" && location === item.href;\r
        const isLogout = (item as any).isLogout;\r
        return (\r
          <div key={idx} className="flex-1">\r
            {isLogout ? (\r
              <button\r
                onClick={handleLogout}\r
                className="w-full flex flex-col items-center justify-center py-1 gap-0.5"\r
              >\r
                <div className="p-1 rounded-xl">\r
                  <item.icon className="w-5 h-5 text-red-500" strokeWidth={2} />\r
                </div>\r
                <span className="text-[10px] font-bold text-red-500">{item.label}</span>\r
              </button>\r
            ) : (\r
              <Link href={item.href} className="block">\r
                <div\r
                  className={cn(\r
                    "flex flex-col items-center justify-center py-1 gap-0.5 rounded-2xl transition-all",\r
                    isActive ? "text-primary" : "text-foreground opacity-70"\r
                  )}\r
                >\r
                  <div\r
                    className={cn(\r
                      "p-1 rounded-xl transition-all",\r
                      isActive ? "bg-primary/10 text-primary" : ""\r
                    )}\r
                  >\r
                    <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />\r
                  </div>\r
                  <span className={cn("text-[10px] font-medium", isActive && "font-bold text-primary")}>\r
                    {item.label}\r
                  </span>\r
                </div>\r
              </Link>\r
            )}\r
          </div>\r
        );\r
      })}\r
    </div>\r
\r
  );\r
}\r
`,s=`import { useState, useEffect } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { format } from "date-fns";\r
import { id } from "date-fns/locale";\r
import { getSettings, type SettingsRecord } from "@/lib/firestore";\r
import { User, Clock, CalendarDays, Sun, Moon, Fingerprint, Monitor, Tablet, Smartphone } from "lucide-react";\r
import { useDisplayMode } from "@/hooks/use-display-mode";\r
\r
export function Header() {\r
  const { user, shift, loginTime, absenTime } = useAuth();\r
  const [clock, setClock] = useState("");\r
  const { mode, setMode, theme, toggleTheme, currentPrimaryColor } = useDisplayMode();\r
\r
  const [settings, setSettings] = useState<SettingsRecord | null>(null);\r
\r
  useEffect(() => {\r
    getSettings().then(setSettings).catch(() => {});\r
  }, []);\r
\r
  useEffect(() => {\r
    const tick = () => {\r
      const now = new Date();\r
      setClock(now.toTimeString().substring(0, 8).replace(/:/g, "."));\r
    };\r
    tick();\r
    const interval = setInterval(tick, 1000);\r
    return () => clearInterval(interval);\r
  }, []);\r
\r
  if (!user) return null;\r
\r
  const today = new Date();\r
  const dayName = format(today, "EEEE", { locale: id });\r
  const dateStr = format(today, "d MMMM yyyy", { locale: id });\r
\r
  const getGreeting = () => {\r
    const lt = loginTime || "";\r
    const hour = lt ? parseInt(lt.split(":")[0] || lt.split(".")[0], 10) : new Date().getHours();\r
    if (isNaN(hour)) return "Pagi";\r
    if (hour >= 3 && hour < 11) return "Pagi";\r
    if (hour >= 11 && hour < 15) return "Siang";\r
    if (hour >= 15 && hour < 18) return "Sore";\r
    return "Malam";\r
  };\r
  const shiftLabel = getGreeting();\r
\r
  const displayModes = [\r
    { id: "hp" as const, icon: Smartphone, label: "HP" },\r
    { id: "tablet" as const, icon: Tablet, label: "Tab" },\r
    { id: "pc" as const, icon: Monitor, label: "PC" },\r
  ];\r
\r
  return (\r
    <div \r
      style={{ \r
        background: \`linear-gradient(135deg, \${currentPrimaryColor}ee 0%, \${currentPrimaryColor} 100%)\`,\r
        boxShadow: \`0 10px 25px -5px \${currentPrimaryColor}40\`\r
      }}\r
      className="rounded-3xl p-4 mb-4 text-white relative overflow-hidden transition-all duration-500"\r
    >\r
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full" />\r
      <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white/5 rounded-full" />\r
\r
      <div className="relative z-10">\r
        <div className="flex justify-between items-start mb-2">\r
          <div className="flex items-center gap-2.5">\r
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/40">\r
              <img src={settings?.profilePhotoUrl || \`\${import.meta.env.BASE_URL}alfaza-logo.png\`} alt="Alfaza" className="w-full h-full object-cover" />\r
            </div>\r
            <div>\r
              <h1 className="text-lg font-extrabold tracking-wide leading-tight">\r
                {settings?.shopName || "ALFAZA LINK"}\r
              </h1>\r
              <p className="text-[10px] font-medium text-white/70 -mt-0.5">Sistem Kasir Pro</p>\r
            </div>\r
          </div>\r
          <div className="text-right">\r
            <span className="text-xl font-extrabold font-mono tracking-wider">{clock}</span>\r
          </div>\r
        </div>\r
\r
        <div className="flex items-center gap-2 mb-2">\r
          <div className="flex items-center gap-1.5">\r
            <User className="w-3.5 h-3.5" />\r
            <span className="font-bold text-sm">{user.name}</span>\r
          </div>\r
          <div className="flex items-center gap-1 text-white/70 text-[10px]">\r
            <Clock className="w-3 h-3" />\r
            <span>Login: {loginTime || "--:--"}</span>\r
          </div>\r
          <div className="ml-auto bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">\r
            <Fingerprint className="w-3 h-3" />\r
            Absen: {absenTime || "--:--"}\r
          </div>\r
        </div>\r
\r
        <div className="flex items-center justify-between">\r
          <div className="flex items-center gap-3 text-[11px] text-white/80">\r
            <div className="flex items-center gap-1">\r
              <CalendarDays className="w-3.5 h-3.5" />\r
              <span>{dayName}, {dateStr}</span>\r
            </div>\r
            <div className="flex items-center gap-1">\r
              {shiftLabel === "Pagi" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}\r
              <span>{shiftLabel}</span>\r
            </div>\r
          </div>\r
\r
          <div className="flex items-center gap-1">\r
            <div className="flex items-center gap-0.5 bg-black/10 rounded-full p-0.5">\r
              <button\r
                onClick={toggleTheme}\r
                className="p-1.5 rounded-full transition-all hover:bg-white/10"\r
                title={theme === "light" ? "Mode Gelap" : "Mode Terang"}\r
              >\r
                {theme === "light" ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}\r
              </button>\r
            </div>\r
\r
            <div className="flex items-center gap-0.5 bg-black/10 rounded-full p-0.5">\r
              {displayModes.map(dm => {\r
                const Icon = dm.icon;\r
                return (\r
                  <button\r
                    key={dm.id}\r
                    onClick={() => {\r
                      console.log("Setting mode to:", dm.id);\r
                      setMode(dm.id);\r
                    }}\r
                    className={\`p-1.5 rounded-full transition-all flex items-center gap-1 \${mode === dm.id ? 'bg-white text-primary shadow-sm' : 'opacity-60 hover:opacity-100 text-white'}\`}\r
                    title={dm.id.toUpperCase()}\r
                  >\r
                    <Icon className="w-3 h-3" />\r
                    {mode === dm.id && <span className="text-[8px] font-bold">{dm.label}</span>}\r
                  </button>\r
                );\r
              })}\r
            </div>\r
          </div>\r
\r
        </div>\r
      </div>\r
    </div>\r
  );\r
}\r
`,i=`import { useState, useRef, useEffect } from "react";\r
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";\r
import { addSaldo, addSaldoHistoryOnly, updateDailyNote, getUsers, type UserRecord } from "@/lib/firestore";\r
import { useQueryClient } from "@tanstack/react-query";\r
import { formatThousands, parseThousands, formatRupiah, getWibDate } from "@/lib/utils";\r
import { useToast } from "@/hooks/use-toast";\r
import { Building2, Wallet, Smartphone, Landmark, User } from "lucide-react";\r
\r
const JENIS_TABS = [\r
  { id: "Bank", label: "Bank", icon: Building2, color: "bg-primary" },\r
  { id: "Cash", label: "Cash", icon: Wallet, color: "bg-emerald-600" },\r
  { id: "Real App", label: "Real App", icon: Smartphone, color: "bg-purple-600" },\r
  { id: "Sisa Saldo", label: "Sisa Saldo", icon: Landmark, color: "bg-amber-600" },\r
];\r
\r
interface AddSaldoModalProps {\r
  open: boolean;\r
  onOpenChange: (open: boolean) => void;\r
  kasirName: string;\r
  isOwner?: boolean;\r
}\r
\r
export function AddSaldoModal({ open, onOpenChange, kasirName, isOwner }: AddSaldoModalProps) {\r
  const [jenis, setJenis] = useState("Bank");\r
  const [nominalDisplay, setNominalDisplay] = useState("");\r
  const [keterangan, setKeterangan] = useState("");\r
  const [saving, setSaving] = useState(false);\r
  const [kasirOptions, setKasirOptions] = useState<UserRecord[]>([]);\r
  const [targetKasir, setTargetKasir] = useState<string>("");\r
  const nominalRef = useRef<HTMLInputElement>(null);\r
  const ketRef = useRef<HTMLInputElement>(null);\r
  const { toast } = useToast();\r
  const queryClient = useQueryClient();\r
\r
  const today = getWibDate();\r
\r
  const isNoteOnly = jenis === "Real App" || jenis === "Sisa Saldo";\r
\r
  useEffect(() => {\r
    if (open && isOwner) {\r
      getUsers()\r
        .then(us => {\r
          const list = us.filter(u => u.role !== "owner" && u.isActive);\r
          setKasirOptions(list);\r
          if (!targetKasir && list.length > 0) setTargetKasir(list[0].name);\r
        })\r
        .catch(() => {});\r
    }\r
  }, [open, isOwner]);\r
\r
  const effectiveKasir = isOwner ? targetKasir : kasirName;\r
\r
  const handleSubmit = async () => {\r
    const n = parseInt(parseThousands(nominalDisplay));\r
    if (!n || n <= 0) {\r
      toast({ title: "Nominal harus diisi", variant: "destructive" });\r
      return;\r
    }\r
\r
    if (!effectiveKasir) {\r
      toast({ title: "Pilih kasir tujuan", variant: "destructive" });\r
      return;\r
    }\r
\r
    setSaving(true);\r
    try {\r
      if (jenis === "Sisa Saldo" || jenis === "Real App") {\r
        const field = jenis === "Sisa Saldo" ? "sisaSaldoBank" : "saldoRealApp";\r
        const label = jenis === "Sisa Saldo" ? "Sisa Saldo Bank" : "Saldo Real App";\r
        const result = await updateDailyNote(effectiveKasir, today, field as any, n);\r
        const newVal = field === "sisaSaldoBank" ? result.sisaSaldoBank : result.saldoRealApp;\r
        await addSaldoHistoryOnly(effectiveKasir, {\r
          jenis: jenis === "Sisa Saldo" ? "Sisa Saldo" : "Real App",\r
          nominal: n,\r
          keterangan: keterangan || label,\r
        });\r
        toast({ title: \`\${label} \${effectiveKasir}: \${formatRupiah(newVal)}\` });\r
        queryClient.invalidateQueries();\r
      } else {\r
        await addSaldo(effectiveKasir, {\r
          jenis,\r
          nominal: n,\r
          keterangan: keterangan || \`Tambah Saldo \${jenis}\`,\r
        });\r
        toast({ title: \`Saldo \${effectiveKasir} ditambahkan\` });\r
        queryClient.invalidateQueries();\r
      }\r
      setNominalDisplay("");\r
      setKeterangan("");\r
      onOpenChange(false);\r
    } catch {\r
      toast({ title: "Gagal menyimpan", variant: "destructive" });\r
    } finally {\r
      setSaving(false);\r
    }\r
  };\r
\r
  const getPlaceholder = () => {\r
    if (jenis === "Sisa Saldo") return "Sisa Saldo Bank";\r
    if (jenis === "Real App") return "Nominal Real App";\r
    return "Nominal Saldo";\r
  };\r
\r
  const getButtonText = () => {\r
    if (saving) return "MEMPROSES...";\r
    if (jenis === "Sisa Saldo") return "SIMPAN SISA SALDO";\r
    if (jenis === "Real App") return "SIMPAN REAL APP";\r
    return "TAMBAH SALDO";\r
  };\r
\r
  const getInfoText = () => {\r
    if (jenis === "Sisa Saldo") return "Catat sisa saldo bank (catatan manual). Nilai akan diakumulasi dan tampil di laporan.";\r
    if (jenis === "Real App") return "Catat saldo real app (catatan manual). Nilai akan diakumulasi dan tampil di laporan.";\r
    return "";\r
  };\r
\r
  return (\r
    <Dialog open={open} onOpenChange={onOpenChange}>\r
      <DialogContent className="rounded-3xl max-w-sm mx-auto p-0 overflow-hidden">\r
        <DialogHeader className="bg-primary text-white p-4 pb-3">\r
          <DialogTitle className="text-lg font-extrabold">+ Tambah Saldo</DialogTitle>\r
          <p className="text-white/70 text-[11px]">Kasir: {isOwner ? (effectiveKasir || "Pilih kasir") : kasirName}</p>\r
        </DialogHeader>\r
\r
        <div className="p-4 space-y-4">\r
          {isOwner && (\r
            <div className="space-y-1.5">\r
              <label className="text-[11px] font-bold text-gray-600 flex items-center gap-1"><User className="w-3 h-3" /> Pilih Kasir Tujuan</label>\r
              <select\r
                value={targetKasir}\r
                onChange={e => setTargetKasir(e.target.value)}\r
                className="w-full border-2 border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold bg-white outline-none"\r
              >\r
                {kasirOptions.length === 0 && <option value="">— Tidak ada kasir aktif —</option>}\r
                {kasirOptions.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}\r
              </select>\r
            </div>\r
          )}\r
          <div className="grid grid-cols-4 gap-2">\r
            {JENIS_TABS.map(tab => {\r
              const Icon = tab.icon;\r
              const isActive = jenis === tab.id;\r
              return (\r
                <button\r
                  key={tab.id}\r
                  onClick={() => setJenis(tab.id)}\r
                  className={\`py-3 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1.5 border-2 transition-all \${\r
                    isActive\r
                      ? \`\${tab.color} text-white border-transparent shadow-md\`\r
                      : "bg-white text-gray-500 border-gray-200"\r
                  }\`}\r
                >\r
                  <Icon className="w-5 h-5" />\r
                  {tab.label}\r
                </button>\r
              );\r
            })}\r
          </div>\r
\r
          {isNoteOnly && (\r
            <div className={\`\${jenis === "Sisa Saldo" ? "bg-amber-50 border-amber-200" : "bg-purple-50 border-purple-200"} border rounded-xl px-3 py-2\`}>\r
              <p className={\`text-[11px] \${jenis === "Sisa Saldo" ? "text-amber-700" : "text-purple-700"} font-semibold\`}>{getInfoText()}</p>\r
            </div>\r
          )}\r
\r
          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-3 h-14 bg-gray-50/50">\r
            <span className="text-primary font-bold text-sm">Rp</span>\r
            <input\r
              ref={nominalRef}\r
              type="text"\r
              inputMode="numeric"\r
              placeholder={getPlaceholder()}\r
              value={nominalDisplay}\r
              onChange={(e) => setNominalDisplay(formatThousands(e.target.value))}\r
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); isNoteOnly ? handleSubmit() : ketRef.current?.focus(); } }}\r
              className="flex-1 bg-transparent outline-none text-xl font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal placeholder:text-base"\r
            />\r
          </div>\r
\r
          {!isNoteOnly && (\r
            <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 h-11 bg-gray-50/50">\r
              <span className="text-blue-400 text-sm">📝</span>\r
              <input\r
                ref={ketRef}\r
                placeholder="Keterangan (opsional)"\r
                value={keterangan}\r
                onChange={(e) => setKeterangan(e.target.value)}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}\r
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder:text-gray-400"\r
              />\r
            </div>\r
          )}\r
\r
          <button\r
            onClick={handleSubmit}\r
            disabled={saving}\r
            className="w-full h-12 rounded-2xl font-bold text-sm bg-primary text-white shadow-lg shadow-primary/30 active:scale-[0.98] transition disabled:opacity-50"\r
          >\r
            {getButtonText()}\r
          </button>\r
        </div>\r
      </DialogContent>\r
    </Dialog>\r
  );\r
}\r
`,l=`import * as React from "react"\r
import * as AccordionPrimitive from "@radix-ui/react-accordion"\r
import { ChevronDown } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Accordion = AccordionPrimitive.Root\r
\r
const AccordionItem = React.forwardRef<\r
  React.ElementRef<typeof AccordionPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>\r
>(({ className, ...props }, ref) => (\r
  <AccordionPrimitive.Item\r
    ref={ref}\r
    className={cn("border-b", className)}\r
    {...props}\r
  />\r
))\r
AccordionItem.displayName = "AccordionItem"\r
\r
const AccordionTrigger = React.forwardRef<\r
  React.ElementRef<typeof AccordionPrimitive.Trigger>,\r
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>\r
>(({ className, children, ...props }, ref) => (\r
  <AccordionPrimitive.Header className="flex">\r
    <AccordionPrimitive.Trigger\r
      ref={ref}\r
      className={cn(\r
        "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",\r
        className\r
      )}\r
      {...props}\r
    >\r
      {children}\r
      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />\r
    </AccordionPrimitive.Trigger>\r
  </AccordionPrimitive.Header>\r
))\r
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName\r
\r
const AccordionContent = React.forwardRef<\r
  React.ElementRef<typeof AccordionPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>\r
>(({ className, children, ...props }, ref) => (\r
  <AccordionPrimitive.Content\r
    ref={ref}\r
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"\r
    {...props}\r
  >\r
    <div className={cn("pb-4 pt-0", className)}>{children}</div>\r
  </AccordionPrimitive.Content>\r
))\r
AccordionContent.displayName = AccordionPrimitive.Content.displayName\r
\r
export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }\r
`,d=`import * as React from "react"\r
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog"\r
\r
import { cn } from "@/lib/utils"\r
import { buttonVariants } from "@/components/ui/button"\r
\r
const AlertDialog = AlertDialogPrimitive.Root\r
\r
const AlertDialogTrigger = AlertDialogPrimitive.Trigger\r
\r
const AlertDialogPortal = AlertDialogPrimitive.Portal\r
\r
const AlertDialogOverlay = React.forwardRef<\r
  React.ElementRef<typeof AlertDialogPrimitive.Overlay>,\r
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Overlay>\r
>(({ className, ...props }, ref) => (\r
  <AlertDialogPrimitive.Overlay\r
    className={cn(\r
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",\r
      className\r
    )}\r
    {...props}\r
    ref={ref}\r
  />\r
))\r
AlertDialogOverlay.displayName = AlertDialogPrimitive.Overlay.displayName\r
\r
const AlertDialogContent = React.forwardRef<\r
  React.ElementRef<typeof AlertDialogPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Content>\r
>(({ className, ...props }, ref) => (\r
  <AlertDialogPortal>\r
    <AlertDialogOverlay />\r
    <AlertDialogPrimitive.Content\r
      ref={ref}\r
      className={cn(\r
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",\r
        className\r
      )}\r
      {...props}\r
    />\r
  </AlertDialogPortal>\r
))\r
AlertDialogContent.displayName = AlertDialogPrimitive.Content.displayName\r
\r
const AlertDialogHeader = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn(\r
      "flex flex-col space-y-2 text-center sm:text-left",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
AlertDialogHeader.displayName = "AlertDialogHeader"\r
\r
const AlertDialogFooter = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn(\r
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
AlertDialogFooter.displayName = "AlertDialogFooter"\r
\r
const AlertDialogTitle = React.forwardRef<\r
  React.ElementRef<typeof AlertDialogPrimitive.Title>,\r
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Title>\r
>(({ className, ...props }, ref) => (\r
  <AlertDialogPrimitive.Title\r
    ref={ref}\r
    className={cn("text-lg font-semibold", className)}\r
    {...props}\r
  />\r
))\r
AlertDialogTitle.displayName = AlertDialogPrimitive.Title.displayName\r
\r
const AlertDialogDescription = React.forwardRef<\r
  React.ElementRef<typeof AlertDialogPrimitive.Description>,\r
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Description>\r
>(({ className, ...props }, ref) => (\r
  <AlertDialogPrimitive.Description\r
    ref={ref}\r
    className={cn("text-sm text-muted-foreground", className)}\r
    {...props}\r
  />\r
))\r
AlertDialogDescription.displayName =\r
  AlertDialogPrimitive.Description.displayName\r
\r
const AlertDialogAction = React.forwardRef<\r
  React.ElementRef<typeof AlertDialogPrimitive.Action>,\r
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Action>\r
>(({ className, ...props }, ref) => (\r
  <AlertDialogPrimitive.Action\r
    ref={ref}\r
    className={cn(buttonVariants(), className)}\r
    {...props}\r
  />\r
))\r
AlertDialogAction.displayName = AlertDialogPrimitive.Action.displayName\r
\r
const AlertDialogCancel = React.forwardRef<\r
  React.ElementRef<typeof AlertDialogPrimitive.Cancel>,\r
  React.ComponentPropsWithoutRef<typeof AlertDialogPrimitive.Cancel>\r
>(({ className, ...props }, ref) => (\r
  <AlertDialogPrimitive.Cancel\r
    ref={ref}\r
    className={cn(\r
      buttonVariants({ variant: "outline" }),\r
      "mt-2 sm:mt-0",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
AlertDialogCancel.displayName = AlertDialogPrimitive.Cancel.displayName\r
\r
export {\r
  AlertDialog,\r
  AlertDialogPortal,\r
  AlertDialogOverlay,\r
  AlertDialogTrigger,\r
  AlertDialogContent,\r
  AlertDialogHeader,\r
  AlertDialogFooter,\r
  AlertDialogTitle,\r
  AlertDialogDescription,\r
  AlertDialogAction,\r
  AlertDialogCancel,\r
}\r
`,c=`import * as React from "react"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
\r
const alertVariants = cva(\r
  "relative w-full rounded-lg border px-4 py-3 text-sm [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground [&>svg~*]:pl-7",\r
  {\r
    variants: {\r
      variant: {\r
        default: "bg-background text-foreground",\r
        destructive:\r
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
    },\r
  }\r
)\r
\r
const Alert = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>\r
>(({ className, variant, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    role="alert"\r
    className={cn(alertVariants({ variant }), className)}\r
    {...props}\r
  />\r
))\r
Alert.displayName = "Alert"\r
\r
const AlertTitle = React.forwardRef<\r
  HTMLParagraphElement,\r
  React.HTMLAttributes<HTMLHeadingElement>\r
>(({ className, ...props }, ref) => (\r
  <h5\r
    ref={ref}\r
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}\r
    {...props}\r
  />\r
))\r
AlertTitle.displayName = "AlertTitle"\r
\r
const AlertDescription = React.forwardRef<\r
  HTMLParagraphElement,\r
  React.HTMLAttributes<HTMLParagraphElement>\r
>(({ className, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    className={cn("text-sm [&_p]:leading-relaxed", className)}\r
    {...props}\r
  />\r
))\r
AlertDescription.displayName = "AlertDescription"\r
\r
export { Alert, AlertTitle, AlertDescription }\r
`,m=`import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"\r
\r
const AspectRatio = AspectRatioPrimitive.Root\r
\r
export { AspectRatio }\r
`,p=`"use client"\r
\r
import * as React from "react"\r
import * as AvatarPrimitive from "@radix-ui/react-avatar"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Avatar = React.forwardRef<\r
  React.ElementRef<typeof AvatarPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>\r
>(({ className, ...props }, ref) => (\r
  <AvatarPrimitive.Root\r
    ref={ref}\r
    className={cn(\r
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
Avatar.displayName = AvatarPrimitive.Root.displayName\r
\r
const AvatarImage = React.forwardRef<\r
  React.ElementRef<typeof AvatarPrimitive.Image>,\r
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>\r
>(({ className, ...props }, ref) => (\r
  <AvatarPrimitive.Image\r
    ref={ref}\r
    className={cn("aspect-square h-full w-full", className)}\r
    {...props}\r
  />\r
))\r
AvatarImage.displayName = AvatarPrimitive.Image.displayName\r
\r
const AvatarFallback = React.forwardRef<\r
  React.ElementRef<typeof AvatarPrimitive.Fallback>,\r
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>\r
>(({ className, ...props }, ref) => (\r
  <AvatarPrimitive.Fallback\r
    ref={ref}\r
    className={cn(\r
      "flex h-full w-full items-center justify-center rounded-full bg-muted",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName\r
\r
export { Avatar, AvatarImage, AvatarFallback }\r
`,u=`import * as React from "react"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
\r
const badgeVariants = cva(\r
  // @replit\r
  // Whitespace-nowrap: Badges should never wrap.\r
  "whitespace-nowrap inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" +\r
  " hover-elevate ",\r
  {\r
    variants: {\r
      variant: {\r
        default:\r
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate\r
          "border-transparent bg-primary text-primary-foreground shadow-xs",\r
        secondary:\r
          // @replit no hover because we use hover-elevate\r
          "border-transparent bg-secondary text-secondary-foreground",\r
        destructive:\r
          // @replit shadow-xs instead of shadow, no hover because we use hover-elevate\r
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",\r
          // @replit shadow-xs" - use badge outline variable\r
        outline: "text-foreground border [border-color:var(--badge-outline)]",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
    },\r
  }\r
)\r
\r
export interface BadgeProps\r
  extends React.HTMLAttributes<HTMLDivElement>,\r
    VariantProps<typeof badgeVariants> {}\r
\r
function Badge({ className, variant, ...props }: BadgeProps) {\r
  return (\r
    <div className={cn(badgeVariants({ variant }), className)} {...props} />\r
  )\r
}\r
\r
export { Badge, badgeVariants }\r
`,f=`import * as React from "react"\r
import { Slot } from "@radix-ui/react-slot"\r
import { ChevronRight, MoreHorizontal } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Breadcrumb = React.forwardRef<\r
  HTMLElement,\r
  React.ComponentPropsWithoutRef<"nav"> & {\r
    separator?: React.ReactNode\r
  }\r
>(({ ...props }, ref) => <nav ref={ref} aria-label="breadcrumb" {...props} />)\r
Breadcrumb.displayName = "Breadcrumb"\r
\r
const BreadcrumbList = React.forwardRef<\r
  HTMLOListElement,\r
  React.ComponentPropsWithoutRef<"ol">\r
>(({ className, ...props }, ref) => (\r
  <ol\r
    ref={ref}\r
    className={cn(\r
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
BreadcrumbList.displayName = "BreadcrumbList"\r
\r
const BreadcrumbItem = React.forwardRef<\r
  HTMLLIElement,\r
  React.ComponentPropsWithoutRef<"li">\r
>(({ className, ...props }, ref) => (\r
  <li\r
    ref={ref}\r
    className={cn("inline-flex items-center gap-1.5", className)}\r
    {...props}\r
  />\r
))\r
BreadcrumbItem.displayName = "BreadcrumbItem"\r
\r
const BreadcrumbLink = React.forwardRef<\r
  HTMLAnchorElement,\r
  React.ComponentPropsWithoutRef<"a"> & {\r
    asChild?: boolean\r
  }\r
>(({ asChild, className, ...props }, ref) => {\r
  const Comp = asChild ? Slot : "a"\r
\r
  return (\r
    <Comp\r
      ref={ref}\r
      className={cn("transition-colors hover:text-foreground", className)}\r
      {...props}\r
    />\r
  )\r
})\r
BreadcrumbLink.displayName = "BreadcrumbLink"\r
\r
const BreadcrumbPage = React.forwardRef<\r
  HTMLSpanElement,\r
  React.ComponentPropsWithoutRef<"span">\r
>(({ className, ...props }, ref) => (\r
  <span\r
    ref={ref}\r
    role="link"\r
    aria-disabled="true"\r
    aria-current="page"\r
    className={cn("font-normal text-foreground", className)}\r
    {...props}\r
  />\r
))\r
BreadcrumbPage.displayName = "BreadcrumbPage"\r
\r
const BreadcrumbSeparator = ({\r
  children,\r
  className,\r
  ...props\r
}: React.ComponentProps<"li">) => (\r
  <li\r
    role="presentation"\r
    aria-hidden="true"\r
    className={cn("[&>svg]:w-3.5 [&>svg]:h-3.5", className)}\r
    {...props}\r
  >\r
    {children ?? <ChevronRight />}\r
  </li>\r
)\r
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"\r
\r
const BreadcrumbEllipsis = ({\r
  className,\r
  ...props\r
}: React.ComponentProps<"span">) => (\r
  <span\r
    role="presentation"\r
    aria-hidden="true"\r
    className={cn("flex h-9 w-9 items-center justify-center", className)}\r
    {...props}\r
  >\r
    <MoreHorizontal className="h-4 w-4" />\r
    <span className="sr-only">More</span>\r
  </span>\r
)\r
BreadcrumbEllipsis.displayName = "BreadcrumbElipssis"\r
\r
export {\r
  Breadcrumb,\r
  BreadcrumbList,\r
  BreadcrumbItem,\r
  BreadcrumbLink,\r
  BreadcrumbPage,\r
  BreadcrumbSeparator,\r
  BreadcrumbEllipsis,\r
}\r
`,g=`import { Slot } from "@radix-ui/react-slot"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
import { Separator } from "@/components/ui/separator"\r
\r
const buttonGroupVariants = cva(\r
  "flex w-fit items-stretch has-[>[data-slot=button-group]]:gap-2 [&>*]:focus-visible:relative [&>*]:focus-visible:z-10 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",\r
  {\r
    variants: {\r
      orientation: {\r
        horizontal:\r
          "[&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",\r
        vertical:\r
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",\r
      },\r
    },\r
    defaultVariants: {\r
      orientation: "horizontal",\r
    },\r
  }\r
)\r
\r
function ButtonGroup({\r
  className,\r
  orientation,\r
  ...props\r
}: React.ComponentProps<"div"> & VariantProps<typeof buttonGroupVariants>) {\r
  return (\r
    <div\r
      role="group"\r
      data-slot="button-group"\r
      data-orientation={orientation}\r
      className={cn(buttonGroupVariants({ orientation }), className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ButtonGroupText({\r
  className,\r
  asChild = false,\r
  ...props\r
}: React.ComponentProps<"div"> & {\r
  asChild?: boolean\r
}) {\r
  const Comp = asChild ? Slot : "div"\r
\r
  return (\r
    <Comp\r
      className={cn(\r
        "bg-muted shadow-xs flex items-center gap-2 rounded-md border px-4 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ButtonGroupSeparator({\r
  className,\r
  orientation = "vertical",\r
  ...props\r
}: React.ComponentProps<typeof Separator>) {\r
  return (\r
    <Separator\r
      data-slot="button-group-separator"\r
      orientation={orientation}\r
      className={cn(\r
        "bg-input relative !m-0 self-stretch data-[orientation=vertical]:h-auto",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export {\r
  ButtonGroup,\r
  ButtonGroupSeparator,\r
  ButtonGroupText,\r
  buttonGroupVariants,\r
}\r
`,b=`import * as React from "react"\r
import { Slot } from "@radix-ui/react-slot"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
\r
const buttonVariants = cva(\r
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0" +\r
" hover-elevate active-elevate-2",\r
  {\r
    variants: {\r
      variant: {\r
        default:\r
           // @replit: no hover, and add primary border\r
           "bg-primary text-primary-foreground border border-primary-border",\r
        destructive:\r
          "bg-destructive text-destructive-foreground shadow-sm border-destructive-border",\r
        outline:\r
          // @replit Shows the background color of whatever card / sidebar / accent background it is inside of.\r
          // Inherits the current text color. Uses shadow-xs. no shadow on active\r
          // No hover state\r
          " border [border-color:var(--button-outline)] shadow-xs active:shadow-none ",\r
        secondary:\r
          // @replit border, no hover, no shadow, secondary border.\r
          "border bg-secondary text-secondary-foreground border border-secondary-border ",\r
        // @replit no hover, transparent border\r
        ghost: "border border-transparent",\r
        link: "text-primary underline-offset-4 hover:underline",\r
      },\r
      size: {\r
        // @replit changed sizes\r
        default: "min-h-9 px-4 py-2",\r
        sm: "min-h-8 rounded-md px-3 text-xs",\r
        lg: "min-h-10 rounded-md px-8",\r
        icon: "h-9 w-9",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
      size: "default",\r
    },\r
  }\r
)\r
\r
export interface ButtonProps\r
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,\r
    VariantProps<typeof buttonVariants> {\r
  asChild?: boolean\r
}\r
\r
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(\r
  ({ className, variant, size, asChild = false, ...props }, ref) => {\r
    const Comp = asChild ? Slot : "button"\r
    return (\r
      <Comp\r
        className={cn(buttonVariants({ variant, size, className }))}\r
        ref={ref}\r
        {...props}\r
      />\r
    )\r
  }\r
)\r
Button.displayName = "Button"\r
\r
export { Button, buttonVariants }\r
`,x=`"use client"\r
\r
import * as React from "react"\r
import {\r
  ChevronDownIcon,\r
  ChevronLeftIcon,\r
  ChevronRightIcon,\r
} from "lucide-react"\r
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker"\r
\r
import { cn } from "@/lib/utils"\r
import { Button, buttonVariants } from "@/components/ui/button"\r
\r
function Calendar({\r
  className,\r
  classNames,\r
  showOutsideDays = true,\r
  captionLayout = "label",\r
  buttonVariant = "ghost",\r
  formatters,\r
  components,\r
  ...props\r
}: React.ComponentProps<typeof DayPicker> & {\r
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]\r
}) {\r
  const defaultClassNames = getDefaultClassNames()\r
\r
  return (\r
    <DayPicker\r
      showOutsideDays={showOutsideDays}\r
      className={cn(\r
        "bg-background group/calendar p-3 [--cell-size:2rem] [[data-slot=card-content]_&]:bg-transparent [[data-slot=popover-content]_&]:bg-transparent",\r
        String.raw\`rtl:**:[.rdp-button\\_next>svg]:rotate-180\`,\r
        String.raw\`rtl:**:[.rdp-button\\_previous>svg]:rotate-180\`,\r
        className\r
      )}\r
      captionLayout={captionLayout}\r
      formatters={{\r
        formatMonthDropdown: (date) =>\r
          date.toLocaleString("default", { month: "short" }),\r
        ...formatters,\r
      }}\r
      classNames={{\r
        root: cn("w-fit", defaultClassNames.root),\r
        months: cn(\r
          "relative flex flex-col gap-4 md:flex-row",\r
          defaultClassNames.months\r
        ),\r
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),\r
        nav: cn(\r
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1",\r
          defaultClassNames.nav\r
        ),\r
        button_previous: cn(\r
          buttonVariants({ variant: buttonVariant }),\r
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",\r
          defaultClassNames.button_previous\r
        ),\r
        button_next: cn(\r
          buttonVariants({ variant: buttonVariant }),\r
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50",\r
          defaultClassNames.button_next\r
        ),\r
        month_caption: cn(\r
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size]",\r
          defaultClassNames.month_caption\r
        ),\r
        dropdowns: cn(\r
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium",\r
          defaultClassNames.dropdowns\r
        ),\r
        dropdown_root: cn(\r
          "has-focus:border-ring border-input shadow-xs has-focus:ring-ring/50 has-focus:ring-[3px] relative rounded-md border",\r
          defaultClassNames.dropdown_root\r
        ),\r
        dropdown: cn(\r
          "bg-popover absolute inset-0 opacity-0",\r
          defaultClassNames.dropdown\r
        ),\r
        caption_label: cn(\r
          "select-none font-medium",\r
          captionLayout === "label"\r
            ? "text-sm"\r
            : "[&>svg]:text-muted-foreground flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",\r
          defaultClassNames.caption_label\r
        ),\r
        table: "w-full border-collapse",\r
        weekdays: cn("flex", defaultClassNames.weekdays),\r
        weekday: cn(\r
          "text-muted-foreground flex-1 select-none rounded-md text-[0.8rem] font-normal",\r
          defaultClassNames.weekday\r
        ),\r
        week: cn("mt-2 flex w-full", defaultClassNames.week),\r
        week_number_header: cn(\r
          "w-[--cell-size] select-none",\r
          defaultClassNames.week_number_header\r
        ),\r
        week_number: cn(\r
          "text-muted-foreground select-none text-[0.8rem]",\r
          defaultClassNames.week_number\r
        ),\r
        day: cn(\r
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",\r
          defaultClassNames.day\r
        ),\r
        range_start: cn(\r
          "bg-accent rounded-l-md",\r
          defaultClassNames.range_start\r
        ),\r
        range_middle: cn("rounded-none", defaultClassNames.range_middle),\r
        range_end: cn("bg-accent rounded-r-md", defaultClassNames.range_end),\r
        today: cn(\r
          "bg-accent text-accent-foreground rounded-md data-[selected=true]:rounded-none",\r
          defaultClassNames.today\r
        ),\r
        outside: cn(\r
          "text-muted-foreground aria-selected:text-muted-foreground",\r
          defaultClassNames.outside\r
        ),\r
        disabled: cn(\r
          "text-muted-foreground opacity-50",\r
          defaultClassNames.disabled\r
        ),\r
        hidden: cn("invisible", defaultClassNames.hidden),\r
        ...classNames,\r
      }}\r
      components={{\r
        Root: ({ className, rootRef, ...props }) => {\r
          return (\r
            <div\r
              data-slot="calendar"\r
              ref={rootRef}\r
              className={cn(className)}\r
              {...props}\r
            />\r
          )\r
        },\r
        Chevron: ({ className, orientation, ...props }) => {\r
          if (orientation === "left") {\r
            return (\r
              <ChevronLeftIcon className={cn("size-4", className)} {...props} />\r
            )\r
          }\r
\r
          if (orientation === "right") {\r
            return (\r
              <ChevronRightIcon\r
                className={cn("size-4", className)}\r
                {...props}\r
              />\r
            )\r
          }\r
\r
          return (\r
            <ChevronDownIcon className={cn("size-4", className)} {...props} />\r
          )\r
        },\r
        DayButton: CalendarDayButton,\r
        WeekNumber: ({ children, ...props }) => {\r
          return (\r
            <td {...props}>\r
              <div className="flex size-[--cell-size] items-center justify-center text-center">\r
                {children}\r
              </div>\r
            </td>\r
          )\r
        },\r
        ...components,\r
      }}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function CalendarDayButton({\r
  className,\r
  day,\r
  modifiers,\r
  ...props\r
}: React.ComponentProps<typeof DayButton>) {\r
  const defaultClassNames = getDefaultClassNames()\r
\r
  const ref = React.useRef<HTMLButtonElement>(null)\r
  React.useEffect(() => {\r
    if (modifiers.focused) ref.current?.focus()\r
  }, [modifiers.focused])\r
\r
  return (\r
    <Button\r
      ref={ref}\r
      variant="ghost"\r
      size="icon"\r
      data-day={day.date.toLocaleDateString()}\r
      data-selected-single={\r
        modifiers.selected &&\r
        !modifiers.range_start &&\r
        !modifiers.range_end &&\r
        !modifiers.range_middle\r
      }\r
      data-range-start={modifiers.range_start}\r
      data-range-end={modifiers.range_end}\r
      data-range-middle={modifiers.range_middle}\r
      className={cn(\r
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-normal leading-none data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] [&>span]:text-xs [&>span]:opacity-70",\r
        defaultClassNames.day,\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export { Calendar, CalendarDayButton }\r
`,h=`import * as React from "react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Card = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    className={cn(\r
      "rounded-xl border bg-card text-card-foreground shadow",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
Card.displayName = "Card"\r
\r
const CardHeader = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    className={cn("flex flex-col space-y-1.5 p-6", className)}\r
    {...props}\r
  />\r
))\r
CardHeader.displayName = "CardHeader"\r
\r
const CardTitle = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    className={cn("font-semibold leading-none tracking-tight", className)}\r
    {...props}\r
  />\r
))\r
CardTitle.displayName = "CardTitle"\r
\r
const CardDescription = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    className={cn("text-sm text-muted-foreground", className)}\r
    {...props}\r
  />\r
))\r
CardDescription.displayName = "CardDescription"\r
\r
const CardContent = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => (\r
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />\r
))\r
CardContent.displayName = "CardContent"\r
\r
const CardFooter = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => (\r
  <div\r
    ref={ref}\r
    className={cn("flex items-center p-6 pt-0", className)}\r
    {...props}\r
  />\r
))\r
CardFooter.displayName = "CardFooter"\r
\r
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }\r
`,v=`import * as React from "react"\r
import useEmblaCarousel, {\r
  type UseEmblaCarouselType,\r
} from "embla-carousel-react"\r
import { ArrowLeft, ArrowRight } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
import { Button } from "@/components/ui/button"\r
\r
type CarouselApi = UseEmblaCarouselType[1]\r
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>\r
type CarouselOptions = UseCarouselParameters[0]\r
type CarouselPlugin = UseCarouselParameters[1]\r
\r
type CarouselProps = {\r
  opts?: CarouselOptions\r
  plugins?: CarouselPlugin\r
  orientation?: "horizontal" | "vertical"\r
  setApi?: (api: CarouselApi) => void\r
}\r
\r
type CarouselContextProps = {\r
  carouselRef: ReturnType<typeof useEmblaCarousel>[0]\r
  api: ReturnType<typeof useEmblaCarousel>[1]\r
  scrollPrev: () => void\r
  scrollNext: () => void\r
  canScrollPrev: boolean\r
  canScrollNext: boolean\r
} & CarouselProps\r
\r
const CarouselContext = React.createContext<CarouselContextProps | null>(null)\r
\r
function useCarousel() {\r
  const context = React.useContext(CarouselContext)\r
\r
  if (!context) {\r
    throw new Error("useCarousel must be used within a <Carousel />")\r
  }\r
\r
  return context\r
}\r
\r
const Carousel = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement> & CarouselProps\r
>(\r
  (\r
    {\r
      orientation = "horizontal",\r
      opts,\r
      setApi,\r
      plugins,\r
      className,\r
      children,\r
      ...props\r
    },\r
    ref\r
  ) => {\r
    const [carouselRef, api] = useEmblaCarousel(\r
      {\r
        ...opts,\r
        axis: orientation === "horizontal" ? "x" : "y",\r
      },\r
      plugins\r
    )\r
    const [canScrollPrev, setCanScrollPrev] = React.useState(false)\r
    const [canScrollNext, setCanScrollNext] = React.useState(false)\r
\r
    const onSelect = React.useCallback((api: CarouselApi) => {\r
      if (!api) {\r
        return\r
      }\r
\r
      setCanScrollPrev(api.canScrollPrev())\r
      setCanScrollNext(api.canScrollNext())\r
    }, [])\r
\r
    const scrollPrev = React.useCallback(() => {\r
      api?.scrollPrev()\r
    }, [api])\r
\r
    const scrollNext = React.useCallback(() => {\r
      api?.scrollNext()\r
    }, [api])\r
\r
    const handleKeyDown = React.useCallback(\r
      (event: React.KeyboardEvent<HTMLDivElement>) => {\r
        if (event.key === "ArrowLeft") {\r
          event.preventDefault()\r
          scrollPrev()\r
        } else if (event.key === "ArrowRight") {\r
          event.preventDefault()\r
          scrollNext()\r
        }\r
      },\r
      [scrollPrev, scrollNext]\r
    )\r
\r
    React.useEffect(() => {\r
      if (!api || !setApi) {\r
        return\r
      }\r
\r
      setApi(api)\r
    }, [api, setApi])\r
\r
    React.useEffect(() => {\r
      if (!api) {\r
        return\r
      }\r
\r
      onSelect(api)\r
      api.on("reInit", onSelect)\r
      api.on("select", onSelect)\r
\r
      return () => {\r
        api?.off("select", onSelect)\r
      }\r
    }, [api, onSelect])\r
\r
    return (\r
      <CarouselContext.Provider\r
        value={{\r
          carouselRef,\r
          api: api,\r
          opts,\r
          orientation:\r
            orientation || (opts?.axis === "y" ? "vertical" : "horizontal"),\r
          scrollPrev,\r
          scrollNext,\r
          canScrollPrev,\r
          canScrollNext,\r
        }}\r
      >\r
        <div\r
          ref={ref}\r
          onKeyDownCapture={handleKeyDown}\r
          className={cn("relative", className)}\r
          role="region"\r
          aria-roledescription="carousel"\r
          {...props}\r
        >\r
          {children}\r
        </div>\r
      </CarouselContext.Provider>\r
    )\r
  }\r
)\r
Carousel.displayName = "Carousel"\r
\r
const CarouselContent = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => {\r
  const { carouselRef, orientation } = useCarousel()\r
\r
  return (\r
    <div ref={carouselRef} className="overflow-hidden">\r
      <div\r
        ref={ref}\r
        className={cn(\r
          "flex",\r
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",\r
          className\r
        )}\r
        {...props}\r
      />\r
    </div>\r
  )\r
})\r
CarouselContent.displayName = "CarouselContent"\r
\r
const CarouselItem = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => {\r
  const { orientation } = useCarousel()\r
\r
  return (\r
    <div\r
      ref={ref}\r
      role="group"\r
      aria-roledescription="slide"\r
      className={cn(\r
        "min-w-0 shrink-0 grow-0 basis-full",\r
        orientation === "horizontal" ? "pl-4" : "pt-4",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
})\r
CarouselItem.displayName = "CarouselItem"\r
\r
const CarouselPrevious = React.forwardRef<\r
  HTMLButtonElement,\r
  React.ComponentProps<typeof Button>\r
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {\r
  const { orientation, scrollPrev, canScrollPrev } = useCarousel()\r
\r
  return (\r
    <Button\r
      ref={ref}\r
      variant={variant}\r
      size={size}\r
      className={cn(\r
        "absolute  h-8 w-8 rounded-full",\r
        orientation === "horizontal"\r
          ? "-left-12 top-1/2 -translate-y-1/2"\r
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",\r
        className\r
      )}\r
      disabled={!canScrollPrev}\r
      onClick={scrollPrev}\r
      {...props}\r
    >\r
      <ArrowLeft className="h-4 w-4" />\r
      <span className="sr-only">Previous slide</span>\r
    </Button>\r
  )\r
})\r
CarouselPrevious.displayName = "CarouselPrevious"\r
\r
const CarouselNext = React.forwardRef<\r
  HTMLButtonElement,\r
  React.ComponentProps<typeof Button>\r
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {\r
  const { orientation, scrollNext, canScrollNext } = useCarousel()\r
\r
  return (\r
    <Button\r
      ref={ref}\r
      variant={variant}\r
      size={size}\r
      className={cn(\r
        "absolute h-8 w-8 rounded-full",\r
        orientation === "horizontal"\r
          ? "-right-12 top-1/2 -translate-y-1/2"\r
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",\r
        className\r
      )}\r
      disabled={!canScrollNext}\r
      onClick={scrollNext}\r
      {...props}\r
    >\r
      <ArrowRight className="h-4 w-4" />\r
      <span className="sr-only">Next slide</span>\r
    </Button>\r
  )\r
})\r
CarouselNext.displayName = "CarouselNext"\r
\r
export {\r
  type CarouselApi,\r
  Carousel,\r
  CarouselContent,\r
  CarouselItem,\r
  CarouselPrevious,\r
  CarouselNext,\r
}\r
`,y=`import * as React from "react"\r
import * as RechartsPrimitive from "recharts"\r
\r
import { cn } from "@/lib/utils"\r
\r
// Format: { THEME_NAME: CSS_SELECTOR }\r
const THEMES = { light: "", dark: ".dark" } as const\r
\r
export type ChartConfig = {\r
  [k in string]: {\r
    label?: React.ReactNode\r
    icon?: React.ComponentType\r
  } & (\r
    | { color?: string; theme?: never }\r
    | { color?: never; theme: Record<keyof typeof THEMES, string> }\r
  )\r
}\r
\r
type ChartContextProps = {\r
  config: ChartConfig\r
}\r
\r
const ChartContext = React.createContext<ChartContextProps | null>(null)\r
\r
function useChart() {\r
  const context = React.useContext(ChartContext)\r
\r
  if (!context) {\r
    throw new Error("useChart must be used within a <ChartContainer />")\r
  }\r
\r
  return context\r
}\r
\r
const ChartContainer = React.forwardRef<\r
  HTMLDivElement,\r
  React.ComponentProps<"div"> & {\r
    config: ChartConfig\r
    children: React.ComponentProps<\r
      typeof RechartsPrimitive.ResponsiveContainer\r
    >["children"]\r
  }\r
>(({ id, className, children, config, ...props }, ref) => {\r
  const uniqueId = React.useId()\r
  const chartId = \`chart-\${id || uniqueId.replace(/:/g, "")}\`\r
\r
  return (\r
    <ChartContext.Provider value={{ config }}>\r
      <div\r
        data-chart={chartId}\r
        ref={ref}\r
        className={cn(\r
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",\r
          className\r
        )}\r
        {...props}\r
      >\r
        <ChartStyle id={chartId} config={config} />\r
        <RechartsPrimitive.ResponsiveContainer>\r
          {children}\r
        </RechartsPrimitive.ResponsiveContainer>\r
      </div>\r
    </ChartContext.Provider>\r
  )\r
})\r
ChartContainer.displayName = "Chart"\r
\r
const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {\r
  const colorConfig = Object.entries(config).filter(\r
    ([, config]) => config.theme || config.color\r
  )\r
\r
  if (!colorConfig.length) {\r
    return null\r
  }\r
\r
  return (\r
    <style\r
      dangerouslySetInnerHTML={{\r
        __html: Object.entries(THEMES)\r
          .map(\r
            ([theme, prefix]) => \`\r
\${prefix} [data-chart=\${id}] {\r
\${colorConfig\r
  .map(([key, itemConfig]) => {\r
    const color =\r
      itemConfig.theme?.[theme as keyof typeof itemConfig.theme] ||\r
      itemConfig.color\r
    return color ? \`  --color-\${key}: \${color};\` : null\r
  })\r
  .join("\\n")}\r
}\r
\`\r
          )\r
          .join("\\n"),\r
      }}\r
    />\r
  )\r
}\r
\r
const ChartTooltip = RechartsPrimitive.Tooltip\r
\r
const ChartTooltipContent = React.forwardRef<\r
  HTMLDivElement,\r
  React.ComponentProps<typeof RechartsPrimitive.Tooltip> &\r
    React.ComponentProps<"div"> & {\r
      hideLabel?: boolean\r
      hideIndicator?: boolean\r
      indicator?: "line" | "dot" | "dashed"\r
      nameKey?: string\r
      labelKey?: string\r
    }\r
>(\r
  (\r
    {\r
      active,\r
      payload,\r
      className,\r
      indicator = "dot",\r
      hideLabel = false,\r
      hideIndicator = false,\r
      label,\r
      labelFormatter,\r
      labelClassName,\r
      formatter,\r
      color,\r
      nameKey,\r
      labelKey,\r
    },\r
    ref\r
  ) => {\r
    const { config } = useChart()\r
\r
    const tooltipLabel = React.useMemo(() => {\r
      if (hideLabel || !payload?.length) {\r
        return null\r
      }\r
\r
      const [item] = payload\r
      const key = \`\${labelKey || item?.dataKey || item?.name || "value"}\`\r
      const itemConfig = getPayloadConfigFromPayload(config, item, key)\r
      const value =\r
        !labelKey && typeof label === "string"\r
          ? config[label as keyof typeof config]?.label || label\r
          : itemConfig?.label\r
\r
      if (labelFormatter) {\r
        return (\r
          <div className={cn("font-medium", labelClassName)}>\r
            {labelFormatter(value, payload)}\r
          </div>\r
        )\r
      }\r
\r
      if (!value) {\r
        return null\r
      }\r
\r
      return <div className={cn("font-medium", labelClassName)}>{value}</div>\r
    }, [\r
      label,\r
      labelFormatter,\r
      payload,\r
      hideLabel,\r
      labelClassName,\r
      config,\r
      labelKey,\r
    ])\r
\r
    if (!active || !payload?.length) {\r
      return null\r
    }\r
\r
    const nestLabel = payload.length === 1 && indicator !== "dot"\r
\r
    return (\r
      <div\r
        ref={ref}\r
        className={cn(\r
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",\r
          className\r
        )}\r
      >\r
        {!nestLabel ? tooltipLabel : null}\r
        <div className="grid gap-1.5">\r
          {payload\r
            .filter((item) => item.type !== "none")\r
            .map((item, index) => {\r
              const key = \`\${nameKey || item.name || item.dataKey || "value"}\`\r
              const itemConfig = getPayloadConfigFromPayload(config, item, key)\r
              const indicatorColor = color || item.payload.fill || item.color\r
\r
              return (\r
                <div\r
                  key={item.dataKey}\r
                  className={cn(\r
                    "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",\r
                    indicator === "dot" && "items-center"\r
                  )}\r
                >\r
                  {formatter && item?.value !== undefined && item.name ? (\r
                    formatter(item.value, item.name, item, index, item.payload)\r
                  ) : (\r
                    <>\r
                      {itemConfig?.icon ? (\r
                        <itemConfig.icon />\r
                      ) : (\r
                        !hideIndicator && (\r
                          <div\r
                            className={cn(\r
                              "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",\r
                              {\r
                                "h-2.5 w-2.5": indicator === "dot",\r
                                "w-1": indicator === "line",\r
                                "w-0 border-[1.5px] border-dashed bg-transparent":\r
                                  indicator === "dashed",\r
                                "my-0.5": nestLabel && indicator === "dashed",\r
                              }\r
                            )}\r
                            style={\r
                              {\r
                                "--color-bg": indicatorColor,\r
                                "--color-border": indicatorColor,\r
                              } as React.CSSProperties\r
                            }\r
                          />\r
                        )\r
                      )}\r
                      <div\r
                        className={cn(\r
                          "flex flex-1 justify-between leading-none",\r
                          nestLabel ? "items-end" : "items-center"\r
                        )}\r
                      >\r
                        <div className="grid gap-1.5">\r
                          {nestLabel ? tooltipLabel : null}\r
                          <span className="text-muted-foreground">\r
                            {itemConfig?.label || item.name}\r
                          </span>\r
                        </div>\r
                        {item.value && (\r
                          <span className="font-mono font-medium tabular-nums text-foreground">\r
                            {item.value.toLocaleString()}\r
                          </span>\r
                        )}\r
                      </div>\r
                    </>\r
                  )}\r
                </div>\r
              )\r
            })}\r
        </div>\r
      </div>\r
    )\r
  }\r
)\r
ChartTooltipContent.displayName = "ChartTooltip"\r
\r
const ChartLegend = RechartsPrimitive.Legend\r
\r
const ChartLegendContent = React.forwardRef<\r
  HTMLDivElement,\r
  React.ComponentProps<"div"> &\r
    Pick<RechartsPrimitive.LegendProps, "payload" | "verticalAlign"> & {\r
      hideIcon?: boolean\r
      nameKey?: string\r
    }\r
>(\r
  (\r
    { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },\r
    ref\r
  ) => {\r
    const { config } = useChart()\r
\r
    if (!payload?.length) {\r
      return null\r
    }\r
\r
    return (\r
      <div\r
        ref={ref}\r
        className={cn(\r
          "flex items-center justify-center gap-4",\r
          verticalAlign === "top" ? "pb-3" : "pt-3",\r
          className\r
        )}\r
      >\r
        {payload\r
          .filter((item) => item.type !== "none")\r
          .map((item) => {\r
            const key = \`\${nameKey || item.dataKey || "value"}\`\r
            const itemConfig = getPayloadConfigFromPayload(config, item, key)\r
\r
            return (\r
              <div\r
                key={item.value}\r
                className={cn(\r
                  "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"\r
                )}\r
              >\r
                {itemConfig?.icon && !hideIcon ? (\r
                  <itemConfig.icon />\r
                ) : (\r
                  <div\r
                    className="h-2 w-2 shrink-0 rounded-[2px]"\r
                    style={{\r
                      backgroundColor: item.color,\r
                    }}\r
                  />\r
                )}\r
                {itemConfig?.label}\r
              </div>\r
            )\r
          })}\r
      </div>\r
    )\r
  }\r
)\r
ChartLegendContent.displayName = "ChartLegend"\r
\r
// Helper to extract item config from a payload.\r
function getPayloadConfigFromPayload(\r
  config: ChartConfig,\r
  payload: unknown,\r
  key: string\r
) {\r
  if (typeof payload !== "object" || payload === null) {\r
    return undefined\r
  }\r
\r
  const payloadPayload =\r
    "payload" in payload &&\r
    typeof payload.payload === "object" &&\r
    payload.payload !== null\r
      ? payload.payload\r
      : undefined\r
\r
  let configLabelKey: string = key\r
\r
  if (\r
    key in payload &&\r
    typeof payload[key as keyof typeof payload] === "string"\r
  ) {\r
    configLabelKey = payload[key as keyof typeof payload] as string\r
  } else if (\r
    payloadPayload &&\r
    key in payloadPayload &&\r
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"\r
  ) {\r
    configLabelKey = payloadPayload[\r
      key as keyof typeof payloadPayload\r
    ] as string\r
  }\r
\r
  return configLabelKey in config\r
    ? config[configLabelKey]\r
    : config[key as keyof typeof config]\r
}\r
\r
export {\r
  ChartContainer,\r
  ChartTooltip,\r
  ChartTooltipContent,\r
  ChartLegend,\r
  ChartLegendContent,\r
  ChartStyle,\r
}\r
`,N=`import * as React from "react"\r
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"\r
import { Check } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Checkbox = React.forwardRef<\r
  React.ElementRef<typeof CheckboxPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>\r
>(({ className, ...props }, ref) => (\r
  <CheckboxPrimitive.Root\r
    ref={ref}\r
    className={cn(\r
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <CheckboxPrimitive.Indicator\r
      className={cn("grid place-content-center text-current")}\r
    >\r
      <Check className="h-4 w-4" />\r
    </CheckboxPrimitive.Indicator>\r
  </CheckboxPrimitive.Root>\r
))\r
Checkbox.displayName = CheckboxPrimitive.Root.displayName\r
\r
export { Checkbox }\r
`,w=`"use client"\r
\r
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"\r
\r
const Collapsible = CollapsiblePrimitive.Root\r
\r
const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger\r
\r
const CollapsibleContent = CollapsiblePrimitive.CollapsibleContent\r
\r
export { Collapsible, CollapsibleTrigger, CollapsibleContent }\r
`,k=`"use client"\r
\r
import * as React from "react"\r
import { type DialogProps } from "@radix-ui/react-dialog"\r
import { Command as CommandPrimitive } from "cmdk"\r
import { Search } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
import { Dialog, DialogContent } from "@/components/ui/dialog"\r
\r
const Command = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>\r
>(({ className, ...props }, ref) => (\r
  <CommandPrimitive\r
    ref={ref}\r
    className={cn(\r
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
Command.displayName = CommandPrimitive.displayName\r
\r
const CommandDialog = ({ children, ...props }: DialogProps) => {\r
  return (\r
    <Dialog {...props}>\r
      <DialogContent className="overflow-hidden p-0">\r
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">\r
          {children}\r
        </Command>\r
      </DialogContent>\r
    </Dialog>\r
  )\r
}\r
\r
const CommandInput = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive.Input>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>\r
>(({ className, ...props }, ref) => (\r
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">\r
    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />\r
    <CommandPrimitive.Input\r
      ref={ref}\r
      className={cn(\r
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",\r
        className\r
      )}\r
      {...props}\r
    />\r
  </div>\r
))\r
\r
CommandInput.displayName = CommandPrimitive.Input.displayName\r
\r
const CommandList = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive.List>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>\r
>(({ className, ...props }, ref) => (\r
  <CommandPrimitive.List\r
    ref={ref}\r
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}\r
    {...props}\r
  />\r
))\r
\r
CommandList.displayName = CommandPrimitive.List.displayName\r
\r
const CommandEmpty = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive.Empty>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>\r
>((props, ref) => (\r
  <CommandPrimitive.Empty\r
    ref={ref}\r
    className="py-6 text-center text-sm"\r
    {...props}\r
  />\r
))\r
\r
CommandEmpty.displayName = CommandPrimitive.Empty.displayName\r
\r
const CommandGroup = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive.Group>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>\r
>(({ className, ...props }, ref) => (\r
  <CommandPrimitive.Group\r
    ref={ref}\r
    className={cn(\r
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
\r
CommandGroup.displayName = CommandPrimitive.Group.displayName\r
\r
const CommandSeparator = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive.Separator>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>\r
>(({ className, ...props }, ref) => (\r
  <CommandPrimitive.Separator\r
    ref={ref}\r
    className={cn("-mx-1 h-px bg-border", className)}\r
    {...props}\r
  />\r
))\r
CommandSeparator.displayName = CommandPrimitive.Separator.displayName\r
\r
const CommandItem = React.forwardRef<\r
  React.ElementRef<typeof CommandPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>\r
>(({ className, ...props }, ref) => (\r
  <CommandPrimitive.Item\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default gap-2 select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
\r
CommandItem.displayName = CommandPrimitive.Item.displayName\r
\r
const CommandShortcut = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLSpanElement>) => {\r
  return (\r
    <span\r
      className={cn(\r
        "ml-auto text-xs tracking-widest text-muted-foreground",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
CommandShortcut.displayName = "CommandShortcut"\r
\r
export {\r
  Command,\r
  CommandDialog,\r
  CommandInput,\r
  CommandList,\r
  CommandEmpty,\r
  CommandGroup,\r
  CommandItem,\r
  CommandShortcut,\r
  CommandSeparator,\r
}\r
`,R=`import * as React from "react"\r
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu"\r
import { Check, ChevronRight, Circle } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const ContextMenu = ContextMenuPrimitive.Root\r
\r
const ContextMenuTrigger = ContextMenuPrimitive.Trigger\r
\r
const ContextMenuGroup = ContextMenuPrimitive.Group\r
\r
const ContextMenuPortal = ContextMenuPrimitive.Portal\r
\r
const ContextMenuSub = ContextMenuPrimitive.Sub\r
\r
const ContextMenuRadioGroup = ContextMenuPrimitive.RadioGroup\r
\r
const ContextMenuSubTrigger = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.SubTrigger>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubTrigger> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, children, ...props }, ref) => (\r
  <ContextMenuPrimitive.SubTrigger\r
    ref={ref}\r
    className={cn(\r
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  >\r
    {children}\r
    <ChevronRight className="ml-auto h-4 w-4" />\r
  </ContextMenuPrimitive.SubTrigger>\r
))\r
ContextMenuSubTrigger.displayName = ContextMenuPrimitive.SubTrigger.displayName\r
\r
const ContextMenuSubContent = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.SubContent>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.SubContent>\r
>(({ className, ...props }, ref) => (\r
  <ContextMenuPrimitive.SubContent\r
    ref={ref}\r
    className={cn(\r
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
ContextMenuSubContent.displayName = ContextMenuPrimitive.SubContent.displayName\r
\r
const ContextMenuContent = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Content>\r
>(({ className, ...props }, ref) => (\r
  <ContextMenuPrimitive.Portal>\r
    <ContextMenuPrimitive.Content\r
      ref={ref}\r
      className={cn(\r
        "z-50 max-h-[--radix-context-menu-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-context-menu-content-transform-origin]",\r
        className\r
      )}\r
      {...props}\r
    />\r
  </ContextMenuPrimitive.Portal>\r
))\r
ContextMenuContent.displayName = ContextMenuPrimitive.Content.displayName\r
\r
const ContextMenuItem = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Item> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, ...props }, ref) => (\r
  <ContextMenuPrimitive.Item\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
ContextMenuItem.displayName = ContextMenuPrimitive.Item.displayName\r
\r
const ContextMenuCheckboxItem = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.CheckboxItem>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.CheckboxItem>\r
>(({ className, children, checked, ...props }, ref) => (\r
  <ContextMenuPrimitive.CheckboxItem\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    checked={checked}\r
    {...props}\r
  >\r
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <ContextMenuPrimitive.ItemIndicator>\r
        <Check className="h-4 w-4" />\r
      </ContextMenuPrimitive.ItemIndicator>\r
    </span>\r
    {children}\r
  </ContextMenuPrimitive.CheckboxItem>\r
))\r
ContextMenuCheckboxItem.displayName =\r
  ContextMenuPrimitive.CheckboxItem.displayName\r
\r
const ContextMenuRadioItem = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.RadioItem>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.RadioItem>\r
>(({ className, children, ...props }, ref) => (\r
  <ContextMenuPrimitive.RadioItem\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <ContextMenuPrimitive.ItemIndicator>\r
        <Circle className="h-4 w-4 fill-current" />\r
      </ContextMenuPrimitive.ItemIndicator>\r
    </span>\r
    {children}\r
  </ContextMenuPrimitive.RadioItem>\r
))\r
ContextMenuRadioItem.displayName = ContextMenuPrimitive.RadioItem.displayName\r
\r
const ContextMenuLabel = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.Label>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Label> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, ...props }, ref) => (\r
  <ContextMenuPrimitive.Label\r
    ref={ref}\r
    className={cn(\r
      "px-2 py-1.5 text-sm font-semibold text-foreground",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
ContextMenuLabel.displayName = ContextMenuPrimitive.Label.displayName\r
\r
const ContextMenuSeparator = React.forwardRef<\r
  React.ElementRef<typeof ContextMenuPrimitive.Separator>,\r
  React.ComponentPropsWithoutRef<typeof ContextMenuPrimitive.Separator>\r
>(({ className, ...props }, ref) => (\r
  <ContextMenuPrimitive.Separator\r
    ref={ref}\r
    className={cn("-mx-1 my-1 h-px bg-border", className)}\r
    {...props}\r
  />\r
))\r
ContextMenuSeparator.displayName = ContextMenuPrimitive.Separator.displayName\r
\r
const ContextMenuShortcut = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLSpanElement>) => {\r
  return (\r
    <span\r
      className={cn(\r
        "ml-auto text-xs tracking-widest text-muted-foreground",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
ContextMenuShortcut.displayName = "ContextMenuShortcut"\r
\r
export {\r
  ContextMenu,\r
  ContextMenuTrigger,\r
  ContextMenuContent,\r
  ContextMenuItem,\r
  ContextMenuCheckboxItem,\r
  ContextMenuRadioItem,\r
  ContextMenuLabel,\r
  ContextMenuSeparator,\r
  ContextMenuShortcut,\r
  ContextMenuGroup,\r
  ContextMenuPortal,\r
  ContextMenuSub,\r
  ContextMenuSubContent,\r
  ContextMenuSubTrigger,\r
  ContextMenuRadioGroup,\r
}\r
`,S=`import * as React from "react"\r
import * as DialogPrimitive from "@radix-ui/react-dialog"\r
import { X } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Dialog = DialogPrimitive.Root\r
\r
const DialogTrigger = DialogPrimitive.Trigger\r
\r
const DialogPortal = DialogPrimitive.Portal\r
\r
const DialogClose = DialogPrimitive.Close\r
\r
const DialogOverlay = React.forwardRef<\r
  React.ElementRef<typeof DialogPrimitive.Overlay>,\r
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>\r
>(({ className, ...props }, ref) => (\r
  <DialogPrimitive.Overlay\r
    ref={ref}\r
    className={cn(\r
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName\r
\r
const DialogContent = React.forwardRef<\r
  React.ElementRef<typeof DialogPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>\r
>(({ className, children, ...props }, ref) => (\r
  <DialogPortal>\r
    <DialogOverlay />\r
    <DialogPrimitive.Content\r
      ref={ref}\r
      className={cn(\r
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",\r
        className\r
      )}\r
      {...props}\r
    >\r
      {children}\r
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">\r
        <X className="h-4 w-4" />\r
        <span className="sr-only">Close</span>\r
      </DialogPrimitive.Close>\r
    </DialogPrimitive.Content>\r
  </DialogPortal>\r
))\r
DialogContent.displayName = DialogPrimitive.Content.displayName\r
\r
const DialogHeader = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn(\r
      "flex flex-col space-y-1.5 text-center sm:text-left",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
DialogHeader.displayName = "DialogHeader"\r
\r
const DialogFooter = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn(\r
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
DialogFooter.displayName = "DialogFooter"\r
\r
const DialogTitle = React.forwardRef<\r
  React.ElementRef<typeof DialogPrimitive.Title>,\r
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>\r
>(({ className, ...props }, ref) => (\r
  <DialogPrimitive.Title\r
    ref={ref}\r
    className={cn(\r
      "text-lg font-semibold leading-none tracking-tight",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
DialogTitle.displayName = DialogPrimitive.Title.displayName\r
\r
const DialogDescription = React.forwardRef<\r
  React.ElementRef<typeof DialogPrimitive.Description>,\r
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>\r
>(({ className, ...props }, ref) => (\r
  <DialogPrimitive.Description\r
    ref={ref}\r
    className={cn("text-sm text-muted-foreground", className)}\r
    {...props}\r
  />\r
))\r
DialogDescription.displayName = DialogPrimitive.Description.displayName\r
\r
export {\r
  Dialog,\r
  DialogPortal,\r
  DialogOverlay,\r
  DialogTrigger,\r
  DialogClose,\r
  DialogContent,\r
  DialogHeader,\r
  DialogFooter,\r
  DialogTitle,\r
  DialogDescription,\r
}\r
`,C=`import * as React from "react"\r
import { Drawer as DrawerPrimitive } from "vaul"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Drawer = ({\r
  shouldScaleBackground = true,\r
  ...props\r
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (\r
  <DrawerPrimitive.Root\r
    shouldScaleBackground={shouldScaleBackground}\r
    {...props}\r
  />\r
)\r
Drawer.displayName = "Drawer"\r
\r
const DrawerTrigger = DrawerPrimitive.Trigger\r
\r
const DrawerPortal = DrawerPrimitive.Portal\r
\r
const DrawerClose = DrawerPrimitive.Close\r
\r
const DrawerOverlay = React.forwardRef<\r
  React.ElementRef<typeof DrawerPrimitive.Overlay>,\r
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>\r
>(({ className, ...props }, ref) => (\r
  <DrawerPrimitive.Overlay\r
    ref={ref}\r
    className={cn("fixed inset-0 z-50 bg-black/80", className)}\r
    {...props}\r
  />\r
))\r
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName\r
\r
const DrawerContent = React.forwardRef<\r
  React.ElementRef<typeof DrawerPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>\r
>(({ className, children, ...props }, ref) => (\r
  <DrawerPortal>\r
    <DrawerOverlay />\r
    <DrawerPrimitive.Content\r
      ref={ref}\r
      className={cn(\r
        "fixed inset-x-0 bottom-0 z-50 mt-24 flex h-auto flex-col rounded-t-[10px] border bg-background",\r
        className\r
      )}\r
      {...props}\r
    >\r
      <div className="mx-auto mt-4 h-2 w-[100px] rounded-full bg-muted" />\r
      {children}\r
    </DrawerPrimitive.Content>\r
  </DrawerPortal>\r
))\r
DrawerContent.displayName = "DrawerContent"\r
\r
const DrawerHeader = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn("grid gap-1.5 p-4 text-center sm:text-left", className)}\r
    {...props}\r
  />\r
)\r
DrawerHeader.displayName = "DrawerHeader"\r
\r
const DrawerFooter = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn("mt-auto flex flex-col gap-2 p-4", className)}\r
    {...props}\r
  />\r
)\r
DrawerFooter.displayName = "DrawerFooter"\r
\r
const DrawerTitle = React.forwardRef<\r
  React.ElementRef<typeof DrawerPrimitive.Title>,\r
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>\r
>(({ className, ...props }, ref) => (\r
  <DrawerPrimitive.Title\r
    ref={ref}\r
    className={cn(\r
      "text-lg font-semibold leading-none tracking-tight",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
DrawerTitle.displayName = DrawerPrimitive.Title.displayName\r
\r
const DrawerDescription = React.forwardRef<\r
  React.ElementRef<typeof DrawerPrimitive.Description>,\r
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>\r
>(({ className, ...props }, ref) => (\r
  <DrawerPrimitive.Description\r
    ref={ref}\r
    className={cn("text-sm text-muted-foreground", className)}\r
    {...props}\r
  />\r
))\r
DrawerDescription.displayName = DrawerPrimitive.Description.displayName\r
\r
export {\r
  Drawer,\r
  DrawerPortal,\r
  DrawerOverlay,\r
  DrawerTrigger,\r
  DrawerClose,\r
  DrawerContent,\r
  DrawerHeader,\r
  DrawerFooter,\r
  DrawerTitle,\r
  DrawerDescription,\r
}\r
`,P=`"use client"\r
\r
import * as React from "react"\r
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu"\r
import { Check, ChevronRight, Circle } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const DropdownMenu = DropdownMenuPrimitive.Root\r
\r
const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger\r
\r
const DropdownMenuGroup = DropdownMenuPrimitive.Group\r
\r
const DropdownMenuPortal = DropdownMenuPrimitive.Portal\r
\r
const DropdownMenuSub = DropdownMenuPrimitive.Sub\r
\r
const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup\r
\r
const DropdownMenuSubTrigger = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, children, ...props }, ref) => (\r
  <DropdownMenuPrimitive.SubTrigger\r
    ref={ref}\r
    className={cn(\r
      "flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  >\r
    {children}\r
    <ChevronRight className="ml-auto" />\r
  </DropdownMenuPrimitive.SubTrigger>\r
))\r
DropdownMenuSubTrigger.displayName =\r
  DropdownMenuPrimitive.SubTrigger.displayName\r
\r
const DropdownMenuSubContent = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>\r
>(({ className, ...props }, ref) => (\r
  <DropdownMenuPrimitive.SubContent\r
    ref={ref}\r
    className={cn(\r
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
DropdownMenuSubContent.displayName =\r
  DropdownMenuPrimitive.SubContent.displayName\r
\r
const DropdownMenuContent = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>\r
>(({ className, sideOffset = 4, ...props }, ref) => (\r
  <DropdownMenuPrimitive.Portal>\r
    <DropdownMenuPrimitive.Content\r
      ref={ref}\r
      sideOffset={sideOffset}\r
      className={cn(\r
        "z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md",\r
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-dropdown-menu-content-transform-origin]",\r
        className\r
      )}\r
      {...props}\r
    />\r
  </DropdownMenuPrimitive.Portal>\r
))\r
DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName\r
\r
const DropdownMenuItem = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, ...props }, ref) => (\r
  <DropdownMenuPrimitive.Item\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&>svg]:size-4 [&>svg]:shrink-0",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName\r
\r
const DropdownMenuCheckboxItem = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>\r
>(({ className, children, checked, ...props }, ref) => (\r
  <DropdownMenuPrimitive.CheckboxItem\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    checked={checked}\r
    {...props}\r
  >\r
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <DropdownMenuPrimitive.ItemIndicator>\r
        <Check className="h-4 w-4" />\r
      </DropdownMenuPrimitive.ItemIndicator>\r
    </span>\r
    {children}\r
  </DropdownMenuPrimitive.CheckboxItem>\r
))\r
DropdownMenuCheckboxItem.displayName =\r
  DropdownMenuPrimitive.CheckboxItem.displayName\r
\r
const DropdownMenuRadioItem = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>\r
>(({ className, children, ...props }, ref) => (\r
  <DropdownMenuPrimitive.RadioItem\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <DropdownMenuPrimitive.ItemIndicator>\r
        <Circle className="h-2 w-2 fill-current" />\r
      </DropdownMenuPrimitive.ItemIndicator>\r
    </span>\r
    {children}\r
  </DropdownMenuPrimitive.RadioItem>\r
))\r
DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName\r
\r
const DropdownMenuLabel = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, ...props }, ref) => (\r
  <DropdownMenuPrimitive.Label\r
    ref={ref}\r
    className={cn(\r
      "px-2 py-1.5 text-sm font-semibold",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName\r
\r
const DropdownMenuSeparator = React.forwardRef<\r
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,\r
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>\r
>(({ className, ...props }, ref) => (\r
  <DropdownMenuPrimitive.Separator\r
    ref={ref}\r
    className={cn("-mx-1 my-1 h-px bg-muted", className)}\r
    {...props}\r
  />\r
))\r
DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName\r
\r
const DropdownMenuShortcut = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLSpanElement>) => {\r
  return (\r
    <span\r
      className={cn("ml-auto text-xs tracking-widest opacity-60", className)}\r
      {...props}\r
    />\r
  )\r
}\r
DropdownMenuShortcut.displayName = "DropdownMenuShortcut"\r
\r
export {\r
  DropdownMenu,\r
  DropdownMenuTrigger,\r
  DropdownMenuContent,\r
  DropdownMenuItem,\r
  DropdownMenuCheckboxItem,\r
  DropdownMenuRadioItem,\r
  DropdownMenuLabel,\r
  DropdownMenuSeparator,\r
  DropdownMenuShortcut,\r
  DropdownMenuGroup,\r
  DropdownMenuPortal,\r
  DropdownMenuSub,\r
  DropdownMenuSubContent,\r
  DropdownMenuSubTrigger,\r
  DropdownMenuRadioGroup,\r
}\r
`,T=`import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
\r
function Empty({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="empty"\r
      className={cn(\r
        "flex min-w-0 flex-1 flex-col items-center justify-center gap-6 text-balance rounded-lg border-dashed p-6 text-center md:p-12",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="empty-header"\r
      className={cn(\r
        "flex max-w-sm flex-col items-center gap-2 text-center",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const emptyMediaVariants = cva(\r
  "mb-2 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",\r
  {\r
    variants: {\r
      variant: {\r
        default: "bg-transparent",\r
        icon: "bg-muted text-foreground flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-6",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
    },\r
  }\r
)\r
\r
function EmptyMedia({\r
  className,\r
  variant = "default",\r
  ...props\r
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {\r
  return (\r
    <div\r
      data-slot="empty-icon"\r
      data-variant={variant}\r
      className={cn(emptyMediaVariants({ variant, className }))}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function EmptyTitle({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="empty-title"\r
      className={cn("text-lg font-medium tracking-tight", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function EmptyDescription({ className, ...props }: React.ComponentProps<"p">) {\r
  return (\r
    <div\r
      data-slot="empty-description"\r
      className={cn(\r
        "text-muted-foreground [&>a:hover]:text-primary text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="empty-content"\r
      className={cn(\r
        "flex w-full min-w-0 max-w-sm flex-col items-center gap-4 text-balance text-sm",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export {\r
  Empty,\r
  EmptyHeader,\r
  EmptyTitle,\r
  EmptyDescription,\r
  EmptyContent,\r
  EmptyMedia,\r
}\r
`,D=`"use client"\r
\r
import { useMemo } from "react"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
import { Label } from "@/components/ui/label"\r
import { Separator } from "@/components/ui/separator"\r
\r
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) {\r
  return (\r
    <fieldset\r
      data-slot="field-set"\r
      className={cn(\r
        "flex flex-col gap-6",\r
        "has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldLegend({\r
  className,\r
  variant = "legend",\r
  ...props\r
}: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) {\r
  return (\r
    <legend\r
      data-slot="field-legend"\r
      data-variant={variant}\r
      className={cn(\r
        "mb-3 font-medium",\r
        "data-[variant=legend]:text-base",\r
        "data-[variant=label]:text-sm",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="field-group"\r
      className={cn(\r
        "group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const fieldVariants = cva(\r
  "group/field data-[invalid=true]:text-destructive flex w-full gap-3",\r
  {\r
    variants: {\r
      orientation: {\r
        vertical: ["flex-col [&>*]:w-full [&>.sr-only]:w-auto"],\r
        horizontal: [\r
          "flex-row items-center",\r
          "[&>[data-slot=field-label]]:flex-auto",\r
          "has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px has-[>[data-slot=field-content]]:items-start",\r
        ],\r
        responsive: [\r
          "@md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto flex-col [&>*]:w-full [&>.sr-only]:w-auto",\r
          "@md/field-group:[&>[data-slot=field-label]]:flex-auto",\r
          "@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",\r
        ],\r
      },\r
    },\r
    defaultVariants: {\r
      orientation: "vertical",\r
    },\r
  }\r
)\r
\r
function Field({\r
  className,\r
  orientation = "vertical",\r
  ...props\r
}: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) {\r
  return (\r
    <div\r
      role="group"\r
      data-slot="field"\r
      data-orientation={orientation}\r
      className={cn(fieldVariants({ orientation }), className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldContent({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="field-content"\r
      className={cn(\r
        "group/field-content flex flex-1 flex-col gap-1.5 leading-snug",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldLabel({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof Label>) {\r
  return (\r
    <Label\r
      data-slot="field-label"\r
      className={cn(\r
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50",\r
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>[data-slot=field]]:p-4",\r
        "has-data-[state=checked]:bg-primary/5 has-data-[state=checked]:border-primary dark:has-data-[state=checked]:bg-primary/10",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldTitle({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="field-label"\r
      className={cn(\r
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug group-data-[disabled=true]/field:opacity-50",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) {\r
  return (\r
    <p\r
      data-slot="field-description"\r
      className={cn(\r
        "text-muted-foreground text-sm font-normal leading-normal group-has-[[data-orientation=horizontal]]/field:text-balance",\r
        "nth-last-2:-mt-1 last:mt-0 [[data-variant=legend]+&]:-mt-1.5",\r
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function FieldSeparator({\r
  children,\r
  className,\r
  ...props\r
}: React.ComponentProps<"div"> & {\r
  children?: React.ReactNode\r
}) {\r
  return (\r
    <div\r
      data-slot="field-separator"\r
      data-content={!!children}\r
      className={cn(\r
        "relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2",\r
        className\r
      )}\r
      {...props}\r
    >\r
      <Separator className="absolute inset-0 top-1/2" />\r
      {children && (\r
        <span\r
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"\r
          data-slot="field-separator-content"\r
        >\r
          {children}\r
        </span>\r
      )}\r
    </div>\r
  )\r
}\r
\r
function FieldError({\r
  className,\r
  children,\r
  errors,\r
  ...props\r
}: React.ComponentProps<"div"> & {\r
  errors?: Array<{ message?: string } | undefined>\r
}) {\r
  const content = useMemo(() => {\r
    if (children) {\r
      return children\r
    }\r
\r
    if (!errors) {\r
      return null\r
    }\r
\r
    if (errors?.length === 1 && errors[0]?.message) {\r
      return errors[0].message\r
    }\r
\r
    return (\r
      <ul className="ml-4 flex list-disc flex-col gap-1">\r
        {errors.map(\r
          (error, index) =>\r
            error?.message && <li key={index}>{error.message}</li>\r
        )}\r
      </ul>\r
    )\r
  }, [children, errors])\r
\r
  if (!content) {\r
    return null\r
  }\r
\r
  return (\r
    <div\r
      role="alert"\r
      data-slot="field-error"\r
      className={cn("text-destructive text-sm font-normal", className)}\r
      {...props}\r
    >\r
      {content}\r
    </div>\r
  )\r
}\r
\r
export {\r
  Field,\r
  FieldLabel,\r
  FieldDescription,\r
  FieldError,\r
  FieldGroup,\r
  FieldLegend,\r
  FieldSeparator,\r
  FieldSet,\r
  FieldContent,\r
  FieldTitle,\r
}\r
`,A=`import * as React from "react"\r
import * as LabelPrimitive from "@radix-ui/react-label"\r
import { Slot } from "@radix-ui/react-slot"\r
import {\r
  Controller,\r
  FormProvider,\r
  useFormContext,\r
  type ControllerProps,\r
  type FieldPath,\r
  type FieldValues,\r
} from "react-hook-form"\r
\r
import { cn } from "@/lib/utils"\r
import { Label } from "@/components/ui/label"\r
\r
const Form = FormProvider\r
\r
type FormFieldContextValue<\r
  TFieldValues extends FieldValues = FieldValues,\r
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>\r
> = {\r
  name: TName\r
}\r
\r
const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)\r
\r
const FormField = <\r
  TFieldValues extends FieldValues = FieldValues,\r
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>\r
>({\r
  ...props\r
}: ControllerProps<TFieldValues, TName>) => {\r
  return (\r
    <FormFieldContext.Provider value={{ name: props.name }}>\r
      <Controller {...props} />\r
    </FormFieldContext.Provider>\r
  )\r
}\r
\r
const useFormField = () => {\r
  const fieldContext = React.useContext(FormFieldContext)\r
  const itemContext = React.useContext(FormItemContext)\r
  const { getFieldState, formState } = useFormContext()\r
\r
  if (!fieldContext) {\r
    throw new Error("useFormField should be used within <FormField>")\r
  }\r
\r
  if (!itemContext) {\r
    throw new Error("useFormField should be used within <FormItem>")\r
  }\r
\r
  const fieldState = getFieldState(fieldContext.name, formState)\r
\r
  const { id } = itemContext\r
\r
  return {\r
    id,\r
    name: fieldContext.name,\r
    formItemId: \`\${id}-form-item\`,\r
    formDescriptionId: \`\${id}-form-item-description\`,\r
    formMessageId: \`\${id}-form-item-message\`,\r
    ...fieldState,\r
  }\r
}\r
\r
type FormItemContextValue = {\r
  id: string\r
}\r
\r
const FormItemContext = React.createContext<FormItemContextValue | null>(null)\r
\r
const FormItem = React.forwardRef<\r
  HTMLDivElement,\r
  React.HTMLAttributes<HTMLDivElement>\r
>(({ className, ...props }, ref) => {\r
  const id = React.useId()\r
\r
  return (\r
    <FormItemContext.Provider value={{ id }}>\r
      <div ref={ref} className={cn("space-y-2", className)} {...props} />\r
    </FormItemContext.Provider>\r
  )\r
})\r
FormItem.displayName = "FormItem"\r
\r
const FormLabel = React.forwardRef<\r
  React.ElementRef<typeof LabelPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>\r
>(({ className, ...props }, ref) => {\r
  const { error, formItemId } = useFormField()\r
\r
  return (\r
    <Label\r
      ref={ref}\r
      className={cn(error && "text-destructive", className)}\r
      htmlFor={formItemId}\r
      {...props}\r
    />\r
  )\r
})\r
FormLabel.displayName = "FormLabel"\r
\r
const FormControl = React.forwardRef<\r
  React.ElementRef<typeof Slot>,\r
  React.ComponentPropsWithoutRef<typeof Slot>\r
>(({ ...props }, ref) => {\r
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField()\r
\r
  return (\r
    <Slot\r
      ref={ref}\r
      id={formItemId}\r
      aria-describedby={\r
        !error\r
          ? \`\${formDescriptionId}\`\r
          : \`\${formDescriptionId} \${formMessageId}\`\r
      }\r
      aria-invalid={!!error}\r
      {...props}\r
    />\r
  )\r
})\r
FormControl.displayName = "FormControl"\r
\r
const FormDescription = React.forwardRef<\r
  HTMLParagraphElement,\r
  React.HTMLAttributes<HTMLParagraphElement>\r
>(({ className, ...props }, ref) => {\r
  const { formDescriptionId } = useFormField()\r
\r
  return (\r
    <p\r
      ref={ref}\r
      id={formDescriptionId}\r
      className={cn("text-[0.8rem] text-muted-foreground", className)}\r
      {...props}\r
    />\r
  )\r
})\r
FormDescription.displayName = "FormDescription"\r
\r
const FormMessage = React.forwardRef<\r
  HTMLParagraphElement,\r
  React.HTMLAttributes<HTMLParagraphElement>\r
>(({ className, children, ...props }, ref) => {\r
  const { error, formMessageId } = useFormField()\r
  const body = error ? String(error?.message ?? "") : children\r
\r
  if (!body) {\r
    return null\r
  }\r
\r
  return (\r
    <p\r
      ref={ref}\r
      id={formMessageId}\r
      className={cn("text-[0.8rem] font-medium text-destructive", className)}\r
      {...props}\r
    >\r
      {body}\r
    </p>\r
  )\r
})\r
FormMessage.displayName = "FormMessage"\r
\r
export {\r
  useFormField,\r
  Form,\r
  FormItem,\r
  FormLabel,\r
  FormControl,\r
  FormDescription,\r
  FormMessage,\r
  FormField,\r
}\r
`,M=`import * as React from "react"\r
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"\r
\r
import { cn } from "@/lib/utils"\r
\r
const HoverCard = HoverCardPrimitive.Root\r
\r
const HoverCardTrigger = HoverCardPrimitive.Trigger\r
\r
const HoverCardContent = React.forwardRef<\r
  React.ElementRef<typeof HoverCardPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>\r
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (\r
  <HoverCardPrimitive.Content\r
    ref={ref}\r
    align={align}\r
    sideOffset={sideOffset}\r
    className={cn(\r
      "z-50 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-hover-card-content-transform-origin]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
HoverCardContent.displayName = HoverCardPrimitive.Content.displayName\r
\r
export { HoverCard, HoverCardTrigger, HoverCardContent }\r
`,L=`import * as React from "react"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
import { Button } from "@/components/ui/button"\r
import { Input } from "@/components/ui/input"\r
import { Textarea } from "@/components/ui/textarea"\r
\r
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="input-group"\r
      role="group"\r
      className={cn(\r
        "group/input-group border-input dark:bg-input/30 shadow-xs relative flex w-full items-center rounded-md border outline-none transition-[color,box-shadow]",\r
        "h-9 has-[>textarea]:h-auto",\r
\r
        // Variants based on alignment.\r
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",\r
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",\r
        "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>input]:pb-3",\r
        "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>input]:pt-3",\r
\r
        // Focus state.\r
        "has-[[data-slot=input-group-control]:focus-visible]:ring-ring has-[[data-slot=input-group-control]:focus-visible]:ring-1",\r
\r
        // Error state.\r
        "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",\r
\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const inputGroupAddonVariants = cva(\r
  "text-muted-foreground flex h-auto cursor-text select-none items-center justify-center gap-2 py-1.5 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&>kbd]:rounded-[calc(var(--radius)-5px)] [&>svg:not([class*='size-'])]:size-4",\r
  {\r
    variants: {\r
      align: {\r
        "inline-start":\r
          "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",\r
        "inline-end":\r
          "order-last pr-3 has-[>button]:mr-[-0.4rem] has-[>kbd]:mr-[-0.35rem]",\r
        "block-start":\r
          "[.border-b]:pb-3 order-first w-full justify-start px-3 pt-3 group-has-[>input]/input-group:pt-2.5",\r
        "block-end":\r
          "[.border-t]:pt-3 order-last w-full justify-start px-3 pb-3 group-has-[>input]/input-group:pb-2.5",\r
      },\r
    },\r
    defaultVariants: {\r
      align: "inline-start",\r
    },\r
  }\r
)\r
\r
function InputGroupAddon({\r
  className,\r
  align = "inline-start",\r
  ...props\r
}: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {\r
  return (\r
    <div\r
      role="group"\r
      data-slot="input-group-addon"\r
      data-align={align}\r
      className={cn(inputGroupAddonVariants({ align }), className)}\r
      onClick={(e) => {\r
        if ((e.target as HTMLElement).closest("button")) {\r
          return\r
        }\r
        e.currentTarget.parentElement?.querySelector("input")?.focus()\r
      }}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const inputGroupButtonVariants = cva(\r
  "flex items-center gap-2 text-sm shadow-none",\r
  {\r
    variants: {\r
      size: {\r
        xs: "h-6 gap-1 rounded-[calc(var(--radius)-5px)] px-2 has-[>svg]:px-2 [&>svg:not([class*='size-'])]:size-3.5",\r
        sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",\r
        "icon-xs":\r
          "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",\r
        "icon-sm": "size-8 p-0 has-[>svg]:p-0",\r
      },\r
    },\r
    defaultVariants: {\r
      size: "xs",\r
    },\r
  }\r
)\r
\r
function InputGroupButton({\r
  className,\r
  type = "button",\r
  variant = "ghost",\r
  size = "xs",\r
  ...props\r
}: Omit<React.ComponentProps<typeof Button>, "size"> &\r
  VariantProps<typeof inputGroupButtonVariants>) {\r
  return (\r
    <Button\r
      type={type}\r
      data-size={size}\r
      variant={variant}\r
      className={cn(inputGroupButtonVariants({ size }), className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function InputGroupText({ className, ...props }: React.ComponentProps<"span">) {\r
  return (\r
    <span\r
      className={cn(\r
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function InputGroupInput({\r
  className,\r
  ...props\r
}: React.ComponentProps<"input">) {\r
  return (\r
    <Input\r
      data-slot="input-group-control"\r
      className={cn(\r
        "flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function InputGroupTextarea({\r
  className,\r
  ...props\r
}: React.ComponentProps<"textarea">) {\r
  return (\r
    <Textarea\r
      data-slot="input-group-control"\r
      className={cn(\r
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export {\r
  InputGroup,\r
  InputGroupAddon,\r
  InputGroupButton,\r
  InputGroupText,\r
  InputGroupInput,\r
  InputGroupTextarea,\r
}\r
`,_=`import * as React from "react"\r
import { OTPInput, OTPInputContext } from "input-otp"\r
import { Minus } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const InputOTP = React.forwardRef<\r
  React.ElementRef<typeof OTPInput>,\r
  React.ComponentPropsWithoutRef<typeof OTPInput>\r
>(({ className, containerClassName, ...props }, ref) => (\r
  <OTPInput\r
    ref={ref}\r
    containerClassName={cn(\r
      "flex items-center gap-2 has-[:disabled]:opacity-50",\r
      containerClassName\r
    )}\r
    className={cn("disabled:cursor-not-allowed", className)}\r
    {...props}\r
  />\r
))\r
InputOTP.displayName = "InputOTP"\r
\r
const InputOTPGroup = React.forwardRef<\r
  React.ElementRef<"div">,\r
  React.ComponentPropsWithoutRef<"div">\r
>(({ className, ...props }, ref) => (\r
  <div ref={ref} className={cn("flex items-center", className)} {...props} />\r
))\r
InputOTPGroup.displayName = "InputOTPGroup"\r
\r
const InputOTPSlot = React.forwardRef<\r
  React.ElementRef<"div">,\r
  React.ComponentPropsWithoutRef<"div"> & { index: number }\r
>(({ index, className, ...props }, ref) => {\r
  const inputOTPContext = React.useContext(OTPInputContext)\r
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index]\r
\r
  return (\r
    <div\r
      ref={ref}\r
      className={cn(\r
        "relative flex h-9 w-9 items-center justify-center border-y border-r border-input text-sm shadow-sm transition-all first:rounded-l-md first:border-l last:rounded-r-md",\r
        isActive && "z-10 ring-1 ring-ring",\r
        className\r
      )}\r
      {...props}\r
    >\r
      {char}\r
      {hasFakeCaret && (\r
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">\r
          <div className="h-4 w-px animate-caret-blink bg-foreground duration-1000" />\r
        </div>\r
      )}\r
    </div>\r
  )\r
})\r
InputOTPSlot.displayName = "InputOTPSlot"\r
\r
const InputOTPSeparator = React.forwardRef<\r
  React.ElementRef<"div">,\r
  React.ComponentPropsWithoutRef<"div">\r
>(({ ...props }, ref) => (\r
  <div ref={ref} role="separator" {...props}>\r
    <Minus />\r
  </div>\r
))\r
InputOTPSeparator.displayName = "InputOTPSeparator"\r
\r
export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }\r
`,I=`import * as React from "react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(\r
  ({ className, type, ...props }, ref) => {\r
    return (\r
      <input\r
        type={type}\r
        className={cn(\r
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",\r
          className\r
        )}\r
        ref={ref}\r
        {...props}\r
      />\r
    )\r
  }\r
)\r
Input.displayName = "Input"\r
\r
export { Input }\r
`,E=`import * as React from "react"\r
import { Slot } from "@radix-ui/react-slot"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
import { Separator } from "@/components/ui/separator"\r
\r
function ItemGroup({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      role="list"\r
      data-slot="item-group"\r
      className={cn("group/item-group flex flex-col", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemSeparator({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof Separator>) {\r
  return (\r
    <Separator\r
      data-slot="item-separator"\r
      orientation="horizontal"\r
      className={cn("my-0", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const itemVariants = cva(\r
  "group/item [a]:hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-ring/50 [a]:transition-colors flex flex-wrap items-center rounded-md border border-transparent text-sm outline-none transition-colors duration-100 focus-visible:ring-[3px]",\r
  {\r
    variants: {\r
      variant: {\r
        default: "bg-transparent",\r
        outline: "border-border",\r
        muted: "bg-muted/50",\r
      },\r
      size: {\r
        default: "gap-4 p-4 ",\r
        sm: "gap-2.5 px-4 py-3",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
      size: "default",\r
    },\r
  }\r
)\r
\r
function Item({\r
  className,\r
  variant = "default",\r
  size = "default",\r
  asChild = false,\r
  ...props\r
}: React.ComponentProps<"div"> &\r
  VariantProps<typeof itemVariants> & { asChild?: boolean }) {\r
  const Comp = asChild ? Slot : "div"\r
  return (\r
    <Comp\r
      data-slot="item"\r
      data-variant={variant}\r
      data-size={size}\r
      className={cn(itemVariants({ variant, size, className }))}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const itemMediaVariants = cva(\r
  "flex shrink-0 items-center justify-center gap-2 group-has-[[data-slot=item-description]]/item:translate-y-0.5 group-has-[[data-slot=item-description]]/item:self-start [&_svg]:pointer-events-none",\r
  {\r
    variants: {\r
      variant: {\r
        default: "bg-transparent",\r
        icon: "bg-muted size-8 rounded-sm border [&_svg:not([class*='size-'])]:size-4",\r
        image:\r
          "size-10 overflow-hidden rounded-sm [&_img]:size-full [&_img]:object-cover",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
    },\r
  }\r
)\r
\r
function ItemMedia({\r
  className,\r
  variant = "default",\r
  ...props\r
}: React.ComponentProps<"div"> & VariantProps<typeof itemMediaVariants>) {\r
  return (\r
    <div\r
      data-slot="item-media"\r
      data-variant={variant}\r
      className={cn(itemMediaVariants({ variant, className }))}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemContent({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="item-content"\r
      className={cn(\r
        "flex flex-1 flex-col gap-1 [&+[data-slot=item-content]]:flex-none",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemTitle({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="item-title"\r
      className={cn(\r
        "flex w-fit items-center gap-2 text-sm font-medium leading-snug",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemDescription({ className, ...props }: React.ComponentProps<"p">) {\r
  return (\r
    <p\r
      data-slot="item-description"\r
      className={cn(\r
        "text-muted-foreground line-clamp-2 text-balance text-sm font-normal leading-normal",\r
        "[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemActions({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="item-actions"\r
      className={cn("flex items-center gap-2", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemHeader({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="item-header"\r
      className={cn(\r
        "flex basis-full items-center justify-between gap-2",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function ItemFooter({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="item-footer"\r
      className={cn(\r
        "flex basis-full items-center justify-between gap-2",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export {\r
  Item,\r
  ItemMedia,\r
  ItemContent,\r
  ItemActions,\r
  ItemGroup,\r
  ItemSeparator,\r
  ItemTitle,\r
  ItemDescription,\r
  ItemHeader,\r
  ItemFooter,\r
}\r
`,B=`import { cn } from "@/lib/utils"\r
\r
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {\r
  return (\r
    <kbd\r
      data-slot="kbd"\r
      className={cn(\r
        "bg-muted text-muted-foreground pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded-sm px-1 font-sans text-xs font-medium",\r
        "[&_svg:not([class*='size-'])]:size-3",\r
        "[[data-slot=tooltip-content]_&]:bg-background/20 [[data-slot=tooltip-content]_&]:text-background dark:[[data-slot=tooltip-content]_&]:bg-background/10",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <kbd\r
      data-slot="kbd-group"\r
      className={cn("inline-flex items-center gap-1", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export { Kbd, KbdGroup }\r
`,H=`"use client"\r
\r
import * as React from "react"\r
import * as LabelPrimitive from "@radix-ui/react-label"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
\r
const labelVariants = cva(\r
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"\r
)\r
\r
const Label = React.forwardRef<\r
  React.ElementRef<typeof LabelPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &\r
    VariantProps<typeof labelVariants>\r
>(({ className, ...props }, ref) => (\r
  <LabelPrimitive.Root\r
    ref={ref}\r
    className={cn(labelVariants(), className)}\r
    {...props}\r
  />\r
))\r
Label.displayName = LabelPrimitive.Root.displayName\r
\r
export { Label }\r
`,z=`import * as React from "react"\r
import * as MenubarPrimitive from "@radix-ui/react-menubar"\r
import { Check, ChevronRight, Circle } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
function MenubarMenu({\r
  ...props\r
}: React.ComponentProps<typeof MenubarPrimitive.Menu>) {\r
  return <MenubarPrimitive.Menu {...props} />\r
}\r
\r
function MenubarGroup({\r
  ...props\r
}: React.ComponentProps<typeof MenubarPrimitive.Group>) {\r
  return <MenubarPrimitive.Group {...props} />\r
}\r
\r
function MenubarPortal({\r
  ...props\r
}: React.ComponentProps<typeof MenubarPrimitive.Portal>) {\r
  return <MenubarPrimitive.Portal {...props} />\r
}\r
\r
function MenubarRadioGroup({\r
  ...props\r
}: React.ComponentProps<typeof MenubarPrimitive.RadioGroup>) {\r
  return <MenubarPrimitive.RadioGroup {...props} />\r
}\r
\r
function MenubarSub({\r
  ...props\r
}: React.ComponentProps<typeof MenubarPrimitive.Sub>) {\r
  return <MenubarPrimitive.Sub data-slot="menubar-sub" {...props} />\r
}\r
\r
const Menubar = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Root>\r
>(({ className, ...props }, ref) => (\r
  <MenubarPrimitive.Root\r
    ref={ref}\r
    className={cn(\r
      "flex h-9 items-center space-x-1 rounded-md border bg-background p-1 shadow-sm",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
Menubar.displayName = MenubarPrimitive.Root.displayName\r
\r
const MenubarTrigger = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.Trigger>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Trigger>\r
>(({ className, ...props }, ref) => (\r
  <MenubarPrimitive.Trigger\r
    ref={ref}\r
    className={cn(\r
      "flex cursor-default select-none items-center rounded-sm px-3 py-1 text-sm font-medium outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
MenubarTrigger.displayName = MenubarPrimitive.Trigger.displayName\r
\r
const MenubarSubTrigger = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.SubTrigger>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubTrigger> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, children, ...props }, ref) => (\r
  <MenubarPrimitive.SubTrigger\r
    ref={ref}\r
    className={cn(\r
      "flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  >\r
    {children}\r
    <ChevronRight className="ml-auto h-4 w-4" />\r
  </MenubarPrimitive.SubTrigger>\r
))\r
MenubarSubTrigger.displayName = MenubarPrimitive.SubTrigger.displayName\r
\r
const MenubarSubContent = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.SubContent>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.SubContent>\r
>(({ className, ...props }, ref) => (\r
  <MenubarPrimitive.SubContent\r
    ref={ref}\r
    className={cn(\r
      "z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
MenubarSubContent.displayName = MenubarPrimitive.SubContent.displayName\r
\r
const MenubarContent = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Content>\r
>(\r
  (\r
    { className, align = "start", alignOffset = -4, sideOffset = 8, ...props },\r
    ref\r
  ) => (\r
    <MenubarPrimitive.Portal>\r
      <MenubarPrimitive.Content\r
        ref={ref}\r
        align={align}\r
        alignOffset={alignOffset}\r
        sideOffset={sideOffset}\r
        className={cn(\r
          "z-50 min-w-[12rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-menubar-content-transform-origin]",\r
          className\r
        )}\r
        {...props}\r
      />\r
    </MenubarPrimitive.Portal>\r
  )\r
)\r
MenubarContent.displayName = MenubarPrimitive.Content.displayName\r
\r
const MenubarItem = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Item> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, ...props }, ref) => (\r
  <MenubarPrimitive.Item\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
MenubarItem.displayName = MenubarPrimitive.Item.displayName\r
\r
const MenubarCheckboxItem = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.CheckboxItem>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.CheckboxItem>\r
>(({ className, children, checked, ...props }, ref) => (\r
  <MenubarPrimitive.CheckboxItem\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    checked={checked}\r
    {...props}\r
  >\r
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <MenubarPrimitive.ItemIndicator>\r
        <Check className="h-4 w-4" />\r
      </MenubarPrimitive.ItemIndicator>\r
    </span>\r
    {children}\r
  </MenubarPrimitive.CheckboxItem>\r
))\r
MenubarCheckboxItem.displayName = MenubarPrimitive.CheckboxItem.displayName\r
\r
const MenubarRadioItem = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.RadioItem>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.RadioItem>\r
>(({ className, children, ...props }, ref) => (\r
  <MenubarPrimitive.RadioItem\r
    ref={ref}\r
    className={cn(\r
      "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <MenubarPrimitive.ItemIndicator>\r
        <Circle className="h-4 w-4 fill-current" />\r
      </MenubarPrimitive.ItemIndicator>\r
    </span>\r
    {children}\r
  </MenubarPrimitive.RadioItem>\r
))\r
MenubarRadioItem.displayName = MenubarPrimitive.RadioItem.displayName\r
\r
const MenubarLabel = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.Label>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Label> & {\r
    inset?: boolean\r
  }\r
>(({ className, inset, ...props }, ref) => (\r
  <MenubarPrimitive.Label\r
    ref={ref}\r
    className={cn(\r
      "px-2 py-1.5 text-sm font-semibold",\r
      inset && "pl-8",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
MenubarLabel.displayName = MenubarPrimitive.Label.displayName\r
\r
const MenubarSeparator = React.forwardRef<\r
  React.ElementRef<typeof MenubarPrimitive.Separator>,\r
  React.ComponentPropsWithoutRef<typeof MenubarPrimitive.Separator>\r
>(({ className, ...props }, ref) => (\r
  <MenubarPrimitive.Separator\r
    ref={ref}\r
    className={cn("-mx-1 my-1 h-px bg-muted", className)}\r
    {...props}\r
  />\r
))\r
MenubarSeparator.displayName = MenubarPrimitive.Separator.displayName\r
\r
const MenubarShortcut = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLSpanElement>) => {\r
  return (\r
    <span\r
      className={cn(\r
        "ml-auto text-xs tracking-widest text-muted-foreground",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
MenubarShortcut.displayname = "MenubarShortcut"\r
\r
export {\r
  Menubar,\r
  MenubarMenu,\r
  MenubarTrigger,\r
  MenubarContent,\r
  MenubarItem,\r
  MenubarSeparator,\r
  MenubarLabel,\r
  MenubarCheckboxItem,\r
  MenubarRadioGroup,\r
  MenubarRadioItem,\r
  MenubarPortal,\r
  MenubarSubContent,\r
  MenubarSubTrigger,\r
  MenubarGroup,\r
  MenubarSub,\r
  MenubarShortcut,\r
}\r
`,j=`import * as React from "react"\r
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"\r
import { cva } from "class-variance-authority"\r
import { ChevronDown } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const NavigationMenu = React.forwardRef<\r
  React.ElementRef<typeof NavigationMenuPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>\r
>(({ className, children, ...props }, ref) => (\r
  <NavigationMenuPrimitive.Root\r
    ref={ref}\r
    className={cn(\r
      "relative z-10 flex max-w-max flex-1 items-center justify-center",\r
      className\r
    )}\r
    {...props}\r
  >\r
    {children}\r
    <NavigationMenuViewport />\r
  </NavigationMenuPrimitive.Root>\r
))\r
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName\r
\r
const NavigationMenuList = React.forwardRef<\r
  React.ElementRef<typeof NavigationMenuPrimitive.List>,\r
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>\r
>(({ className, ...props }, ref) => (\r
  <NavigationMenuPrimitive.List\r
    ref={ref}\r
    className={cn(\r
      "group flex flex-1 list-none items-center justify-center space-x-1",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName\r
\r
const NavigationMenuItem = NavigationMenuPrimitive.Item\r
\r
const navigationMenuTriggerStyle = cva(\r
  "group inline-flex h-9 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=open]:text-accent-foreground data-[state=open]:bg-accent/50 data-[state=open]:hover:bg-accent data-[state=open]:focus:bg-accent"\r
)\r
\r
const NavigationMenuTrigger = React.forwardRef<\r
  React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,\r
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>\r
>(({ className, children, ...props }, ref) => (\r
  <NavigationMenuPrimitive.Trigger\r
    ref={ref}\r
    className={cn(navigationMenuTriggerStyle(), "group", className)}\r
    {...props}\r
  >\r
    {children}{" "}\r
    <ChevronDown\r
      className="relative top-[1px] ml-1 h-3 w-3 transition duration-300 group-data-[state=open]:rotate-180"\r
      aria-hidden="true"\r
    />\r
  </NavigationMenuPrimitive.Trigger>\r
))\r
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName\r
\r
const NavigationMenuContent = React.forwardRef<\r
  React.ElementRef<typeof NavigationMenuPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>\r
>(({ className, ...props }, ref) => (\r
  <NavigationMenuPrimitive.Content\r
    ref={ref}\r
    className={cn(\r
      "left-0 top-0 w-full data-[motion^=from-]:animate-in data-[motion^=to-]:animate-out data-[motion^=from-]:fade-in data-[motion^=to-]:fade-out data-[motion=from-end]:slide-in-from-right-52 data-[motion=from-start]:slide-in-from-left-52 data-[motion=to-end]:slide-out-to-right-52 data-[motion=to-start]:slide-out-to-left-52 md:absolute md:w-auto ",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName\r
\r
const NavigationMenuLink = NavigationMenuPrimitive.Link\r
\r
const NavigationMenuViewport = React.forwardRef<\r
  React.ElementRef<typeof NavigationMenuPrimitive.Viewport>,\r
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Viewport>\r
>(({ className, ...props }, ref) => (\r
  <div className={cn("absolute left-0 top-full flex justify-center")}>\r
    <NavigationMenuPrimitive.Viewport\r
      className={cn(\r
        "origin-top-center relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-90 md:w-[var(--radix-navigation-menu-viewport-width)]",\r
        className\r
      )}\r
      ref={ref}\r
      {...props}\r
    />\r
  </div>\r
))\r
NavigationMenuViewport.displayName =\r
  NavigationMenuPrimitive.Viewport.displayName\r
\r
const NavigationMenuIndicator = React.forwardRef<\r
  React.ElementRef<typeof NavigationMenuPrimitive.Indicator>,\r
  React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Indicator>\r
>(({ className, ...props }, ref) => (\r
  <NavigationMenuPrimitive.Indicator\r
    ref={ref}\r
    className={cn(\r
      "top-full z-[1] flex h-1.5 items-end justify-center overflow-hidden data-[state=visible]:animate-in data-[state=hidden]:animate-out data-[state=hidden]:fade-out data-[state=visible]:fade-in",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <div className="relative top-[60%] h-2 w-2 rotate-45 rounded-tl-sm bg-border shadow-md" />\r
  </NavigationMenuPrimitive.Indicator>\r
))\r
NavigationMenuIndicator.displayName =\r
  NavigationMenuPrimitive.Indicator.displayName\r
\r
export {\r
  navigationMenuTriggerStyle,\r
  NavigationMenu,\r
  NavigationMenuList,\r
  NavigationMenuItem,\r
  NavigationMenuContent,\r
  NavigationMenuTrigger,\r
  NavigationMenuLink,\r
  NavigationMenuIndicator,\r
  NavigationMenuViewport,\r
}\r
`,K=`import * as React from "react"\r
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
import { ButtonProps, buttonVariants } from "@/components/ui/button"\r
\r
const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (\r
  <nav\r
    role="navigation"\r
    aria-label="pagination"\r
    className={cn("mx-auto flex w-full justify-center", className)}\r
    {...props}\r
  />\r
)\r
Pagination.displayName = "Pagination"\r
\r
const PaginationContent = React.forwardRef<\r
  HTMLUListElement,\r
  React.ComponentProps<"ul">\r
>(({ className, ...props }, ref) => (\r
  <ul\r
    ref={ref}\r
    className={cn("flex flex-row items-center gap-1", className)}\r
    {...props}\r
  />\r
))\r
PaginationContent.displayName = "PaginationContent"\r
\r
const PaginationItem = React.forwardRef<\r
  HTMLLIElement,\r
  React.ComponentProps<"li">\r
>(({ className, ...props }, ref) => (\r
  <li ref={ref} className={cn("", className)} {...props} />\r
))\r
PaginationItem.displayName = "PaginationItem"\r
\r
type PaginationLinkProps = {\r
  isActive?: boolean\r
} & Pick<ButtonProps, "size"> &\r
  React.ComponentProps<"a">\r
\r
const PaginationLink = ({\r
  className,\r
  isActive,\r
  size = "icon",\r
  ...props\r
}: PaginationLinkProps) => (\r
  <a\r
    aria-current={isActive ? "page" : undefined}\r
    className={cn(\r
      buttonVariants({\r
        variant: isActive ? "outline" : "ghost",\r
        size,\r
      }),\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
PaginationLink.displayName = "PaginationLink"\r
\r
const PaginationPrevious = ({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof PaginationLink>) => (\r
  <PaginationLink\r
    aria-label="Go to previous page"\r
    size="default"\r
    className={cn("gap-1 pl-2.5", className)}\r
    {...props}\r
  >\r
    <ChevronLeft className="h-4 w-4" />\r
    <span>Previous</span>\r
  </PaginationLink>\r
)\r
PaginationPrevious.displayName = "PaginationPrevious"\r
\r
const PaginationNext = ({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof PaginationLink>) => (\r
  <PaginationLink\r
    aria-label="Go to next page"\r
    size="default"\r
    className={cn("gap-1 pr-2.5", className)}\r
    {...props}\r
  >\r
    <span>Next</span>\r
    <ChevronRight className="h-4 w-4" />\r
  </PaginationLink>\r
)\r
PaginationNext.displayName = "PaginationNext"\r
\r
const PaginationEllipsis = ({\r
  className,\r
  ...props\r
}: React.ComponentProps<"span">) => (\r
  <span\r
    aria-hidden\r
    className={cn("flex h-9 w-9 items-center justify-center", className)}\r
    {...props}\r
  >\r
    <MoreHorizontal className="h-4 w-4" />\r
    <span className="sr-only">More pages</span>\r
  </span>\r
)\r
PaginationEllipsis.displayName = "PaginationEllipsis"\r
\r
export {\r
  Pagination,\r
  PaginationContent,\r
  PaginationLink,\r
  PaginationItem,\r
  PaginationPrevious,\r
  PaginationNext,\r
  PaginationEllipsis,\r
}\r
`,O=`import * as React from "react"\r
import * as PopoverPrimitive from "@radix-ui/react-popover"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Popover = PopoverPrimitive.Root\r
\r
const PopoverTrigger = PopoverPrimitive.Trigger\r
\r
const PopoverAnchor = PopoverPrimitive.Anchor\r
\r
const PopoverContent = React.forwardRef<\r
  React.ElementRef<typeof PopoverPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>\r
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => (\r
  <PopoverPrimitive.Portal>\r
    <PopoverPrimitive.Content\r
      ref={ref}\r
      align={align}\r
      sideOffset={sideOffset}\r
      className={cn(\r
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]",\r
        className\r
      )}\r
      {...props}\r
    />\r
  </PopoverPrimitive.Portal>\r
))\r
PopoverContent.displayName = PopoverPrimitive.Content.displayName\r
\r
export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }\r
`,F=`"use client"\r
\r
import * as React from "react"\r
import * as ProgressPrimitive from "@radix-ui/react-progress"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Progress = React.forwardRef<\r
  React.ElementRef<typeof ProgressPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>\r
>(({ className, value, ...props }, ref) => (\r
  <ProgressPrimitive.Root\r
    ref={ref}\r
    className={cn(\r
      "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <ProgressPrimitive.Indicator\r
      className="h-full w-full flex-1 bg-primary transition-all"\r
      style={{ transform: \`translateX(-\${100 - (value || 0)}%)\` }}\r
    />\r
  </ProgressPrimitive.Root>\r
))\r
Progress.displayName = ProgressPrimitive.Root.displayName\r
\r
export { Progress }\r
`,U=`import * as React from "react"\r
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group"\r
import { Circle } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const RadioGroup = React.forwardRef<\r
  React.ElementRef<typeof RadioGroupPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>\r
>(({ className, ...props }, ref) => {\r
  return (\r
    <RadioGroupPrimitive.Root\r
      className={cn("grid gap-2", className)}\r
      {...props}\r
      ref={ref}\r
    />\r
  )\r
})\r
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName\r
\r
const RadioGroupItem = React.forwardRef<\r
  React.ElementRef<typeof RadioGroupPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>\r
>(({ className, ...props }, ref) => {\r
  return (\r
    <RadioGroupPrimitive.Item\r
      ref={ref}\r
      className={cn(\r
        "aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",\r
        className\r
      )}\r
      {...props}\r
    >\r
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">\r
        <Circle className="h-3.5 w-3.5 fill-primary" />\r
      </RadioGroupPrimitive.Indicator>\r
    </RadioGroupPrimitive.Item>\r
  )\r
})\r
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName\r
\r
export { RadioGroup, RadioGroupItem }\r
`,G=`"use client"\r
\r
import { GripVertical } from "lucide-react"\r
import * as ResizablePrimitive from "react-resizable-panels"\r
\r
import { cn } from "@/lib/utils"\r
\r
const ResizablePanelGroup = ({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (\r
  <ResizablePrimitive.PanelGroup\r
    className={cn(\r
      "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
\r
const ResizablePanel = ResizablePrimitive.Panel\r
\r
const ResizableHandle = ({\r
  withHandle,\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {\r
  withHandle?: boolean\r
}) => (\r
  <ResizablePrimitive.PanelResizeHandle\r
    className={cn(\r
      "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",\r
      className\r
    )}\r
    {...props}\r
  >\r
    {withHandle && (\r
      <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">\r
        <GripVertical className="h-2.5 w-2.5" />\r
      </div>\r
    )}\r
  </ResizablePrimitive.PanelResizeHandle>\r
)\r
\r
export { ResizablePanelGroup, ResizablePanel, ResizableHandle }\r
`,W=`import * as React from "react"\r
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"\r
\r
import { cn } from "@/lib/utils"\r
\r
const ScrollArea = React.forwardRef<\r
  React.ElementRef<typeof ScrollAreaPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root>\r
>(({ className, children, ...props }, ref) => (\r
  <ScrollAreaPrimitive.Root\r
    ref={ref}\r
    className={cn("relative overflow-hidden", className)}\r
    {...props}\r
  >\r
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">\r
      {children}\r
    </ScrollAreaPrimitive.Viewport>\r
    <ScrollBar />\r
    <ScrollAreaPrimitive.Corner />\r
  </ScrollAreaPrimitive.Root>\r
))\r
ScrollArea.displayName = ScrollAreaPrimitive.Root.displayName\r
\r
const ScrollBar = React.forwardRef<\r
  React.ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,\r
  React.ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>\r
>(({ className, orientation = "vertical", ...props }, ref) => (\r
  <ScrollAreaPrimitive.ScrollAreaScrollbar\r
    ref={ref}\r
    orientation={orientation}\r
    className={cn(\r
      "flex touch-none select-none transition-colors",\r
      orientation === "vertical" &&\r
        "h-full w-2.5 border-l border-l-transparent p-[1px]",\r
      orientation === "horizontal" &&\r
        "h-2.5 flex-col border-t border-t-transparent p-[1px]",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-border" />\r
  </ScrollAreaPrimitive.ScrollAreaScrollbar>\r
))\r
ScrollBar.displayName = ScrollAreaPrimitive.ScrollAreaScrollbar.displayName\r
\r
export { ScrollArea, ScrollBar }\r
`,$=`"use client"\r
\r
import * as React from "react"\r
import * as SelectPrimitive from "@radix-ui/react-select"\r
import { Check, ChevronDown, ChevronUp } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Select = SelectPrimitive.Root\r
\r
const SelectGroup = SelectPrimitive.Group\r
\r
const SelectValue = SelectPrimitive.Value\r
\r
const SelectTrigger = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.Trigger>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>\r
>(({ className, children, ...props }, ref) => (\r
  <SelectPrimitive.Trigger\r
    ref={ref}\r
    className={cn(\r
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",\r
      className\r
    )}\r
    {...props}\r
  >\r
    {children}\r
    <SelectPrimitive.Icon asChild>\r
      <ChevronDown className="h-4 w-4 opacity-50" />\r
    </SelectPrimitive.Icon>\r
  </SelectPrimitive.Trigger>\r
))\r
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName\r
\r
const SelectScrollUpButton = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>\r
>(({ className, ...props }, ref) => (\r
  <SelectPrimitive.ScrollUpButton\r
    ref={ref}\r
    className={cn(\r
      "flex cursor-default items-center justify-center py-1",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <ChevronUp className="h-4 w-4" />\r
  </SelectPrimitive.ScrollUpButton>\r
))\r
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName\r
\r
const SelectScrollDownButton = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>\r
>(({ className, ...props }, ref) => (\r
  <SelectPrimitive.ScrollDownButton\r
    ref={ref}\r
    className={cn(\r
      "flex cursor-default items-center justify-center py-1",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <ChevronDown className="h-4 w-4" />\r
  </SelectPrimitive.ScrollDownButton>\r
))\r
SelectScrollDownButton.displayName =\r
  SelectPrimitive.ScrollDownButton.displayName\r
\r
const SelectContent = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>\r
>(({ className, children, position = "popper", ...props }, ref) => (\r
  <SelectPrimitive.Portal>\r
    <SelectPrimitive.Content\r
      ref={ref}\r
      className={cn(\r
        "relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]",\r
        position === "popper" &&\r
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",\r
        className\r
      )}\r
      position={position}\r
      {...props}\r
    >\r
      <SelectScrollUpButton />\r
      <SelectPrimitive.Viewport\r
        className={cn(\r
          "p-1",\r
          position === "popper" &&\r
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"\r
        )}\r
      >\r
        {children}\r
      </SelectPrimitive.Viewport>\r
      <SelectScrollDownButton />\r
    </SelectPrimitive.Content>\r
  </SelectPrimitive.Portal>\r
))\r
SelectContent.displayName = SelectPrimitive.Content.displayName\r
\r
const SelectLabel = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.Label>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>\r
>(({ className, ...props }, ref) => (\r
  <SelectPrimitive.Label\r
    ref={ref}\r
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}\r
    {...props}\r
  />\r
))\r
SelectLabel.displayName = SelectPrimitive.Label.displayName\r
\r
const SelectItem = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>\r
>(({ className, children, ...props }, ref) => (\r
  <SelectPrimitive.Item\r
    ref={ref}\r
    className={cn(\r
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">\r
      <SelectPrimitive.ItemIndicator>\r
        <Check className="h-4 w-4" />\r
      </SelectPrimitive.ItemIndicator>\r
    </span>\r
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>\r
  </SelectPrimitive.Item>\r
))\r
SelectItem.displayName = SelectPrimitive.Item.displayName\r
\r
const SelectSeparator = React.forwardRef<\r
  React.ElementRef<typeof SelectPrimitive.Separator>,\r
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>\r
>(({ className, ...props }, ref) => (\r
  <SelectPrimitive.Separator\r
    ref={ref}\r
    className={cn("-mx-1 my-1 h-px bg-muted", className)}\r
    {...props}\r
  />\r
))\r
SelectSeparator.displayName = SelectPrimitive.Separator.displayName\r
\r
export {\r
  Select,\r
  SelectGroup,\r
  SelectValue,\r
  SelectTrigger,\r
  SelectContent,\r
  SelectLabel,\r
  SelectItem,\r
  SelectSeparator,\r
  SelectScrollUpButton,\r
  SelectScrollDownButton,\r
}\r
`,V=`import * as React from "react"\r
import * as SeparatorPrimitive from "@radix-ui/react-separator"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Separator = React.forwardRef<\r
  React.ElementRef<typeof SeparatorPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>\r
>(\r
  (\r
    { className, orientation = "horizontal", decorative = true, ...props },\r
    ref\r
  ) => (\r
    <SeparatorPrimitive.Root\r
      ref={ref}\r
      decorative={decorative}\r
      orientation={orientation}\r
      className={cn(\r
        "shrink-0 bg-border",\r
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
)\r
Separator.displayName = SeparatorPrimitive.Root.displayName\r
\r
export { Separator }\r
`,X=`"use client"\r
\r
import * as React from "react"\r
import * as SheetPrimitive from "@radix-ui/react-dialog"\r
import { cva, type VariantProps } from "class-variance-authority"\r
import { X } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Sheet = SheetPrimitive.Root\r
\r
const SheetTrigger = SheetPrimitive.Trigger\r
\r
const SheetClose = SheetPrimitive.Close\r
\r
const SheetPortal = SheetPrimitive.Portal\r
\r
const SheetOverlay = React.forwardRef<\r
  React.ElementRef<typeof SheetPrimitive.Overlay>,\r
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>\r
>(({ className, ...props }, ref) => (\r
  <SheetPrimitive.Overlay\r
    className={cn(\r
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",\r
      className\r
    )}\r
    {...props}\r
    ref={ref}\r
  />\r
))\r
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName\r
\r
const sheetVariants = cva(\r
  "fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out",\r
  {\r
    variants: {\r
      side: {\r
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",\r
        bottom:\r
          "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",\r
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",\r
        right:\r
          "inset-y-0 right-0 h-full w-3/4 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",\r
      },\r
    },\r
    defaultVariants: {\r
      side: "right",\r
    },\r
  }\r
)\r
\r
interface SheetContentProps\r
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,\r
    VariantProps<typeof sheetVariants> {}\r
\r
const SheetContent = React.forwardRef<\r
  React.ElementRef<typeof SheetPrimitive.Content>,\r
  SheetContentProps\r
>(({ side = "right", className, children, ...props }, ref) => (\r
  <SheetPortal>\r
    <SheetOverlay />\r
    <SheetPrimitive.Content\r
      ref={ref}\r
      className={cn(sheetVariants({ side }), className)}\r
      {...props}\r
    >\r
      <SheetPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">\r
        <X className="h-4 w-4" />\r
        <span className="sr-only">Close</span>\r
      </SheetPrimitive.Close>\r
      {children}\r
    </SheetPrimitive.Content>\r
  </SheetPortal>\r
))\r
SheetContent.displayName = SheetPrimitive.Content.displayName\r
\r
const SheetHeader = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn(\r
      "flex flex-col space-y-2 text-center sm:text-left",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
SheetHeader.displayName = "SheetHeader"\r
\r
const SheetFooter = ({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) => (\r
  <div\r
    className={cn(\r
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",\r
      className\r
    )}\r
    {...props}\r
  />\r
)\r
SheetFooter.displayName = "SheetFooter"\r
\r
const SheetTitle = React.forwardRef<\r
  React.ElementRef<typeof SheetPrimitive.Title>,\r
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>\r
>(({ className, ...props }, ref) => (\r
  <SheetPrimitive.Title\r
    ref={ref}\r
    className={cn("text-lg font-semibold text-foreground", className)}\r
    {...props}\r
  />\r
))\r
SheetTitle.displayName = SheetPrimitive.Title.displayName\r
\r
const SheetDescription = React.forwardRef<\r
  React.ElementRef<typeof SheetPrimitive.Description>,\r
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>\r
>(({ className, ...props }, ref) => (\r
  <SheetPrimitive.Description\r
    ref={ref}\r
    className={cn("text-sm text-muted-foreground", className)}\r
    {...props}\r
  />\r
))\r
SheetDescription.displayName = SheetPrimitive.Description.displayName\r
\r
export {\r
  Sheet,\r
  SheetPortal,\r
  SheetOverlay,\r
  SheetTrigger,\r
  SheetClose,\r
  SheetContent,\r
  SheetHeader,\r
  SheetFooter,\r
  SheetTitle,\r
  SheetDescription,\r
}\r
`,q=`"use client"\r
\r
import * as React from "react"\r
import { Slot } from "@radix-ui/react-slot"\r
import { cva, VariantProps } from "class-variance-authority"\r
import { PanelLeftIcon } from "lucide-react"\r
\r
import { useIsMobile } from "@/hooks/use-mobile"\r
import { cn } from "@/lib/utils"\r
import { Button } from "@/components/ui/button"\r
import { Input } from "@/components/ui/input"\r
import { Separator } from "@/components/ui/separator"\r
import {\r
  Sheet,\r
  SheetContent,\r
  SheetDescription,\r
  SheetHeader,\r
  SheetTitle,\r
} from "@/components/ui/sheet"\r
import { Skeleton } from "@/components/ui/skeleton"\r
import {\r
  Tooltip,\r
  TooltipContent,\r
  TooltipProvider,\r
  TooltipTrigger,\r
} from "@/components/ui/tooltip"\r
\r
const SIDEBAR_COOKIE_NAME = "sidebar_state"\r
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7\r
const SIDEBAR_WIDTH = "16rem"\r
const SIDEBAR_WIDTH_MOBILE = "18rem"\r
const SIDEBAR_WIDTH_ICON = "3rem"\r
const SIDEBAR_KEYBOARD_SHORTCUT = "b"\r
\r
type SidebarContextProps = {\r
  state: "expanded" | "collapsed"\r
  open: boolean\r
  setOpen: (open: boolean) => void\r
  openMobile: boolean\r
  setOpenMobile: (open: boolean) => void\r
  isMobile: boolean\r
  toggleSidebar: () => void\r
}\r
\r
const SidebarContext = React.createContext<SidebarContextProps | null>(null)\r
\r
function useSidebar() {\r
  const context = React.useContext(SidebarContext)\r
  if (!context) {\r
    throw new Error("useSidebar must be used within a SidebarProvider.")\r
  }\r
\r
  return context\r
}\r
\r
function SidebarProvider({\r
  defaultOpen = true,\r
  open: openProp,\r
  onOpenChange: setOpenProp,\r
  className,\r
  style,\r
  children,\r
  ...props\r
}: React.ComponentProps<"div"> & {\r
  defaultOpen?: boolean\r
  open?: boolean\r
  onOpenChange?: (open: boolean) => void\r
}) {\r
  const isMobile = useIsMobile()\r
  const [openMobile, setOpenMobile] = React.useState(false)\r
\r
  // This is the internal state of the sidebar.\r
  // We use openProp and setOpenProp for control from outside the component.\r
  const [_open, _setOpen] = React.useState(defaultOpen)\r
  const open = openProp ?? _open\r
  const setOpen = React.useCallback(\r
    (value: boolean | ((value: boolean) => boolean)) => {\r
      const openState = typeof value === "function" ? value(open) : value\r
      if (setOpenProp) {\r
        setOpenProp(openState)\r
      } else {\r
        _setOpen(openState)\r
      }\r
\r
      // This sets the cookie to keep the sidebar state.\r
      document.cookie = \`\${SIDEBAR_COOKIE_NAME}=\${openState}; path=/; max-age=\${SIDEBAR_COOKIE_MAX_AGE}\`\r
    },\r
    [setOpenProp, open]\r
  )\r
\r
  // Helper to toggle the sidebar.\r
  const toggleSidebar = React.useCallback(() => {\r
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open)\r
  }, [isMobile, setOpen, setOpenMobile])\r
\r
  // Adds a keyboard shortcut to toggle the sidebar.\r
  React.useEffect(() => {\r
    const handleKeyDown = (event: KeyboardEvent) => {\r
      if (\r
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&\r
        (event.metaKey || event.ctrlKey)\r
      ) {\r
        event.preventDefault()\r
        toggleSidebar()\r
      }\r
    }\r
\r
    window.addEventListener("keydown", handleKeyDown)\r
    return () => window.removeEventListener("keydown", handleKeyDown)\r
  }, [toggleSidebar])\r
\r
  // We add a state so that we can do data-state="expanded" or "collapsed".\r
  // This makes it easier to style the sidebar with Tailwind classes.\r
  const state = open ? "expanded" : "collapsed"\r
\r
  const contextValue = React.useMemo<SidebarContextProps>(\r
    () => ({\r
      state,\r
      open,\r
      setOpen,\r
      isMobile,\r
      openMobile,\r
      setOpenMobile,\r
      toggleSidebar,\r
    }),\r
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]\r
  )\r
\r
  return (\r
    <SidebarContext.Provider value={contextValue}>\r
      <TooltipProvider delayDuration={0}>\r
        <div\r
          data-slot="sidebar-wrapper"\r
          style={\r
            {\r
              "--sidebar-width": SIDEBAR_WIDTH,\r
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,\r
              ...style,\r
            } as React.CSSProperties\r
          }\r
          className={cn(\r
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",\r
            className\r
          )}\r
          {...props}\r
        >\r
          {children}\r
        </div>\r
      </TooltipProvider>\r
    </SidebarContext.Provider>\r
  )\r
}\r
\r
function Sidebar({\r
  side = "left",\r
  variant = "sidebar",\r
  collapsible = "offcanvas",\r
  className,\r
  children,\r
  ...props\r
}: React.ComponentProps<"div"> & {\r
  side?: "left" | "right"\r
  variant?: "sidebar" | "floating" | "inset"\r
  collapsible?: "offcanvas" | "icon" | "none"\r
}) {\r
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()\r
\r
  if (collapsible === "none") {\r
    return (\r
      <div\r
        data-slot="sidebar"\r
        className={cn(\r
          "bg-sidebar text-sidebar-foreground flex h-full w-[var(--sidebar-width)] flex-col",\r
          className\r
        )}\r
        {...props}\r
      >\r
        {children}\r
      </div>\r
    )\r
  }\r
\r
  if (isMobile) {\r
    return (\r
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>\r
        <SheetContent\r
          data-sidebar="sidebar"\r
          data-slot="sidebar"\r
          data-mobile="true"\r
          className="bg-sidebar text-sidebar-foreground w-[var(--sidebar-width)] p-0 [&>button]:hidden"\r
          style={\r
            {\r
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,\r
            } as React.CSSProperties\r
          }\r
          side={side}\r
        >\r
          <SheetHeader className="sr-only">\r
            <SheetTitle>Sidebar</SheetTitle>\r
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>\r
          </SheetHeader>\r
          <div className="flex h-full w-full flex-col">{children}</div>\r
        </SheetContent>\r
      </Sheet>\r
    )\r
  }\r
\r
  return (\r
    <div\r
      className="group peer text-sidebar-foreground hidden md:block"\r
      data-state={state}\r
      data-collapsible={state === "collapsed" ? collapsible : ""}\r
      data-variant={variant}\r
      data-side={side}\r
      data-slot="sidebar"\r
    >\r
      {/* This is what handles the sidebar gap on desktop */}\r
      <div\r
        data-slot="sidebar-gap"\r
        className={cn(\r
          "relative w-[var(--sidebar-width)] bg-transparent transition-[width] duration-200 ease-linear",\r
          "group-data-[collapsible=offcanvas]:w-0",\r
          "group-data-[side=right]:rotate-180",\r
          variant === "floating" || variant === "inset"\r
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4))]"\r
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)]"\r
        )}\r
      />\r
      <div\r
        data-slot="sidebar-container"\r
        className={cn(\r
          "fixed inset-y-0 z-10 hidden h-svh w-[var(--sidebar-width)] transition-[left,right,width] duration-200 ease-linear md:flex",\r
          side === "left"\r
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"\r
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",\r
          // Adjust the padding for floating and inset variants.\r
          variant === "floating" || variant === "inset"\r
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+var(--spacing-4)+2px)]"\r
            : "group-data-[collapsible=icon]:w-[var(--sidebar-width-icon)] group-data-[side=left]:border-r group-data-[side=right]:border-l",\r
          className\r
        )}\r
        {...props}\r
      >\r
        <div\r
          data-sidebar="sidebar"\r
          data-slot="sidebar-inner"\r
          className="bg-sidebar group-data-[variant=floating]:border-sidebar-border flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:shadow-sm"\r
        >\r
          {children}\r
        </div>\r
      </div>\r
    </div>\r
  )\r
}\r
\r
function SidebarTrigger({\r
  className,\r
  onClick,\r
  ...props\r
}: React.ComponentProps<typeof Button>) {\r
  const { toggleSidebar } = useSidebar()\r
\r
  return (\r
    <Button\r
      data-sidebar="trigger"\r
      data-slot="sidebar-trigger"\r
      variant="ghost"\r
      size="icon"\r
      className={cn("h-7 w-7", className)}\r
      onClick={(event) => {\r
        onClick?.(event)\r
        toggleSidebar()\r
      }}\r
      {...props}\r
    >\r
      <PanelLeftIcon />\r
      <span className="sr-only">Toggle Sidebar</span>\r
    </Button>\r
  )\r
}\r
\r
function SidebarRail({ className, ...props }: React.ComponentProps<"button">) {\r
  const { toggleSidebar } = useSidebar()\r
\r
  // Note: Tailwind v3.4 doesn't support "in-" selectors. So the rail won't work perfectly.\r
  return (\r
    <button\r
      data-sidebar="rail"\r
      data-slot="sidebar-rail"\r
      aria-label="Toggle Sidebar"\r
      tabIndex={-1}\r
      onClick={toggleSidebar}\r
      title="Toggle Sidebar"\r
      className={cn(\r
        "hover:after:bg-sidebar-border absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 transition-all ease-linear group-data-[side=left]:-right-4 group-data-[side=right]:left-0 after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] sm:flex",\r
        "in-data-[side=left]:cursor-w-resize in-data-[side=right]:cursor-e-resize",\r
        "[[data-side=left][data-state=collapsed]_&]:cursor-e-resize [[data-side=right][data-state=collapsed]_&]:cursor-w-resize",\r
        "hover:group-data-[collapsible=offcanvas]:bg-sidebar group-data-[collapsible=offcanvas]:translate-x-0 group-data-[collapsible=offcanvas]:after:left-full",\r
        "[[data-side=left][data-collapsible=offcanvas]_&]:-right-2",\r
        "[[data-side=right][data-collapsible=offcanvas]_&]:-left-2",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {\r
  return (\r
    <main\r
      data-slot="sidebar-inset"\r
      className={cn(\r
        "bg-background relative flex w-full flex-1 flex-col",\r
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarInput({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof Input>) {\r
  return (\r
    <Input\r
      data-slot="sidebar-input"\r
      data-sidebar="input"\r
      className={cn("bg-background h-8 w-full shadow-none", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="sidebar-header"\r
      data-sidebar="header"\r
      className={cn("flex flex-col gap-2 p-2", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="sidebar-footer"\r
      data-sidebar="footer"\r
      className={cn("flex flex-col gap-2 p-2", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarSeparator({\r
  className,\r
  ...props\r
}: React.ComponentProps<typeof Separator>) {\r
  return (\r
    <Separator\r
      data-slot="sidebar-separator"\r
      data-sidebar="separator"\r
      className={cn("bg-sidebar-border mx-2 w-auto", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="sidebar-content"\r
      data-sidebar="content"\r
      className={cn(\r
        "flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="sidebar-group"\r
      data-sidebar="group"\r
      className={cn("relative flex w-full min-w-0 flex-col p-2", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarGroupLabel({\r
  className,\r
  asChild = false,\r
  ...props\r
}: React.ComponentProps<"div"> & { asChild?: boolean }) {\r
  const Comp = asChild ? Slot : "div"\r
\r
  return (\r
    <Comp\r
      data-slot="sidebar-group-label"\r
      data-sidebar="group-label"\r
      className={cn(\r
        "text-sidebar-foreground/70 ring-sidebar-ring flex h-8 shrink-0 items-center rounded-md px-2 text-xs font-medium outline-hidden transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:h-4 [&>svg]:w-4 [&>svg]:shrink-0",\r
        "group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarGroupAction({\r
  className,\r
  asChild = false,\r
  ...props\r
}: React.ComponentProps<"button"> & { asChild?: boolean }) {\r
  const Comp = asChild ? Slot : "button"\r
\r
  return (\r
    <Comp\r
      data-slot="sidebar-group-action"\r
      data-sidebar="group-action"\r
      className={cn(\r
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground absolute top-3.5 right-3 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",\r
        // Increases the hit area of the button on mobile.\r
        "after:absolute after:-inset-2 md:after:hidden",\r
        "group-data-[collapsible=icon]:hidden",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarGroupContent({\r
  className,\r
  ...props\r
}: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="sidebar-group-content"\r
      data-sidebar="group-content"\r
      className={cn("w-full text-sm", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {\r
  return (\r
    <ul\r
      data-slot="sidebar-menu"\r
      data-sidebar="menu"\r
      className={cn("flex w-full min-w-0 flex-col gap-1", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {\r
  return (\r
    <li\r
      data-slot="sidebar-menu-item"\r
      data-sidebar="menu-item"\r
      className={cn("group/menu-item relative", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
const sidebarMenuButtonVariants = cva(\r
  "peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:w-8! group-data-[collapsible=icon]:h-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",\r
  {\r
    variants: {\r
      variant: {\r
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",\r
        outline:\r
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",\r
      },\r
      size: {\r
        default: "h-8 text-sm",\r
        sm: "h-7 text-xs",\r
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
      size: "default",\r
    },\r
  }\r
)\r
\r
function SidebarMenuButton({\r
  asChild = false,\r
  isActive = false,\r
  variant = "default",\r
  size = "default",\r
  tooltip,\r
  className,\r
  ...props\r
}: React.ComponentProps<"button"> & {\r
  asChild?: boolean\r
  isActive?: boolean\r
  tooltip?: string | React.ComponentProps<typeof TooltipContent>\r
} & VariantProps<typeof sidebarMenuButtonVariants>) {\r
  const Comp = asChild ? Slot : "button"\r
  const { isMobile, state } = useSidebar()\r
\r
  const button = (\r
    <Comp\r
      data-slot="sidebar-menu-button"\r
      data-sidebar="menu-button"\r
      data-size={size}\r
      data-active={isActive}\r
      className={cn(sidebarMenuButtonVariants({ variant, size }), className)}\r
      {...props}\r
    />\r
  )\r
\r
  if (!tooltip) {\r
    return button\r
  }\r
\r
  if (typeof tooltip === "string") {\r
    tooltip = {\r
      children: tooltip,\r
    }\r
  }\r
\r
  return (\r
    <Tooltip>\r
      <TooltipTrigger asChild>{button}</TooltipTrigger>\r
      <TooltipContent\r
        side="right"\r
        align="center"\r
        hidden={state !== "collapsed" || isMobile}\r
        {...tooltip}\r
      />\r
    </Tooltip>\r
  )\r
}\r
\r
function SidebarMenuAction({\r
  className,\r
  asChild = false,\r
  showOnHover = false,\r
  ...props\r
}: React.ComponentProps<"button"> & {\r
  asChild?: boolean\r
  showOnHover?: boolean\r
}) {\r
  const Comp = asChild ? Slot : "button"\r
\r
  return (\r
    <Comp\r
      data-slot="sidebar-menu-action"\r
      data-sidebar="menu-action"\r
      className={cn(\r
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground peer-hover/menu-button:text-sidebar-accent-foreground absolute top-1.5 right-1 flex aspect-square w-5 items-center justify-center rounded-md p-0 outline-hidden transition-transform focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",\r
        // Increases the hit area of the button on mobile.\r
        "after:absolute after:-inset-2 md:after:hidden",\r
        "peer-data-[size=sm]/menu-button:top-1",\r
        "peer-data-[size=default]/menu-button:top-1.5",\r
        "peer-data-[size=lg]/menu-button:top-2.5",\r
        "group-data-[collapsible=icon]:hidden",\r
        showOnHover &&\r
          "peer-data-[active=true]/menu-button:text-sidebar-accent-foreground group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 md:opacity-0",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarMenuBadge({\r
  className,\r
  ...props\r
}: React.ComponentProps<"div">) {\r
  return (\r
    <div\r
      data-slot="sidebar-menu-badge"\r
      data-sidebar="menu-badge"\r
      className={cn(\r
        "text-sidebar-foreground pointer-events-none absolute right-1 flex h-5 min-w-5 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums select-none",\r
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",\r
        "peer-data-[size=sm]/menu-button:top-1",\r
        "peer-data-[size=default]/menu-button:top-1.5",\r
        "peer-data-[size=lg]/menu-button:top-2.5",\r
        "group-data-[collapsible=icon]:hidden",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarMenuSkeleton({\r
  className,\r
  showIcon = false,\r
  ...props\r
}: React.ComponentProps<"div"> & {\r
  showIcon?: boolean\r
}) {\r
  // Random width between 50 to 90%.\r
  const width = React.useMemo(() => {\r
    return \`\${Math.floor(Math.random() * 40) + 50}%\`\r
  }, [])\r
\r
  return (\r
    <div\r
      data-slot="sidebar-menu-skeleton"\r
      data-sidebar="menu-skeleton"\r
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}\r
      {...props}\r
    >\r
      {showIcon && (\r
        <Skeleton\r
          className="size-4 rounded-md"\r
          data-sidebar="menu-skeleton-icon"\r
        />\r
      )}\r
      <Skeleton\r
        className="h-4 max-w-[var(--skeleton-width)] flex-1"\r
        data-sidebar="menu-skeleton-text"\r
        style={\r
          {\r
            "--skeleton-width": width,\r
          } as React.CSSProperties\r
        }\r
      />\r
    </div>\r
  )\r
}\r
\r
function SidebarMenuSub({ className, ...props }: React.ComponentProps<"ul">) {\r
  return (\r
    <ul\r
      data-slot="sidebar-menu-sub"\r
      data-sidebar="menu-sub"\r
      className={cn(\r
        "border-sidebar-border mx-3.5 flex min-w-0 translate-x-px flex-col gap-1 border-l px-2.5 py-0.5",\r
        "group-data-[collapsible=icon]:hidden",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarMenuSubItem({\r
  className,\r
  ...props\r
}: React.ComponentProps<"li">) {\r
  return (\r
    <li\r
      data-slot="sidebar-menu-sub-item"\r
      data-sidebar="menu-sub-item"\r
      className={cn("group/menu-sub-item relative", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
function SidebarMenuSubButton({\r
  asChild = false,\r
  size = "md",\r
  isActive = false,\r
  className,\r
  ...props\r
}: React.ComponentProps<"a"> & {\r
  asChild?: boolean\r
  size?: "sm" | "md"\r
  isActive?: boolean\r
}) {\r
  const Comp = asChild ? Slot : "a"\r
\r
  return (\r
    <Comp\r
      data-slot="sidebar-menu-sub-button"\r
      data-sidebar="menu-sub-button"\r
      data-size={size}\r
      data-active={isActive}\r
      className={cn(\r
        "text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground active:bg-sidebar-accent active:text-sidebar-accent-foreground [&>svg]:text-sidebar-accent-foreground flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 outline outline-2 outline-transparent outline-offset-2 focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",\r
        "data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground",\r
        size === "sm" && "text-xs",\r
        size === "md" && "text-sm",\r
        "group-data-[collapsible=icon]:hidden",\r
        className\r
      )}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export {\r
  Sidebar,\r
  SidebarContent,\r
  SidebarFooter,\r
  SidebarGroup,\r
  SidebarGroupAction,\r
  SidebarGroupContent,\r
  SidebarGroupLabel,\r
  SidebarHeader,\r
  SidebarInput,\r
  SidebarInset,\r
  SidebarMenu,\r
  SidebarMenuAction,\r
  SidebarMenuBadge,\r
  SidebarMenuButton,\r
  SidebarMenuItem,\r
  SidebarMenuSkeleton,\r
  SidebarMenuSub,\r
  SidebarMenuSubButton,\r
  SidebarMenuSubItem,\r
  SidebarProvider,\r
  SidebarRail,\r
  SidebarSeparator,\r
  SidebarTrigger,\r
  useSidebar,\r
}\r
`,J=`import { cn } from "@/lib/utils"\r
\r
function Skeleton({\r
  className,\r
  ...props\r
}: React.HTMLAttributes<HTMLDivElement>) {\r
  return (\r
    <div\r
      className={cn("animate-pulse rounded-md bg-primary/10", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export { Skeleton }\r
`,Q=`import * as React from "react"\r
import * as SliderPrimitive from "@radix-ui/react-slider"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Slider = React.forwardRef<\r
  React.ElementRef<typeof SliderPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>\r
>(({ className, ...props }, ref) => (\r
  <SliderPrimitive.Root\r
    ref={ref}\r
    className={cn(\r
      "relative flex w-full touch-none select-none items-center",\r
      className\r
    )}\r
    {...props}\r
  >\r
    <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">\r
      <SliderPrimitive.Range className="absolute h-full bg-primary" />\r
    </SliderPrimitive.Track>\r
    <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50" />\r
  </SliderPrimitive.Root>\r
))\r
Slider.displayName = SliderPrimitive.Root.displayName\r
\r
export { Slider }\r
`,Y=`"use client"\r
\r
import { useTheme } from "next-themes"\r
import { Toaster as Sonner } from "sonner"\r
\r
type ToasterProps = React.ComponentProps<typeof Sonner>\r
\r
const Toaster = ({ ...props }: ToasterProps) => {\r
  const { theme = "system" } = useTheme()\r
\r
  return (\r
    <Sonner\r
      theme={theme as ToasterProps["theme"]}\r
      className="toaster group"\r
      toastOptions={{\r
        classNames: {\r
          toast:\r
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",\r
          description: "group-[.toast]:text-muted-foreground",\r
          actionButton:\r
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",\r
          cancelButton:\r
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",\r
        },\r
      }}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export { Toaster }\r
`,Z=`import { Loader2Icon } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
function Spinner({ className, ...props }: React.ComponentProps<"svg">) {\r
  return (\r
    <Loader2Icon\r
      role="status"\r
      aria-label="Loading"\r
      className={cn("size-4 animate-spin", className)}\r
      {...props}\r
    />\r
  )\r
}\r
\r
export { Spinner }\r
`,rr=`import * as React from "react"\r
import * as SwitchPrimitives from "@radix-ui/react-switch"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Switch = React.forwardRef<\r
  React.ElementRef<typeof SwitchPrimitives.Root>,\r
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>\r
>(({ className, ...props }, ref) => (\r
  <SwitchPrimitives.Root\r
    className={cn(\r
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",\r
      className\r
    )}\r
    {...props}\r
    ref={ref}\r
  >\r
    <SwitchPrimitives.Thumb\r
      className={cn(\r
        "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"\r
      )}\r
    />\r
  </SwitchPrimitives.Root>\r
))\r
Switch.displayName = SwitchPrimitives.Root.displayName\r
\r
export { Switch }\r
`,er=`import * as React from "react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Table = React.forwardRef<\r
  HTMLTableElement,\r
  React.HTMLAttributes<HTMLTableElement>\r
>(({ className, ...props }, ref) => (\r
  <div className="relative w-full overflow-auto">\r
    <table\r
      ref={ref}\r
      className={cn("w-full caption-bottom text-sm", className)}\r
      {...props}\r
    />\r
  </div>\r
))\r
Table.displayName = "Table"\r
\r
const TableHeader = React.forwardRef<\r
  HTMLTableSectionElement,\r
  React.HTMLAttributes<HTMLTableSectionElement>\r
>(({ className, ...props }, ref) => (\r
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />\r
))\r
TableHeader.displayName = "TableHeader"\r
\r
const TableBody = React.forwardRef<\r
  HTMLTableSectionElement,\r
  React.HTMLAttributes<HTMLTableSectionElement>\r
>(({ className, ...props }, ref) => (\r
  <tbody\r
    ref={ref}\r
    className={cn("[&_tr:last-child]:border-0", className)}\r
    {...props}\r
  />\r
))\r
TableBody.displayName = "TableBody"\r
\r
const TableFooter = React.forwardRef<\r
  HTMLTableSectionElement,\r
  React.HTMLAttributes<HTMLTableSectionElement>\r
>(({ className, ...props }, ref) => (\r
  <tfoot\r
    ref={ref}\r
    className={cn(\r
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TableFooter.displayName = "TableFooter"\r
\r
const TableRow = React.forwardRef<\r
  HTMLTableRowElement,\r
  React.HTMLAttributes<HTMLTableRowElement>\r
>(({ className, ...props }, ref) => (\r
  <tr\r
    ref={ref}\r
    className={cn(\r
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TableRow.displayName = "TableRow"\r
\r
const TableHead = React.forwardRef<\r
  HTMLTableCellElement,\r
  React.ThHTMLAttributes<HTMLTableCellElement>\r
>(({ className, ...props }, ref) => (\r
  <th\r
    ref={ref}\r
    className={cn(\r
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TableHead.displayName = "TableHead"\r
\r
const TableCell = React.forwardRef<\r
  HTMLTableCellElement,\r
  React.TdHTMLAttributes<HTMLTableCellElement>\r
>(({ className, ...props }, ref) => (\r
  <td\r
    ref={ref}\r
    className={cn(\r
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TableCell.displayName = "TableCell"\r
\r
const TableCaption = React.forwardRef<\r
  HTMLTableCaptionElement,\r
  React.HTMLAttributes<HTMLTableCaptionElement>\r
>(({ className, ...props }, ref) => (\r
  <caption\r
    ref={ref}\r
    className={cn("mt-4 text-sm text-muted-foreground", className)}\r
    {...props}\r
  />\r
))\r
TableCaption.displayName = "TableCaption"\r
\r
export {\r
  Table,\r
  TableHeader,\r
  TableBody,\r
  TableFooter,\r
  TableHead,\r
  TableRow,\r
  TableCell,\r
  TableCaption,\r
}\r
`,nr=`import * as React from "react"\r
import * as TabsPrimitive from "@radix-ui/react-tabs"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Tabs = TabsPrimitive.Root\r
\r
const TabsList = React.forwardRef<\r
  React.ElementRef<typeof TabsPrimitive.List>,\r
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>\r
>(({ className, ...props }, ref) => (\r
  <TabsPrimitive.List\r
    ref={ref}\r
    className={cn(\r
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TabsList.displayName = TabsPrimitive.List.displayName\r
\r
const TabsTrigger = React.forwardRef<\r
  React.ElementRef<typeof TabsPrimitive.Trigger>,\r
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>\r
>(({ className, ...props }, ref) => (\r
  <TabsPrimitive.Trigger\r
    ref={ref}\r
    className={cn(\r
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName\r
\r
const TabsContent = React.forwardRef<\r
  React.ElementRef<typeof TabsPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>\r
>(({ className, ...props }, ref) => (\r
  <TabsPrimitive.Content\r
    ref={ref}\r
    className={cn(\r
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
TabsContent.displayName = TabsPrimitive.Content.displayName\r
\r
export { Tabs, TabsList, TabsTrigger, TabsContent }\r
`,tr=`import * as React from "react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const Textarea = React.forwardRef<\r
  HTMLTextAreaElement,\r
  React.ComponentProps<"textarea">\r
>(({ className, ...props }, ref) => {\r
  return (\r
    <textarea\r
      className={cn(\r
        "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",\r
        className\r
      )}\r
      ref={ref}\r
      {...props}\r
    />\r
  )\r
})\r
Textarea.displayName = "Textarea"\r
\r
export { Textarea }\r
`,ar=`import * as React from "react"\r
import * as ToastPrimitives from "@radix-ui/react-toast"\r
import { cva, type VariantProps } from "class-variance-authority"\r
import { X } from "lucide-react"\r
\r
import { cn } from "@/lib/utils"\r
\r
const ToastProvider = ToastPrimitives.Provider\r
\r
const ToastViewport = React.forwardRef<\r
  React.ElementRef<typeof ToastPrimitives.Viewport>,\r
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>\r
>(({ className, ...props }, ref) => (\r
  <ToastPrimitives.Viewport\r
    ref={ref}\r
    className={cn(\r
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
ToastViewport.displayName = ToastPrimitives.Viewport.displayName\r
\r
const toastVariants = cva(\r
  "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",\r
  {\r
    variants: {\r
      variant: {\r
        default: "border bg-background text-foreground",\r
        destructive:\r
          "destructive group border-destructive bg-destructive text-destructive-foreground",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
    },\r
  }\r
)\r
\r
const Toast = React.forwardRef<\r
  React.ElementRef<typeof ToastPrimitives.Root>,\r
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &\r
    VariantProps<typeof toastVariants>\r
>(({ className, variant, ...props }, ref) => {\r
  return (\r
    <ToastPrimitives.Root\r
      ref={ref}\r
      className={cn(toastVariants({ variant }), className)}\r
      {...props}\r
    />\r
  )\r
})\r
Toast.displayName = ToastPrimitives.Root.displayName\r
\r
const ToastAction = React.forwardRef<\r
  React.ElementRef<typeof ToastPrimitives.Action>,\r
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>\r
>(({ className, ...props }, ref) => (\r
  <ToastPrimitives.Action\r
    ref={ref}\r
    className={cn(\r
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",\r
      className\r
    )}\r
    {...props}\r
  />\r
))\r
ToastAction.displayName = ToastPrimitives.Action.displayName\r
\r
const ToastClose = React.forwardRef<\r
  React.ElementRef<typeof ToastPrimitives.Close>,\r
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>\r
>(({ className, ...props }, ref) => (\r
  <ToastPrimitives.Close\r
    ref={ref}\r
    className={cn(\r
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",\r
      className\r
    )}\r
    toast-close=""\r
    {...props}\r
  >\r
    <X className="h-4 w-4" />\r
  </ToastPrimitives.Close>\r
))\r
ToastClose.displayName = ToastPrimitives.Close.displayName\r
\r
const ToastTitle = React.forwardRef<\r
  React.ElementRef<typeof ToastPrimitives.Title>,\r
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>\r
>(({ className, ...props }, ref) => (\r
  <ToastPrimitives.Title\r
    ref={ref}\r
    className={cn("text-sm font-semibold", className)}\r
    {...props}\r
  />\r
))\r
ToastTitle.displayName = ToastPrimitives.Title.displayName\r
\r
const ToastDescription = React.forwardRef<\r
  React.ElementRef<typeof ToastPrimitives.Description>,\r
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>\r
>(({ className, ...props }, ref) => (\r
  <ToastPrimitives.Description\r
    ref={ref}\r
    className={cn("text-sm opacity-90", className)}\r
    {...props}\r
  />\r
))\r
ToastDescription.displayName = ToastPrimitives.Description.displayName\r
\r
type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>\r
\r
type ToastActionElement = React.ReactElement<typeof ToastAction>\r
\r
export {\r
  type ToastProps,\r
  type ToastActionElement,\r
  ToastProvider,\r
  ToastViewport,\r
  Toast,\r
  ToastTitle,\r
  ToastDescription,\r
  ToastClose,\r
  ToastAction,\r
}\r
`,or=`import { useToast } from "@/hooks/use-toast"\r
import {\r
  Toast,\r
  ToastClose,\r
  ToastDescription,\r
  ToastProvider,\r
  ToastTitle,\r
  ToastViewport,\r
} from "@/components/ui/toast"\r
\r
export function Toaster() {\r
  const { toasts } = useToast()\r
\r
  return (\r
    <ToastProvider>\r
      {toasts.map(function ({ id, title, description, action, ...props }) {\r
        return (\r
          <Toast key={id} {...props}>\r
            <div className="grid gap-1">\r
              {title && <ToastTitle>{title}</ToastTitle>}\r
              {description && (\r
                <ToastDescription>{description}</ToastDescription>\r
              )}\r
            </div>\r
            {action}\r
            <ToastClose />\r
          </Toast>\r
        )\r
      })}\r
      <ToastViewport />\r
    </ToastProvider>\r
  )\r
}\r
`,sr=`"use client"\r
\r
import * as React from "react"\r
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group"\r
import { type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
import { toggleVariants } from "@/components/ui/toggle"\r
\r
const ToggleGroupContext = React.createContext<\r
  VariantProps<typeof toggleVariants>\r
>({\r
  size: "default",\r
  variant: "default",\r
})\r
\r
const ToggleGroup = React.forwardRef<\r
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &\r
    VariantProps<typeof toggleVariants>\r
>(({ className, variant, size, children, ...props }, ref) => (\r
  <ToggleGroupPrimitive.Root\r
    ref={ref}\r
    className={cn("flex items-center justify-center gap-1", className)}\r
    {...props}\r
  >\r
    <ToggleGroupContext.Provider value={{ variant, size }}>\r
      {children}\r
    </ToggleGroupContext.Provider>\r
  </ToggleGroupPrimitive.Root>\r
))\r
\r
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName\r
\r
const ToggleGroupItem = React.forwardRef<\r
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,\r
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &\r
    VariantProps<typeof toggleVariants>\r
>(({ className, children, variant, size, ...props }, ref) => {\r
  const context = React.useContext(ToggleGroupContext)\r
\r
  return (\r
    <ToggleGroupPrimitive.Item\r
      ref={ref}\r
      className={cn(\r
        toggleVariants({\r
          variant: context.variant || variant,\r
          size: context.size || size,\r
        }),\r
        className\r
      )}\r
      {...props}\r
    >\r
      {children}\r
    </ToggleGroupPrimitive.Item>\r
  )\r
})\r
\r
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName\r
\r
export { ToggleGroup, ToggleGroupItem }\r
`,ir=`import * as React from "react"\r
import * as TogglePrimitive from "@radix-ui/react-toggle"\r
import { cva, type VariantProps } from "class-variance-authority"\r
\r
import { cn } from "@/lib/utils"\r
\r
const toggleVariants = cva(\r
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",\r
  {\r
    variants: {\r
      variant: {\r
        default: "bg-transparent",\r
        outline:\r
          "border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",\r
      },\r
      size: {\r
        default: "h-9 px-2 min-w-9",\r
        sm: "h-8 px-1.5 min-w-8",\r
        lg: "h-10 px-2.5 min-w-10",\r
      },\r
    },\r
    defaultVariants: {\r
      variant: "default",\r
      size: "default",\r
    },\r
  }\r
)\r
\r
const Toggle = React.forwardRef<\r
  React.ElementRef<typeof TogglePrimitive.Root>,\r
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &\r
    VariantProps<typeof toggleVariants>\r
>(({ className, variant, size, ...props }, ref) => (\r
  <TogglePrimitive.Root\r
    ref={ref}\r
    className={cn(toggleVariants({ variant, size, className }))}\r
    {...props}\r
  />\r
))\r
\r
Toggle.displayName = TogglePrimitive.Root.displayName\r
\r
export { Toggle, toggleVariants }\r
`,lr=`"use client"\r
\r
import * as React from "react"\r
import * as TooltipPrimitive from "@radix-ui/react-tooltip"\r
\r
import { cn } from "@/lib/utils"\r
\r
const TooltipProvider = TooltipPrimitive.Provider\r
\r
const Tooltip = TooltipPrimitive.Root\r
\r
const TooltipTrigger = TooltipPrimitive.Trigger\r
\r
const TooltipContent = React.forwardRef<\r
  React.ElementRef<typeof TooltipPrimitive.Content>,\r
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>\r
>(({ className, sideOffset = 4, ...props }, ref) => (\r
  <TooltipPrimitive.Portal>\r
    <TooltipPrimitive.Content\r
      ref={ref}\r
      sideOffset={sideOffset}\r
      className={cn(\r
        "z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-tooltip-content-transform-origin]",\r
        className\r
      )}\r
      {...props}\r
    />\r
  </TooltipPrimitive.Portal>\r
))\r
TooltipContent.displayName = TooltipPrimitive.Content.displayName\r
\r
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }\r
`,dr=`import { useEffect, useRef } from "react";\r
import { getSettings, getUsers, lockReport, resetBalance, updateSettings } from "@/lib/firestore";\r
\r
import { getWibDate } from "@/lib/utils";\r
\r
function getWibNow(): { hour: number; minute: number } {\r
  const now = new Date();\r
  const wibOffset = 7 * 60;\r
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();\r
  const wibMinutes = (utcMinutes + wibOffset) % (24 * 60);\r
  return { hour: Math.floor(wibMinutes / 60), minute: wibMinutes % 60 };\r
}\r
\r
export function useAutoScheduler(isLoggedIn: boolean) {\r
  const isRunning = useRef(false);\r
\r
  useEffect(() => {\r
    if (!isLoggedIn) return;\r
\r
    const checkSchedules = async () => {\r
      if (isRunning.current) return;\r
      isRunning.current = true;\r
\r
      try {\r
        const settings = await getSettings();\r
        const { hour, minute } = getWibNow();\r
        const today = getWibDate();\r
\r
        const currentTotalMinutes = hour * 60 + minute;\r
\r
        // --- AUTO LOCK ---\r
        const lockTotalMinutes = settings.autoLockHour * 60 + settings.autoLockMinute;\r
        if (currentTotalMinutes >= lockTotalMinutes && settings.lastLockDate !== today) {\r
          // Perform Lock\r
          const users = await getUsers();\r
          const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
          for (const k of kasirList) {\r
            try {\r
              await lockReport(k.name, today);\r
            } catch {}\r
          }\r
          // Mark as done for today\r
          await updateSettings({ lastLockDate: today });\r
        }\r
\r
        // --- AUTO RESET ---\r
        const resetTotalMinutes = settings.autoResetHour * 60 + settings.autoResetMinute;\r
        if (currentTotalMinutes >= resetTotalMinutes && settings.lastResetDate !== today) {\r
          // Perform Reset\r
          const users = await getUsers();\r
          const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
          for (const k of kasirList) {\r
            try {\r
              await resetBalance(k.name);\r
            } catch {}\r
          }\r
          // Mark as done for today\r
          await updateSettings({ lastResetDate: today });\r
        }\r
      } catch (err) {\r
        console.error("Scheduler Error:", err);\r
      } finally {\r
        isRunning.current = false;\r
      }\r
    };\r
\r
    checkSchedules();\r
    const interval = setInterval(checkSchedules, 60000); // Check every minute\r
    return () => clearInterval(interval);\r
  }, [isLoggedIn]);\r
}\r
\r
`,cr=`import { useState, useEffect, createContext, useContext } from "react";

type DisplayMode = "hp" | "tablet" | "pc";
type Theme = "light" | "dark";

interface DisplayModeContextType {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  theme: Theme;
  toggleTheme: () => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  primaryColorDark: string;
  setPrimaryColorDark: (color: string) => void;
  currentPrimaryColor: string;
}

const DisplayModeContext = createContext<DisplayModeContextType>({
  mode: "hp",
  setMode: () => {},
  theme: "light",
  toggleTheme: () => {},
  primaryColor: "#3b82f6",
  setPrimaryColor: () => {},
  primaryColorDark: "#3b82f6",
  setPrimaryColorDark: () => {},
  currentPrimaryColor: "#3b82f6",
});

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>(() => {
    return (localStorage.getItem("alfaza_display_mode") as DisplayMode) || "hp";
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("alfaza_theme") as Theme) || "light";
  });

  const [primaryColor, setPrimaryColor] = useState(() => {
    return localStorage.getItem("alfaza_primary_color") || "#3b82f6";
  });

  const [primaryColorDark, setPrimaryColorDark] = useState(() => {
    return localStorage.getItem("alfaza_primary_color_dark") || "#60a5fa";
  });

  useEffect(() => {
    localStorage.setItem("alfaza_display_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("alfaza_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const currentPrimaryColor = theme === "dark" ? primaryColorDark : primaryColor;

  useEffect(() => {
    localStorage.setItem("alfaza_primary_color", primaryColor);
    localStorage.setItem("alfaza_primary_color_dark", primaryColorDark);
    
    document.documentElement.style.setProperty("--primary-hex", currentPrimaryColor);
  }, [primaryColor, primaryColorDark, theme, currentPrimaryColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  return (
    <DisplayModeContext.Provider value={{ 
      mode, setMode, 
      theme, toggleTheme, 
      primaryColor, setPrimaryColor,
      primaryColorDark, setPrimaryColorDark,
      currentPrimaryColor
    }}>
      {children}
    </DisplayModeContext.Provider>
  );
}

export function useDisplayMode() {
  return useContext(DisplayModeContext);
}

export function getMaxWidth(mode: DisplayMode): string {
  switch (mode) {
    case "hp": return "max-w-[450px]";
    case "tablet": return "max-w-[768px]";
    case "pc": return "max-w-full";
    default: return "max-w-[450px]";
  }
}
`,mr=`import * as React from "react"\r
\r
const MOBILE_BREAKPOINT = 768\r
\r
export function useIsMobile() {\r
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)\r
\r
  React.useEffect(() => {\r
    const mql = window.matchMedia(\`(max-width: \${MOBILE_BREAKPOINT - 1}px)\`)\r
    const onChange = () => {\r
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)\r
    }\r
    mql.addEventListener("change", onChange)\r
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)\r
    return () => mql.removeEventListener("change", onChange)\r
  }, [])\r
\r
  return !!isMobile\r
}\r
`,pr=`import * as React from "react"\r
\r
import type {\r
  ToastActionElement,\r
  ToastProps,\r
} from "@/components/ui/toast"\r
\r
const TOAST_LIMIT = 1\r
const TOAST_REMOVE_DELAY = 1000000\r
\r
type ToasterToast = ToastProps & {\r
  id: string\r
  title?: React.ReactNode\r
  description?: React.ReactNode\r
  action?: ToastActionElement\r
}\r
\r
const actionTypes = {\r
  ADD_TOAST: "ADD_TOAST",\r
  UPDATE_TOAST: "UPDATE_TOAST",\r
  DISMISS_TOAST: "DISMISS_TOAST",\r
  REMOVE_TOAST: "REMOVE_TOAST",\r
} as const\r
\r
let count = 0\r
\r
function genId() {\r
  count = (count + 1) % Number.MAX_SAFE_INTEGER\r
  return count.toString()\r
}\r
\r
type ActionType = typeof actionTypes\r
\r
type Action =\r
  | {\r
      type: ActionType["ADD_TOAST"]\r
      toast: ToasterToast\r
    }\r
  | {\r
      type: ActionType["UPDATE_TOAST"]\r
      toast: Partial<ToasterToast>\r
    }\r
  | {\r
      type: ActionType["DISMISS_TOAST"]\r
      toastId?: ToasterToast["id"]\r
    }\r
  | {\r
      type: ActionType["REMOVE_TOAST"]\r
      toastId?: ToasterToast["id"]\r
    }\r
\r
interface State {\r
  toasts: ToasterToast[]\r
}\r
\r
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()\r
\r
const addToRemoveQueue = (toastId: string) => {\r
  if (toastTimeouts.has(toastId)) {\r
    return\r
  }\r
\r
  const timeout = setTimeout(() => {\r
    toastTimeouts.delete(toastId)\r
    dispatch({\r
      type: "REMOVE_TOAST",\r
      toastId: toastId,\r
    })\r
  }, TOAST_REMOVE_DELAY)\r
\r
  toastTimeouts.set(toastId, timeout)\r
}\r
\r
export const reducer = (state: State, action: Action): State => {\r
  switch (action.type) {\r
    case "ADD_TOAST":\r
      return {\r
        ...state,\r
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),\r
      }\r
\r
    case "UPDATE_TOAST":\r
      return {\r
        ...state,\r
        toasts: state.toasts.map((t) =>\r
          t.id === action.toast.id ? { ...t, ...action.toast } : t\r
        ),\r
      }\r
\r
    case "DISMISS_TOAST": {\r
      const { toastId } = action\r
\r
      // ! Side effects ! - This could be extracted into a dismissToast() action,\r
      // but I'll keep it here for simplicity\r
      if (toastId) {\r
        addToRemoveQueue(toastId)\r
      } else {\r
        state.toasts.forEach((toast) => {\r
          addToRemoveQueue(toast.id)\r
        })\r
      }\r
\r
      return {\r
        ...state,\r
        toasts: state.toasts.map((t) =>\r
          t.id === toastId || toastId === undefined\r
            ? {\r
                ...t,\r
                open: false,\r
              }\r
            : t\r
        ),\r
      }\r
    }\r
    case "REMOVE_TOAST":\r
      if (action.toastId === undefined) {\r
        return {\r
          ...state,\r
          toasts: [],\r
        }\r
      }\r
      return {\r
        ...state,\r
        toasts: state.toasts.filter((t) => t.id !== action.toastId),\r
      }\r
  }\r
}\r
\r
const listeners: Array<(state: State) => void> = []\r
\r
let memoryState: State = { toasts: [] }\r
\r
function dispatch(action: Action) {\r
  memoryState = reducer(memoryState, action)\r
  listeners.forEach((listener) => {\r
    listener(memoryState)\r
  })\r
}\r
\r
type Toast = Omit<ToasterToast, "id">\r
\r
function toast({ ...props }: Toast) {\r
  const id = genId()\r
\r
  const update = (props: ToasterToast) =>\r
    dispatch({\r
      type: "UPDATE_TOAST",\r
      toast: { ...props, id },\r
    })\r
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })\r
\r
  dispatch({\r
    type: "ADD_TOAST",\r
    toast: {\r
      ...props,\r
      id,\r
      open: true,\r
      onOpenChange: (open) => {\r
        if (!open) dismiss()\r
      },\r
    },\r
  })\r
\r
  return {\r
    id: id,\r
    dismiss,\r
    update,\r
  }\r
}\r
\r
function useToast() {\r
  const [state, setState] = React.useState<State>(memoryState)\r
\r
  React.useEffect(() => {\r
    listeners.push(setState)\r
    return () => {\r
      const index = listeners.indexOf(setState)\r
      if (index > -1) {\r
        listeners.splice(index, 1)\r
      }\r
    }\r
  }, [state])\r
\r
  return {\r
    ...state,\r
    toast,\r
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),\r
  }\r
}\r
\r
export { useToast, toast }\r
`,ur=`@import "tailwindcss";\r
@import "tw-animate-css";\r
@plugin "@tailwindcss/typography";\r
\r
@custom-variant dark (&:is(.dark *));\r
\r
@theme inline {\r
  --color-background: hsl(var(--background));\r
  --color-foreground: hsl(var(--foreground));\r
  --color-border: hsl(var(--border));\r
  --color-input: hsl(var(--input));\r
  --color-ring: hsl(var(--ring));\r
\r
  --color-card: hsl(var(--card));\r
  --color-card-foreground: hsl(var(--card-foreground));\r
  --color-card-border: hsl(var(--card-border));\r
\r
  --color-popover: hsl(var(--popover));\r
  --color-popover-foreground: hsl(var(--popover-foreground));\r
  --color-popover-border: hsl(var(--popover-border));\r
\r
  --color-primary: var(--primary-hex);\r
  --color-primary-foreground: hsl(var(--primary-foreground));\r
  --color-primary-border: var(--primary-border);\r
\r
  --color-secondary: hsl(var(--secondary));\r
  --color-secondary-foreground: hsl(var(--secondary-foreground));\r
  --color-secondary-border: var(--secondary-border);\r
\r
  --color-muted: hsl(var(--muted));\r
  --color-muted-foreground: hsl(var(--muted-foreground));\r
  --color-muted-border: var(--muted-border);\r
\r
  --color-accent: hsl(var(--accent));\r
  --color-accent-foreground: hsl(var(--accent-foreground));\r
  --color-accent-border: var(--accent-border);\r
\r
  --color-destructive: hsl(var(--destructive));\r
  --color-destructive-foreground: hsl(var(--destructive-foreground));\r
  --color-destructive-border: var(--destructive-border);\r
\r
  --color-chart-1: hsl(var(--chart-1));\r
  --color-chart-2: hsl(var(--chart-2));\r
  --color-chart-3: hsl(var(--chart-3));\r
  --color-chart-4: hsl(var(--chart-4));\r
  --color-chart-5: hsl(var(--chart-5));\r
\r
  --color-sidebar: hsl(var(--sidebar));\r
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));\r
  --color-sidebar-border: hsl(var(--sidebar-border));\r
  --color-sidebar-primary: hsl(var(--sidebar-primary));\r
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));\r
  --color-sidebar-primary-border: var(--sidebar-primary-border);\r
  --color-sidebar-accent: hsl(var(--sidebar-accent));\r
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));\r
  --color-sidebar-accent-border: var(--sidebar-accent-border);\r
  --color-sidebar-ring: hsl(var(--sidebar-ring));\r
\r
  --font-sans: var(--app-font-sans);\r
  --font-serif: var(--app-font-serif);\r
  --font-mono: var(--app-font-mono);\r
\r
  --radius-sm: calc(var(--radius) - 4px);\r
  --radius-md: calc(var(--radius) - 2px);\r
  --radius-lg: var(--radius);\r
  --radius-xl: calc(var(--radius) + 4px);\r
}\r
\r
:root {\r
  --background: 226 100% 97%;\r
  --foreground: 222 47% 11%;\r
\r
  --card: 0 0% 100%;\r
  --card-foreground: 222 47% 11%;\r
  --card-border: 214 32% 91%;\r
\r
  --popover: 0 0% 100%;\r
  --popover-foreground: 222 47% 11%;\r
  --popover-border: 214 32% 91%;\r
\r
  --primary: 222 91% 57%;\r
  --primary-foreground: 210 40% 98%;\r
\r
  --secondary: 210 40% 96.1%;\r
  --secondary-foreground: 222.2 47.4% 11.2%;\r
\r
  --muted: 210 40% 96.1%;\r
  --muted-foreground: 215.4 16.3% 46.9%;\r
\r
  --accent: 210 40% 96.1%;\r
  --accent-foreground: 222.2 47.4% 11.2%;\r
\r
  --destructive: 0 84.2% 60.2%;\r
  --destructive-foreground: 210 40% 98%;\r
\r
  --border: 214.3 31.8% 91.4%;\r
  --input: 214.3 31.8% 91.4%;\r
  --ring: 222 91% 57%;\r
\r
  --chart-1: 222 91% 57%;\r
  --chart-2: 160 60% 45%;\r
  --chart-3: 30 80% 55%;\r
  --chart-4: 280 65% 60%;\r
  --chart-5: 340 75% 55%;\r
\r
  --sidebar: 0 0% 100%;\r
  --sidebar-foreground: 222 47% 11%;\r
  --sidebar-border: 214 32% 91%;\r
  --sidebar-primary: 222 91% 57%;\r
  --sidebar-primary-foreground: 210 40% 98%;\r
  --sidebar-accent: 210 40% 96.1%;\r
  --sidebar-accent-foreground: 222.2 47.4% 11.2%;\r
  --sidebar-ring: 222 91% 57%;\r
\r
  --app-font-sans: 'Inter', sans-serif;\r
  --app-font-serif: Georgia, serif;\r
  --app-font-mono: Menlo, monospace;\r
  --radius: 1rem;\r
  --primary-hex: #3b82f6;\r
}\r
\r
.dark {\r
  --background: 222 47% 11%;\r
  --foreground: 210 40% 98%;\r
\r
  --card: 222 47% 13%;\r
  --card-foreground: 210 40% 98%;\r
  --card-border: 217 33% 17%;\r
\r
  --popover: 222 47% 11%;\r
  --popover-foreground: 210 40% 98%;\r
  --popover-border: 217 33% 17%;\r
\r
  --primary: 217 91% 60%;\r
  --primary-foreground: 222 47% 11%;\r
\r
  --secondary: 217 33% 17%;\r
  --secondary-foreground: 210 40% 98%;\r
\r
  --muted: 217 33% 17%;\r
  --muted-foreground: 215 20% 65%;\r
\r
  --accent: 217 33% 17%;\r
  --accent-foreground: 210 40% 98%;\r
\r
  --destructive: 0 62.8% 30.6%;\r
  --destructive-foreground: 210 40% 98%;\r
\r
  --border: 217 33% 17%;\r
  --input: 217 33% 17%;\r
  --ring: 224 76% 48%;\r
\r
  --sidebar: 222 47% 11%;\r
  --sidebar-foreground: 240 4.8% 95.9%;\r
  --sidebar-primary: 224 76% 48%;\r
  --sidebar-primary-foreground: 0 0% 100%;\r
  --sidebar-accent: 240 3.7% 15.9%;\r
  --sidebar-accent-foreground: 240 4.8% 95.9%;\r
  --sidebar-border: 240 3.7% 15.9%;\r
  --sidebar-ring: 217 91% 60%;\r
}\r
\r
\r
@layer base {\r
  * {\r
    @apply border-border;\r
  }\r
  body {\r
    @apply font-sans antialiased bg-background text-foreground;\r
  }\r
}\r
\r
@media (orientation: landscape) {\r
  body {\r
    overflow-x: hidden;\r
  }\r
\r
  .landscape-scroll {\r
    height: calc(100dvh - 52px);\r
    overflow-y: auto;\r
    -webkit-overflow-scrolling: touch;\r
    overscroll-behavior-y: contain;\r
  }\r
\r
  #root > div {\r
    max-width: 100% !important;\r
    padding-bottom: 52px !important;\r
  }\r
}\r
\r
@keyframes runningText {\r
  0% { transform: translateX(100%); }\r
  40% { transform: translateX(0); }\r
  60% { transform: translateX(0); }\r
  100% { transform: translateX(-100%); }\r
}\r
\r
.running-text {\r
  animation: runningText 8s linear infinite;\r
  font-style: normal;\r
}\r
`,fr=`import React, { createContext, useContext, useState, useEffect } from "react";\r
import {\r
  onAuthStateChanged,\r
  signInWithEmailAndPassword,\r
  createUserWithEmailAndPassword,\r
  signOut,\r
  type User as FirebaseUser,\r
} from "firebase/auth";\r
import { auth } from "./firebase";\r
import type { UserRecord } from "./firestore";\r
\r
interface AuthContextType {\r
  firebaseUser: FirebaseUser | null;\r
  firebaseLoading: boolean;\r
  user: UserRecord | null;\r
  shift: string | null;\r
  loginTime: string | null;\r
  absenTime: string | null;\r
  login: (user: UserRecord, shift: string, absenTime?: string) => void;\r
  logout: () => void;\r
  firebaseLogin: (email: string, password: string) => Promise<void>;\r
  firebaseRegister: (email: string, password: string) => Promise<void>;\r
  firebaseLogout: () => Promise<void>;\r
}\r
\r
const AuthContext = createContext<AuthContextType | undefined>(undefined);\r
\r
export function AuthProvider({ children }: { children: React.ReactNode }) {\r
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);\r
  const [firebaseLoading, setFirebaseLoading] = useState(true);\r
  const [user, setUser] = useState<UserRecord | null>(null);\r
  const [shift, setShift] = useState<string | null>(null);\r
  const [loginTime, setLoginTime] = useState<string | null>(null);\r
  const [absenTime, setAbsenTime] = useState<string | null>(null);\r
\r
  useEffect(() => {\r
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {\r
      setFirebaseUser(fbUser);\r
      setFirebaseLoading(false);\r
      if (!fbUser) {\r
        setUser(null);\r
        setShift(null);\r
        setLoginTime(null);\r
        setAbsenTime(null);\r
        localStorage.removeItem("alfaza_user");\r
        localStorage.removeItem("alfaza_shift");\r
        localStorage.removeItem("alfaza_login_time");\r
        localStorage.removeItem("alfaza_absen_time");\r
      } else {\r
        const storedUser = localStorage.getItem("alfaza_user");\r
        const storedShift = localStorage.getItem("alfaza_shift");\r
        const storedLoginTime = localStorage.getItem("alfaza_login_time");\r
        const storedAbsenTime = localStorage.getItem("alfaza_absen_time");\r
        if (storedUser) setUser(JSON.parse(storedUser));\r
        if (storedShift) setShift(storedShift);\r
        if (storedLoginTime) setLoginTime(storedLoginTime);\r
        if (storedAbsenTime) setAbsenTime(storedAbsenTime);\r
      }\r
    });\r
    return () => unsubscribe();\r
  }, []);\r
\r
  const login = (newUser: UserRecord, newShift: string, serverAbsenTime?: string) => {\r
    const now = new Date();\r
    const h = now.getHours().toString().padStart(2, "0");\r
    const m = now.getMinutes().toString().padStart(2, "0");\r
    const s = now.getSeconds().toString().padStart(2, "0");\r
    const timeStr = \`\${h}.\${m}.\${s}\`;\r
    setUser(newUser);\r
    setShift(newShift);\r
    setLoginTime(timeStr);\r
    localStorage.setItem("alfaza_user", JSON.stringify(newUser));\r
    localStorage.setItem("alfaza_shift", newShift);\r
    localStorage.setItem("alfaza_login_time", timeStr);\r
\r
    const absen = serverAbsenTime || timeStr;\r
    setAbsenTime(absen);\r
    localStorage.setItem("alfaza_absen_time", absen);\r
  };\r
\r
  const logout = () => {\r
    setUser(null);\r
    setShift(null);\r
    setLoginTime(null);\r
    setAbsenTime(null);\r
    localStorage.removeItem("alfaza_user");\r
    localStorage.removeItem("alfaza_shift");\r
    localStorage.removeItem("alfaza_login_time");\r
    localStorage.removeItem("alfaza_absen_time");\r
  };\r
\r
  const firebaseLogin = async (email: string, password: string) => {\r
    await signInWithEmailAndPassword(auth, email, password);\r
  };\r
\r
  const firebaseRegister = async (email: string, password: string) => {\r
    await createUserWithEmailAndPassword(auth, email, password);\r
  };\r
\r
  const firebaseLogout = async () => {\r
    logout();\r
    await signOut(auth);\r
  };\r
\r
  return (\r
    <AuthContext.Provider\r
      value={{\r
        firebaseUser,\r
        firebaseLoading,\r
        user,\r
        shift,\r
        loginTime,\r
        absenTime,\r
        login,\r
        logout,\r
        firebaseLogin,\r
        firebaseRegister,\r
        firebaseLogout,\r
      }}\r
    >\r
      {children}\r
    </AuthContext.Provider>\r
  );\r
}\r
\r
export function useAuth() {\r
  const context = useContext(AuthContext);\r
  if (context === undefined) {\r
    throw new Error("useAuth must be used within an AuthProvider");\r
  }\r
  return context;\r
}\r
`,gr=`import { initializeApp } from "firebase/app";\r
import { getFirestore } from "firebase/firestore/lite";\r
import { getAuth } from "firebase/auth";\r
\r
const firebaseConfig = {\r
  apiKey: "AIzaSyAWLJbjFCpEsxNY8l6a-9cCDBR9E4vG-Ww",\r
  authDomain: "alfazalink-ecb76.firebaseapp.com",\r
  projectId: "alfazalink-ecb76",\r
  storageBucket: "alfazalink-ecb76.firebasestorage.app",\r
  messagingSenderId: "358049561649",\r
  appId: "1:358049561649:web:6334d4f0ca22a4ef452910",\r
};\r
\r
const app = initializeApp(firebaseConfig);\r
export const db = getFirestore(app);\r
export const auth = getAuth(app);\r
`,br=`import {\r
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc,\r
  setDoc\r
} from "firebase/firestore/lite";\r
import { db } from "./firebase";\r
import { getWibDate } from "./utils";\r
\r
export interface UserRecord {\r
  id: string;\r
  name: string;\r
  role: string;\r
  pin: string;\r
  isActive: boolean;\r
}\r
\r
export interface CategoryLabels {\r
  BANK: { name: string; visible: boolean };\r
  FLIP: { name: string; visible: boolean };\r
  APP: { name: string; visible: boolean };\r
  DANA: { name: string; visible: boolean };\r
  AKS: { name: string; visible: boolean };\r
  TARIK: { name: string; visible: boolean };\r
}\r
\r
export interface SettingsRecord {\r
  shopName: string;\r
  logoUrl: string;\r
  profilePhotoUrl: string;\r
  autoLockHour: number;\r
  autoLockMinute: number;\r
  autoResetHour: number;\r
  autoResetMinute: number;\r
  autoUnlockHour: number;\r
  autoUnlockMinute: number;\r
  mutiaraQuotes: string;\r
  runningText: string;\r
  pinEnabled: boolean;\r
  categoryLabels: CategoryLabels;\r
  lastLockDate?: string;\r
  lastResetDate?: string;\r
}\r
\r
\r
export interface TransactionRecord {\r
  id: string;\r
  kasirName: string;\r
  category: string;\r
  nominal: number;\r
  admin: number;\r
  keterangan: string;\r
  transDate: string;\r
  transTime: string;\r
  paymentMethod: string;\r
  nominalTunai?: number;\r
  adminTunai?: number;\r
  nominalNonTunai?: number;\r
  adminNonTunai?: number;\r
  createdAt: any;\r
}\r
\r
export interface SaldoHistoryRecord {\r
  id: string;\r
  kasirName: string;\r
  jenis: string;\r
  nominal: number;\r
  keterangan: string;\r
  saldoDate: string;\r
  saldoTime: string;\r
  createdAt: any;\r
}\r
\r
export interface BalanceRecord {\r
  bank: number;\r
  cash: number;\r
  tarik: number;\r
  aks: number;\r
  adminTotal: number;\r
  bankNonTunai: number;\r
  cashNonTunai: number;\r
  tarikNonTunai: number;\r
  aksNonTunai: number;\r
}\r
\r
export interface HutangRecord {\r
  id: string;\r
  nama: string;\r
  nominal: number;\r
  keterangan?: string;\r
  tanggal: string;\r
  lunas: boolean;\r
  tglLunas?: string;\r
  createdBy?: string;\r
}\r
\r
export interface KontakRecord {\r
  id: string;\r
  nama: string;\r
  nomor?: string;\r
  keterangan?: string;\r
  createdBy?: string;\r
}\r
\r
export interface AttendanceRecord {\r
  id: string;\r
  kasirName: string;\r
  tanggal: string;\r
  shift: string;\r
  jamMasuk: string;\r
  createdAt: any;\r
}\r
\r
export interface IzinRecord {\r
  id: string;\r
  nama: string;\r
  tanggal: string;\r
  alasan: string;\r
  status: string;\r
  createdAt: any;\r
}\r
\r
export interface DailyNoteRecord {\r
  sisaSaldoBank: number;\r
  saldoRealApp: number;\r
}\r
\r
export interface DailySnapshotRecord {\r
  locked: boolean;\r
  lockedAt?: any;\r
}\r
\r
export async function getUsers(): Promise<UserRecord[]> {\r
  const snap = await getDocs(collection(db, "users"));\r
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as UserRecord));\r
}\r
\r
export async function createUser(data: Omit<UserRecord, "id">): Promise<string> {\r
  const ref = await addDoc(collection(db, "users"), data);\r
  return ref.id;\r
}\r
\r
export async function updateUser(id: string, data: Partial<UserRecord>): Promise<void> {\r
  await updateDoc(doc(db, "users", id), data as any);\r
}\r
\r
export async function deleteUser(id: string): Promise<void> {\r
  await deleteDoc(doc(db, "users", id));\r
}\r
\r
export async function getSettings(): Promise<SettingsRecord> {\r
  const ref = doc(db, "settings", "main");\r
  const snap = await getDoc(ref);\r
  if (!snap.exists()) {\r
    const defaults: SettingsRecord = {\r
      shopName: "ALFAZA LINK",\r
      logoUrl: "",\r
      profilePhotoUrl: "",\r
      autoLockHour: 1,\r
      autoLockMinute: 0,\r
      autoResetHour: 2,\r
      autoResetMinute: 0,\r
      autoUnlockHour: 8,\r
      autoUnlockMinute: 0,\r
      mutiaraQuotes: "",\r
      runningText: "",\r
      pinEnabled: false,\r
      categoryLabels: {\r
        BANK: { name: "BANK", visible: true },\r
        FLIP: { name: "FLIP", visible: true },\r
        APP: { name: "APP", visible: true },\r
        DANA: { name: "DANA", visible: true },\r
        AKS: { name: "AKS", visible: true },\r
        TARIK: { name: "TARIK", visible: true },\r
      },\r
      lastLockDate: "",\r
      lastResetDate: "",\r
    };\r
\r
    await setDoc(ref, defaults);\r
    return defaults;\r
  }\r
  return snap.data() as SettingsRecord;\r
}\r
\r
export async function updateSettings(data: Partial<SettingsRecord>): Promise<void> {\r
  const ref = doc(db, "settings", "main");\r
  const snap = await getDoc(ref);\r
  if (!snap.exists()) {\r
    await setDoc(ref, data);\r
  } else {\r
    await updateDoc(ref, data as any);\r
  }\r
}\r
\r
export async function getTransactions(params: {\r
  kasirName?: string;\r
  startDate?: string;\r
  endDate?: string;\r
}): Promise<TransactionRecord[]> {\r
  const snap = await getDocs(collection(db, "transactions"));\r
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as TransactionRecord));\r
\r
  if (params.kasirName) {\r
    results = results.filter(t => t.kasirName === params.kasirName);\r
  }\r
  if (params.startDate) {\r
    results = results.filter(t => t.transDate >= params.startDate!);\r
  }\r
  if (params.endDate) {\r
    results = results.filter(t => t.transDate <= params.endDate!);\r
  }\r
  results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));\r
  return results;\r
}\r
\r
export async function createTransaction(data: Omit<TransactionRecord, "id" | "createdAt">): Promise<string> {\r
  const ref = await addDoc(collection(db, "transactions"), {\r
    ...data,\r
    createdAt: new Date().toISOString(),\r
  });\r
\r
  await updateBalance(data.kasirName, data);\r
\r
  return ref.id;\r
}\r
\r
export async function updateTransaction(id: string, data: Partial<TransactionRecord>): Promise<void> {\r
  const oldSnap = await getDoc(doc(db, "transactions", id));\r
  if (oldSnap.exists()) {\r
    const oldTx = oldSnap.data() as TransactionRecord;\r
    await reverseBalance(oldTx.kasirName, oldTx);\r
  }\r
  await updateDoc(doc(db, "transactions", id), data as any);\r
  const newSnap = await getDoc(doc(db, "transactions", id));\r
  if (newSnap.exists()) {\r
    const newTx = newSnap.data() as TransactionRecord;\r
    await updateBalance(newTx.kasirName, newTx);\r
  }\r
}\r
\r
export async function deleteTransaction(id: string): Promise<void> {\r
  const snap = await getDoc(doc(db, "transactions", id));\r
  if (snap.exists()) {\r
    const txData = snap.data() as TransactionRecord;\r
    await reverseBalance(txData.kasirName, txData);\r
  }\r
  await deleteDoc(doc(db, "transactions", id));\r
}\r
\r
async function updateBalance(kasirName: string, tx: Omit<TransactionRecord, "id" | "createdAt">) {\r
  const ref = doc(db, "balances", kasirName);\r
  const snap = await getDoc(ref);\r
  const bal: BalanceRecord = snap.exists()\r
    ? (snap.data() as BalanceRecord)\r
    : { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0 };\r
\r
  const isNonTunai = tx.paymentMethod && tx.paymentMethod.toLowerCase().includes("non-tunai");\r
  const nominal = tx.nominal || 0;\r
  const admin = tx.admin || 0;\r
\r
  if (tx.category === "NON TUNAI" || isNonTunai) {\r
    bal.bankNonTunai += nominal;\r
  } else if (["BANK", "FLIP", "APP PULSA", "DANA"].includes(tx.category)) {\r
    bal.cash += nominal;\r
    bal.bank -= nominal;\r
  } else if (tx.category === "TARIK TUNAI") {\r
    bal.tarik += nominal;\r
    bal.cash -= nominal;\r
  } else if (tx.category === "AKSESORIS") {\r
    bal.aks += nominal;\r
  }\r
\r
  if (!(tx.category === "NON TUNAI" || isNonTunai)) {\r
    bal.adminTotal += admin;\r
  }\r
\r
  if (snap.exists()) {\r
    await updateDoc(ref, bal as any);\r
  } else {\r
    await setDoc(ref, bal);\r
  }\r
}\r
\r
async function reverseBalance(kasirName: string, tx: TransactionRecord) {\r
  const ref = doc(db, "balances", kasirName);\r
  const snap = await getDoc(ref);\r
  if (!snap.exists()) return;\r
  const bal = snap.data() as BalanceRecord;\r
\r
  const isNonTunai = tx.paymentMethod && tx.paymentMethod.toLowerCase().includes("non-tunai");\r
  const nominal = tx.nominal || 0;\r
  const admin = tx.admin || 0;\r
\r
  if (tx.category === "NON TUNAI" || isNonTunai) {\r
    bal.bankNonTunai -= nominal;\r
  } else if (["BANK", "FLIP", "APP PULSA", "DANA"].includes(tx.category)) {\r
    bal.cash -= nominal;\r
    bal.bank += nominal;\r
  } else if (tx.category === "TARIK TUNAI") {\r
    bal.tarik -= nominal;\r
    bal.cash += nominal;\r
  } else if (tx.category === "AKSESORIS") {\r
    bal.aks -= nominal;\r
  }\r
\r
  if (!(tx.category === "NON TUNAI" || isNonTunai)) {\r
    bal.adminTotal -= admin;\r
  }\r
\r
  await updateDoc(ref, bal as any);\r
}\r
\r
export async function getBalance(kasirName: string): Promise<BalanceRecord> {\r
  const ref = doc(db, "balances", kasirName);\r
  const snap = await getDoc(ref);\r
  if (!snap.exists()) {\r
    return { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0 };\r
  }\r
  return snap.data() as BalanceRecord;\r
}\r
\r
export async function resetBalance(kasirName: string): Promise<void> {\r
  const ref = doc(db, "balances", kasirName);\r
  await setDoc(ref, { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0 });\r
}\r
\r
export async function getSaldoHistory(params: {\r
  kasirName?: string;\r
  startDate?: string;\r
  endDate?: string;\r
}): Promise<SaldoHistoryRecord[]> {\r
  const snap = await getDocs(collection(db, "saldo_history"));\r
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as SaldoHistoryRecord));\r
\r
  if (params.kasirName) {\r
    results = results.filter(s => s.kasirName === params.kasirName);\r
  }\r
  if (params.startDate) {\r
    results = results.filter(s => s.saldoDate >= params.startDate!);\r
  }\r
  if (params.endDate) {\r
    results = results.filter(s => s.saldoDate <= params.endDate!);\r
  }\r
  results.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));\r
  return results;\r
}\r
\r
export async function addSaldo(kasirName: string, data: {\r
  jenis: string;\r
  nominal: number;\r
  keterangan?: string;\r
}): Promise<string> {\r
  const now = new Date();\r
  const saldoDate = getWibDate();\r
  const saldoTime = now.toTimeString().substring(0, 5);\r
\r
  const ref = await addDoc(collection(db, "saldo_history"), {\r
    kasirName,\r
    jenis: data.jenis,\r
    nominal: data.nominal,\r
    keterangan: data.keterangan || \`Tambah Saldo \${data.jenis}\`,\r
    saldoDate,\r
    saldoTime,\r
    createdAt: new Date().toISOString(),\r
  });\r
\r
  const balRef = doc(db, "balances", kasirName);\r
  const balSnap = await getDoc(balRef);\r
  const bal: BalanceRecord = balSnap.exists()\r
    ? (balSnap.data() as BalanceRecord)\r
    : { bank: 0, cash: 0, tarik: 0, aks: 0, adminTotal: 0, bankNonTunai: 0, cashNonTunai: 0, tarikNonTunai: 0, aksNonTunai: 0 };\r
\r
  if (data.jenis === "Bank") {\r
    bal.bank += data.nominal;\r
  } else if (data.jenis === "Cash") {\r
    bal.cash += data.nominal;\r
  }\r
\r
  if (balSnap.exists()) {\r
    await updateDoc(balRef, bal as any);\r
  } else {\r
    await setDoc(balRef, bal);\r
  }\r
\r
  return ref.id;\r
}\r
\r
export async function addSaldoHistoryOnly(kasirName: string, data: {\r
  jenis: string;\r
  nominal: number;\r
  keterangan?: string;\r
}): Promise<string> {\r
  const now = new Date();\r
  const saldoDate = getWibDate();\r
  const saldoTime = now.toTimeString().substring(0, 5);\r
\r
  const ref = await addDoc(collection(db, "saldo_history"), {\r
    kasirName,\r
    jenis: data.jenis,\r
    nominal: data.nominal,\r
    keterangan: data.keterangan || \`Tambah \${data.jenis}\`,\r
    saldoDate,\r
    saldoTime,\r
    createdAt: new Date().toISOString(),\r
  });\r
  return ref.id;\r
}\r
\r
export async function getHutangList(): Promise<HutangRecord[]> {\r
  const snap = await getDocs(collection(db, "hutang"));\r
  const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as HutangRecord));\r
  results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));\r
  return results;\r
}\r
\r
export async function createHutang(data: Omit<HutangRecord, "id">): Promise<string> {\r
  const ref = await addDoc(collection(db, "hutang"), data);\r
  return ref.id;\r
}\r
\r
export async function updateHutang(id: string, data: Partial<HutangRecord>): Promise<void> {\r
  await updateDoc(doc(db, "hutang", id), data as any);\r
}\r
\r
export async function deleteHutang(id: string): Promise<void> {\r
  await deleteDoc(doc(db, "hutang", id));\r
}\r
\r
export async function getKontakList(): Promise<KontakRecord[]> {\r
  const snap = await getDocs(collection(db, "kontak"));\r
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as KontakRecord));\r
}\r
\r
export async function createKontak(data: Omit<KontakRecord, "id">): Promise<string> {\r
  const ref = await addDoc(collection(db, "kontak"), data);\r
  return ref.id;\r
}\r
\r
export async function updateKontak(id: string, data: Partial<KontakRecord>): Promise<void> {\r
  await updateDoc(doc(db, "kontak", id), data as any);\r
}\r
\r
export async function deleteKontak(id: string): Promise<void> {\r
  await deleteDoc(doc(db, "kontak", id));\r
}\r
\r
export async function getAttendance(params: {\r
  kasirName?: string;\r
  month?: string;\r
}): Promise<AttendanceRecord[]> {\r
  const snap = await getDocs(collection(db, "attendance"));\r
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as AttendanceRecord));\r
\r
  if (params.kasirName) {\r
    results = results.filter(a => a.kasirName === params.kasirName);\r
  }\r
  if (params.month) {\r
    results = results.filter(a => a.tanggal.startsWith(params.month!));\r
  }\r
  results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));\r
  return results;\r
}\r
\r
export async function createAttendance(data: Omit<AttendanceRecord, "id" | "createdAt">): Promise<string> {\r
  const ref = await addDoc(collection(db, "attendance"), {\r
    ...data,\r
    createdAt: new Date().toISOString(),\r
  });\r
  return ref.id;\r
}\r
\r
export async function getIzinList(params?: {\r
  month?: string;\r
  nama?: string;\r
}): Promise<IzinRecord[]> {\r
  const snap = await getDocs(collection(db, "izin"));\r
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as IzinRecord));\r
\r
  if (params?.month) {\r
    results = results.filter(i => i.tanggal.startsWith(params.month!));\r
  }\r
  if (params?.nama && params.nama !== "Semua") {\r
    results = results.filter(i => i.nama === params.nama);\r
  }\r
  results.sort((a, b) => (b.tanggal || "").localeCompare(a.tanggal || ""));\r
  return results;\r
}\r
\r
export async function createIzin(data: Omit<IzinRecord, "id" | "createdAt">): Promise<string> {\r
  const ref = await addDoc(collection(db, "izin"), {\r
    ...data,\r
    createdAt: new Date().toISOString(),\r
  });\r
  return ref.id;\r
}\r
\r
export async function updateIzin(id: string, data: Partial<IzinRecord>): Promise<void> {\r
  await updateDoc(doc(db, "izin", id), data as any);\r
}\r
\r
export async function getDailyNotes(kasirName: string, date: string): Promise<DailyNoteRecord> {\r
  const docId = \`\${kasirName}_\${date}\`;\r
  const ref = doc(db, "daily_notes", docId);\r
  const snap = await getDoc(ref);\r
  if (!snap.exists()) {\r
    return { sisaSaldoBank: 0, saldoRealApp: 0 };\r
  }\r
  return snap.data() as DailyNoteRecord;\r
}\r
\r
export async function updateDailyNote(\r
  kasirName: string,\r
  date: string,\r
  field: "sisaSaldoBank" | "saldoRealApp",\r
  amount: number\r
): Promise<DailyNoteRecord> {\r
  const docId = \`\${kasirName}_\${date}\`;\r
  const ref = doc(db, "daily_notes", docId);\r
  const snap = await getDoc(ref);\r
  const current: DailyNoteRecord = snap.exists()\r
    ? (snap.data() as DailyNoteRecord)\r
    : { sisaSaldoBank: 0, saldoRealApp: 0 };\r
\r
  current[field] = (current[field] || 0) + amount;\r
\r
  if (snap.exists()) {\r
    await updateDoc(ref, current as any);\r
  } else {\r
    await setDoc(ref, current);\r
  }\r
  return current;\r
}\r
\r
export async function setDailyNote(\r
  kasirName: string,\r
  date: string,\r
  field: "sisaSaldoBank" | "saldoRealApp",\r
  value: number\r
): Promise<DailyNoteRecord> {\r
  const docId = \`\${kasirName}_\${date}\`;\r
  const ref = doc(db, "daily_notes", docId);\r
  const snap = await getDoc(ref);\r
  const current: DailyNoteRecord = snap.exists()\r
    ? (snap.data() as DailyNoteRecord)\r
    : { sisaSaldoBank: 0, saldoRealApp: 0 };\r
\r
  current[field] = value;\r
\r
  if (snap.exists()) {\r
    await updateDoc(ref, current as any);\r
  } else {\r
    await setDoc(ref, current);\r
  }\r
  return current;\r
}\r
\r
export async function getDailySnapshot(kasirName: string, date: string): Promise<DailySnapshotRecord | null> {\r
  const docId = \`\${kasirName}_\${date}\`;\r
  const ref = doc(db, "daily_snapshots", docId);\r
  const snap = await getDoc(ref);\r
  if (!snap.exists()) return null;\r
  return snap.data() as DailySnapshotRecord;\r
}\r
\r
export async function lockReport(kasirName: string, date: string): Promise<void> {\r
  const docId = \`\${kasirName}_\${date}\`;\r
  const ref = doc(db, "daily_snapshots", docId);\r
  await setDoc(ref, { locked: true, lockedAt: new Date().toISOString() }, { merge: true });\r
}\r
\r
export async function unlockReport(kasirName: string, date: string): Promise<void> {\r
  const docId = \`\${kasirName}_\${date}\`;\r
  const ref = doc(db, "daily_snapshots", docId);\r
  await setDoc(ref, { locked: false }, { merge: true });\r
}\r
\r
export async function resetAllData(): Promise<void> {\r
  const colNames = ["transactions", "saldo_history", "balances", "hutang", "kontak", "attendance", "izin", "daily_notes", "daily_snapshots"];\r
  for (const col of colNames) {\r
    const snap = await getDocs(collection(db, col));\r
    for (const d of snap.docs) {\r
      await deleteDoc(d.ref);\r
    }\r
  }\r
}\r
\r
export async function loginUser(name: string, pin?: string, shift?: string, deviceTime?: string): Promise<{\r
  success: boolean;\r
  user?: UserRecord;\r
  role?: string;\r
  absenTime?: string;\r
  message?: string;\r
}> {\r
  const users = await getUsers();\r
  const user = users.find(u => u.name === name && u.isActive);\r
  if (!user) return { success: false, message: "User tidak ditemukan" };\r
\r
  const settings = await getSettings();\r
  if (settings.pinEnabled && user.role !== "owner") {\r
    if (!pin || pin !== user.pin) {\r
      return { success: false, message: "PIN salah" };\r
    }\r
  }\r
\r
  if (user.role !== "owner" && shift) {\r
    const today = getWibDate();\r
    const now = new Date();\r
    const jamMasuk = deviceTime || now.toTimeString().substring(0, 5);\r
\r
    const allAttendance = await getDocs(collection(db, "attendance"));\r
    const alreadyExists = allAttendance.docs.some(d => {\r
      const data = d.data();\r
      return data.kasirName === name && data.tanggal === today && data.shift === shift;\r
    });\r
    if (!alreadyExists) {\r
      await createAttendance({\r
        kasirName: name,\r
        tanggal: today,\r
        shift,\r
        jamMasuk,\r
      });\r
    }\r
  }\r
\r
  const absenTime = deviceTime || new Date().toTimeString().substring(0, 5);\r
\r
  return {\r
    success: true,\r
    user,\r
    role: user.role,\r
    absenTime,\r
  };\r
}\r
`,xr=`import { clsx, type ClassValue } from "clsx"\r
import { twMerge } from "tailwind-merge"\r
\r
export function cn(...inputs: ClassValue[]) {\r
  return twMerge(clsx(inputs))\r
}\r
\r
export function getWibDate(): string {\r
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });\r
}\r
\r
export function getWibDateTime(): Date {\r
  const now = new Date();\r
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));\r
}\r
\r
export function formatRupiah(amount: number | string | undefined): string {\r
  if (amount === undefined || amount === null) return "Rp 0";\r
  const num = typeof amount === "string" ? parseFloat(amount) : amount;\r
  if (isNaN(num)) return "Rp 0";\r
\r
  const isNegative = num < 0;\r
  const absNum = Math.abs(num);\r
  const formatted = absNum.toString().replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");\r
  return \`\${isNegative ? "-" : ""}Rp \${formatted}\`;\r
}\r
\r
export function formatThousands(value: string): string {\r
  const digits = value.replace(/\\D/g, "");\r
  if (!digits) return "";\r
  return digits.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ".");\r
}\r
\r
export function parseThousands(formatted: string): string {\r
  return formatted.replace(/\\./g, "");\r
}\r
\r
export function generateUniqueId() {\r
  return Math.random().toString(36).substring(2, 9).toUpperCase();\r
}\r
`,hr=`import { createRoot } from "react-dom/client";\r
import App from "./App";\r
import "./index.css";\r
\r
createRoot(document.getElementById("root")!).render(<App />);\r
\r
if ("serviceWorker" in navigator) {\r
  window.addEventListener("load", () => {\r
    navigator.serviceWorker.register("/sw.js").catch(() => {});\r
  });\r
}\r
`,vr=`import { useState, useRef, useEffect, useCallback } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { useLocation } from "wouter";\r
import { Header } from "@/components/layout/header";\r
import { AddSaldoModal } from "@/components/modals/add-saldo-modal";\r
import { getBalance, createTransaction, getSettings, type BalanceRecord, type SettingsRecord } from "@/lib/firestore";\r
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";\r
import { Landmark, Wallet, ArrowDownToLine, Gem, RefreshCw, Send, Plus, Lock, Save, ClipboardList, BookUser, Settings } from "lucide-react";\r
import { useToast } from "@/hooks/use-toast";\r
\r
const DEFAULT_QUOTES = [\r
  "Kerja keras hari ini, kemudahan esok hari",\r
  "Semangat adalah kunci keberhasilan",\r
  "Pelayanan terbaik adalah investasi terbaik",\r
];\r
\r
const CATEGORIES = [\r
  { id: "BANK", label: "Bank", icon: Landmark, activeColor: "bg-primary text-white shadow-primary/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },\r
  { id: "FLIP", label: "Flip", icon: RefreshCw, activeColor: "bg-orange-500 text-white shadow-orange-500/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },\r
  { id: "APP PULSA", label: "App", icon: Send, activeColor: "bg-purple-600 text-white shadow-purple-600/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },\r
  { id: "DANA", label: "Dana", icon: Wallet, activeColor: "bg-sky-500 text-white shadow-sky-500/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },\r
  { id: "TARIK TUNAI", label: "Tarik", icon: ArrowDownToLine, activeColor: "bg-emerald-600 text-white shadow-emerald-600/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },\r
  { id: "AKSESORIS", label: "Aks", icon: Gem, activeColor: "bg-rose-500 text-white shadow-rose-500/40", inactiveColor: "bg-white text-gray-400 border border-gray-100" },\r
];\r
\r
export default function Beranda() {\r
  const { user } = useAuth();\r
  const [, setLocation] = useLocation();\r
  const [isSaldoModalOpen, setIsSaldoModalOpen] = useState(false);\r
  const [category, setCategory] = useState("BANK");\r
  const [nominalDisplay, setNominalDisplay] = useState("");\r
  const [adminDisplay, setAdminDisplay] = useState("");\r
  const [keterangan, setKeterangan] = useState("");\r
  const [balance, setBalance] = useState<BalanceRecord | null>(null);\r
  const [shopSettings, setShopSettings] = useState<SettingsRecord | null>(null);\r
  const [saving, setSaving] = useState(false);\r
\r
  const nominalRef = useRef<HTMLInputElement>(null);\r
  const adminRef = useRef<HTMLInputElement>(null);\r
  const ketRef = useRef<HTMLInputElement>(null);\r
\r
  const { toast } = useToast();\r
\r
  const loadBalance = useCallback(async () => {\r
    if (!user?.name) return;\r
    try {\r
      const bal = await getBalance(user.name);\r
      setBalance(bal);\r
    } catch {}\r
  }, [user?.name]);\r
\r
  useEffect(() => {\r
    loadBalance();\r
    getSettings().then(setShopSettings).catch(() => {});\r
    const interval = setInterval(loadBalance, 5000);\r
    return () => clearInterval(interval);\r
  }, [loadBalance]);\r
\r
  const [mutiaraIndex] = useState(() => Math.floor(Math.random() * 100));\r
\r
  const getMutiaraQuote = () => {\r
    const quotesStr = shopSettings?.mutiaraQuotes || "";\r
    const customQuotes = quotesStr.split("\\n").map(q => q.trim()).filter(q => q.length > 0);\r
    const allQuotes = customQuotes.length > 0 ? customQuotes : DEFAULT_QUOTES;\r
    return allQuotes[mutiaraIndex % allQuotes.length];\r
  };\r
\r
  const handleProses = useCallback(async () => {\r
    if (!user) return;\r
    const now = new Date();\r
    const dateStr = getWibDate();\r
    const timeStr = now.toTimeString().substring(0, 5);\r
    const n = parseInt(parseThousands(nominalDisplay));\r
    const a = parseInt(parseThousands(adminDisplay)) || 0;\r
    if (!n || n <= 0) {\r
      toast({ title: "Nominal harus diisi", variant: "destructive" });\r
      return;\r
    }\r
    setSaving(true);\r
    try {\r
      await createTransaction({\r
        kasirName: user.name,\r
        category,\r
        keterangan,\r
        transDate: dateStr,\r
        transTime: timeStr,\r
        paymentMethod: "tunai",\r
        nominal: n,\r
        admin: a,\r
        nominalTunai: n,\r
        adminTunai: a,\r
      });\r
      toast({ title: "Transaksi berhasil disimpan" });\r
      setNominalDisplay("");\r
      setAdminDisplay("");\r
      setKeterangan("");\r
      nominalRef.current?.focus();\r
      await loadBalance();\r
    } catch (err: any) {\r
      toast({ title: "Gagal menyimpan transaksi", description: err.message, variant: "destructive" });\r
    } finally {\r
      setSaving(false);\r
    }\r
  }, [user, nominalDisplay, adminDisplay, category, keterangan, toast, loadBalance]);\r
\r
  useEffect(() => {\r
    const handleKeyDown = (e: KeyboardEvent) => {\r
      const active = document.activeElement;\r
      const isInput = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement;\r
      if (isInput) return;\r
\r
      const catIdx = CATEGORIES.findIndex(c => c.id === category);\r
      if (e.key === "ArrowLeft" && catIdx > 0) {\r
        e.preventDefault();\r
        setCategory(CATEGORIES[catIdx - 1].id);\r
      } else if (e.key === "ArrowRight" && catIdx < CATEGORIES.length - 1) {\r
        e.preventDefault();\r
        setCategory(CATEGORIES[catIdx + 1].id);\r
      } else if (e.key === "ArrowUp" && catIdx >= 3) {\r
        e.preventDefault();\r
        setCategory(CATEGORIES[catIdx - 3].id);\r
      } else if (e.key === "ArrowDown" && catIdx + 3 < CATEGORIES.length) {\r
        e.preventDefault();\r
        setCategory(CATEGORIES[catIdx + 3].id);\r
      } else if (e.key === "Tab") {\r
        e.preventDefault();\r
        const nextIdx = (catIdx + 1) % CATEGORIES.length;\r
        setCategory(CATEGORIES[nextIdx].id);\r
      }\r
    };\r
    window.addEventListener("keydown", handleKeyDown);\r
    return () => window.removeEventListener("keydown", handleKeyDown);\r
  }, [category]);\r
\r
  return (\r
    <div className="px-3 pt-3 pb-2 landscape-scroll">\r
      <Header />\r
\r
      {shopSettings?.runningText && (\r
        <div className="overflow-hidden mb-3">\r
          <div className="running-text text-red-600 text-sm font-bold text-center">\r
            {shopSettings.runningText}\r
          </div>\r
        </div>\r
      )}\r
\r
      <div className="grid grid-cols-2 gap-2.5 mb-3">\r
        <div className="bg-gradient-to-br from-blue-900 to-primary rounded-2xl p-3 text-white shadow-md relative overflow-hidden">\r
          <div className="absolute -right-3 -top-3 w-12 h-12 bg-white/10 rounded-full" />\r
          <p className="text-[10px] font-semibold opacity-90 mb-0.5 flex items-center gap-1">\r
            <Landmark className="w-3 h-3" /> SALDO BANK\r
          </p>\r
          <h3 className="text-xl font-extrabold">{formatRupiah(balance?.bank || 0)}</h3>\r
        </div>\r
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-500 rounded-2xl p-3 text-white shadow-md relative overflow-hidden">\r
          <div className="absolute -right-3 -bottom-3 w-12 h-12 bg-white/10 rounded-full" />\r
          <p className="text-[10px] font-semibold opacity-90 mb-0.5 flex items-center gap-1">\r
            <Wallet className="w-3 h-3" /> SALDO CASH\r
          </p>\r
          <h3 className="text-xl font-extrabold">{formatRupiah(balance?.cash || 0)}</h3>\r
        </div>\r
      </div>\r
\r
      <div className="flex gap-2 mb-3">\r
        <div className="flex-1 bg-card border border-border rounded-xl py-2 px-2 text-center shadow-sm">\r
          <span className="text-[8px] font-bold text-muted-foreground block uppercase flex items-center justify-center gap-0.5">\r
            <ArrowDownToLine className="w-2.5 h-2.5" /> Tarik Tunai\r
          </span>\r
          <span className="text-xs font-extrabold text-foreground block">{formatRupiah(balance?.tarik || 0)}</span>\r
        </div>\r
        <div className="flex-1 bg-card border border-border rounded-xl py-2 px-2 text-center shadow-sm">\r
          <span className="text-[8px] font-bold text-muted-foreground block uppercase flex items-center justify-center gap-0.5">\r
            <Gem className="w-2.5 h-2.5" /> Aksesoris\r
          </span>\r
          <span className="text-xs font-extrabold text-foreground block">{formatRupiah(balance?.aks || 0)}</span>\r
        </div>\r
        <div className="flex-1 bg-card border border-border rounded-xl py-2 px-2 text-center shadow-sm">\r
          <span className="text-[8px] font-bold text-muted-foreground block uppercase flex items-center justify-center gap-0.5">\r
            <Lock className="w-2.5 h-2.5" /> Admin\r
          </span>\r
          <span className="text-xs font-extrabold text-foreground block">{formatRupiah(balance?.adminTotal || 0)}</span>\r
        </div>\r
      </div>\r
\r
\r
      <div className="flex gap-2 mb-3">\r
        <button onClick={() => setLocation("/catatan")} className="flex-1 bg-emerald-500 text-white py-2 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition">\r
          <ClipboardList className="w-3.5 h-3.5" /> KASBON\r
        </button>\r
        <button onClick={() => setIsSaldoModalOpen(true)} className="flex-1 bg-primary text-white py-2 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition">\r
          <Plus className="w-3.5 h-3.5" /> +Saldo\r
        </button>\r
        <button onClick={() => setLocation("/catatan?tab=kontak")} className="flex-1 bg-teal-500 text-white py-2 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition">\r
          <BookUser className="w-3.5 h-3.5" /> KONTAK\r
        </button>\r
      </div>\r
\r
      <div className="bg-gradient-to-r from-orange-500 to-amber-400 text-white text-center py-2 rounded-xl mb-3 text-[11px] font-bold">\r
        {getMutiaraQuote()}\r
      </div>\r
\r
      {user?.role !== "owner" && (\r
        <div className="grid grid-cols-6 gap-2 mb-3 px-1">\r
          {CATEGORIES.map((cat) => {\r
            const Icon = cat.icon;\r
            const isActive = category === cat.id;\r
            return (\r
              <button\r
                key={cat.id}\r
                onClick={() => setCategory(cat.id)}\r
                className="flex flex-col items-center gap-1 transition-all"\r
              >\r
                <div className={\`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-all \${isActive ? cat.activeColor + ' shadow-lg scale-110' : 'bg-card text-muted-foreground border border-border'}\`}>\r
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.5} />\r
                </div>\r
                <span className={\`text-[10px] font-bold \${isActive ? 'text-primary' : 'text-foreground opacity-80'}\`}>{cat.label}</span>\r
\r
              </button>\r
            );\r
          })}\r
        </div>\r
      )}\r
\r
      {user?.role === "owner" && (\r
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border text-center">\r
          <button\r
            onClick={() => setLocation("/owner")}\r
            className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition"\r
          >\r
            <Settings className="w-4 h-4" />\r
            BUKA PANEL OWNER\r
          </button>\r
        </div>\r
      )}\r
\r
\r
      {user?.role !== "owner" && (\r
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border">\r
          <div className="space-y-3 mb-4">\r
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-12 bg-muted/30">\r
              <span className="text-primary font-bold text-sm">Rp</span>\r
              <input\r
                ref={nominalRef}\r
                type="text"\r
                inputMode="numeric"\r
                placeholder="Nominal"\r
                value={nominalDisplay}\r
                onChange={(e) => setNominalDisplay(formatThousands(e.target.value))}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adminRef.current?.focus(); } }}\r
                className="flex-1 bg-transparent outline-none text-base font-bold text-foreground placeholder:text-muted-foreground placeholder:font-normal"\r
              />\r
            </div>\r
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-muted/30">\r
              <span className="text-amber-500 font-bold text-sm">%</span>\r
              <input\r
                ref={adminRef}\r
                type="text"\r
                inputMode="numeric"\r
                placeholder="Admin"\r
                value={adminDisplay}\r
                onChange={(e) => setAdminDisplay(formatThousands(e.target.value))}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ketRef.current?.focus(); } }}\r
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"\r
              />\r
            </div>\r
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 h-11 bg-muted/30">\r
              <span className="text-blue-400 text-sm">📝</span>\r
              <input\r
                ref={ketRef}\r
                placeholder="Keterangan"\r
                value={keterangan}\r
                onChange={(e) => setKeterangan(e.target.value)}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleProses(); } }}\r
                className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"\r
              />\r
            </div>\r
          </div>\r
\r
\r
          <button\r
            onClick={handleProses}\r
            disabled={saving}\r
            className="w-full h-12 rounded-2xl font-bold text-sm bg-gradient-to-r from-blue-500 to-blue-700 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50"\r
          >\r
            <Save className="w-4 h-4" />\r
            {saving ? "MEMPROSES..." : "SIMPAN TRANSAKSI"}\r
          </button>\r
        </div>\r
      )}\r
\r
      <AddSaldoModal\r
        open={isSaldoModalOpen}\r
        onOpenChange={setIsSaldoModalOpen}\r
        kasirName={user?.name || ""}\r
        isOwner={user?.role === "owner"}\r
      />\r
    </div>\r
  );\r
}\r
`,yr=`import { useState, useEffect, useMemo, useCallback } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { Header } from "@/components/layout/header";\r
import { getHutangList, createHutang, updateHutang, deleteHutang, getKontakList, createKontak, updateKontak, deleteKontak, type HutangRecord, type KontakRecord } from "@/lib/firestore";\r
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";\r
import { useToast } from "@/hooks/use-toast";\r
import { Receipt, BookUser, Plus, Trash2, Edit, Check, Search, Ban, Phone, Copy } from "lucide-react";\r
\r
export default function Catatan() {\r
  const { user } = useAuth();\r
  const { toast } = useToast();\r
\r
  const searchParams = new URLSearchParams(window.location.search);\r
  const tabParam = searchParams.get("tab");\r
  const [tab, setTab] = useState<"kasbon" | "kontak">(tabParam === "kontak" ? "kontak" : "kasbon");\r
\r
  const [hutangList, setHutangList] = useState<HutangRecord[]>([]);\r
  const [kontakList, setKontakList] = useState<KontakRecord[]>([]);\r
  const [loading, setLoading] = useState(true);\r
  const [searchText, setSearchText] = useState("");\r
\r
  const [showForm, setShowForm] = useState(false);\r
  const [editItem, setEditItem] = useState<HutangRecord | KontakRecord | null>(null);\r
\r
  const [nama, setNama] = useState("");\r
  const [nominalDisplay, setNominalDisplay] = useState("");\r
  const [keterangan, setKeterangan] = useState("");\r
  const [nomor, setNomor] = useState("");\r
  const [saving, setSaving] = useState(false);\r
  const [showLunas, setShowLunas] = useState(false);\r
\r
  const loadData = useCallback(async () => {\r
    try {\r
      const [h, k] = await Promise.all([getHutangList(), getKontakList()]);\r
      setHutangList(h);\r
      setKontakList(k);\r
      setLoading(false);\r
    } catch {\r
      setLoading(false);\r
    }\r
  }, []);\r
\r
  useEffect(() => { loadData(); }, [loadData]);\r
\r
  const resetForm = () => {\r
    setNama("");\r
    setNominalDisplay("");\r
    setKeterangan("");\r
    setNomor("");\r
    setEditItem(null);\r
    setShowForm(false);\r
  };\r
\r
  const handleSaveKasbon = async () => {\r
    if (!nama.trim()) { toast({ title: "Nama harus diisi", variant: "destructive" }); return; }\r
    const n = parseInt(parseThousands(nominalDisplay));\r
    if (!n || n <= 0) { toast({ title: "Nominal harus diisi", variant: "destructive" }); return; }\r
    setSaving(true);\r
    try {\r
      if (editItem && "nominal" in editItem) {\r
        await updateHutang(editItem.id, { nama, nominal: n, keterangan });\r
      } else {\r
        await createHutang({ nama, nominal: n, keterangan, tanggal: getWibDate(), lunas: false, createdBy: user?.name });\r
      }\r
      toast({ title: editItem ? "Kasbon diperbarui" : "Kasbon ditambahkan" });\r
      resetForm();\r
      await loadData();\r
    } catch {\r
      toast({ title: "Gagal menyimpan", variant: "destructive" });\r
    } finally { setSaving(false); }\r
  };\r
\r
  const handleSaveKontak = async () => {\r
    if (!nama.trim()) { toast({ title: "Nama harus diisi", variant: "destructive" }); return; }\r
    setSaving(true);\r
    try {\r
      if (editItem && "nomor" in editItem) {\r
        await updateKontak(editItem.id, { nama, nomor, keterangan });\r
      } else {\r
        await createKontak({ nama, nomor, keterangan, createdBy: user?.name });\r
      }\r
      toast({ title: editItem ? "Kontak diperbarui" : "Kontak ditambahkan" });\r
      resetForm();\r
      await loadData();\r
    } catch {\r
      toast({ title: "Gagal menyimpan", variant: "destructive" });\r
    } finally { setSaving(false); }\r
  };\r
\r
  const handleDeleteKasbon = async (id: string) => {\r
    if (!confirm("Hapus kasbon ini?")) return;\r
    try {\r
      await deleteHutang(id);\r
      toast({ title: "Kasbon dihapus" });\r
      await loadData();\r
    } catch { toast({ title: "Gagal menghapus", variant: "destructive" }); }\r
  };\r
\r
  const handleDeleteKontak = async (id: string) => {\r
    if (!confirm("Hapus kontak ini?")) return;\r
    try {\r
      await deleteKontak(id);\r
      toast({ title: "Kontak dihapus" });\r
      await loadData();\r
    } catch { toast({ title: "Gagal menghapus", variant: "destructive" }); }\r
  };\r
\r
  const handleLunas = async (h: HutangRecord) => {\r
    try {\r
      await updateHutang(h.id, { lunas: !h.lunas, tglLunas: !h.lunas ? getWibDate() : undefined });\r
      toast({ title: h.lunas ? "Dibatalkan lunas" : "Ditandai lunas" });\r
      await loadData();\r
    } catch { toast({ title: "Gagal", variant: "destructive" }); }\r
  };\r
\r
  const openEditKasbon = (h: HutangRecord) => {\r
    setEditItem(h);\r
    setNama(h.nama);\r
    setNominalDisplay(formatThousands(String(h.nominal)));\r
    setKeterangan(h.keterangan || "");\r
    setShowForm(true);\r
  };\r
\r
  const openEditKontak = (k: KontakRecord) => {\r
    setEditItem(k);\r
    setNama(k.nama);\r
    setNomor(k.nomor || "");\r
    setKeterangan(k.keterangan || "");\r
    setShowForm(true);\r
  };\r
\r
  const filteredHutang = useMemo(() => {\r
    let list = hutangList;\r
    if (!showLunas) list = list.filter(h => !h.lunas);\r
    if (searchText) {\r
      const q = searchText.toLowerCase();\r
      list = list.filter(h => h.nama.toLowerCase().includes(q) || (h.keterangan || "").toLowerCase().includes(q));\r
    }\r
    return list;\r
  }, [hutangList, showLunas, searchText]);\r
\r
  const filteredKontak = useMemo(() => {\r
    if (!searchText) return kontakList;\r
    const q = searchText.toLowerCase();\r
    return kontakList.filter(k => k.nama.toLowerCase().includes(q) || (k.nomor || "").toLowerCase().includes(q));\r
  }, [kontakList, searchText]);\r
\r
  const totalHutang = filteredHutang.filter(h => !h.lunas).reduce((sum, h) => sum + h.nominal, 0);\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20">\r
      <Header />\r
\r
      <div className="flex gap-2 mb-3">\r
        <button onClick={() => { setTab("kasbon"); resetForm(); setSearchText(""); }} className={\`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition \${tab === "kasbon" ? "bg-emerald-600 text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}>\r
          <Receipt className="w-4 h-4" /> Kasbon\r
        </button>\r
        <button onClick={() => { setTab("kontak"); resetForm(); setSearchText(""); }} className={\`flex-1 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-1 transition \${tab === "kontak" ? "bg-teal-600 text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}>\r
          <BookUser className="w-4 h-4" /> Kontak\r
        </button>\r
      </div>\r
\r
      <div className="flex items-center gap-2 mb-3">\r
        <div className="flex-1 relative">\r
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />\r
          <input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="Cari..." className="w-full pl-9 pr-3 py-2 rounded-full border-2 border-gray-200 text-sm bg-white outline-none" />\r
        </div>\r
        <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-blue-600 text-white rounded-full p-2 shadow">\r
          <Plus className="w-5 h-5" />\r
        </button>\r
      </div>\r
\r
      {tab === "kasbon" && (\r
        <>\r
          <div className="flex justify-between items-center mb-2">\r
            <span className="text-xs text-gray-500 font-semibold">Total Hutang: <strong className="text-red-600">{formatRupiah(totalHutang)}</strong></span>\r
            <button onClick={() => setShowLunas(!showLunas)} className={\`text-[10px] px-2.5 py-1 rounded-full border font-semibold \${showLunas ? 'bg-green-50 border-green-300 text-green-600' : 'bg-gray-50 border-gray-300 text-gray-500'}\`}>\r
              {showLunas ? "Sembunyikan Lunas" : "Tampilkan Lunas"}\r
            </button>\r
          </div>\r
\r
          {filteredHutang.length === 0 ? (\r
            <div className="text-center py-10 text-gray-400">\r
              <Receipt className="w-10 h-10 mx-auto mb-2 text-gray-300" />\r
              <p className="text-sm">Tidak ada kasbon</p>\r
            </div>\r
          ) : (\r
            filteredHutang.map(h => (\r
              <div key={h.id} className={\`bg-white rounded-2xl p-3.5 mb-2 shadow-sm border \${h.lunas ? 'border-green-200 bg-green-50/50' : 'border-gray-100'}\`}>\r
                <div className="flex justify-between items-start mb-1">\r
                  <div>\r
                    <span className="font-bold text-sm text-gray-800">{h.nama}</span>\r
                    {h.keterangan && <p className="text-[11px] text-gray-500 mt-0.5">{h.keterangan}</p>}\r
                  </div>\r
                  <span className={\`font-extrabold text-sm \${h.lunas ? 'text-green-600 line-through' : 'text-red-600'}\`}>{formatRupiah(h.nominal)}</span>\r
                </div>\r
                <div className="flex items-center justify-between mt-2">\r
                  <div className="flex flex-col">\r
                    <span className="text-[10px] text-gray-400">{h.tanggal}{h.lunas && h.tglLunas ? \` • Lunas: \${h.tglLunas}\` : ""}</span>\r
                    {h.createdBy && <span className="text-[10px] text-blue-400 mt-0.5">Dibuat oleh: {h.createdBy}</span>}\r
                  </div>\r
                  <div className="flex gap-1.5">\r
                    <button onClick={() => handleLunas(h)} className={\`text-[10px] px-2 py-1 rounded-lg font-bold \${h.lunas ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}\`}>\r
                      {h.lunas ? <Ban className="w-3 h-3 inline" /> : <Check className="w-3 h-3 inline" />} {h.lunas ? "Batal" : "Lunas"}\r
                    </button>\r
                    <button onClick={() => openEditKasbon(h)} className="text-[10px] px-2 py-1 rounded-lg font-bold bg-blue-100 text-blue-600"><Edit className="w-3 h-3 inline" /></button>\r
                    <button onClick={() => handleDeleteKasbon(h.id)} className="text-[10px] px-2 py-1 rounded-lg font-bold bg-red-100 text-red-600"><Trash2 className="w-3 h-3 inline" /></button>\r
                  </div>\r
                </div>\r
              </div>\r
            ))\r
          )}\r
        </>\r
      )}\r
\r
      {tab === "kontak" && (\r
        <>\r
          {filteredKontak.length === 0 ? (\r
            <div className="text-center py-10 text-gray-400">\r
              <BookUser className="w-10 h-10 mx-auto mb-2 text-gray-300" />\r
              <p className="text-sm">Tidak ada kontak</p>\r
            </div>\r
          ) : (\r
            filteredKontak.map(k => (\r
              <div key={k.id} className="bg-white rounded-2xl p-3.5 mb-2 shadow-sm border border-gray-100">\r
                <div className="flex justify-between items-start">\r
                  <div className="flex-1 min-w-0">\r
                    <span className="font-bold text-sm text-gray-800">{k.nama}</span>\r
                    {k.nomor && (\r
                      <div className="flex items-center gap-2 mt-1">\r
                        <p className="text-base font-bold text-blue-600 flex items-center gap-1"><Phone className="w-4 h-4" /> {k.nomor}</p>\r
                        <button onClick={() => { navigator.clipboard.writeText(k.nomor || ""); toast({ title: "Nomor disalin" }); }} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-0.5 active:scale-95 transition">\r
                          <Copy className="w-3 h-3" /> Copy\r
                        </button>\r
                      </div>\r
                    )}\r
                    {k.keterangan && <p className="text-[11px] text-gray-500 mt-0.5">{k.keterangan}</p>}\r
                    {k.createdBy && <p className="text-[10px] text-blue-400 mt-0.5">Dibuat oleh: {k.createdBy}</p>}\r
                  </div>\r
                  <div className="flex gap-1.5 flex-shrink-0 ml-2">\r
                    <button onClick={() => openEditKontak(k)} className="text-[10px] px-2 py-1 rounded-lg font-bold bg-blue-100 text-blue-600"><Edit className="w-3 h-3 inline" /></button>\r
                    <button onClick={() => handleDeleteKontak(k.id)} className="text-[10px] px-2 py-1 rounded-lg font-bold bg-red-100 text-red-600"><Trash2 className="w-3 h-3 inline" /></button>\r
                  </div>\r
                </div>\r
              </div>\r
            ))\r
          )}\r
        </>\r
      )}\r
\r
      {showForm && (\r
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => resetForm()}>\r
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>\r
            <div className="flex justify-between mb-3">\r
              <h3 className="font-bold text-base">{editItem ? "Edit" : "Tambah"} {tab === "kasbon" ? "Kasbon" : "Kontak"}</h3>\r
              <button onClick={resetForm} className="text-xl text-gray-400">&times;</button>\r
            </div>\r
            <div className="space-y-3 mb-4">\r
              <input value={nama} onChange={e => setNama(e.target.value)} placeholder="Nama" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />\r
              {tab === "kasbon" && (\r
                <input value={nominalDisplay} onChange={e => setNominalDisplay(formatThousands(e.target.value))} inputMode="numeric" placeholder="Nominal" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />\r
              )}\r
              {tab === "kontak" && (\r
                <input value={nomor} onChange={e => setNomor(e.target.value)} inputMode="tel" placeholder="Nomor HP" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />\r
              )}\r
              <input value={keterangan} onChange={e => setKeterangan(e.target.value)} placeholder="Keterangan" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />\r
            </div>\r
            <button onClick={tab === "kasbon" ? handleSaveKasbon : handleSaveKontak} disabled={saving} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-full text-sm disabled:opacity-60">\r
              {saving ? "Menyimpan..." : "Simpan"}\r
            </button>\r
          </div>\r
        </div>\r
      )}\r
    </div>\r
  );\r
}\r
`,Nr=`import { useState, useEffect, useCallback, useRef } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { Header } from "@/components/layout/header";\r
import {\r
  getTransactions, getSaldoHistory, getDailySnapshot, getDailyNotes,\r
  lockReport, resetBalance, getUsers,\r
  type TransactionRecord, type SaldoHistoryRecord, type DailyNoteRecord, type UserRecord\r
} from "@/lib/firestore";\r
import { formatRupiah, getWibDate } from "@/lib/utils";\r
import { useToast } from "@/hooks/use-toast";\r
import { Lock, Download, Share2, Loader2, RotateCcw } from "lucide-react";\r
\r
export default function Laporan() {\r
  const { user, shift } = useAuth();\r
  const { toast } = useToast();\r
  const today = getWibDate();\r
  const now = new Date();\r
\r
  const isOwner = user?.role === "owner";\r
\r
  const [date, setDate] = useState(today);\r
  const [month, setMonth] = useState(() => \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);\r
  const [viewMode, setViewMode] = useState<"day" | "month">("day");\r
  const [kasirFilter, setKasirFilter] = useState("Semua");\r
  const [kasirList, setKasirList] = useState<UserRecord[]>([]);\r
\r
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);\r
  const [saldoHistory, setSaldoHistory] = useState<SaldoHistoryRecord[]>([]);\r
  const [isLocked, setIsLocked] = useState(false);\r
  const [resetting, setResetting] = useState(false);\r
  const [loading, setLoading] = useState(true);\r
  const [locking, setLocking] = useState(false);\r
  const [dailyNotes, setDailyNotes] = useState<DailyNoteRecord>({ sisaSaldoBank: 0, saldoRealApp: 0 });\r
\r
  const reportRef = useRef<HTMLDivElement>(null);\r
\r
  useEffect(() => {\r
    if (isOwner) {\r
      getUsers().then(u => setKasirList(u.filter(k => k.role !== "owner" && k.isActive))).catch(() => {});\r
    }\r
  }, [isOwner]);\r
\r
  const getDateRange = useCallback(() => {\r
    if (viewMode === "day") return { startDate: date, endDate: date };\r
    const [y, m] = month.split("-").map(Number);\r
    const lastDay = new Date(y, m, 0).getDate();\r
    return {\r
      startDate: \`\${y}-\${String(m).padStart(2, "0")}-01\`,\r
      endDate: \`\${y}-\${String(m).padStart(2, "0")}-\${String(lastDay).padStart(2, "0")}\`,\r
    };\r
  }, [viewMode, date, month]);\r
\r
  const loadData = useCallback(async () => {\r
    if (!user) return;\r
    setLoading(true);\r
    try {\r
      const { startDate, endDate } = getDateRange();\r
      let kasirName: string | undefined;\r
      if (!isOwner) {\r
        kasirName = user.name;\r
      } else if (kasirFilter !== "Semua") {\r
        kasirName = kasirFilter;\r
      }\r
      const [txs, saldo, snap, notes] = await Promise.all([\r
        getTransactions({ kasirName, startDate, endDate }),\r
        getSaldoHistory({ kasirName, startDate, endDate }),\r
        isOwner ? Promise.resolve(null) : getDailySnapshot(user.name, startDate),\r
        isOwner ? Promise.resolve({ sisaSaldoBank: 0, saldoRealApp: 0 }) : getDailyNotes(user.name, startDate),\r
      ]);\r
      setTransactions(txs);\r
      setSaldoHistory(saldo);\r
      setIsLocked((snap as any)?.locked || false);\r
      setDailyNotes(notes as DailyNoteRecord);\r
    } catch {} finally {\r
      setLoading(false);\r
    }\r
  }, [user, isOwner, kasirFilter, getDateRange]);\r
\r
  useEffect(() => { loadData(); }, [loadData]);\r
\r
  const bankTx = transactions.filter(t => t.category === "BANK");\r
  const flipTx = transactions.filter(t => t.category === "FLIP");\r
  const appTx = transactions.filter(t => t.category === "APP PULSA");\r
  const danaTx = transactions.filter(t => t.category === "DANA");\r
  const tarikTx = transactions.filter(t => t.category === "TARIK TUNAI");\r
  const aksTx = transactions.filter(t => t.category === "AKSESORIS");\r
  const nonTunaiTx = transactions.filter(t => (t.paymentMethod || "").toLowerCase().includes("non-tunai") || t.category === "NON TUNAI");\r
\r
  const sumNominal = (list: TransactionRecord[]) => list.reduce((s, t) => s + (t.nominal || 0), 0);\r
  const sumAdmin = (list: TransactionRecord[]) => list.reduce((s, t) => s + (t.admin || 0), 0);\r
\r
  const totalBank = sumNominal(bankTx);\r
  const totalFlip = sumNominal(flipTx);\r
  const totalApp = sumNominal(appTx);\r
  const totalDana = sumNominal(danaTx);\r
  const totalTarik = sumNominal(tarikTx);\r
  const totalAks = sumNominal(aksTx);\r
  const totalAdmin = sumAdmin(transactions);\r
  const totalNonTunai = sumNominal(nonTunaiTx);\r
\r
  const totalPenjualan = totalBank + totalFlip + totalApp + totalDana;\r
  const sisaCashPenjualan = totalPenjualan - totalTarik;\r
  const sisaCashTotal = sisaCashPenjualan + totalAdmin + totalAks;\r
\r
  const saldoBankHistory = saldoHistory.filter(s => s.jenis === "Bank");\r
  const totalIsiSaldoBank = saldoBankHistory.reduce((s, h) => s + h.nominal, 0);\r
\r
  const sisaSaldoBank = dailyNotes.sisaSaldoBank || 0;\r
  const saldoRealApp = dailyNotes.saldoRealApp || 0;\r
  const selisih = saldoRealApp - sisaSaldoBank;\r
\r
  const categoryItems = [\r
    { label: "BANK", count: bankTx.length, total: totalBank },\r
    { label: "FLIP", count: flipTx.length, total: totalFlip },\r
    { label: "DANA", count: danaTx.length, total: totalDana },\r
    { label: "APP PULSA", count: appTx.length, total: totalApp },\r
  ].filter(c => c.count > 0);\r
\r
  const handleResetSaldo = async () => {\r
    if (!confirm("Reset saldo kasir ini ke Rp 0? Tindakan tidak bisa dibatalkan.")) return;\r
    setResetting(true);\r
    try {\r
      await resetBalance(user!.name);\r
      toast({ title: "Saldo berhasil direset ke Rp 0" });\r
    } catch {\r
      toast({ title: "Gagal reset saldo", variant: "destructive" });\r
    } finally {\r
      setResetting(false);\r
    }\r
  };\r
\r
  const handleLock = async () => {\r
    if (!confirm("Kunci laporan hari ini? Data tidak bisa diubah lagi.")) return;\r
    setLocking(true);\r
    try {\r
      await lockReport(user!.name, date);\r
      setIsLocked(true);\r
      toast({ title: "Laporan dikunci" });\r
    } catch {\r
      toast({ title: "Gagal mengunci", variant: "destructive" });\r
    } finally {\r
      setLocking(false);\r
    }\r
  };\r
\r
  const handleExportExcel = async () => {\r
    try {\r
      const XLSX = await import("xlsx");\r
      const wsData: any[][] = [\r
        ["ALFAZA CELL - Laporan Harian"],\r
        [\`Kasir: \${user?.name}\`, \`Shift: \${shift}\`, \`Tanggal: \${date}\`],\r
        [],\r
        ["#", "Jam", "Kategori", "Nominal", "Admin", "Keterangan", "Pembayaran"],\r
      ];\r
      transactions.forEach((tx, i) => {\r
        wsData.push([String(i + 1), tx.transTime || "", tx.category, tx.nominal || 0, tx.admin || 0, tx.keterangan || "", tx.paymentMethod || "tunai"]);\r
      });\r
      wsData.push([]);\r
      wsData.push(["Ringkasan"]);\r
      categoryItems.forEach(c => wsData.push([c.label, c.total]));\r
      wsData.push(["Total Penjualan", totalPenjualan]);\r
      wsData.push(["Tarik Tunai", totalTarik]);\r
      wsData.push(["Sisa Cash Penjualan", sisaCashPenjualan]);\r
      wsData.push(["Admin", totalAdmin]);\r
      wsData.push(["Aksesoris", totalAks]);\r
      wsData.push(["Non Tunai", totalNonTunai]);\r
      wsData.push(["Sisa Cash Total", sisaCashTotal]);\r
      wsData.push([]);\r
      wsData.push(["Saldo & Selisih"]);\r
      wsData.push(["Sisa Saldo Bank (Catatan)", sisaSaldoBank]);\r
      wsData.push(["Saldo Real App", saldoRealApp]);\r
      wsData.push(["Selisih", selisih]);\r
\r
      const ws = XLSX.utils.aoa_to_sheet(wsData);\r
      const wb = XLSX.utils.book_new();\r
      XLSX.utils.book_append_sheet(wb, ws, "Laporan");\r
      XLSX.writeFile(wb, \`laporan_\${user?.name}_\${date}.xlsx\`);\r
      toast({ title: "Excel berhasil diunduh" });\r
    } catch {\r
      toast({ title: "Gagal membuat Excel", variant: "destructive" });\r
    }\r
  };\r
\r
  const buildPdf = async () => {\r
    const { default: jsPDF } = await import("jspdf");\r
    const pdf = new jsPDF("p", "mm", "a4");\r
    const pw = 210;\r
    const ml = 12;\r
    const mr = 12;\r
    const cw = pw - ml - mr;\r
    let y = 10;\r
\r
    const checkPage = (need: number) => { if (y + need > 280) { pdf.addPage(); y = 12; } };\r
\r
    const sectionHeader = (text: string, bgR: number, bgG: number, bgB: number, h = 9) => {\r
      checkPage(h + 2);\r
      pdf.setFillColor(bgR, bgG, bgB);\r
      pdf.roundedRect(ml, y, cw, h, 2, 2, "F");\r
      pdf.setTextColor(255, 255, 255);\r
      pdf.setFontSize(10); pdf.setFont("helvetica", "bold");\r
      pdf.text(text, ml + 4, y + h / 2 + 1);\r
      y += h;\r
    };\r
\r
    const sectionHeaderRight = (left: string, right: string, bgR: number, bgG: number, bgB: number, h = 10) => {\r
      checkPage(h + 2);\r
      pdf.setFillColor(bgR, bgG, bgB);\r
      pdf.roundedRect(ml, y, cw, h, 2, 2, "F");\r
      pdf.setTextColor(255, 255, 255);\r
      pdf.setFontSize(10); pdf.setFont("helvetica", "bold");\r
      pdf.text(left, ml + 4, y + h / 2 + 1);\r
      pdf.setFontSize(12);\r
      pdf.text(right, ml + cw - 4, y + h / 2 + 1, { align: "right" });\r
      y += h;\r
    };\r
\r
    const row = (left: string, right: string, opts?: { leftColor?: number[]; rightColor?: number[]; bold?: boolean }) => {\r
      checkPage(7);\r
      pdf.setFontSize(9);\r
      pdf.setFont("helvetica", opts?.bold ? "bold" : "normal");\r
      const lc = opts?.leftColor || [55, 55, 55];\r
      pdf.setTextColor(lc[0], lc[1], lc[2]);\r
      pdf.text(left, ml + 4, y + 4.5);\r
      const rc = opts?.rightColor || [55, 55, 55];\r
      pdf.setTextColor(rc[0], rc[1], rc[2]);\r
      pdf.setFont("helvetica", "bold");\r
      pdf.text(right, ml + cw - 4, y + 4.5, { align: "right" });\r
      pdf.setDrawColor(230, 230, 230);\r
      pdf.line(ml + 2, y + 6.5, ml + cw - 2, y + 6.5);\r
      y += 7;\r
    };\r
\r
    pdf.setFillColor(55, 95, 190);\r
    pdf.roundedRect(ml, y, cw, 16, 3, 3, "F");\r
    pdf.setTextColor(255, 255, 255);\r
    pdf.setFontSize(15); pdf.setFont("helvetica", "bold");\r
    pdf.text("ALFAZA CELL", pw / 2, y + 7, { align: "center" });\r
    pdf.setFontSize(9); pdf.setFont("helvetica", "normal");\r
    pdf.text("Laporan Harian", pw / 2, y + 12.5, { align: "center" });\r
    y += 19;\r
\r
    pdf.setFillColor(240, 240, 245);\r
    pdf.roundedRect(ml, y, cw, 8, 2, 2, "F");\r
    pdf.setTextColor(80, 80, 100);\r
    pdf.setFontSize(8); pdf.setFont("helvetica", "normal");\r
    const infoKasir = isOwner && kasirFilter !== "Semua" ? kasirFilter : (user?.name || "-");\r
    pdf.text(\`Kasir: \${infoKasir}  |  Shift: \${shift || "-"}  |  Tanggal: \${viewMode === "day" ? date : month}\`, pw / 2, y + 5, { align: "center" });\r
    y += 11;\r
\r
    if (categoryItems.length > 0) {\r
      sectionHeader("Rincian Kategori", 46, 160, 67);\r
      categoryItems.forEach(c => {\r
        row(\`\${c.label} (\${c.count}x)\`, formatRupiah(c.total), { leftColor: [30, 30, 200], rightColor: [30, 30, 200], bold: true });\r
      });\r
      y += 2;\r
    }\r
\r
    sectionHeader("TOTAL PENJUALAN", 16, 150, 100);\r
    row("Total Penjualan", formatRupiah(totalPenjualan), { leftColor: [16, 130, 90], rightColor: [16, 130, 90] });\r
    if (tarikTx.length > 0) row(\`Tarik Tunai (\${tarikTx.length}x)\`, \`-\${formatRupiah(totalTarik)}\`, { leftColor: [220, 50, 50], rightColor: [220, 50, 50] });\r
    row("Sisa Cash Penjualan", formatRupiah(sisaCashPenjualan), { leftColor: [16, 130, 90], rightColor: [16, 130, 90] });\r
    row("Admin", formatRupiah(totalAdmin), { leftColor: [180, 130, 20], rightColor: [180, 130, 20] });\r
    if (aksTx.length > 0) row(\`Aksesoris (\${aksTx.length}x)\`, formatRupiah(totalAks), { leftColor: [200, 50, 100], rightColor: [200, 50, 100] });\r
    row("Non Tunai", formatRupiah(totalNonTunai), { leftColor: [100, 50, 200], rightColor: [100, 50, 200] });\r
    y += 2;\r
\r
    sectionHeaderRight("SISA CASH TOTAL", formatRupiah(sisaCashTotal), 230, 160, 20, 12);\r
    y += 3;\r
\r
    sectionHeader("Jurnal Penyesuaian", 130, 60, 200);\r
    row("Total Tambah/Isi Saldo Bank", formatRupiah(totalIsiSaldoBank), { bold: true });\r
    y += 2;\r
\r
    sectionHeader("Saldo & Selisih", 46, 140, 67);\r
    row("Sisa Saldo Bank (Catatan)", formatRupiah(sisaSaldoBank), { leftColor: [30, 30, 200], rightColor: [30, 30, 200] });\r
    row("Saldo Real App", formatRupiah(saldoRealApp), { leftColor: [200, 30, 30], rightColor: [200, 30, 30] });\r
    row("Selisih", formatRupiah(selisih), { leftColor: selisih >= 0 ? [16, 130, 90] : [220, 50, 50], rightColor: selisih >= 0 ? [16, 130, 90] : [220, 50, 50], bold: true });\r
    y += 4;\r
\r
    if (transactions.length > 0) {\r
      sectionHeader("Detail Transaksi", 70, 70, 80);\r
\r
      const colW = [10, 35, 42, 35, 64];\r
      const colX = [ml, ml + colW[0], ml + colW[0] + colW[1], ml + colW[0] + colW[1] + colW[2], ml + colW[0] + colW[1] + colW[2] + colW[3]];\r
      const headers = ["#", "Kategori", "Nominal", "Admin", "Keterangan"];\r
      checkPage(14);\r
\r
      pdf.setFillColor(55, 55, 65);\r
      pdf.rect(ml, y, cw, 7, "F");\r
      pdf.setTextColor(255, 255, 255);\r
      pdf.setFontSize(7.5); pdf.setFont("helvetica", "bold");\r
      headers.forEach((h, i) => pdf.text(h, colX[i] + 2, y + 4.8));\r
      y += 7;\r
\r
      pdf.setFontSize(7.5); pdf.setFont("helvetica", "normal");\r
      transactions.forEach((tx, idx) => {\r
        checkPage(7);\r
        const bgFill = idx % 2 === 0;\r
        if (bgFill) {\r
          pdf.setFillColor(248, 248, 252);\r
          pdf.rect(ml, y, cw, 6.5, "F");\r
        }\r
        pdf.setTextColor(60, 60, 60);\r
        pdf.text(String(idx + 1), colX[0] + 2, y + 4.3);\r
        pdf.text(tx.category || "-", colX[1] + 2, y + 4.3);\r
        pdf.text(formatRupiah(tx.nominal || 0), colX[2] + 2, y + 4.3);\r
        pdf.text(formatRupiah(tx.admin || 0), colX[3] + 2, y + 4.3);\r
        const ket = (tx.keterangan || "-").substring(0, 30);\r
        pdf.text(ket, colX[4] + 2, y + 4.3);\r
        y += 6.5;\r
      });\r
    }\r
\r
    y += 6;\r
    checkPage(8);\r
    pdf.setTextColor(160, 160, 170);\r
    pdf.setFontSize(7); pdf.setFont("helvetica", "normal");\r
    const nowStr = new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" });\r
    pdf.text(\`Dicetak: \${nowStr} | Alfaza Link POS\`, pw / 2, y, { align: "center" });\r
\r
    return pdf;\r
  };\r
\r
  const handleExportPDF = async () => {\r
    try {\r
      const pdf = await buildPdf();\r
      pdf.save(\`laporan-\${user?.name}-\${date}.pdf\`);\r
    } catch { toast({ title: "Gagal export PDF", variant: "destructive" }); }\r
  };\r
\r
  const handleBagikan = async () => {\r
    try {\r
      const pdf = await buildPdf();\r
      const blob = pdf.output("blob");\r
      const file = new File([blob], \`laporan-\${user?.name}-\${date}.pdf\`, { type: "application/pdf" });\r
      if (navigator.canShare && navigator.canShare({ files: [file] })) {\r
        await navigator.share({ files: [file], title: "Laporan Harian Alfaza Cell" });\r
      } else {\r
        const url = URL.createObjectURL(blob);\r
        const a = document.createElement("a");\r
        a.href = url; a.download = file.name; a.click();\r
        URL.revokeObjectURL(url);\r
      }\r
    } catch { toast({ title: "Gagal bagikan PDF", variant: "destructive" }); }\r
  };\r
\r
  if (loading) {\r
    return (\r
      <div className="px-3 pt-3">\r
        <Header />\r
        <div className="flex flex-col items-center gap-3 py-16">\r
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />\r
          <p className="text-sm text-gray-400">Memuat laporan...</p>\r
        </div>\r
      </div>\r
    );\r
  }\r
\r
  return (\r
    <div className="px-3 pt-3 pb-24">\r
      <Header />\r
\r
      {isOwner && (\r
        <>\r
          <div className="grid grid-cols-2 gap-2 mb-2">\r
            <button onClick={() => setViewMode("day")} className={\`py-2.5 rounded-full text-xs font-bold transition \${viewMode === "day" ? "bg-blue-600 text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}>\r
              Per Hari\r
            </button>\r
            <button onClick={() => setViewMode("month")} className={\`py-2.5 rounded-full text-xs font-bold transition \${viewMode === "month" ? "bg-blue-600 text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}>\r
              Per Bulan\r
            </button>\r
          </div>\r
          <div className="flex gap-2 overflow-x-auto pb-1 mb-2 scrollbar-hide">\r
            {["Semua", ...kasirList.map(k => k.name)].map(name => (\r
              <button\r
                key={name}\r
                onClick={() => setKasirFilter(name)}\r
                className={\`whitespace-nowrap px-3 py-1.5 rounded-full text-[11px] font-bold transition flex-shrink-0 \${kasirFilter === name ? "bg-blue-600 text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
              >\r
                {name}\r
              </button>\r
            ))}\r
          </div>\r
        </>\r
      )}\r
      <div className="flex items-center gap-2 mb-3">\r
        {viewMode === "day" ? (\r
          <input\r
            type="date"\r
            value={date}\r
            onChange={e => setDate(e.target.value)}\r
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-xs bg-white outline-none"\r
          />\r
        ) : (\r
          <input\r
            type="month"\r
            value={month}\r
            onChange={e => setMonth(e.target.value)}\r
            className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-xs bg-white outline-none"\r
          />\r
        )}\r
        <button\r
          onClick={() => loadData()}\r
          className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-xs font-bold active:scale-95 transition"\r
        >\r
          Tampilkan\r
        </button>\r
      </div>\r
\r
      {/* GRUP 1: Rincian + Total Penjualan + Total Uang Cash */}\r
      <div ref={reportRef} className="rounded-2xl border-2 border-gray-900 overflow-hidden mb-3">\r
        {categoryItems.length > 0 && (\r
          <>\r
            <div className="bg-gradient-to-r from-blue-700 to-blue-500 px-4 py-2.5">\r
              <h3 className="text-white font-bold text-sm flex items-center gap-1.5">📊 Rincian Kategori</h3>\r
            </div>\r
            <div className="px-4 py-3 bg-white space-y-2 border-b-2 border-gray-900">\r
              {categoryItems.map(c => (\r
                <div key={c.label} className="flex justify-between items-center">\r
                  <span className="text-sm font-bold text-gray-800">{c.label} <span className="text-gray-400 font-normal">({c.count}x)</span></span>\r
                  <span className="text-sm font-bold text-blue-700">{formatRupiah(c.total)}</span>\r
                </div>\r
              ))}\r
            </div>\r
          </>\r
        )}\r
\r
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 px-4 py-2.5 flex justify-between items-center">\r
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">📈 TOTAL PENJUALAN</h3>\r
          <span className="text-white font-extrabold text-base">{formatRupiah(totalPenjualan)}</span>\r
        </div>\r
        <div className="bg-white px-4 space-y-0 border-b-2 border-gray-900">\r
          {tarikTx.length > 0 && (\r
            <div className="flex justify-between items-center py-2 border-b border-gray-200">\r
              <span className="text-sm text-gray-700 flex items-center gap-1">💸 <strong className="text-emerald-700">Tarik Tunai</strong><span className="text-[10px] bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-bold ml-1">{tarikTx.length}x</span></span>\r
              <span className="text-sm font-bold text-red-500">-{formatRupiah(totalTarik)}</span>\r
            </div>\r
          )}\r
          <div className="flex justify-between items-center py-2 border-b border-gray-200">\r
            <span className="text-sm text-gray-700 flex items-center gap-1">💰 <strong className="text-emerald-700">Sisa Cash Penjualan</strong></span>\r
            <span className="text-sm font-bold text-emerald-700">{formatRupiah(sisaCashPenjualan)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2 border-b border-gray-200">\r
            <span className="text-sm text-gray-700 flex items-center gap-1">📱 <strong className="text-amber-600">Admin</strong></span>\r
            <span className="text-sm font-bold text-amber-600">{formatRupiah(totalAdmin)}</span>\r
          </div>\r
          {aksTx.length > 0 && (\r
            <div className="flex justify-between items-center py-2 border-b border-gray-200">\r
              <span className="text-sm text-gray-700 flex items-center gap-1">🎧 <strong className="text-rose-500">Aksesoris</strong><span className="text-[10px] bg-rose-100 text-rose-500 px-1.5 py-0.5 rounded-full font-bold ml-1">{aksTx.length}x</span></span>\r
              <span className="text-sm font-bold text-rose-500">{formatRupiah(totalAks)}</span>\r
            </div>\r
          )}\r
          <div className="flex justify-between items-center py-2">\r
            <span className="text-sm text-gray-700 flex items-center gap-1">🏷️ <strong className="text-purple-600">Non Tunai</strong></span>\r
            <span className="text-sm font-bold text-purple-600">{formatRupiah(totalNonTunai)}</span>\r
          </div>\r
        </div>\r
\r
        <div className="bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-3">\r
          <div className="flex justify-between items-center mb-1">\r
            <h3 className="text-gray-900 font-extrabold text-sm flex items-center gap-1.5">💰 TOTAL UANG CASH</h3>\r
            <span className="text-gray-900 font-extrabold text-xl">{formatRupiah(sisaCashTotal)}</span>\r
          </div>\r
          <p className="text-[10px] text-gray-800">Sisa Cash: {formatRupiah(sisaCashPenjualan)} + Admin: {formatRupiah(totalAdmin)} + Aks: {formatRupiah(totalAks)}</p>\r
        </div>\r
      </div>\r
\r
      {/* GRUP 2: Jurnal Penyesuaian + Saldo & Selisih */}\r
      <div className="rounded-2xl border-2 border-gray-900 overflow-hidden mb-4">\r
        <div className="bg-gradient-to-r from-purple-700 to-purple-500 px-4 py-2.5">\r
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">📒 Jurnal Penyesuaian</h3>\r
        </div>\r
        <div className="bg-white px-4 space-y-0 border-b-2 border-gray-900">\r
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">\r
            <span className="text-sm text-gray-700">💳 <strong>Total Tambah/Isi Saldo Bank</strong></span>\r
            <span className="text-sm font-extrabold text-blue-700">{formatRupiah(totalIsiSaldoBank)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2 border-b border-gray-300">\r
            <span className="text-sm text-gray-700">Sisa Saldo Bank (Catatan)</span>\r
            <span className="text-sm font-bold text-gray-800">{formatRupiah(sisaSaldoBank)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">\r
            <span className="text-sm text-gray-700">Total Penjualan</span>\r
            <span className="text-sm font-bold text-gray-800">{formatRupiah(totalPenjualan)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">\r
            <span className="text-sm font-bold text-gray-900">Total</span>\r
            <span className="text-sm font-extrabold text-gray-900">{formatRupiah(sisaSaldoBank + totalPenjualan)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2">\r
            <span className="text-sm font-bold text-gray-700">Selisih</span>\r
            <span className={\`text-sm font-extrabold \${(totalIsiSaldoBank - (sisaSaldoBank + totalPenjualan)) >= 0 ? 'text-green-600' : 'text-red-600'}\`}>{formatRupiah(totalIsiSaldoBank - (sisaSaldoBank + totalPenjualan))}</span>\r
          </div>\r
        </div>\r
\r
        <div className="bg-gradient-to-r from-green-700 to-green-500 px-4 py-2.5">\r
          <h3 className="text-white font-bold text-sm flex items-center gap-1.5">🏦 Saldo & Selisih</h3>\r
        </div>\r
        <div className="bg-white px-4 space-y-0">\r
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">\r
            <span className="text-sm text-gray-700 flex items-center gap-1">🏛️ <strong>Sisa Saldo Bank (Catatan)</strong></span>\r
            <span className="text-sm font-extrabold text-blue-700">{formatRupiah(sisaSaldoBank)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2 border-b-2 border-gray-900">\r
            <span className="text-sm text-gray-700 flex items-center gap-1">📱 <strong>Saldo Real App</strong></span>\r
            <span className="text-sm font-extrabold text-red-600">{formatRupiah(saldoRealApp)}</span>\r
          </div>\r
          <div className="flex justify-between items-center py-2">\r
            <span className="text-sm text-gray-700 flex items-center gap-1">🔄 <strong>Selisih</strong></span>\r
            <span className={\`text-sm font-extrabold \${selisih >= 0 ? 'text-green-600' : 'text-red-600'}\`}>{formatRupiah(selisih)}</span>\r
          </div>\r
        </div>\r
      </div>\r
\r
      {/* Tombol aksi */}\r
      <div className="space-y-2.5 mt-2">\r
        <div className="grid grid-cols-2 gap-2.5">\r
          <button onClick={handleExportPDF} className="flex items-center justify-center gap-1.5 bg-red-500 text-white py-3 rounded-2xl font-bold text-xs shadow active:scale-95 transition">\r
            <Download className="w-4 h-4" /> PDF\r
          </button>\r
          <button onClick={handleExportExcel} className="flex items-center justify-center gap-1.5 bg-green-600 text-white py-3 rounded-2xl font-bold text-xs shadow active:scale-95 transition">\r
            <Download className="w-4 h-4" /> Excel\r
          </button>\r
        </div>\r
        <button onClick={handleBagikan} className="w-full flex items-center justify-center gap-1.5 bg-blue-600 text-white py-3 rounded-2xl font-bold text-sm shadow active:scale-95 transition">\r
          <Share2 className="w-4 h-4" /> BAGIKAN (PDF)\r
        </button>\r
        <button onClick={handleResetSaldo} disabled={resetting} className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white py-3.5 rounded-2xl font-bold text-sm shadow active:scale-95 transition disabled:opacity-50">\r
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />} RESET SALDO (MANUAL)\r
        </button>\r
      </div>\r
    </div>\r
  );\r
}\r
`,wr=`import { useState, useEffect } from "react";\r
import { useLocation } from "wouter";\r
import { useAuth } from "@/lib/auth";\r
import { getUsers, getSettings, loginUser, type UserRecord } from "@/lib/firestore";\r
import { User, Clock, CalendarDays, Sun, Moon, Fingerprint, Monitor, Tablet, Smartphone, ChevronDown, Loader2, Lock, SunMedium, SunMoon, Eye, EyeOff, Mail, KeyRound, LogOut, Store } from "lucide-react";\r
import { useDisplayMode } from "@/hooks/use-display-mode";\r
\r
const logoUrl = \`\${import.meta.env.BASE_URL}alfaza-logo.png\`;\r
\r
\r
const SHIFT_OPTIONS = [\r
  { value: "PAGI", label: "Pagi", icon: SunMedium },\r
  { value: "SIANG", label: "Siang", icon: SunMoon },\r
];\r
\r
function FirebaseAuthScreen() {\r
  const { firebaseLogin, firebaseRegister } = useAuth();\r
  const [email, setEmail] = useState("");\r
  const [password, setPassword] = useState("");\r
  const [confirmPassword, setConfirmPassword] = useState("");\r
  const [isRegister, setIsRegister] = useState(false);\r
  const [shopCode, setShopCode] = useState("");\r
  const [error, setError] = useState("");\r
  const [loading, setLoading] = useState(false);\r
  const [showPass, setShowPass] = useState(false);\r
\r
  const SHOP_CODE = "ALFAZA2024";\r
\r
  const handleSubmit = async () => {\r
    if (!email || !password) {\r
      setError("Email dan password harus diisi");\r
      return;\r
    }\r
    if (password.length < 6) {\r
      setError("Password minimal 6 karakter");\r
      return;\r
    }\r
    if (isRegister) {\r
      if (shopCode !== SHOP_CODE) {\r
        setError("Kode toko salah. Hubungi pemilik toko.");\r
        return;\r
      }\r
      if (password !== confirmPassword) {\r
        setError("Password tidak cocok");\r
        return;\r
      }\r
    }\r
    setLoading(true);\r
    setError("");\r
    try {\r
      if (isRegister) {\r
        await firebaseRegister(email, password);\r
      } else {\r
        await firebaseLogin(email, password);\r
      }\r
    } catch (err: any) {\r
      const code = err?.code || "";\r
      if (code === "auth/user-not-found" || code === "auth/invalid-credential") {\r
        setError("Email atau password salah");\r
      } else if (code === "auth/email-already-in-use") {\r
        setError("Email sudah terdaftar. Silakan login.");\r
        setIsRegister(false);\r
      } else if (code === "auth/weak-password") {\r
        setError("Password terlalu lemah (min 6 karakter)");\r
      } else if (code === "auth/invalid-email") {\r
        setError("Format email tidak valid");\r
      } else {\r
        setError(err?.message || "Gagal autentikasi");\r
      }\r
    } finally {\r
      setLoading(false);\r
    }\r
  };\r
\r
  const [authSettings, setAuthSettings] = useState<{ profilePhotoUrl?: string; shopName?: string } | null>(null);\r
  useEffect(() => { getSettings().then(s => setAuthSettings(s)).catch(() => {}); }, []);\r
\r
  const { theme, toggleTheme } = useDisplayMode();\r
\r
  return (\r
    <div className="min-h-screen bg-gradient-to-b from-blue-700 via-primary to-sky-500 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 flex items-center justify-center p-4 relative transition-colors duration-500">\r
      <button\r
        onClick={toggleTheme}\r
        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all shadow-lg backdrop-blur-sm z-50"\r
      >\r
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}\r
      </button>\r
\r
      <div className="bg-card p-6 sm:p-8 rounded-[2rem] w-full max-w-sm shadow-2xl border border-border/50">\r
        <div className="flex justify-center mb-4">\r
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">\r
            <img src={authSettings?.profilePhotoUrl || logoUrl} alt="Alfaza" className="w-full h-full object-cover" />\r
          </div>\r
        </div>\r
\r
        <h2 className="text-2xl font-extrabold text-primary text-center mb-0.5">{authSettings?.shopName || "ALFAZA CELL"}</h2>\r
        <p className="text-center text-muted-foreground text-sm mb-1">Sistem Kasir Pro</p>\r
        <p className="text-center text-blue-500 dark:text-blue-400 text-xs font-semibold mb-6">\r
          {isRegister ? "Daftar Akun Baru" : "Login Firebase"}\r
        </p>\r
\r
        {error && (\r
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold px-4 py-2.5 rounded-xl mb-4 text-center">\r
            {error}\r
          </div>\r
        )}\r
\r
        <div className="space-y-3 mb-5">\r
          {isRegister && (\r
            <div className="flex items-center gap-3 border-2 border-border rounded-2xl px-4 h-14 bg-muted/30 focus-within:border-primary transition-all">\r
              <Store className="w-5 h-5 text-muted-foreground" />\r
              <input\r
                type="text"\r
                placeholder="Kode Toko"\r
                value={shopCode}\r
                onChange={e => setShopCode(e.target.value.toUpperCase())}\r
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground tracking-widest placeholder:text-muted-foreground placeholder:font-normal placeholder:tracking-normal"\r
              />\r
            </div>\r
          )}\r
\r
          <div className="flex items-center gap-3 border-2 border-border rounded-2xl px-4 h-14 bg-muted/30 focus-within:border-primary transition-all">\r
            <Mail className="w-5 h-5 text-muted-foreground" />\r
            <input\r
              type="email"\r
              placeholder="Email"\r
              value={email}\r
              onChange={e => setEmail(e.target.value)}\r
              onKeyDown={e => e.key === "Enter" && !isRegister && handleSubmit()}\r
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal"\r
            />\r
          </div>\r
\r
          <div className="flex items-center gap-3 border-2 border-border rounded-2xl px-4 h-14 bg-muted/30 focus-within:border-primary transition-all">\r
            <KeyRound className="w-5 h-5 text-muted-foreground" />\r
            <input\r
              type={showPass ? "text" : "password"}\r
              placeholder="Password"\r
              value={password}\r
              onChange={e => setPassword(e.target.value)}\r
              onKeyDown={e => e.key === "Enter" && !isRegister && handleSubmit()}\r
              className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal"\r
            />\r
            <button type="button" onClick={() => setShowPass(!showPass)} className="text-muted-foreground">\r
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}\r
            </button>\r
          </div>\r
\r
          {isRegister && (\r
            <div className="flex items-center gap-3 border-2 border-border rounded-2xl px-4 h-14 bg-muted/30 focus-within:border-primary transition-all">\r
              <KeyRound className="w-5 h-5 text-muted-foreground" />\r
              <input\r
                type={showPass ? "text" : "password"}\r
                placeholder="Konfirmasi Password"\r
                value={confirmPassword}\r
                onChange={e => setConfirmPassword(e.target.value)}\r
                onKeyDown={e => e.key === "Enter" && handleSubmit()}\r
                className="flex-1 bg-transparent outline-none text-sm font-semibold text-foreground placeholder:text-muted-foreground placeholder:font-normal"\r
              />\r
            </div>\r
          )}\r
        </div>\r
\r
        <button\r
          type="button"\r
          onClick={handleSubmit}\r
          disabled={loading}\r
          className="w-full h-14 rounded-3xl font-extrabold text-lg bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 mb-4"\r
        >\r
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}\r
          {isRegister ? "DAFTAR" : "LOGIN"}\r
        </button>\r
\r
        <button\r
          type="button"\r
          onClick={() => { setIsRegister(!isRegister); setError(""); setShopCode(""); setConfirmPassword(""); }}\r
          className="w-full text-center text-sm text-primary font-semibold"\r
        >\r
          {isRegister ? "Sudah punya akun? Login" : "Belum punya akun? Daftar"}\r
        </button>\r
\r
        <div className="mt-4 bg-primary/5 rounded-xl p-3 border border-primary/20">\r
          <p className="text-[10px] text-primary text-center">\r
            Data disimpan di Firebase Cloud. Aman dan bisa diakses dari mana saja.\r
          </p>\r
        </div>\r
      </div>\r
    </div>\r
  );\r
\r
}\r
\r
function KasirSelectionScreen() {\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [pinEnabled, setPinEnabled] = useState(false);\r
  const [profilePhoto, setProfilePhoto] = useState("");\r
  const [shopNameSetting, setShopNameSetting] = useState("");\r
  const [loading, setLoading] = useState(true);\r
  const [error, setError] = useState("");\r
  const [selected, setSelected] = useState("");\r
  const [pin, setPin] = useState("");\r
  const [loggingIn, setLoggingIn] = useState(false);\r
  const [selectedShift, setSelectedShift] = useState<string>("PAGI");\r
  const [dropdownOpen, setDropdownOpen] = useState(false);\r
  const [showPin, setShowPin] = useState(false);\r
  const [, setLocation] = useLocation();\r
  const { login, firebaseLogout, firebaseUser } = useAuth();\r
\r
  useEffect(() => {\r
    let cancelled = false;\r
    const timeout = setTimeout(() => {\r
      if (!cancelled) {\r
        setError("Koneksi ke Firebase timeout.");\r
        setLoading(false);\r
      }\r
    }, 10000);\r
\r
    const load = async () => {\r
      try {\r
        const [usersData, settingsData] = await Promise.all([\r
          getUsers(),\r
          getSettings(),\r
        ]);\r
        if (!cancelled) {\r
          clearTimeout(timeout);\r
          setUsers(usersData.filter(u => u.isActive));\r
          setPinEnabled(settingsData.pinEnabled ?? false);\r
          setProfilePhoto(settingsData.profilePhotoUrl || "");\r
          setShopNameSetting(settingsData.shopName || "");\r
          setLoading(false);\r
        }\r
      } catch (err: any) {\r
        if (!cancelled) {\r
          clearTimeout(timeout);\r
          setError(err?.message || "Gagal memuat data");\r
          setLoading(false);\r
        }\r
      }\r
    };\r
    load();\r
    return () => { cancelled = true; clearTimeout(timeout); };\r
  }, []);\r
\r
  const doLogin = async (userName: string) => {\r
    const user = users.find((u) => u.name === userName);\r
    if (!user) return;\r
    if (pinEnabled && pin.length < 4) {\r
      setError("PIN harus 4 digit");\r
      return;\r
    }\r
    if (user.role !== "owner" && !selectedShift) {\r
      setError("Pilih shift dulu");\r
      return;\r
    }\r
    setLoggingIn(true);\r
    setError("");\r
    setSelected(userName);\r
    try {\r
      const now = new Date();\r
      const deviceH = now.getHours().toString().padStart(2, "0");\r
      const deviceM = now.getMinutes().toString().padStart(2, "0");\r
      const deviceTime = \`\${deviceH}:\${deviceM}\`;\r
\r
      const result = await loginUser(\r
        userName,\r
        pinEnabled ? pin : undefined,\r
        user.role !== "owner" ? selectedShift : undefined,\r
        deviceTime\r
      );\r
\r
      if (result.success && result.user) {\r
        login(result.user, selectedShift || "", result.absenTime);\r
        setLocation(result.role === "owner" ? "/owner" : "/beranda");\r
      } else {\r
        setError(result.message || "Login gagal");\r
        setLoggingIn(false);\r
      }\r
    } catch {\r
      setError("Gagal login");\r
      setLoggingIn(false);\r
    }\r
  };\r
\r
  const activeUsers = users.filter((u) => u.role !== "owner").sort((a, b) => a.name.localeCompare(b.name));\r
  const ownerUser = users.find((u) => u.role === "owner");\r
  const selectedUser = users.find((u) => u.name === selected);\r
  const isOwnerSelected = selectedUser?.role === "owner";\r
\r
  const { theme, toggleTheme } = useDisplayMode();\r
\r
  return (\r
    <div className="min-h-screen bg-gradient-to-b from-blue-700 via-primary to-sky-500 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 flex items-center justify-center p-4 relative transition-colors duration-500">\r
      <button\r
        onClick={toggleTheme}\r
        className="absolute top-4 right-4 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all shadow-lg backdrop-blur-sm z-50"\r
      >\r
        {theme === "light" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}\r
      </button>\r
\r
      <div className="bg-card p-6 sm:p-8 rounded-[2rem] w-full max-w-sm shadow-2xl border border-border/50">\r
        <div className="flex justify-center mb-4">\r
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">\r
            <img src={profilePhoto || logoUrl} alt="Alfaza" className="w-full h-full object-cover" />\r
          </div>\r
        </div>\r
\r
        <h2 className="text-2xl font-extrabold text-primary text-center mb-0.5">{shopNameSetting || "ALFAZA CELL"}</h2>\r
        <p className="text-center text-muted-foreground text-sm mb-1">Sistem Kasir Pro</p>\r
        {firebaseUser && (\r
          <p className="text-center text-[10px] text-green-600 dark:text-green-400 mb-4 font-semibold">\r
            🔒 {firebaseUser.email}\r
          </p>\r
        )}\r
\r
        {error && (\r
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold px-4 py-2.5 rounded-xl mb-4 text-center">\r
            {error}\r
          </div>\r
        )}\r
\r
        {loading ? (\r
          <div className="flex flex-col items-center gap-3 py-8">\r
            <Loader2 className="w-8 h-8 text-primary animate-spin" />\r
            <span className="text-sm text-muted-foreground">Memuat data...</span>\r
          </div>\r
        ) : (\r
          <>\r
            <button\r
              type="button"\r
              onClick={() => setDropdownOpen((v) => !v)}\r
              className="w-full h-16 rounded-3xl border-2 border-primary/50 bg-card px-5 flex items-center justify-between text-left mb-5 shadow-sm"\r
            >\r
              <div className="flex items-center gap-3 min-w-0">\r
                <span className="text-lg font-extrabold text-foreground truncate">\r
                  {selected || "PILIH KASIR"}\r
                </span>\r
                {isOwnerSelected && <span className="text-lg">👑</span>}\r
              </div>\r
              <ChevronDown className="w-6 h-6 text-muted-foreground" />\r
            </button>\r
\r
            {dropdownOpen && (\r
              <div className="mb-5 rounded-3xl border-2 border-border bg-card shadow-lg overflow-hidden">\r
                {activeUsers.map((u) => (\r
                  <button\r
                    key={u.id}\r
                    type="button"\r
                    onClick={() => {\r
                      setSelected(u.name);\r
                      setDropdownOpen(false);\r
                      setSelectedShift("PAGI");\r
                    }}\r
                    className="w-full px-5 py-4 text-left text-base font-semibold text-gray-900 border-b last:border-b-0 border-gray-100"\r
                  >\r
                    {u.name}\r
                  </button>\r
                ))}\r
                {ownerUser && (\r
                  <button\r
                    type="button"\r
                    onClick={() => {\r
                      setSelected(ownerUser.name);\r
                      setDropdownOpen(false);\r
                      setSelectedShift("PAGI");\r
                    }}\r
                    className="w-full px-5 py-4 text-left text-base font-semibold text-gray-900"\r
                  >\r
                    {ownerUser.name} 👑\r
                  </button>\r
                )}\r
              </div>\r
            )}\r
\r
            {selectedUser && selectedUser.role !== "owner" && (\r
              <>\r
                <p className="text-center text-gray-500 font-semibold mb-3">Pilih Shift</p>\r
                <div className="grid grid-cols-2 gap-3 mb-5">\r
                  {SHIFT_OPTIONS.map((shift) => {\r
                    const Icon = shift.icon;\r
                    const isActive = selectedShift === shift.value;\r
                    return (\r
                      <button\r
                        key={shift.value}\r
                        type="button"\r
                        onClick={() => setSelectedShift(shift.value)}\r
                        className={\`h-28 rounded-3xl border-2 flex flex-col items-center justify-center gap-2 transition-all \${\r
                          isActive ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-gray-50"\r
                        }\`}\r
                      >\r
                        <Icon className="w-8 h-8 text-gray-500" />\r
                        <span className="text-2xl font-extrabold text-gray-700">{shift.label}</span>\r
                      </button>\r
                    );\r
                  })}\r
                </div>\r
              </>\r
            )}\r
\r
            {pinEnabled && (\r
              <div className="flex items-center gap-3 border-2 border-gray-200 rounded-2xl px-4 h-14 bg-gray-50 mb-4 focus-within:border-blue-500">\r
                <Lock className="w-5 h-5 text-gray-500" />\r
                <input\r
                  type={showPin ? "text" : "password"}\r
                  inputMode="numeric"\r
                  maxLength={4}\r
                  placeholder="PIN"\r
                  value={pin}\r
                  onChange={(e) => {\r
                    const d = e.target.value.replace(/\\D/g, "");\r
                    if (d.length <= 4) setPin(d);\r
                  }}\r
                  onKeyDown={(e) => {\r
                    if (e.key === "Enter" && selected) {\r
                      e.preventDefault();\r
                      void doLogin(selected);\r
                    }\r
                  }}\r
                  className="flex-1 bg-transparent outline-none text-base font-bold text-gray-800 tracking-widest placeholder:text-gray-400 placeholder:font-normal placeholder:tracking-normal"\r
                />\r
                <button type="button" onClick={() => setShowPin(!showPin)} className="text-gray-400 hover:text-gray-600 p-1">\r
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}\r
                </button>\r
              </div>\r
            )}\r
\r
            <button\r
              type="button"\r
              onClick={() => selected && void doLogin(selected)}\r
              disabled={loggingIn || !selected || (selectedUser?.role !== "owner" && !selectedShift)}\r
              className="w-full h-14 rounded-3xl font-extrabold text-lg bg-primary text-white shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-50 mb-3"\r
            >\r
              {loggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : null}\r
              MASUK\r
            </button>\r
\r
            <button\r
              type="button"\r
              onClick={firebaseLogout}\r
              className="w-full flex items-center justify-center gap-2 text-red-500 text-sm font-semibold py-2"\r
            >\r
              <LogOut className="w-4 h-4" /> Logout Firebase\r
            </button>\r
          </>\r
        )}\r
      </div>\r
    </div>\r
  );\r
}\r
\r
export default function Login() {\r
  const { firebaseUser, firebaseLoading } = useAuth();\r
\r
  const { theme, toggleTheme } = useDisplayMode();\r
\r
  if (firebaseLoading) {\r
    return (\r
      <div className="min-h-screen bg-gradient-to-b from-blue-700 via-primary to-sky-500 dark:from-slate-900 dark:via-blue-900 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-500">\r
        <div className="bg-card p-8 rounded-[2rem] w-full max-w-sm shadow-2xl flex flex-col items-center gap-4 border border-border/50">\r
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-primary/20">\r
            <img src={logoUrl} alt="Alfaza" className="w-full h-full object-cover" />\r
          </div>\r
          <h2 className="text-xl font-extrabold text-primary">ALFAZA CELL</h2>\r
          <p className="text-muted-foreground text-sm">Sistem Kasir Pro</p>\r
          <Loader2 className="w-8 h-8 text-primary animate-spin" />\r
          <p className="text-sm text-muted-foreground">Memuat data...</p>\r
        </div>\r
      </div>\r
    );\r
  }\r
\r
\r
  if (!firebaseUser) {\r
    return <FirebaseAuthScreen />;\r
  }\r
\r
  return <KasirSelectionScreen />;\r
}\r
`,kr=`import { useState, useRef, useCallback, useEffect } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { Header } from "@/components/layout/header";\r
import { getBalance, createTransaction, type BalanceRecord } from "@/lib/firestore";\r
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";\r
import { CreditCard, Check } from "lucide-react";\r
import { useToast } from "@/hooks/use-toast";\r
\r
export default function NonTunai() {\r
  const { user } = useAuth();\r
  const [nominalDisplay, setNominalDisplay] = useState("");\r
  const [adminDisplay, setAdminDisplay] = useState("");\r
  const [keterangan, setKeterangan] = useState("");\r
  const [saved, setSaved] = useState(false);\r
  const [saving, setSaving] = useState(false);\r
\r
  const nominalRef = useRef<HTMLInputElement>(null);\r
  const adminRef = useRef<HTMLInputElement>(null);\r
  const ketRef = useRef<HTMLInputElement>(null);\r
\r
  const { toast } = useToast();\r
\r
  const handleProses = async () => {\r
    if (!user) return;\r
    const n = parseInt(parseThousands(nominalDisplay));\r
    const a = parseInt(parseThousands(adminDisplay)) || 0;\r
    if (!n || n <= 0) {\r
      toast({ title: "Nominal harus diisi", variant: "destructive" });\r
      return;\r
    }\r
    setSaving(true);\r
    try {\r
      const now = new Date();\r
      await createTransaction({\r
        kasirName: user.name,\r
        category: "NON TUNAI",\r
        nominal: n,\r
        nominalTunai: 0,\r
        nominalNonTunai: n,\r
        admin: a,\r
        adminTunai: 0,\r
        adminNonTunai: a,\r
        keterangan,\r
        transDate: getWibDate(),\r
        transTime: now.toTimeString().substring(0, 5),\r
        paymentMethod: "NON-TUNAI",\r
      });\r
      setSaved(true);\r
      setTimeout(() => setSaved(false), 2000);\r
      setNominalDisplay("");\r
      setAdminDisplay("");\r
      setKeterangan("");\r
      nominalRef.current?.focus();\r
    } catch (err: any) {\r
      toast({ title: "Gagal menyimpan", description: err.message, variant: "destructive" });\r
    } finally {\r
      setSaving(false);\r
    }\r
  };\r
\r
  return (\r
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-purple-50 to-white">\r
      <div className="p-4">\r
        <Header />\r
\r
        <div className="bg-gradient-to-r from-purple-600 to-purple-500 text-white p-4 rounded-2xl mb-5 text-center shadow-lg">\r
          <div className="flex items-center justify-center gap-2 text-base font-extrabold">\r
            <CreditCard className="w-5 h-5" />\r
            Khusus Pembayaran Non Tunai\r
          </div>\r
        </div>\r
\r
        {saved && (\r
          <div className="bg-green-50 border-2 border-green-300 text-green-700 p-3 rounded-2xl mb-4 text-sm font-bold flex items-center justify-center gap-2 animate-in fade-in">\r
            <Check className="w-5 h-5" /> BERHASIL disimpan!\r
          </div>\r
        )}\r
\r
        <div className="bg-white rounded-3xl p-5 shadow-md border border-purple-100 mb-5">\r
          <div className="space-y-4 mb-5">\r
            <div className="flex items-center gap-3">\r
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0">\r
                <span className="text-purple-600 font-extrabold text-sm">Rp</span>\r
              </div>\r
              <input\r
                ref={nominalRef}\r
                type="text"\r
                inputMode="numeric"\r
                placeholder="Nominal"\r
                value={nominalDisplay}\r
                onChange={(e) => setNominalDisplay(formatThousands(e.target.value))}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); adminRef.current?.focus(); } }}\r
                className="flex-1 bg-transparent outline-none text-lg font-bold text-gray-800 placeholder:text-gray-400 border-b border-gray-200 pb-2"\r
              />\r
            </div>\r
\r
            <div className="flex items-center gap-3">\r
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">\r
                <span className="text-amber-600 font-extrabold text-sm">%</span>\r
              </div>\r
              <input\r
                ref={adminRef}\r
                type="text"\r
                inputMode="numeric"\r
                placeholder="Admin"\r
                value={adminDisplay}\r
                onChange={(e) => setAdminDisplay(formatThousands(e.target.value))}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); ketRef.current?.focus(); } }}\r
                className="flex-1 bg-transparent outline-none text-lg font-bold text-gray-800 placeholder:text-gray-400 border-b border-gray-200 pb-2"\r
              />\r
            </div>\r
\r
            <div className="flex items-center gap-3">\r
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">\r
                <span className="text-lg">📝</span>\r
              </div>\r
              <input\r
                ref={ketRef}\r
                placeholder="Keterangan"\r
                value={keterangan}\r
                onChange={(e) => setKeterangan(e.target.value)}\r
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleProses(); } }}\r
                className="flex-1 bg-transparent outline-none text-lg font-bold text-gray-800 placeholder:text-gray-400 border-b border-gray-200 pb-2"\r
              />\r
            </div>\r
          </div>\r
\r
          <button\r
            onClick={handleProses}\r
            disabled={saving}\r
            className="w-full h-14 rounded-2xl font-extrabold text-base bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"\r
          >\r
            <CreditCard className="w-5 h-5" />\r
            {saving ? "MEMPROSES..." : "SIMPAN NON TUNAI"}\r
          </button>\r
        </div>\r
      </div>\r
    </div>\r
  );\r
}\r
`,Rr=`import { AlertCircle } from "lucide-react";\r
import { Link } from "wouter";\r
\r
export default function NotFound() {\r
  return (\r
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">\r
      <div className="w-full max-w-md mx-4 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">\r
        <div className="flex mb-4 gap-2">\r
          <AlertCircle className="h-8 w-8 text-red-500" />\r
          <h1 className="text-2xl font-bold text-gray-900">404</h1>\r
        </div>\r
        <p className="text-sm text-gray-600 mb-4">Halaman tidak ditemukan</p>\r
        <Link href="/" className="text-blue-600 font-bold text-sm">Kembali ke Login</Link>\r
      </div>\r
    </div>\r
  );\r
}\r
`,Sr=`import { useState, useEffect, useMemo, useCallback, useRef } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { Header } from "@/components/layout/header";\r
import {\r
  getUsers, createUser, updateUser, deleteUser,\r
  getSettings, updateSettings,\r
  getTransactions, getSaldoHistory, getBalance, resetBalance,\r
  getAttendance, getIzinList, createIzin, updateIzin,\r
  getHutangList, getKontakList,\r
  resetAllData, getDailyNotes,\r
  type UserRecord, type SettingsRecord, type TransactionRecord, type AttendanceRecord, type IzinRecord, type SaldoHistoryRecord, type CategoryLabels,\r
} from "@/lib/firestore";\r
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";\r
import { useToast } from "@/hooks/use-toast";\r
import { useDisplayMode } from "@/hooks/use-display-mode";\r
import {\r
  Users, BarChart3, TrendingUp, FileText, DollarSign, Fingerprint, Palette,\r
  Database, Settings, ArrowLeft, Plus, Trash2, Edit, Eye, EyeOff,\r
  Shield, Check, X, CalendarDays, Download, RefreshCw,\r
  BookOpen, AlertTriangle, Star, Activity, Loader2, Lock,\r
  Share2, ImageIcon\r
} from "lucide-react";\r
import { format } from "date-fns";\r
import { id as idLocale } from "date-fns/locale";\r
import html2canvas from "html2canvas";\r
\r
type OwnerPage = "main" | "kasir" | "grafik" | "performa" | "izin" | "gajih" | "absen" | "backup" | "setting" | "ringkasan";\r
\r
export default function Owner() {\r
  const { user } = useAuth();\r
  const { toast } = useToast();\r
  const [page, setPage] = useState<OwnerPage>("main");\r
\r
  const menuItems = [\r
    { id: "kasir" as const, icon: Users, label: "Kasir", desc: "Kelola data kasir", color: "from-primary to-blue-500" },\r
    { id: "ringkasan" as const, icon: FileText, label: "Ringkasan", desc: "Ringkasan harian", color: "from-indigo-600 to-indigo-500" },\r
    { id: "grafik" as const, icon: BarChart3, label: "Grafik", desc: "Grafik transaksi", color: "from-emerald-600 to-emerald-500" },\r
    { id: "performa" as const, icon: TrendingUp, label: "Performa", desc: "Performa kasir", color: "from-purple-600 to-purple-500" },\r
    { id: "absen" as const, icon: Fingerprint, label: "Absen", desc: "Kehadiran kasir", color: "from-teal-600 to-teal-500" },\r
    { id: "izin" as const, icon: CalendarDays, label: "Izin", desc: "Kelola izin", color: "from-amber-600 to-amber-500" },\r
    { id: "gajih" as const, icon: DollarSign, label: "Gajih", desc: "Data gaji kasir", color: "from-green-600 to-green-500" },\r
    { id: "backup" as const, icon: Database, label: "Backup", desc: "Backup & reset", color: "from-rose-600 to-rose-500" },\r
    { id: "setting" as const, icon: Settings, label: "Setting", desc: "Pengaturan app", color: "from-gray-600 to-gray-500" },\r
  ];\r
\r
  const [zipping, setZipping] = useState(false);\r
\r
  const handleDownloadZip = async () => {\r
    setZipping(true);\r
    try {\r
      const [{ getSourceFiles }, { default: JSZip }] = await Promise.all([\r
        import("@/lib/source-bundle"),\r
        import("jszip"),\r
      ]);\r
      const files = getSourceFiles();\r
      const zip = new JSZip();\r
      for (const [path, content] of Object.entries(files)) {\r
        zip.file(path, content);\r
      }\r
      const blob = await zip.generateAsync({ type: "blob" });\r
      const url = URL.createObjectURL(blob);\r
      const a = document.createElement("a");\r
      a.href = url;\r
      a.download = \`alfaza-link-source-\${new Date().toISOString().slice(0, 10)}.zip\`;\r
      a.click();\r
      URL.revokeObjectURL(url);\r
      toast({ title: "Source code berhasil diunduh" });\r
    } catch {\r
      toast({ title: "Gagal membuat ZIP", variant: "destructive" });\r
    } finally {\r
      setZipping(false);\r
    }\r
  };\r
\r
  if (page === "main") {\r
    return (\r
      <div className="px-3 pt-3 pb-20">\r
        <Header />\r
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 rounded-2xl p-4 mb-4 text-white shadow-lg">\r
          <div className="flex items-center gap-2">\r
            <Shield className="w-6 h-6" />\r
            <div>\r
              <h2 className="font-extrabold text-lg">Panel Owner</h2>\r
              <p className="text-[11px] opacity-80">Kelola semua data toko</p>\r
            </div>\r
          </div>\r
        </div>\r
        <div className="grid grid-cols-3 gap-2.5">\r
          {menuItems.map(item => {\r
            const Icon = item.icon;\r
            return (\r
              <button key={item.id} onClick={() => setPage(item.id)} className="bg-card rounded-2xl p-3 shadow-sm border border-border flex flex-col items-center gap-2 active:scale-95 transition">\r
                <div className={\`w-11 h-11 rounded-xl bg-gradient-to-br \${item.color} flex items-center justify-center shadow-sm\`}>\r
                  <Icon className="w-5 h-5 text-white" />\r
                </div>\r
                <span className="text-xs font-bold text-foreground">{item.label}</span>\r
                <span className="text-[9px] text-muted-foreground">{item.desc}</span>\r
              </button>\r
            );\r
          })}\r
        </div>\r
\r
        <div className="mt-4">\r
          <button onClick={handleDownloadZip} disabled={zipping} className="w-full bg-slate-800 dark:bg-slate-700 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition disabled:opacity-60">\r
            {zipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}\r
            {zipping ? "Membuat ZIP..." : "Download Source Code (ZIP)"}\r
          </button>\r
          <p className="text-[10px] text-muted-foreground text-center mt-1.5">Unduh semua file kode terbaru untuk diedit di aplikasi lain</p>\r
        </div>\r
\r
      </div>\r
    );\r
  }\r
\r
  const BackButton = () => (\r
    <button onClick={() => setPage("main")} className="flex items-center gap-1 text-primary font-bold text-sm mb-3">\r
      <ArrowLeft className="w-4 h-4" /> Kembali\r
    </button>\r
  );\r
\r
  switch (page) {\r
    case "kasir": return <KasirPage goBack={() => setPage("main")} />;\r
    case "grafik": return <GrafikPage goBack={() => setPage("main")} />;\r
    case "performa": return <PerformaPage goBack={() => setPage("main")} />;\r
    case "absen": return <AbsenPage goBack={() => setPage("main")} />;\r
    case "izin": return <IzinPage goBack={() => setPage("main")} />;\r
    case "gajih": return <GajihPage goBack={() => setPage("main")} />;\r
    case "backup": return <BackupPage goBack={() => setPage("main")} />;\r
    case "setting": return <SettingPage goBack={() => setPage("main")} />;\r
    case "ringkasan": return <RingkasanPage goBack={() => setPage("main")} />;\r
    default: return null;\r
  }\r
}\r
\r
function PageWrapper({ title, icon: Icon, goBack, children }: { title: string; icon: any; goBack: () => void; children: React.ReactNode }) {\r
  return (\r
    <div className="px-3 pt-3 pb-20">\r
      <Header />\r
      <button onClick={goBack} className="flex items-center gap-1 text-primary font-bold text-sm mb-3">\r
        <ArrowLeft className="w-4 h-4" /> Kembali\r
      </button>\r
      <div className="bg-gradient-to-r from-blue-900 to-primary rounded-2xl p-4 mb-4 text-white flex items-center gap-3">\r
        <Icon className="w-6 h-6" />\r
        <h2 className="font-extrabold text-base">{title}</h2>\r
      </div>\r
      {children}\r
    </div>\r
  );\r
}\r
\r
function KasirPage({ goBack }: { goBack: () => void }) {\r
  const { toast } = useToast();\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [showForm, setShowForm] = useState(false);\r
  const [editUser, setEditUser] = useState<UserRecord | null>(null);\r
  const [name, setName] = useState("");\r
  const [pin, setPin] = useState("");\r
  const [role, setRole] = useState("kasir");\r
  const [saving, setSaving] = useState(false);\r
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});\r
\r
  const loadUsers = useCallback(async () => {\r
    const u = await getUsers();\r
    setUsers(u);\r
  }, []);\r
\r
  useEffect(() => { loadUsers(); }, [loadUsers]);\r
\r
  const kasirList = users.filter(u => u.role !== "owner");\r
\r
  const resetForm = () => {\r
    setName("");\r
    setPin("");\r
    setRole("kasir");\r
    setEditUser(null);\r
    setShowForm(false);\r
  };\r
\r
  const handleSave = async () => {\r
    if (!name.trim()) { toast({ title: "Nama harus diisi", variant: "destructive" }); return; }\r
    setSaving(true);\r
    try {\r
      if (editUser) {\r
        await updateUser(editUser.id, { name, pin: pin || editUser.pin, role });\r
      } else {\r
        await createUser({ name, pin: pin || "0000", role, isActive: true });\r
      }\r
      toast({ title: editUser ? "Kasir diperbarui" : "Kasir ditambahkan" });\r
      resetForm();\r
      await loadUsers();\r
    } catch {\r
      toast({ title: "Gagal menyimpan", variant: "destructive" });\r
    } finally { setSaving(false); }\r
  };\r
\r
  const handleDelete = async (id: string) => {\r
    if (!confirm("Hapus kasir ini?")) return;\r
    try {\r
      await deleteUser(id);\r
      toast({ title: "Kasir dihapus" });\r
      await loadUsers();\r
    } catch {\r
      toast({ title: "Gagal menghapus", variant: "destructive" });\r
    }\r
  };\r
\r
  const toggleActive = async (u: UserRecord) => {\r
    try {\r
      await updateUser(u.id, { isActive: !u.isActive });\r
      await loadUsers();\r
    } catch {}\r
  };\r
\r
  return (\r
    <PageWrapper title="Manajemen Kasir" icon={Users} goBack={goBack}>\r
      <button onClick={() => setShowForm(true)} className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm mb-4 flex items-center justify-center gap-2 shadow active:scale-95 transition">\r
        <Plus className="w-4 h-4" /> Tambah Kasir\r
      </button>\r
\r
      {kasirList.length === 0 ? (\r
        <div className="text-center py-10 text-muted-foreground">\r
          <Users className="w-10 h-10 mx-auto mb-2 text-muted-foreground/50" />\r
          <p className="text-sm">Belum ada kasir</p>\r
        </div>\r
      ) : (\r
        kasirList.map(u => (\r
          <div key={u.id} className={\`bg-card rounded-2xl p-4 mb-2.5 shadow-sm border \${u.isActive ? 'border-border' : 'border-destructive/20 bg-destructive/5'}\`}>\r
            <div className="flex justify-between items-center">\r
              <div>\r
                <span className="font-bold text-sm text-foreground">{u.name}</span>\r
                <div className="flex items-center gap-2 mt-1">\r
                  <span className={\`text-[10px] font-semibold px-2 py-0.5 rounded-full \${u.isActive ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}\`}>\r
                    {u.isActive ? "Aktif" : "Nonaktif"}\r
                  </span>\r
                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">\r
                    PIN: {showPins[u.id] ? u.pin : "••••"}\r
                    <button onClick={() => setShowPins(prev => ({ ...prev, [u.id]: !prev[u.id] }))} className="text-muted-foreground ml-1">\r
                      {showPins[u.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}\r
                    </button>\r
                  </span>\r
                </div>\r
              </div>\r
              <div className="flex gap-1.5">\r
                <button onClick={() => toggleActive(u)} className={\`text-[10px] px-2.5 py-1.5 rounded-lg font-bold \${u.isActive ? 'bg-red-100 text-red-600 dark:bg-red-900/30' : 'bg-green-100 text-green-600 dark:bg-green-900/30'}\`}>\r
                  {u.isActive ? "Nonaktifkan" : "Aktifkan"}\r
                </button>\r
                <button onClick={() => { setEditUser(u); setName(u.name); setPin(u.pin); setRole(u.role); setShowForm(true); }} className="bg-primary/10 text-primary px-2 py-1.5 rounded-lg">\r
                  <Edit className="w-3.5 h-3.5" />\r
                </button>\r
                <button onClick={() => handleDelete(u.id)} className="bg-destructive/10 text-destructive px-2 py-1.5 rounded-lg">\r
                  <Trash2 className="w-3.5 h-3.5" />\r
                </button>\r
              </div>\r
            </div>\r
          </div>\r
        ))\r
      )}\r
\r
\r
      {showForm && (\r
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={resetForm}>\r
          <div className="bg-card rounded-2xl p-5 w-full max-w-sm shadow-xl border border-border" onClick={e => e.stopPropagation()}>\r
            <div className="flex justify-between mb-3">\r
              <h3 className="font-bold text-base text-foreground">{editUser ? "Edit" : "Tambah"} Kasir</h3>\r
              <button onClick={resetForm} className="text-xl text-muted-foreground hover:text-foreground">&times;</button>\r
            </div>\r
            <div className="space-y-3 mb-4">\r
              <input value={name} onChange={e => setName(e.target.value)} placeholder="Nama Kasir" className="w-full border border-border bg-muted/20 rounded-xl px-3 py-2.5 text-sm outline-none text-foreground" />\r
              <input value={pin} onChange={e => setPin(e.target.value.replace(/\\D/g, "").slice(0, 4))} maxLength={4} inputMode="numeric" placeholder="PIN (4 digit)" className="w-full border border-border bg-muted/20 rounded-xl px-3 py-2.5 text-sm outline-none text-foreground" />\r
            </div>\r
            <button onClick={handleSave} disabled={saving} className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-full text-sm disabled:opacity-60">\r
              {saving ? "Menyimpan..." : "Simpan"}\r
            </button>\r
          </div>\r
        </div>\r
      )}\r
\r
    </PageWrapper>\r
  );\r
}\r
\r
function GrafikPage({ goBack }: { goBack: () => void }) {\r
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [filterKasir, setFilterKasir] = useState("Semua");\r
  const today = getWibDate();\r
  const now = new Date();\r
  const [viewMode, setViewMode] = useState<"range" | "bulan">("range");\r
  const [startDate, setStartDate] = useState(() => {\r
    const d = new Date();\r
    d.setDate(d.getDate() - 7);\r
    return d.toISOString().split("T")[0];\r
  });\r
  const [endDate, setEndDate] = useState(today);\r
  const [month, setMonth] = useState(() => \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);\r
\r
  useEffect(() => {\r
    let sDate: string, eDate: string;\r
    if (viewMode === "bulan") {\r
      const [y, m] = month.split("-").map(Number);\r
      sDate = \`\${y}-\${String(m).padStart(2, "0")}-01\`;\r
      const lastDay = new Date(y, m, 0).getDate();\r
      eDate = \`\${y}-\${String(m).padStart(2, "0")}-\${String(lastDay).padStart(2, "0")}\`;\r
    } else {\r
      sDate = startDate;\r
      eDate = endDate;\r
    }\r
    Promise.all([\r
      getTransactions({ startDate: sDate, endDate: eDate }),\r
      getUsers(),\r
    ]).then(([t, u]) => {\r
      setTransactions(t);\r
      setUsers(u);\r
    }).catch(() => {});\r
  }, [startDate, endDate, month, viewMode]);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
  const filteredTx = filterKasir === "Semua" ? transactions : transactions.filter(t => t.kasirName === filterKasir);\r
\r
  const dailyData = useMemo(() => {\r
    const map = new Map<string, { bank: number; flip: number; app: number; dana: number; tarik: number; aks: number; admin: number }>();\r
    filteredTx.forEach(tx => {\r
      const d = tx.transDate;\r
      if (!map.has(d)) map.set(d, { bank: 0, flip: 0, app: 0, dana: 0, tarik: 0, aks: 0, admin: 0 });\r
      const entry = map.get(d)!;\r
      if (tx.category === "BANK") entry.bank += tx.nominal || 0;\r
      else if (tx.category === "FLIP") entry.flip += tx.nominal || 0;\r
      else if (tx.category === "APP PULSA") entry.app += tx.nominal || 0;\r
      else if (tx.category === "DANA") entry.dana += tx.nominal || 0;\r
      else if (tx.category === "TARIK TUNAI") entry.tarik += tx.nominal || 0;\r
      else if (tx.category === "AKSESORIS") entry.aks += tx.nominal || 0;\r
      entry.admin += tx.admin || 0;\r
    });\r
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([date, data]) => ({ date: date.slice(5), ...data }));\r
  }, [filteredTx]);\r
\r
  const maxVal = Math.max(1, ...dailyData.map(d => Math.max(d.bank, d.flip, d.app, d.dana, d.tarik, d.aks)));\r
  const categories = [\r
    { key: "bank" as const, label: "Bank", color: "bg-blue-500" },\r
    { key: "flip" as const, label: "Flip", color: "bg-orange-500" },\r
    { key: "app" as const, label: "App", color: "bg-purple-500" },\r
    { key: "dana" as const, label: "Dana", color: "bg-sky-500" },\r
    { key: "tarik" as const, label: "Tarik", color: "bg-emerald-500" },\r
    { key: "aks" as const, label: "Aks", color: "bg-rose-500" },\r
  ];\r
\r
  return (\r
    <PageWrapper title="Grafik Transaksi" icon={BarChart3} goBack={goBack}>\r
      <div className="grid grid-cols-2 gap-2 mb-3">\r
        <button\r
          onClick={() => setViewMode("range")}\r
          className={\`py-2 rounded-full text-xs font-bold transition \${viewMode === "range" ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
        >\r
          Per Tanggal\r
        </button>\r
        <button\r
          onClick={() => setViewMode("bulan")}\r
          className={\`py-2 rounded-full text-xs font-bold transition \${viewMode === "bulan" ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
        >\r
          Per Bulan\r
        </button>\r
      </div>\r
\r
      {viewMode === "range" ? (\r
        <div className="flex gap-1.5 items-center mb-3">\r
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-2.5 py-2 text-xs bg-white outline-none" />\r
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-2.5 py-2 text-xs bg-white outline-none" />\r
        </div>\r
      ) : (\r
        <div className="mb-3">\r
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white outline-none" />\r
        </div>\r
      )}\r
\r
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">\r
        <button\r
          onClick={() => setFilterKasir("Semua")}\r
          className={\`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition \${filterKasir === "Semua" ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
        >\r
          Semua\r
        </button>\r
        {kasirList.map(k => (\r
          <button\r
            key={k.name}\r
            onClick={() => setFilterKasir(k.name)}\r
            className={\`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition \${filterKasir === k.name ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
          >\r
            {k.name}\r
          </button>\r
        ))}\r
      </div>\r
\r
      <div className="flex flex-wrap gap-2 mb-4">\r
        {categories.map(c => (\r
          <div key={c.key} className="flex items-center gap-1 text-[10px] text-gray-600">\r
            <div className={\`w-2.5 h-2.5 rounded-full \${c.color}\`} />\r
            {c.label}\r
          </div>\r
        ))}\r
      </div>\r
\r
      {dailyData.length === 0 ? (\r
        <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data</div>\r
      ) : (\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 overflow-x-auto">\r
          <div className="min-w-[300px]">\r
            {dailyData.map((d, i) => (\r
              <div key={i} className="mb-3">\r
                <div className="text-[10px] font-semibold text-gray-500 mb-1">{d.date}</div>\r
                {categories.map(c => {\r
                  const val = d[c.key];\r
                  const width = Math.max(2, (val / maxVal) * 100);\r
                  return (\r
                    <div key={c.key} className="flex items-center gap-1 mb-0.5">\r
                      <div className={\`\${c.color} h-3 rounded-full transition-all\`} style={{ width: \`\${width}%\` }} />\r
                      <span className="text-[9px] text-gray-500 whitespace-nowrap">{formatRupiah(val)}</span>\r
                    </div>\r
                  );\r
                })}\r
              </div>\r
            ))}\r
          </div>\r
        </div>\r
      )}\r
    </PageWrapper>\r
  );\r
}\r
\r
function PerformaPage({ goBack }: { goBack: () => void }) {\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);\r
  const [loading, setLoading] = useState(true);\r
  const now = new Date();\r
  const [month, setMonth] = useState(() => \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);\r
\r
  useEffect(() => {\r
    setLoading(true);\r
    const [y, m] = month.split("-").map(Number);\r
    const startDate = \`\${y}-\${String(m).padStart(2, "0")}-01\`;\r
    const lastDay = new Date(y, m, 0).getDate();\r
    const endDate = \`\${y}-\${String(m).padStart(2, "0")}-\${String(lastDay).padStart(2, "0")}\`;\r
    Promise.all([\r
      getUsers(),\r
      getTransactions({ startDate, endDate }),\r
    ]).then(([u, t]) => {\r
      setUsers(u);\r
      setTransactions(t);\r
    }).catch(() => {}).finally(() => setLoading(false));\r
  }, [month]);\r
\r
  const [y, m] = month.split("-").map(Number);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
  const performaData = kasirList.map(k => {\r
    const kasirTx = transactions.filter(t => t.kasirName === k.name);\r
    const daysSet = new Set(kasirTx.map(t => t.transDate));\r
    const daysActive = daysSet.size || 1;\r
    const totalNominal = kasirTx.reduce((s, t) => s + (t.nominal || 0), 0);\r
    const totalAdmin = kasirTx.reduce((s, t) => s + (t.admin || 0), 0);\r
    return {\r
      name: k.name,\r
      count: kasirTx.length,\r
      totalNominal,\r
      totalAdmin,\r
      rataPerHari: Math.round(totalNominal / daysActive),\r
    };\r
  }).sort((a, b) => b.totalNominal - a.totalNominal);\r
\r
  const monthLabel = format(new Date(y, m - 1), "MMMM yyyy", { locale: idLocale });\r
  const cardColors = ["from-pink-500 to-rose-400", "from-blue-500 to-blue-400", "from-purple-500 to-purple-400", "from-teal-500 to-teal-400", "from-amber-500 to-amber-400"];\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20 min-h-screen bg-gray-50">\r
      <div className="flex items-center gap-2 mb-4">\r
        <button onClick={goBack} className="text-gray-600"><ArrowLeft className="w-5 h-5" /></button>\r
        <TrendingUp className="w-5 h-5 text-red-500" />\r
        <h1 className="font-extrabold text-base">Performa Karyawan</h1>\r
      </div>\r
\r
      <div className="bg-gradient-to-r from-primary to-blue-400 rounded-2xl p-4 mb-4 text-white">\r
        <h2 className="font-bold text-base">Bulan {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</h2>\r
        <p className="text-xs opacity-80">Rekap performa kasir bulan ini</p>\r
      </div>\r
\r
      <div className="flex gap-2 mb-4">\r
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white outline-none" />\r
      </div>\r
\r
      {loading ? (\r
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>\r
      ) : performaData.length === 0 ? (\r
        <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data</div>\r
      ) : (\r
        performaData.map((k, i) => (\r
          <div key={k.name} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">\r
            <div className="flex items-center gap-3 mb-3">\r
              <div className={\`w-11 h-11 rounded-full bg-gradient-to-br \${cardColors[i % cardColors.length]} flex items-center justify-center text-white font-bold text-lg shadow\`}>\r
                {k.name.charAt(0).toUpperCase()}\r
              </div>\r
              <span className="font-extrabold text-sm uppercase">{k.name}</span>\r
            </div>\r
            <div className="grid grid-cols-2 gap-2">\r
              <div className="bg-blue-50 rounded-xl p-3">\r
                <p className="text-[10px] font-semibold text-blue-500">Jumlah Transaksi</p>\r
                <p className="text-lg font-extrabold text-blue-700">{k.count}</p>\r
              </div>\r
              <div className="bg-green-50 rounded-xl p-3">\r
                <p className="text-[10px] font-semibold text-green-500">Total Penjualan</p>\r
                <p className="text-lg font-extrabold text-green-700">{formatRupiah(k.totalNominal)}</p>\r
              </div>\r
              <div className="bg-amber-50 rounded-xl p-3">\r
                <p className="text-[10px] font-semibold text-amber-500">Total Admin</p>\r
                <p className="text-lg font-extrabold text-amber-700">{formatRupiah(k.totalAdmin)}</p>\r
              </div>\r
              <div className="bg-yellow-50 rounded-xl p-3">\r
                <p className="text-[10px] font-semibold text-yellow-600">Rata-rata / Hari</p>\r
                <p className="text-lg font-extrabold text-yellow-700">{formatRupiah(k.rataPerHari)}</p>\r
              </div>\r
            </div>\r
          </div>\r
        ))\r
      )}\r
    </div>\r
  );\r
}\r
\r
function AbsenPage({ goBack }: { goBack: () => void }) {\r
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [loading, setLoading] = useState(true);\r
  const [viewMode, setViewMode] = useState<"ringkasan" | "lengkap">("ringkasan");\r
  const [filterKasir, setFilterKasir] = useState("Semua");\r
  const now = new Date();\r
  const [monthDate, setMonthDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));\r
\r
  const monthStr = \`\${monthDate.getFullYear()}-\${String(monthDate.getMonth() + 1).padStart(2, "0")}\`;\r
\r
  useEffect(() => {\r
    setLoading(true);\r
    Promise.all([\r
      getAttendance({ month: monthStr }),\r
      getUsers(),\r
    ]).then(([a, u]) => {\r
      setAttendance(a);\r
      setUsers(u);\r
    }).catch(() => {}).finally(() => setLoading(false));\r
  }, [monthStr]);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
  const monthLabel = format(monthDate, "MMMM yyyy", { locale: idLocale });\r
\r
  const prevMonth = () => setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));\r
  const nextMonth = () => setMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));\r
\r
  const filteredAttendance = useMemo(() => {\r
    if (filterKasir === "Semua") return attendance;\r
    return attendance.filter(a => a.kasirName === filterKasir);\r
  }, [attendance, filterKasir]);\r
\r
  const summaryData = kasirList.map(k => {\r
    const kasirAbsen = attendance.filter(a => a.kasirName === k.name);\r
    const hadir = kasirAbsen.length;\r
    const pagi = kasirAbsen.filter(a => a.shift === "PAGI").length;\r
    const siang = kasirAbsen.filter(a => a.shift === "SIANG").length;\r
    return { name: k.name, hadir, pagi, siang };\r
  });\r
\r
  const attendanceByDate = useMemo(() => {\r
    const groups: Record<string, AttendanceRecord[]> = {};\r
    filteredAttendance.forEach(a => {\r
      if (!groups[a.tanggal]) groups[a.tanggal] = [];\r
      groups[a.tanggal].push(a);\r
    });\r
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));\r
  }, [filteredAttendance]);\r
\r
  const cardColors = ["from-blue-500 to-blue-400", "from-pink-500 to-rose-400", "from-purple-500 to-purple-400", "from-teal-500 to-teal-400", "from-amber-500 to-amber-400"];\r
  const softColors = [\r
    "bg-blue-50 border-blue-100",\r
    "bg-emerald-50 border-emerald-100",\r
    "bg-purple-50 border-purple-100",\r
    "bg-amber-50 border-amber-100",\r
    "bg-pink-50 border-pink-100",\r
    "bg-indigo-50 border-indigo-100",\r
    "bg-rose-50 border-rose-100",\r
    "bg-teal-50 border-teal-100"\r
  ];\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20 min-h-screen bg-gray-50">\r
      <div className="flex items-center gap-2 mb-4">\r
        <button onClick={goBack} className="text-gray-600"><ArrowLeft className="w-5 h-5" /></button>\r
        <Users className="w-5 h-5 text-blue-500" />\r
        <h1 className="font-extrabold text-base">Data Absensi</h1>\r
      </div>\r
\r
      <div className="bg-gradient-to-r from-primary to-blue-400 rounded-2xl p-4 mb-4 text-white">\r
        <div className="flex items-center gap-2">\r
          <CalendarDays className="w-5 h-5" />\r
          <div>\r
            <h2 className="font-bold text-sm">Data Absensi</h2>\r
            <p className="text-[11px] opacity-80">Rekap kehadiran karyawan bulan ini</p>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <div className="flex items-center justify-between mb-4 bg-white rounded-xl p-2 shadow-sm border border-gray-100">\r
        <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">\r
          <ArrowLeft className="w-4 h-4" />\r
        </button>\r
        <span className="font-bold text-sm capitalize">{monthLabel}</span>\r
        <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">\r
          <ArrowLeft className="w-4 h-4 rotate-180" />\r
        </button>\r
      </div>\r
\r
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-hide">\r
        <button\r
          onClick={() => setFilterKasir("Semua")}\r
          className={\`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition \${filterKasir === "Semua" ? "bg-primary text-white shadow-md" : "bg-white text-gray-500 border border-gray-200"}\`}\r
        >\r
          Semua Kasir\r
        </button>\r
        {kasirList.map(k => (\r
          <button\r
            key={k.name}\r
            onClick={() => setFilterKasir(k.name)}\r
            className={\`shrink-0 px-4 py-2 rounded-full text-xs font-bold transition \${filterKasir === k.name ? "bg-primary text-white shadow-md" : "bg-white text-gray-500 border border-gray-200"}\`}\r
          >\r
            {k.name}\r
          </button>\r
        ))}\r
      </div>\r
\r
      <div className="grid grid-cols-2 gap-2 mb-4">\r
        <button onClick={() => setViewMode("ringkasan")} className={\`py-2.5 rounded-full text-xs font-bold transition \${viewMode === "ringkasan" ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}>\r
          Ringkasan\r
        </button>\r
        <button onClick={() => setViewMode("lengkap")} className={\`py-2.5 rounded-full text-xs font-bold transition \${viewMode === "lengkap" ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}>\r
          Lengkap\r
        </button>\r
      </div>\r
\r
      {loading ? (\r
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></div>\r
      ) : viewMode === "ringkasan" ? (\r
        summaryData.length === 0 ? (\r
          <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data absensi</div>\r
        ) : (\r
          summaryData.map((k, i) => (\r
            <div key={k.name} className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">\r
              <div className="flex items-center gap-3 mb-2">\r
                <div className={\`w-11 h-11 rounded-full bg-gradient-to-br \${cardColors[i % cardColors.length]} flex items-center justify-center text-white font-bold text-lg shadow\`}>\r
                  {k.name.charAt(0).toUpperCase()}\r
                </div>\r
                <span className="font-extrabold text-sm uppercase">{k.name}</span>\r
              </div>\r
              <div className="flex gap-2">\r
                <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">{k.hadir} Hadir</span>\r
                {k.pagi > 0 && <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">{k.pagi} Pagi</span>}\r
                {k.siang > 0 && <span className="text-[11px] font-semibold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full">{k.siang} Siang</span>}\r
              </div>\r
            </div>\r
          ))\r
        )\r
      ) : (\r
        attendanceByDate.length === 0 ? (\r
          <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data absensi</div>\r
        ) : (\r
          <div className="space-y-4">\r
            {attendanceByDate.map(([date, records], index) => {\r
              const colorClass = softColors[index % softColors.length];\r
              return (\r
                <div key={date} className={\`rounded-2xl border \${colorClass} overflow-hidden shadow-sm\`}>\r
                  <div className="px-4 py-2 border-b border-inherit flex justify-between items-center bg-white/40">\r
                    <span className="font-extrabold text-xs text-gray-700">{format(new Date(date), "EEEE, dd MMMM", { locale: idLocale })}</span>\r
                    <span className="text-[10px] font-bold text-gray-400">{records.length} Kasir</span>\r
                  </div>\r
                  <div className="divide-y divide-inherit">\r
                    {records.map(a => (\r
                      <div key={a.id} className="grid grid-cols-3 px-4 py-3 items-center">\r
                        <div>\r
                          <p className="text-[11px] font-extrabold text-gray-800 uppercase">{a.kasirName}</p>\r
                        </div>\r
                        <div className="text-center">\r
                          <span className={\`text-[10px] font-bold px-2 py-0.5 rounded-full \${a.shift === "PAGI" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}\`}>\r
                            {a.shift}\r
                          </span>\r
                        </div>\r
                        <div className="text-right">\r
                          <span className="text-[11px] font-extrabold text-primary">{a.jamMasuk}</span>\r
                        </div>\r
                      </div>\r
                    ))}\r
                  </div>\r
                </div>\r
              );\r
            })}\r
          </div>\r
        )\r
      )}\r
    </div>\r
  );\r
}\r
\r
function IzinPage({ goBack }: { goBack: () => void }) {\r
  const { toast } = useToast();\r
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [showForm, setShowForm] = useState(false);\r
  const [nama, setNama] = useState("");\r
  const [tanggal, setTanggal] = useState(getWibDate());\r
  const [alasan, setAlasan] = useState("");\r
  const [saving, setSaving] = useState(false);\r
  const [filterKasir, setFilterKasir] = useState("Semua");\r
  const now = new Date();\r
  const [month, setMonth] = useState(() => \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);\r
\r
  const loadData = useCallback(async () => {\r
    const [iz, u] = await Promise.all([getIzinList({ month }), getUsers()]);\r
    setIzinList(iz);\r
    setUsers(u);\r
  }, [month]);\r
\r
  useEffect(() => { loadData(); }, [loadData]);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
  const filteredIzin = filterKasir === "Semua" ? izinList : izinList.filter(iz => iz.nama === filterKasir);\r
\r
  const handleSubmit = async () => {\r
    if (!nama || !alasan) { toast({ title: "Isi semua field", variant: "destructive" }); return; }\r
    setSaving(true);\r
    try {\r
      await createIzin({ nama, tanggal, alasan, status: "pending" });\r
      toast({ title: "Izin diajukan" });\r
      setShowForm(false);\r
      setNama("");\r
      setAlasan("");\r
      await loadData();\r
    } catch {\r
      toast({ title: "Gagal", variant: "destructive" });\r
    } finally { setSaving(false); }\r
  };\r
\r
  const handleApprove = async (iz: IzinRecord, status: string) => {\r
    try {\r
      await updateIzin(iz.id, { status });\r
      toast({ title: status === "approved" ? "Disetujui" : "Ditolak" });\r
      await loadData();\r
    } catch {\r
      toast({ title: "Gagal", variant: "destructive" });\r
    }\r
  };\r
\r
  return (\r
    <PageWrapper title="Manajemen Izin" icon={CalendarDays} goBack={goBack}>\r
      <div className="flex gap-2 mb-3">\r
        <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs bg-white outline-none" />\r
        <button onClick={() => setShowForm(true)} className="bg-primary text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1 shadow">\r
          <Plus className="w-3.5 h-3.5" /> Ajukan\r
        </button>\r
      </div>\r
\r
      <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1">\r
        <button\r
          onClick={() => setFilterKasir("Semua")}\r
          className={\`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition \${filterKasir === "Semua" ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
        >\r
          Semua\r
        </button>\r
        {kasirList.map(k => (\r
          <button\r
            key={k.name}\r
            onClick={() => setFilterKasir(k.name)}\r
            className={\`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition \${filterKasir === k.name ? "bg-primary text-white shadow" : "bg-white text-gray-500 border border-gray-200"}\`}\r
          >\r
            {k.name}\r
          </button>\r
        ))}\r
      </div>\r
\r
      {filteredIzin.length === 0 ? (\r
        <div className="text-center py-10 text-gray-400 text-sm">Tidak ada data izin</div>\r
      ) : (\r
        filteredIzin.map(iz => (\r
          <div key={iz.id} className="bg-white rounded-2xl p-4 mb-2.5 shadow-sm border border-gray-100">\r
            <div className="flex justify-between items-start mb-2">\r
              <div>\r
                <span className="font-bold text-sm">{iz.nama}</span>\r
                <p className="text-[11px] text-gray-500 mt-0.5">{iz.alasan}</p>\r
                <p className="text-[10px] text-gray-400 mt-0.5">{iz.tanggal}</p>\r
              </div>\r
              <span className={\`text-[10px] font-bold px-2.5 py-1 rounded-full \${iz.status === "approved" ? "bg-green-100 text-green-600" : iz.status === "rejected" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600"}\`}>\r
                {iz.status === "approved" ? "Disetujui" : iz.status === "rejected" ? "Ditolak" : "Pending"}\r
              </span>\r
            </div>\r
            {iz.status === "pending" && (\r
              <div className="flex gap-2 mt-2">\r
                <button onClick={() => handleApprove(iz, "approved")} className="flex-1 bg-green-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">\r
                  <Check className="w-3.5 h-3.5" /> Setujui\r
                </button>\r
                <button onClick={() => handleApprove(iz, "rejected")} className="flex-1 bg-red-500 text-white py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1">\r
                  <X className="w-3.5 h-3.5" /> Tolak\r
                </button>\r
              </div>\r
            )}\r
          </div>\r
        ))\r
      )}\r
\r
      {showForm && (\r
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>\r
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>\r
            <div className="flex justify-between mb-3">\r
              <h3 className="font-bold text-base">Ajukan Izin</h3>\r
              <button onClick={() => setShowForm(false)} className="text-xl text-gray-400">&times;</button>\r
            </div>\r
            <div className="space-y-3 mb-4">\r
              <select value={nama} onChange={e => setNama(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white">\r
                <option value="">Pilih Kasir</option>\r
                {kasirList.map(k => <option key={k.name} value={k.name}>{k.name}</option>)}\r
              </select>\r
              <input type="date" value={tanggal} onChange={e => setTanggal(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" />\r
              <textarea value={alasan} onChange={e => setAlasan(e.target.value)} placeholder="Alasan izin" rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" />\r
            </div>\r
            <button onClick={handleSubmit} disabled={saving} className="w-full bg-gradient-to-r from-primary to-blue-500 text-white font-bold py-3 rounded-full text-sm disabled:opacity-60">\r
              {saving ? "Menyimpan..." : "Ajukan Izin"}\r
            </button>\r
          </div>\r
        </div>\r
      )}\r
    </PageWrapper>\r
  );\r
}\r
\r
function GajihPage({ goBack }: { goBack: () => void }) {\r
  const { toast } = useToast();\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);\r
  const [izinList, setIzinList] = useState<IzinRecord[]>([]);\r
  const now = new Date();\r
  const [month, setMonth] = useState(() => \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);\r
  const [selectedKasir, setSelectedKasir] = useState("");\r
  const [mode, setMode] = useState<"harian" | "bulanan">("harian");\r
  const [gajiPerHariDisplay, setGajiPerHariDisplay] = useState(() => formatThousands(localStorage.getItem("alfaza_gaji_per_hari") || "50000"));\r
  const [gajiBulananDisplay, setGajiBulananDisplay] = useState(() => formatThousands(localStorage.getItem("alfaza_gaji_bulanan") || "0"));\r
  const [bonusDisplay, setBonusDisplay] = useState("0");\r
  const [editHariKerja, setEditHariKerja] = useState(false);\r
  const [hariKerjaManual, setHariKerjaManual] = useState("");\r
  const [catatan, setCatatan] = useState("");\r
  const slipRef = useRef<HTMLDivElement>(null);\r
\r
  useEffect(() => {\r
    Promise.all([\r
      getUsers(),\r
      getAttendance({ month }),\r
      getIzinList({ month }),\r
    ]).then(([u, a, iz]) => {\r
      setUsers(u);\r
      setAttendance(a);\r
      setIzinList(iz);\r
      if (!selectedKasir && u.filter(x => x.role !== "owner" && x.isActive).length > 0) {\r
        setSelectedKasir(u.filter(x => x.role !== "owner" && x.isActive)[0].name);\r
      }\r
    }).catch(() => {});\r
  }, [month]);\r
\r
  useEffect(() => {\r
    localStorage.setItem("alfaza_gaji_per_hari", parseThousands(gajiPerHariDisplay));\r
  }, [gajiPerHariDisplay]);\r
\r
  useEffect(() => {\r
    localStorage.setItem("alfaza_gaji_bulanan", parseThousands(gajiBulananDisplay));\r
  }, [gajiBulananDisplay]);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
  const absenCount = attendance.filter(a => a.kasirName === selectedKasir).length;\r
  const izinCount = izinList.filter(iz => iz.nama === selectedKasir && iz.status === "approved").length;\r
\r
  const hariKerja = editHariKerja ? (parseInt(hariKerjaManual) || 0) : absenCount;\r
  const gajiPerHari = parseInt(parseThousands(gajiPerHariDisplay)) || 0;\r
  const gajiBulanan = parseInt(parseThousands(gajiBulananDisplay)) || 0;\r
  const bonus = parseInt(parseThousands(bonusDisplay)) || 0;\r
\r
  const gajiPokok = mode === "harian" ? hariKerja * gajiPerHari : gajiBulanan;\r
  const totalGaji = gajiPokok + bonus;\r
\r
  const [y, m2] = month.split("-").map(Number);\r
  const monthLabel = format(new Date(y, m2 - 1), "MMMM yyyy", { locale: idLocale });\r
\r
  useEffect(() => {\r
    setHariKerjaManual(String(absenCount));\r
    setEditHariKerja(false);\r
  }, [selectedKasir, month, absenCount]);\r
\r
  const handleShareText = async () => {\r
    const lines = [\r
      \`Slip Gaji - \${monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}\`,\r
      \`Nama: \${selectedKasir}\`,\r
      \`Hari Kerja: \${hariKerja} hari\`,\r
      \`Izin: \${izinCount} hari\`,\r
      \`Gaji Pokok: \${formatRupiah(gajiPokok)}\`,\r
      \`Bonus: \${formatRupiah(bonus)}\`,\r
      \`Total Gaji: \${formatRupiah(totalGaji)}\`,\r
    ];\r
    if (catatan) lines.push(\`Catatan: \${catatan}\`);\r
    const text = lines.join("\\n");\r
    try {\r
      if (navigator.share) {\r
        await navigator.share({ text });\r
      } else {\r
        await navigator.clipboard.writeText(text);\r
        toast({ title: "Teks disalin ke clipboard" });\r
      }\r
    } catch { }\r
  };\r
\r
  const handleShareImage = async () => {\r
    if (!slipRef.current) return;\r
    try {\r
      const canvas = await html2canvas(slipRef.current, { scale: 2, backgroundColor: "#ffffff", useCORS: true });\r
      canvas.toBlob(async (blob) => {\r
        if (!blob) return;\r
        const file = new File([blob], \`slip-gaji-\${selectedKasir}-\${month}.png\`, { type: "image/png" });\r
        if (navigator.share && navigator.canShare({ files: [file] })) {\r
          await navigator.share({ files: [file] });\r
        } else {\r
          const url = URL.createObjectURL(blob);\r
          const link = document.createElement("a");\r
          link.href = url;\r
          link.download = file.name;\r
          link.click();\r
          URL.revokeObjectURL(url);\r
          toast({ title: "Gambar diunduh" });\r
        }\r
      }, "image/png");\r
    } catch {\r
      toast({ title: "Gagal membuat gambar", variant: "destructive" });\r
    }\r
  };\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20 min-h-screen bg-gradient-to-b from-blue-50 to-white">\r
      <div className="flex items-center gap-2 mb-4">\r
        <button onClick={goBack} className="text-gray-600 flex items-center gap-1 text-sm font-semibold">\r
          <ArrowLeft className="w-4 h-4" /> Kembali\r
        </button>\r
        <span className="ml-2 text-base font-extrabold flex items-center gap-1.5">\r
          <DollarSign className="w-5 h-5 text-green-600" /> Hitung Gaji Karyawan\r
        </span>\r
      </div>\r
\r
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">\r
        <div className="mb-4">\r
          <label className="text-xs font-semibold text-gray-500 block mb-1">Pilih Karyawan:</label>\r
          <select\r
            value={selectedKasir}\r
            onChange={e => setSelectedKasir(e.target.value)}\r
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold outline-none bg-white"\r
          >\r
            {kasirList.map(k => <option key={k.name} value={k.name}>{k.name.toUpperCase()}</option>)}\r
          </select>\r
        </div>\r
\r
        <div className="mb-4">\r
          <label className="text-xs font-semibold text-gray-500 block mb-1">Periode Bulan:</label>\r
          <input\r
            type="month"\r
            value={month}\r
            onChange={e => setMonth(e.target.value)}\r
            className="w-full border border-gray-200 rounded-xl px-3 py-3 text-sm font-bold outline-none bg-white"\r
          />\r
        </div>\r
\r
        <div className="mb-4">\r
          <label className="text-xs font-semibold text-gray-500 block mb-2">Mode Penghitungan:</label>\r
          <div className="grid grid-cols-2 gap-2">\r
            <button\r
              onClick={() => setMode("harian")}\r
              className={\`py-2.5 rounded-full text-xs font-bold transition border-2 \${mode === "harian" ? "bg-primary text-white border-primary shadow" : "bg-white text-gray-500 border-gray-200"}\`}\r
            >\r
              {mode === "harian" && <Check className="w-3.5 h-3.5 inline mr-1" />}Gajih / Hari\r
            </button>\r
            <button\r
              onClick={() => setMode("bulanan")}\r
              className={\`py-2.5 rounded-full text-xs font-bold transition border-2 \${mode === "bulanan" ? "bg-primary text-white border-primary shadow" : "bg-white text-gray-500 border-gray-200"}\`}\r
            >\r
              {mode === "bulanan" && <Check className="w-3.5 h-3.5 inline mr-1" />}Gajih Full 1 Bulan\r
            </button>\r
          </div>\r
        </div>\r
\r
        {mode === "harian" ? (\r
          <div className="grid grid-cols-2 gap-3 mb-4">\r
            <div>\r
              <label className="text-xs font-semibold text-gray-500 block mb-1">Gaji / Hari:</label>\r
              <input\r
                type="text"\r
                inputMode="numeric"\r
                value={gajiPerHariDisplay}\r
                onChange={e => setGajiPerHariDisplay(formatThousands(e.target.value))}\r
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none"\r
              />\r
            </div>\r
            <div>\r
              <label className="text-xs font-semibold text-gray-500 block mb-1">Bonus:</label>\r
              <input\r
                type="text"\r
                inputMode="numeric"\r
                value={bonusDisplay}\r
                onChange={e => setBonusDisplay(formatThousands(e.target.value))}\r
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none"\r
              />\r
            </div>\r
          </div>\r
        ) : (\r
          <div className="grid grid-cols-2 gap-3 mb-4">\r
            <div>\r
              <label className="text-xs font-semibold text-gray-500 block mb-1">Gaji Full Bulan:</label>\r
              <input\r
                type="text"\r
                inputMode="numeric"\r
                value={gajiBulananDisplay}\r
                onChange={e => setGajiBulananDisplay(formatThousands(e.target.value))}\r
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none"\r
              />\r
            </div>\r
            <div>\r
              <label className="text-xs font-semibold text-gray-500 block mb-1">Bonus:</label>\r
              <input\r
                type="text"\r
                inputMode="numeric"\r
                value={bonusDisplay}\r
                onChange={e => setBonusDisplay(formatThousands(e.target.value))}\r
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold outline-none"\r
              />\r
            </div>\r
          </div>\r
        )}\r
\r
        <div className="grid grid-cols-2 gap-3 mb-2">\r
          <div>\r
            <label className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 mb-1">\r
              Hari Kerja:\r
              <input\r
                type="checkbox"\r
                checked={editHariKerja}\r
                onChange={e => { setEditHariKerja(e.target.checked); if (e.target.checked) setHariKerjaManual(String(absenCount)); }}\r
                className="w-3.5 h-3.5"\r
              />\r
              <span className="text-primary text-[10px]">Edit</span>\r
            </label>\r
            {editHariKerja ? (\r
              <input\r
                type="number"\r
                value={hariKerjaManual}\r
                onChange={e => setHariKerjaManual(e.target.value)}\r
                className="w-full border border-blue-300 rounded-xl px-3 py-2.5 text-sm font-bold outline-none bg-blue-50"\r
              />\r
            ) : (\r
              <div className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-bold text-blue-700">\r
                {absenCount} hari\r
              </div>\r
            )}\r
          </div>\r
          <div>\r
            <label className="text-xs font-semibold text-gray-500 block mb-1">Izin (Hari):</label>\r
            <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-700">\r
              {izinCount}\r
            </div>\r
          </div>\r
        </div>\r
\r
        <p className="text-[11px] text-gray-400 italic mb-4">\r
          *Hari kerja dari absen: <span className="font-semibold">{absenCount} hari</span>. Centang Edit untuk ubah manual.\r
        </p>\r
\r
        <div className="mb-0">\r
          <label className="text-xs font-semibold text-gray-500 flex items-center gap-1 mb-1">\r
            ✏️ CATATAN:\r
          </label>\r
          <textarea\r
            value={catatan}\r
            onChange={e => setCatatan(e.target.value)}\r
            placeholder="Tambahkan catatan untuk karyawan..."\r
            rows={3}\r
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none"\r
          />\r
        </div>\r
      </div>\r
\r
      <div ref={slipRef} className="bg-gradient-to-br from-blue-700 to-blue-500 rounded-2xl p-5 text-white shadow-lg mb-4">\r
        <h2 className="text-center font-extrabold text-lg mb-0.5">Slip Gaji</h2>\r
        <p className="text-center text-blue-200 text-sm mb-4">{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</p>\r
\r
        <div className="space-y-2.5">\r
          <div className="flex justify-between text-sm">\r
            <span className="text-blue-100">Nama:</span>\r
            <span className="font-bold">{selectedKasir.toUpperCase()}</span>\r
          </div>\r
          <div className="flex justify-between text-sm">\r
            <span className="text-blue-100">Hari Kerja:</span>\r
            <span className="font-bold">{hariKerja} hari</span>\r
          </div>\r
          <div className="flex justify-between text-sm">\r
            <span className="text-blue-100">Izin:</span>\r
            <span className="font-bold">{izinCount} hari</span>\r
          </div>\r
          <div className="flex justify-between text-sm">\r
            <span className="text-blue-100">Gaji Pokok:</span>\r
            <span className="font-bold">{formatRupiah(gajiPokok)}</span>\r
          </div>\r
          <div className="flex justify-between text-sm">\r
            <span className="text-blue-100">Bonus:</span>\r
            <span className="font-bold">{formatRupiah(bonus)}</span>\r
          </div>\r
          {catatan && (\r
            <div className="flex justify-between text-sm">\r
              <span className="text-blue-100">Catatan:</span>\r
              <span className="font-bold text-right max-w-[60%]">{catatan}</span>\r
            </div>\r
          )}\r
          <div className="border-t border-blue-400 pt-2 mt-2">\r
            <div className="flex justify-between items-center">\r
              <span className="font-bold text-blue-100">Total Gaji</span>\r
              <span className="font-extrabold text-xl">{formatRupiah(totalGaji)}</span>\r
            </div>\r
          </div>\r
        </div>\r
      </div>\r
\r
      <div className="grid grid-cols-2 gap-3">\r
        <button\r
          onClick={handleShareText}\r
          className="bg-gradient-to-r from-primary to-blue-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow active:scale-95 transition"\r
        >\r
          🍰 Bagikan Teks\r
        </button>\r
        <button\r
          onClick={handleShareImage}\r
          className="bg-gradient-to-r from-green-600 to-green-500 text-white py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow active:scale-95 transition"\r
        >\r
          📸 Bagikan Gambar\r
        </button>\r
      </div>\r
    </div>\r
  );\r
}\r
\r
function BackupPage({ goBack }: { goBack: () => void }) {\r
  const { toast } = useToast();\r
  const [resetting, setResetting] = useState(false);\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
\r
  useEffect(() => { getUsers().then(setUsers).catch(() => {}); }, []);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
\r
  const handleResetKasir = async (name: string) => {\r
    if (!confirm(\`Reset saldo \${name}?\`)) return;\r
    try {\r
      await resetBalance(name);\r
      toast({ title: \`Saldo \${name} direset\` });\r
    } catch {\r
      toast({ title: "Gagal reset", variant: "destructive" });\r
    }\r
  };\r
\r
  const handleResetAll = async () => {\r
    if (!confirm("RESET SEMUA DATA? Tindakan ini tidak bisa dibatalkan!")) return;\r
    if (!confirm("Yakin? Semua transaksi, saldo, kasbon, kontak, absen, izin akan dihapus.")) return;\r
    setResetting(true);\r
    try {\r
      await resetAllData();\r
      toast({ title: "Semua data berhasil direset" });\r
    } catch {\r
      toast({ title: "Gagal reset", variant: "destructive" });\r
    } finally {\r
      setResetting(false);\r
    }\r
  };\r
\r
  const handleDownloadBackup = async () => {\r
    try {\r
      const [settings, allUsers] = await Promise.all([getSettings(), getUsers()]);\r
      const payload = {\r
        exportedAt: new Date().toISOString(),\r
        appName: "Alfaza Link",\r
        settings,\r
        users: allUsers,\r
      };\r
      const json = JSON.stringify(payload, null, 2);\r
      const blob = new Blob([json], { type: "application/json" });\r
      const url = URL.createObjectURL(blob);\r
      const a = document.createElement("a");\r
      a.href = url;\r
      a.download = \`backup-alfazalink-\${new Date().toISOString().slice(0, 10)}.json\`;\r
      a.click();\r
      URL.revokeObjectURL(url);\r
      toast({ title: "Backup berhasil diunduh" });\r
    } catch {\r
      toast({ title: "Gagal download backup", variant: "destructive" });\r
    }\r
  };\r
\r
  const [exportingExcel, setExportingExcel] = useState(false);\r
  const handleDownloadExcel = async () => {\r
    setExportingExcel(true);\r
    try {\r
      const XLSX = await import("xlsx");\r
      const [trx, saldo, hutang, kontak, attendance, izin] = await Promise.all([\r
        getTransactions({}),\r
        getSaldoHistory({}),\r
        getHutangList(),\r
        getKontakList(),\r
        getAttendance({}),\r
        getIzinList(),\r
      ]);\r
\r
      const wb = XLSX.utils.book_new();\r
\r
      const trxData: any[][] = [["#", "Tanggal", "Jam", "Kasir", "Shift", "Kategori", "Nominal", "Admin", "Keterangan", "Pembayaran"]];\r
      trx.forEach((t, i) => trxData.push([i + 1, t.tanggal || "", t.transTime || "", t.kasirName || "", t.shift || "", t.category || "", t.nominal || 0, t.admin || 0, t.keterangan || "", t.paymentMethod || "tunai"]));\r
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trxData), "Transaksi");\r
\r
      const saldoData: any[][] = [["#", "Tanggal", "Jam", "Kasir", "Jenis", "Nominal", "Keterangan"]];\r
      saldo.forEach((s: any, i) => saldoData.push([i + 1, s.tanggal || "", s.jam || "", s.kasirName || "", s.jenis || "", s.nominal || 0, s.keterangan || ""]));\r
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(saldoData), "Saldo History");\r
\r
      const hutangData: any[][] = [["#", "Tanggal", "Nama", "Nominal", "Keterangan", "Lunas", "Tgl Lunas", "Dibuat Oleh"]];\r
      hutang.forEach((h, i) => hutangData.push([i + 1, h.tanggal || "", h.nama || "", h.nominal || 0, h.keterangan || "", h.lunas ? "Ya" : "Tidak", h.tglLunas || "", h.createdBy || ""]));\r
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(hutangData), "Kasbon");\r
\r
      const kontakData: any[][] = [["#", "Nama", "Nomor", "Keterangan", "Dibuat Oleh"]];\r
      kontak.forEach((k, i) => kontakData.push([i + 1, k.nama || "", k.nomor || "", k.keterangan || "", k.createdBy || ""]));\r
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(kontakData), "Kontak");\r
\r
      const absenData: any[][] = [["#", "Tanggal", "Kasir", "Jam Masuk", "Jam Keluar", "Status"]];\r
      attendance.forEach((a: any, i) => absenData.push([i + 1, a.tanggal || "", a.kasirName || "", a.jamMasuk || "", a.jamKeluar || "", a.status || ""]));\r
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(absenData), "Absensi");\r
\r
      const izinData: any[][] = [["#", "Tanggal", "Kasir", "Jenis", "Keterangan", "Status"]];\r
      izin.forEach((iz: any, i) => izinData.push([i + 1, iz.tanggal || "", iz.kasirName || "", iz.jenis || "", iz.keterangan || "", iz.status || ""]));\r
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(izinData), "Izin");\r
\r
      XLSX.writeFile(wb, \`backup-alfazalink-\${new Date().toISOString().slice(0, 10)}.xlsx\`);\r
      toast({ title: "Excel berhasil diunduh" });\r
    } catch {\r
      toast({ title: "Gagal export Excel", variant: "destructive" });\r
    } finally {\r
      setExportingExcel(false);\r
    }\r
  };\r
\r
  return (\r
    <PageWrapper title="Backup & Reset" icon={Database} goBack={goBack}>\r
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">\r
        <div className="flex items-center gap-2 mb-2">\r
          <AlertTriangle className="w-5 h-5 text-amber-600" />\r
          <h3 className="font-bold text-sm text-amber-700">Peringatan</h3>\r
        </div>\r
        <p className="text-[11px] text-amber-600">Data tersimpan di Firebase Cloud. Reset hanya menghapus data transaksi, bukan data kasir.</p>\r
      </div>\r
\r
      <div className="mb-5 space-y-2">\r
        <button onClick={handleDownloadExcel} disabled={exportingExcel} className="w-full bg-emerald-600 text-white py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition disabled:opacity-60">\r
          {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}\r
          {exportingExcel ? "Memproses..." : "Backup SEMUA Data (Excel)"}\r
        </button>\r
        <p className="text-[10px] text-gray-500 text-center mt-0.5">Transaksi, saldo, kasbon, kontak, absen, izin — multi sheet</p>\r
        <button onClick={handleDownloadBackup} className="w-full bg-primary text-white py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition">\r
          <Download className="w-4 h-4" /> Backup Pengaturan & Kasir (JSON)\r
        </button>\r
      </div>\r
\r
      <h3 className="font-bold text-sm text-gray-700 mb-3">Reset Saldo Per Kasir</h3>\r
      {kasirList.map(k => (\r
        <div key={k.name} className="bg-white rounded-2xl p-4 mb-2 shadow-sm border border-gray-100 flex justify-between items-center">\r
          <span className="font-bold text-sm">{k.name}</span>\r
          <button onClick={() => handleResetKasir(k.name)} className="bg-amber-100 text-amber-600 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1">\r
            <RefreshCw className="w-3.5 h-3.5" /> Reset Saldo\r
          </button>\r
        </div>\r
      ))}\r
\r
      <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-200 mt-6">\r
        <h3 className="font-bold text-sm text-red-700 mb-2 flex items-center gap-2">\r
          <AlertTriangle className="w-4 h-4" /> Zona Bahaya\r
        </h3>\r
        <p className="text-[11px] text-red-500 mb-3">Reset semua data transaksi, saldo, kasbon, kontak, absen, dan izin. Tindakan ini tidak bisa dibatalkan.</p>\r
        <button onClick={handleResetAll} disabled={resetting} className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 active:scale-95 transition disabled:opacity-50">\r
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}\r
          RESET SELURUH DATA\r
        </button>\r
      </div>\r
    </PageWrapper>\r
  );\r
}\r
\r
function SettingPage({ goBack }: { goBack: () => void }) {\r
  const { toast } = useToast();\r
  const { \r
    theme, \r
    primaryColor, setPrimaryColor, \r
    primaryColorDark, setPrimaryColorDark, \r
    currentPrimaryColor \r
  } = useDisplayMode();\r
  const [settings, setSettings] = useState<SettingsRecord | null>(null);\r
  const [shopName, setShopName] = useState("");\r
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");\r
  const [pinEnabled, setPinEnabled] = useState(false);\r
  const [quotes, setQuotes] = useState("");\r
  const [runningText, setRunningText] = useState("");\r
  const [autoResetHour, setAutoResetHour] = useState(2);\r
  const [autoResetMinute, setAutoResetMinute] = useState(0);\r
  const [saving, setSaving] = useState(false);\r
  const [resetting, setResetting] = useState(false);\r
  const defaultLabels: CategoryLabels = {\r
    BANK: { name: "BANK", visible: true },\r
    FLIP: { name: "FLIP", visible: true },\r
    APP: { name: "APP", visible: true },\r
    DANA: { name: "DANA", visible: true },\r
    AKS: { name: "AKS", visible: true },\r
    TARIK: { name: "TARIK", visible: true },\r
  };\r
  const [catLabels, setCatLabels] = useState<CategoryLabels>(defaultLabels);\r
\r
  // PWA Install State\r
  const [installPrompt, setInstallPrompt] = useState<any>(null);\r
\r
  useEffect(() => {\r
    const handler = (e: any) => {\r
      e.preventDefault();\r
      setInstallPrompt(e);\r
    };\r
    window.addEventListener("beforeinstallprompt", handler);\r
    return () => window.removeEventListener("beforeinstallprompt", handler);\r
  }, []);\r
\r
  const handleInstallPWA = async () => {\r
    if (!installPrompt) {\r
      toast({ title: "Gunakan menu browser untuk instalasi", variant: "default" });\r
      return;\r
    }\r
    installPrompt.prompt();\r
    const { outcome } = await installPrompt.userChoice;\r
    if (outcome === 'accepted') setInstallPrompt(null);\r
  };\r
\r
  useEffect(() => {\r
    getSettings().then(s => {\r
      setSettings(s);\r
      setShopName(s.shopName || "ALFAZA LINK");\r
      setProfilePhotoUrl(s.profilePhotoUrl || "");\r
      setPinEnabled(s.pinEnabled || false);\r
      setQuotes(s.mutiaraQuotes || "");\r
      setRunningText(s.runningText || "");\r
      setAutoResetHour(s.autoResetHour ?? 2);\r
      setAutoResetMinute(s.autoResetMinute ?? 0);\r
      if (s.categoryLabels) {\r
        setCatLabels(s.categoryLabels);\r
      }\r
    }).catch(() => {});\r
  }, []);\r
\r
  const handleSave = async () => {\r
    setSaving(true);\r
    try {\r
      await updateSettings({\r
        shopName,\r
        profilePhotoUrl,\r
        pinEnabled,\r
        mutiaraQuotes: quotes,\r
        runningText,\r
        autoResetHour,\r
        autoResetMinute,\r
        categoryLabels: catLabels,\r
      });\r
      toast({ title: "Pengaturan disimpan" });\r
    } catch {\r
      toast({ title: "Gagal menyimpan", variant: "destructive" });\r
    } finally { setSaving(false); }\r
  };\r
\r
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {\r
    const file = e.target.files?.[0];\r
    if (!file) return;\r
    const maxSize = 200;\r
    const canvas = document.createElement("canvas");\r
    const ctx = canvas.getContext("2d");\r
    const img = new Image();\r
    img.onload = () => {\r
      const w = img.width;\r
      const h = img.height;\r
      const scale = Math.min(maxSize / w, maxSize / h, 1);\r
      canvas.width = w * scale;\r
      canvas.height = h * scale;\r
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);\r
      const compressed = canvas.toDataURL("image/jpeg", 0.6);\r
      setProfilePhotoUrl(compressed);\r
    };\r
    img.src = URL.createObjectURL(file);\r
  };\r
\r
  const handleResetAll = async () => {\r
    if (!confirm("RESET SEMUA DATA? Tindakan ini tidak bisa dibatalkan!")) return;\r
    if (!confirm("Yakin? Semua transaksi, saldo, kasbon, kontak, absen, izin akan dihapus.")) return;\r
    setResetting(true);\r
    try {\r
      await resetAllData();\r
      toast({ title: "Semua data berhasil direset" });\r
    } catch {\r
      toast({ title: "Gagal reset", variant: "destructive" });\r
    } finally {\r
      setResetting(false);\r
    }\r
  };\r
\r
  const updateCatLabel = (key: keyof CategoryLabels, field: "name" | "visible", value: string | boolean) => {\r
    setCatLabels(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));\r
  };\r
\r
  const catKeys: (keyof CategoryLabels)[] = ["BANK", "FLIP", "APP", "DANA", "AKS", "TARIK"];\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20 min-h-screen bg-gray-50 dark:bg-slate-950">\r
      <div className="flex items-center gap-2 mb-4">\r
        <button onClick={goBack} className="text-gray-600 dark:text-gray-400"><ArrowLeft className="w-5 h-5" /></button>\r
        <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />\r
        <h1 className="font-extrabold text-base dark:text-white">Pengaturan</h1>\r
      </div>\r
\r
      <div className="space-y-4">\r
        {/* PWA Install Button */}\r
        <div className="bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl p-4 shadow-lg text-white">\r
          <div className="flex items-center justify-between">\r
            <div className="flex items-center gap-3">\r
              <div className="bg-white/20 p-2 rounded-xl">\r
                <Download className="w-5 h-5" />\r
              </div>\r
              <div>\r
                <h3 className="font-bold text-sm">Instal Aplikasi (PWA)</h3>\r
                <p className="text-[10px] opacity-80">Akses lebih cepat & ikon di layar utama</p>\r
              </div>\r
            </div>\r
            <button \r
              onClick={handleInstallPWA}\r
              className="bg-white text-emerald-600 px-4 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition"\r
            >\r
              {installPrompt ? "INSTAL SEKARANG" : "CEK STATUS"}\r
            </button>\r
          </div>\r
        </div>\r
\r
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-800">\r
          <div className="flex items-center justify-between">\r
            <div>\r
              <h3 className="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">\r
                <Palette className="w-4 h-4 text-pink-500" /> TEMA {theme === "dark" ? "GELAP" : "TERANG"}\r
              </h3>\r
              <p className="text-[10px] text-gray-400 mt-0.5">Warna utama untuk mode saat ini</p>\r
            </div>\r
            <div className="flex items-center gap-3">\r
              <div \r
                className="w-8 h-8 rounded-full border shadow-inner" \r
                style={{ backgroundColor: currentPrimaryColor }}\r
              />\r
              <input \r
                type="color" \r
                value={theme === "dark" ? primaryColorDark : primaryColor} \r
                onChange={(e) => theme === "dark" ? setPrimaryColorDark(e.target.value) : setPrimaryColor(e.target.value)}\r
                className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer"\r
              />\r
            </div>\r
          </div>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">\r
            <Users className="w-4 h-4 text-blue-500" /> Profil Toko\r
          </h3>\r
          <div className="flex items-center gap-4 mb-4">\r
            <div className="relative">\r
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-400 flex items-center justify-center overflow-hidden shadow">\r
                {profilePhotoUrl ? (\r
                  <img src={profilePhotoUrl} alt="Profile" className="w-full h-full object-cover" />\r
                ) : (\r
                  <span className="text-white text-2xl font-bold">{shopName.charAt(0)}</span>\r
                )}\r
              </div>\r
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer shadow">\r
                <Edit className="w-3.5 h-3.5 text-white" />\r
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />\r
              </label>\r
            </div>\r
            <div className="flex-1">\r
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Nama Toko</label>\r
              <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none font-bold" />\r
            </div>\r
          </div>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">\r
            <RefreshCw className="w-4 h-4 text-green-500" /> Jam Reset Otomatis Saldo\r
          </h3>\r
          <div className="flex items-center gap-2">\r
            <div className="flex-1">\r
              <label className="text-[10px] text-gray-500 block mb-1">Jam</label>\r
              <select value={autoResetHour} onChange={e => setAutoResetHour(parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none text-center font-bold bg-white appearance-none">\r
                {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}</option>)}\r
              </select>\r
            </div>\r
            <span className="font-bold text-lg mt-4">:</span>\r
            <div className="flex-1">\r
              <label className="text-[10px] text-gray-500 block mb-1">Menit</label>\r
              <select value={autoResetMinute} onChange={e => setAutoResetMinute(parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none text-center font-bold bg-white appearance-none">\r
                {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{i}</option>)}\r
              </select>\r
            </div>\r
          </div>\r
          <p className="text-[10px] text-gray-400 mt-2">Saldo semua kasir akan direset otomatis pada jam ini (WIB)</p>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <div className="flex items-center justify-between">\r
            <div>\r
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">\r
                <Palette className="w-4 h-4 text-pink-500" /> TEMA APLIKASI\r
              </h3>\r
              <p className="text-[10px] text-gray-400 mt-0.5">Pilih warna tema utama aplikasi</p>\r
            </div>\r
            <div className="flex items-center gap-3">\r
              <div \r
                className="w-8 h-8 rounded-full border shadow-inner" \r
                style={{ backgroundColor: primaryColor }}\r
              />\r
              <input \r
                type="color" \r
                value={primaryColor} \r
                onChange={(e) => setPrimaryColor(e.target.value)}\r
                className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer"\r
              />\r
            </div>\r
          </div>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <div className="flex items-center justify-between">\r
            <div>\r
              <h3 className="font-bold text-sm text-gray-700 flex items-center gap-2">\r
                <Lock className="w-4 h-4 text-indigo-500" /> PIN Login\r
              </h3>\r
              <p className="text-[10px] text-gray-400 mt-0.5">Aktifkan PIN untuk kasir saat login</p>\r
            </div>\r
            <button onClick={() => setPinEnabled(!pinEnabled)} className={\`w-12 h-6 rounded-full flex items-center transition-all \${pinEnabled ? 'bg-primary justify-end' : 'bg-gray-300 justify-start'}\`}>\r
              <div className="w-5 h-5 bg-white rounded-full mx-0.5 shadow" />\r
            </button>\r
          </div>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">\r
            <Star className="w-4 h-4 text-amber-500" /> Kata-kata Mutiara\r
          </h3>\r
          <textarea value={quotes} onChange={e => setQuotes(e.target.value)} rows={4} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none resize-none" placeholder="Masukkan quotes motivasi (satu per baris)..." />\r
          <p className="text-[10px] text-gray-400 mt-1">Tampil secara acak di header kasir</p>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">\r
            <Activity className="w-4 h-4 text-red-500" /> Teks Berjalan (Merah)\r
          </h3>\r
          <input value={runningText} onChange={e => setRunningText(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none" placeholder="Contoh: Semoga Hari ini penuh Berkah..." />\r
          <p className="text-[10px] text-gray-400 mt-1">Teks berjalan merah di beranda kasir (kosongkan untuk sembunyikan)</p>\r
        </div>\r
\r
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">\r
          <h3 className="font-bold text-sm text-gray-700 mb-3 flex items-center gap-2">\r
            <Edit className="w-4 h-4 text-purple-500" /> Edit Nama / Sembunyikan Kategori\r
          </h3>\r
          <div className="space-y-2">\r
            {catKeys.map(key => {\r
              const cat = catLabels[key] || { name: key, visible: true };\r
              return (\r
                <div key={key} className="flex items-center gap-2">\r
                  <button onClick={() => updateCatLabel(key, "visible", !cat.visible)} className={\`w-8 h-8 rounded-lg flex items-center justify-center \${cat.visible ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}\`}>\r
                    {cat.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}\r
                  </button>\r
                  <div className="flex-1">\r
                    <input value={cat.name} onChange={e => updateCatLabel(key, "name", e.target.value)} className={\`w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none font-semibold \${!cat.visible ? 'opacity-40 line-through' : ''}\`} />\r
                  </div>\r
                  <span className="text-[9px] text-gray-400 w-10">{key}</span>\r
                </div>\r
              );\r
            })}\r
          </div>\r
        </div>\r
\r
        <button onClick={handleSave} disabled={saving} className="w-full bg-gradient-to-r from-primary to-blue-500 text-white font-bold py-3.5 rounded-2xl text-sm disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30">\r
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}\r
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}\r
        </button>\r
\r
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">\r
          <p className="text-[11px] text-primary">Reset Data & Backup sekarang ada di menu <strong>Backup</strong>.</p>\r
        </div>\r
      </div>\r
    </div>\r
  );\r
}\r
\r
function RingkasanPage({ goBack }: { goBack: () => void }) {\r
  const [users, setUsers] = useState<UserRecord[]>([]);\r
  const [allTransactions, setAllTransactions] = useState<TransactionRecord[]>([]);\r
  const [allNotes, setAllNotes] = useState<Record<string, { sisaSaldoBank: number; saldoRealApp: number }>>({});\r
  const [allSaldoHistory, setAllSaldoHistory] = useState<any[]>([]);\r
  const [loading, setLoading] = useState(true);\r
  const today = getWibDate();\r
  const [date, setDate] = useState(today);\r
  const [viewMode, setViewMode] = useState<"day" | "month">("day");\r
  const now = new Date();\r
  const [month, setMonth] = useState(() => \`\${now.getFullYear()}-\${String(now.getMonth() + 1).padStart(2, "0")}\`);\r
  const [selectedKasir, setSelectedKasir] = useState("Semua");\r
\r
  useEffect(() => {\r
    setLoading(true);\r
    let startDate: string, endDate: string;\r
    if (viewMode === "day") {\r
      startDate = date;\r
      endDate = date;\r
    } else {\r
      const [y, m] = month.split("-").map(Number);\r
      startDate = \`\${y}-\${String(m).padStart(2, "0")}-01\`;\r
      const lastDay = new Date(y, m, 0).getDate();\r
      endDate = \`\${y}-\${String(m).padStart(2, "0")}-\${String(lastDay).padStart(2, "0")}\`;\r
    }\r
    Promise.all([\r
      getUsers(),\r
      getTransactions({ startDate, endDate }),\r
      getSaldoHistory({ startDate, endDate }),\r
    ]).then(async ([u, t, sh]) => {\r
      setUsers(u);\r
      setAllTransactions(t);\r
      setAllSaldoHistory(sh);\r
      const kasirList = u.filter(usr => usr.role !== "owner" && usr.isActive);\r
      const notesMap: Record<string, { sisaSaldoBank: number; saldoRealApp: number }> = {};\r
      if (viewMode === "day") {\r
        for (const k of kasirList) {\r
          try {\r
            const notes = await getDailyNotes(k.name, date);\r
            notesMap[k.name] = notes;\r
          } catch {\r
            notesMap[k.name] = { sisaSaldoBank: 0, saldoRealApp: 0 };\r
          }\r
        }\r
      }\r
      setAllNotes(notesMap);\r
    }).catch(() => {}).finally(() => setLoading(false));\r
  }, [date, month, viewMode]);\r
\r
  const kasirList = users.filter(u => u.role !== "owner" && u.isActive);\r
  const allKasirs = [{ name: "PANEL ADMIN", isAdmin: true }, ...kasirList.map(k => ({ name: k.name, isAdmin: false }))];\r
  const chipNames = ["Semua", "Admin", ...kasirList.map(k => k.name)];\r
\r
  const filteredKasirs = selectedKasir === "Semua"\r
    ? allKasirs\r
    : selectedKasir === "Admin"\r
      ? allKasirs.filter(k => k.isAdmin)\r
      : allKasirs.filter(k => k.name === selectedKasir);\r
\r
  const getKasirData = (kasirName: string, isAdmin: boolean) => {\r
    const tx = isAdmin ? allTransactions : allTransactions.filter(t => t.kasirName === kasirName);\r
    const bank = tx.filter(t => t.category === "BANK").reduce((s, t) => s + (t.nominal || 0), 0);\r
    const flip = tx.filter(t => t.category === "FLIP").reduce((s, t) => s + (t.nominal || 0), 0);\r
    const app = tx.filter(t => t.category === "APP PULSA").reduce((s, t) => s + (t.nominal || 0), 0);\r
    const dana = tx.filter(t => t.category === "DANA").reduce((s, t) => s + (t.nominal || 0), 0);\r
    const tarik = tx.filter(t => t.category === "TARIK TUNAI").reduce((s, t) => s + (t.nominal || 0), 0);\r
    const aks = tx.filter(t => t.category === "AKSESORIS").reduce((s, t) => s + (t.nominal || 0), 0);\r
    const totalAdmin = tx.reduce((s, t) => s + (t.admin || 0), 0);\r
    const totalPenjualan = bank + flip + dana + app;\r
    const sisaCash = totalPenjualan - tarik;\r
    const nonTunai = tx.filter(t => (t.nominalNonTunai || 0) > 0).reduce((s, t) => s + (t.nominalNonTunai || 0), 0);\r
    const totalUangCash = sisaCash + totalAdmin + aks;\r
\r
    const sh = isAdmin ? allSaldoHistory : allSaldoHistory.filter((s: any) => s.kasirName === kasirName);\r
    const totalIsiSaldoBank = sh.reduce((s: number, h: any) => s + (h.nominal || 0), 0);\r
\r
    const notes = allNotes[kasirName] || { sisaSaldoBank: 0, saldoRealApp: 0 };\r
    const saldoBankCatatan = notes.sisaSaldoBank;\r
    const saldoRealApp = notes.saldoRealApp;\r
    const selisih = saldoBankCatatan - saldoRealApp;\r
    const sesuai = selisih === 0;\r
    const saldoPlusPenjualan = saldoBankCatatan + totalPenjualan;\r
\r
    return {\r
      totalIsiSaldoBank, saldoBankCatatan, saldoRealApp, selisih, sesuai,\r
      totalPenjualan, totalAdmin, sisaCash, tarik, nonTunai, totalUangCash, saldoPlusPenjualan,\r
    };\r
  };\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20 min-h-screen bg-gradient-to-b from-primary via-blue-500 to-blue-400">\r
      <div className="flex items-center gap-2 mb-3">\r
        <button onClick={goBack} className="text-white"><ArrowLeft className="w-5 h-5" /></button>\r
        <div>\r
          <h1 className="font-extrabold text-base text-white">Ringkasan Harian Per Kasir</h1>\r
          <p className="text-[11px] text-white/70">Data ringkasan seluruh kasir</p>\r
        </div>\r
      </div>\r
\r
      <div className="grid grid-cols-2 gap-2 mb-3">\r
        <button onClick={() => setViewMode("day")} className={\`py-2.5 rounded-full text-xs font-bold transition \${viewMode === "day" ? "bg-white text-primary shadow" : "bg-white/20 text-white border border-white/30"}\`}>\r
          Per Hari\r
        </button>\r
        <button onClick={() => setViewMode("month")} className={\`py-2.5 rounded-full text-xs font-bold transition \${viewMode === "month" ? "bg-white text-primary shadow" : "bg-white/20 text-white border border-white/30"}\`}>\r
          Per Bulan\r
        </button>\r
      </div>\r
\r
      <div className="mb-3">\r
        {viewMode === "day" ? (\r
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-xl border border-white/30 bg-white/10 text-white px-3 py-2.5 text-sm outline-none" />\r
        ) : (\r
          <input type="month" value={month} onChange={e => setMonth(e.target.value)} className="w-full rounded-xl border border-white/30 bg-white/10 text-white px-3 py-2.5 text-sm outline-none" />\r
        )}\r
      </div>\r
\r
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 scrollbar-hide">\r
        {chipNames.map(name => (\r
          <button\r
            key={name}\r
            onClick={() => setSelectedKasir(name)}\r
            className={\`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition flex-shrink-0 \${selectedKasir === name ? "bg-white text-primary shadow" : "bg-white/20 text-white border border-white/30"}\`}\r
          >\r
            {name}\r
          </button>\r
        ))}\r
      </div>\r
\r
      {loading ? (\r
        <div className="text-center py-10"><Loader2 className="w-6 h-6 animate-spin mx-auto text-white" /></div>\r
      ) : filteredKasirs.length === 0 ? (\r
        <div className="text-center py-10 text-white/70 text-sm">Tidak ada data kasir</div>\r
      ) : (\r
        filteredKasirs.map((k, idx) => {\r
          const data = getKasirData(k.name, k.isAdmin);\r
          return (\r
            <div key={k.name} className="bg-white rounded-2xl mb-4 shadow-lg overflow-hidden">\r
              <div className={\`px-4 py-3 flex items-center justify-between \${k.isAdmin ? 'bg-gradient-to-r from-blue-700 to-blue-500' : 'bg-gradient-to-r from-green-600 to-green-400'}\`}>\r
                <span className="text-white font-bold text-sm">{String(idx + 1).padStart(2, "0")} - {k.name.toUpperCase()}</span>\r
                <span className="flex items-center gap-1 text-white text-[10px] font-semibold">\r
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" /> Live\r
                </span>\r
              </div>\r
              <div className="p-4 space-y-2.5">\r
                <div className="flex justify-between items-center text-xs">\r
                  <span className="text-gray-600 flex items-center gap-1.5">💳 Total Tambah/Isi Saldo Bank</span>\r
                  <span className="font-bold text-blue-700">{formatRupiah(data.totalIsiSaldoBank)}</span>\r
                </div>\r
                <div className="flex justify-between items-center text-xs">\r
                  <span className="text-gray-600 flex items-center gap-1.5">🏦 Saldo Bank Catatan</span>\r
                  <span className="font-bold text-blue-700">{formatRupiah(data.saldoBankCatatan)}</span>\r
                </div>\r
                <div className="flex justify-between items-center text-xs">\r
                  <span className="text-gray-600 flex items-center gap-1.5">📱 Saldo Real App</span>\r
                  <span className="font-bold text-blue-700">{formatRupiah(data.saldoRealApp)}</span>\r
                </div>\r
\r
                <div className="flex justify-between items-center text-xs bg-gray-50 rounded-lg px-3 py-2">\r
                  <span className="text-gray-700 font-semibold flex items-center gap-1.5">✅ Selisih</span>\r
                  <span className={\`font-bold \${data.sesuai ? 'text-green-600' : 'text-red-600'}\`}>\r
                    {data.sesuai ? '✓ Sesuai' : formatRupiah(data.selisih)}\r
                  </span>\r
                </div>\r
\r
                <div className="grid grid-cols-3 gap-2 pt-1">\r
                  <div className="bg-green-50 rounded-xl p-2.5 text-center">\r
                    <p className="text-xs font-extrabold text-green-700">{formatRupiah(data.totalPenjualan)}</p>\r
                    <p className="text-[9px] text-green-600">Total Penjualan</p>\r
                  </div>\r
                  <div className="bg-amber-50 rounded-xl p-2.5 text-center">\r
                    <p className="text-xs font-extrabold text-amber-700">{formatRupiah(data.totalAdmin)}</p>\r
                    <p className="text-[9px] text-amber-500">Total Admin</p>\r
                  </div>\r
                  <div className="bg-purple-50 rounded-xl p-2.5 text-center">\r
                    <p className="text-xs font-extrabold text-purple-700">{formatRupiah(data.sisaCash)}</p>\r
                    <p className="text-[9px] text-purple-500">Sisa Cash</p>\r
                  </div>\r
                </div>\r
\r
                <div className="grid grid-cols-3 gap-2">\r
                  <div className="bg-red-50 rounded-xl p-2.5 text-center">\r
                    <p className="text-xs font-extrabold text-red-600">{formatRupiah(data.tarik)}</p>\r
                    <p className="text-[9px] text-red-500">Tarik Tunai</p>\r
                  </div>\r
                  <div className="bg-green-50 rounded-xl p-2.5 text-center">\r
                    <p className="text-xs font-extrabold text-green-700">{formatRupiah(data.nonTunai)}</p>\r
                    <p className="text-[9px] text-green-500">Non Tunai</p>\r
                  </div>\r
                  <div className="bg-red-50 rounded-xl p-2.5 text-center">\r
                    <p className="text-xs font-extrabold text-red-600">{formatRupiah(data.totalUangCash)}</p>\r
                    <p className="text-[9px] text-red-500 font-bold">TOTAL UANG CASH</p>\r
                  </div>\r
                </div>\r
\r
                <div className="flex justify-between items-center text-xs bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg px-3 py-2">\r
                  <span className="text-gray-700 font-semibold flex items-center gap-1.5">🏦 Saldo Bank Catatan + Total Penjualan</span>\r
                  <span className="font-bold text-indigo-700">{formatRupiah(data.saldoPlusPenjualan)}</span>\r
                </div>\r
                <div className="text-[10px] text-gray-400 pl-1">\r
                  {formatRupiah(data.saldoBankCatatan)} + {formatRupiah(data.totalPenjualan)}\r
                </div>\r
              </div>\r
            </div>\r
          );\r
        })\r
      )}\r
    </div>\r
  );\r
}\r
`,Cr=`import { useState, useMemo, useEffect, useCallback } from "react";\r
import { useAuth } from "@/lib/auth";\r
import { Header } from "@/components/layout/header";\r
import { formatRupiah, formatThousands, parseThousands, getWibDate } from "@/lib/utils";\r
import { getTransactions, getSaldoHistory, getUsers, updateTransaction, deleteTransaction, type TransactionRecord, type SaldoHistoryRecord, type UserRecord } from "@/lib/firestore";\r
import { Receipt, AlertCircle } from "lucide-react";\r
import { useToast } from "@/hooks/use-toast";\r
\r
const CATEGORY_FILTERS = ["Semua", "Bank", "Flip", "App", "Dana", "Tarik", "Aks"];\r
const CATEGORY_MAP: Record<string, string> = {\r
  Bank: "BANK", Flip: "FLIP", App: "APP PULSA", Dana: "DANA", Tarik: "TARIK TUNAI", Aks: "AKSESORIS",\r
};\r
const SALDO_FILTERS = ["Semua", "Bank", "Cash", "Saldo Real", "Sisa Saldo"];\r
\r
export default function Riwayat() {\r
  const { user } = useAuth();\r
  const { toast } = useToast();\r
\r
  const today = getWibDate();\r
  const [startDate, setStartDate] = useState(today);\r
  const [endDate, setEndDate] = useState(today);\r
  const [selectedKasir, setSelectedKasir] = useState("Semua Kasir");\r
  const [selectedCategory, setSelectedCategory] = useState("Semua");\r
  const [selectedSaldoTab, setSelectedSaldoTab] = useState("Semua");\r
  const [expandedTx, setExpandedTx] = useState<string | null>(null);\r
  const [searchText, setSearchText] = useState("");\r
\r
  const [editTx, setEditTx] = useState<TransactionRecord | null>(null);\r
  const [editNominal, setEditNominal] = useState("");\r
  const [editAdmin, setEditAdmin] = useState("");\r
  const [editKeterangan, setEditKeterangan] = useState("");\r
  const [editSaving, setEditSaving] = useState(false);\r
\r
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);\r
  const [saldoHistory, setSaldoHistory] = useState<SaldoHistoryRecord[]>([]);\r
  const [allUsers, setAllUsers] = useState<UserRecord[]>([]);\r
  const [refreshKey, setRefreshKey] = useState(0);\r
\r
  const kasirFilter = selectedKasir === "Semua Kasir" ? undefined : selectedKasir;\r
\r
  const loadData = useCallback(async () => {\r
    if (!user?.name) return;\r
    try {\r
      const [txs, saldo, users] = await Promise.all([\r
        getTransactions({ kasirName: kasirFilter || (user.role === "owner" ? undefined : user.name), startDate, endDate }),\r
        getSaldoHistory({ kasirName: kasirFilter || (user.role === "owner" ? undefined : user.name), startDate, endDate }),\r
        getUsers(),\r
      ]);\r
      setTransactions(txs);\r
      setSaldoHistory(saldo);\r
      setAllUsers(users);\r
    } catch {}\r
  }, [user?.name, user?.role, kasirFilter, startDate, endDate, refreshKey]);\r
\r
  useEffect(() => { loadData(); }, [loadData]);\r
\r
  const handleDelete = async (id: string) => {\r
    if (!confirm("Hapus transaksi ini?")) return;\r
    try {\r
      await deleteTransaction(id);\r
      toast({ title: "Transaksi dihapus" });\r
      setRefreshKey(k => k + 1);\r
    } catch {\r
      toast({ title: "Gagal menghapus", variant: "destructive" });\r
    }\r
  };\r
\r
  const openEdit = (tx: TransactionRecord) => {\r
    setEditTx(tx);\r
    setEditNominal(formatThousands(String(tx.nominal || 0)));\r
    setEditAdmin(formatThousands(String(tx.admin || 0)));\r
    setEditKeterangan(tx.keterangan || "");\r
  };\r
\r
  const handleEditSave = async () => {\r
    if (!editTx) return;\r
    setEditSaving(true);\r
    try {\r
      await updateTransaction(editTx.id, {\r
        nominal: parseInt(parseThousands(editNominal)) || editTx.nominal,\r
        admin: parseInt(parseThousands(editAdmin)) || 0,\r
        keterangan: editKeterangan,\r
      });\r
      toast({ title: "Diperbarui" });\r
      setEditTx(null);\r
      setRefreshKey(k => k + 1);\r
    } catch {\r
      toast({ title: "Gagal memperbarui", variant: "destructive" });\r
    } finally {\r
      setEditSaving(false);\r
    }\r
  };\r
\r
  const filteredTx = useMemo(() => {\r
    let result = transactions;\r
    if (selectedCategory !== "Semua") {\r
      const mapped = CATEGORY_MAP[selectedCategory];\r
      if (mapped) result = result.filter(tx => tx.category === mapped);\r
    }\r
    if (searchText.trim()) {\r
      const q = searchText.toLowerCase().trim();\r
      result = result.filter(tx =>\r
        (tx.keterangan || "").toLowerCase().includes(q) ||\r
        (tx.category || "").toLowerCase().includes(q) ||\r
        (tx.kasirName || "").toLowerCase().includes(q)\r
      );\r
    }\r
    return result;\r
  }, [transactions, selectedCategory, searchText]);\r
\r
  const filteredSaldo = saldoHistory.filter(s => {\r
    if (selectedSaldoTab === "Semua") return true;\r
    if (selectedSaldoTab === "Bank") return s.jenis === "Bank";\r
    if (selectedSaldoTab === "Cash") return s.jenis === "Cash";\r
    if (selectedSaldoTab === "Saldo Real") return s.jenis === "Real App";\r
    if (selectedSaldoTab === "Sisa Saldo") return s.jenis === "Sisa Saldo";\r
    return true;\r
  });\r
\r
  const kasirList = allUsers.filter(u => u.role !== "owner");\r
\r
  const getShortCategory = (cat: string) => {\r
    if (cat === "TARIK TUNAI") return "TARIK";\r
    if (cat === "APP PULSA") return "APP";\r
    if (cat === "AKSESORIS") return "AKS";\r
    return cat;\r
  };\r
\r
  const isNonTunai = (tx: TransactionRecord) => tx.paymentMethod && tx.paymentMethod.toLowerCase().includes("non-tunai");\r
\r
  return (\r
    <div className="px-3 pt-3 pb-20">\r
      <Header />\r
\r
      <div className="relative mb-2.5">\r
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">🔍</span>\r
        <input\r
          value={searchText}\r
          onChange={e => setSearchText(e.target.value)}\r
          placeholder="Cari keterangan..."\r
          className="w-full pl-9 pr-3 py-2 rounded-full border-2 border-gray-200 text-[13px] bg-white outline-none"\r
        />\r
      </div>\r
\r
      <div className="flex gap-1.5 items-center mb-2.5">\r
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs bg-white outline-none" />\r
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 rounded-full border border-gray-200 px-2.5 py-1.5 text-xs bg-white outline-none" />\r
        <button onClick={() => setRefreshKey(k => k + 1)} className="bg-blue-600 text-white border-none rounded-full px-4 py-1.5 font-bold text-xs whitespace-nowrap">Tampilkan</button>\r
      </div>\r
\r
      {user?.role === "owner" && (\r
        <div className="flex flex-wrap gap-1.5 mb-2">\r
          <button onClick={() => setSelectedKasir("Semua Kasir")} className={\`rounded-full px-3 py-1 text-[11px] font-semibold border-[1.5px] \${selectedKasir === "Semua Kasir" ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-900 border-gray-300'}\`}>Semua Kasir</button>\r
          {kasirList.map(k => (\r
            <button key={k.name} onClick={() => setSelectedKasir(k.name)} className={\`rounded-full px-3 py-1 text-[11px] font-semibold border-[1.5px] \${selectedKasir === k.name ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-900 border-gray-300'}\`}>{k.name}</button>\r
          ))}\r
        </div>\r
      )}\r
\r
      <div className="grid grid-cols-7 gap-1.5 mb-3">\r
        {CATEGORY_FILTERS.map(c => (\r
          <button key={c} onClick={() => setSelectedCategory(c)} className={\`rounded-full py-1.5 text-xs font-semibold border-[1.5px] text-center \${selectedCategory === c ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-900 border-gray-300'}\`}>{c}</button>\r
        ))}\r
      </div>\r
\r
      <div className="bg-white rounded-[14px] overflow-hidden shadow-sm mb-3.5">\r
        <div className="grid gap-0.5 px-1.5 py-1.5 border-b-2 border-gray-200 text-[9px] font-bold text-gray-500" style={{ gridTemplateColumns: '20px 36px 48px 1fr 52px 1fr 18px' }}>\r
          <span>#</span><span>Jam</span><span>Tipe</span><span>Nominal</span><span>Admin</span><span>Ket</span><span></span>\r
        </div>\r
\r
        {filteredTx.length === 0 ? (\r
          <div className="text-center py-6 text-gray-400 text-xs">\r
            <Receipt className="w-8 h-8 mx-auto mb-2 text-gray-300" />\r
            {searchText ? \`Tidak ditemukan "\${searchText}"\` : "Tidak ada transaksi"}\r
          </div>\r
        ) : (\r
          filteredTx.map((tx, i) => {\r
            const nt = isNonTunai(tx);\r
            const isExpanded = expandedTx === tx.id;\r
            const ketText = tx.keterangan || "";\r
            return (\r
              <div key={tx.id}>\r
                <div onClick={() => setExpandedTx(isExpanded ? null : tx.id)} className="grid gap-0.5 px-1.5 py-1.5 border-b border-gray-100 text-[9px] items-center cursor-pointer" style={{ gridTemplateColumns: '20px 36px 48px 1fr 52px 1fr 18px' }}>\r
                  <span className="text-gray-400">{i + 1}</span>\r
                  <span>{(tx.transTime || "").slice(0, 5)}</span>\r
                  <span className={\`font-bold truncate \${nt ? 'text-purple-600' : 'text-blue-900'}\`}>{getShortCategory(tx.category)}</span>\r
                  <span className={\`font-bold truncate \${nt ? 'text-purple-600' : 'text-blue-600'}\`}>{formatRupiah(tx.nominal)}</span>\r
                  <span className="truncate">{formatRupiah(tx.admin || 0)}</span>\r
                  <span className="text-gray-500 truncate">{nt ? "💳 " : ""}{ketText}</span>\r
                  <span className="text-gray-400 text-[10px] text-center">{isExpanded ? "▲" : "▼"}</span>\r
                </div>\r
\r
                {isExpanded && (\r
                  <div className="px-3.5 py-2 pb-3 bg-gray-50 border-b border-gray-200">\r
                    <div className="text-xs text-gray-500 mb-1">Tanggal: <strong>{tx.transDate}</strong></div>\r
                    <div className="text-xs text-gray-500 mb-1">Pembayaran: <strong className={nt ? 'text-purple-600' : 'text-green-600'}>{nt ? "NON TUNAI" : "TUNAI"}</strong></div>\r
                    {ketText && <div className="text-xs text-gray-500 mb-1">Keterangan: <strong className="text-gray-700">{ketText}</strong></div>}\r
                    {tx.kasirName && <div className="text-xs text-gray-500 mb-2">Kasir: <strong>{tx.kasirName}</strong></div>}\r
                    <div className="flex gap-2.5">\r
                      <button onClick={e => { e.stopPropagation(); openEdit(tx); }} className="bg-blue-50 border border-blue-200 rounded-[10px] px-4 py-1.5 text-[13px] font-bold text-blue-600 flex items-center gap-1">✏️ Edit</button>\r
                      <button onClick={e => { e.stopPropagation(); handleDelete(tx.id); }} className="bg-red-50 border border-red-200 rounded-[10px] px-4 py-1.5 text-[13px] font-bold text-red-600 flex items-center gap-1">🗑️ Hapus</button>\r
                    </div>\r
                  </div>\r
                )}\r
              </div>\r
            );\r
          })\r
        )}\r
\r
        {filteredTx.length > 0 && (\r
          <div className="border-t border-gray-100 px-3 py-2 text-[10px] text-gray-500 flex justify-between">\r
            <span>{filteredTx.length} transaksi</span>\r
            <span>Total: {formatRupiah(filteredTx.reduce((sum, tx) => sum + (tx.nominal || 0), 0))}</span>\r
          </div>\r
        )}\r
      </div>\r
\r
      <div className="bg-gradient-to-r from-blue-900 to-blue-600 rounded-t-[14px] px-3.5 py-2.5 text-white font-bold text-[13px]">RIWAYAT TAMBAH SALDO</div>\r
      <div className="bg-white rounded-b-[14px] shadow-sm">\r
        <div className="flex gap-1.5 px-2.5 py-2 border-b border-gray-200">\r
          {SALDO_FILTERS.map(f => (\r
            <button key={f} onClick={() => setSelectedSaldoTab(f)} className={\`rounded-full px-2.5 py-1 text-[10px] font-semibold border-[1.5px] \${selectedSaldoTab === f ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-700 border-gray-300'}\`}>{f}</button>\r
          ))}\r
        </div>\r
\r
        <div className="grid px-2.5 py-2 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500" style={{ gridTemplateColumns: '28px 1fr 1fr 1fr 1fr' }}>\r
          <span>#</span><span>Jam</span><span>Jenis</span><span>Nominal</span><span>Ket</span>\r
        </div>\r
\r
        {filteredSaldo.length === 0 ? (\r
          <div className="text-center py-5 text-gray-400 text-xs">\r
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />\r
            Tidak ada riwayat\r
          </div>\r
        ) : (\r
          filteredSaldo.map((s, i) => (\r
            <div key={s.id} className="grid px-2.5 py-1.5 border-b border-gray-100 text-[10px]" style={{ gridTemplateColumns: '28px 1fr 1fr 1fr 1fr' }}>\r
              <span className="text-gray-400">{i + 1}</span>\r
              <span>{s.saldoTime}</span>\r
              <span className="font-semibold">{s.jenis}</span>\r
              <span className="font-bold">{formatRupiah(s.nominal)}</span>\r
              <span className="text-gray-500">{s.keterangan || ""}</span>\r
            </div>\r
          ))\r
        )}\r
      </div>\r
\r
      {editTx && (\r
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setEditTx(null)}>\r
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>\r
            <div className="flex justify-between mb-3.5">\r
              <h3 className="font-bold text-base">Edit Transaksi</h3>\r
              <button onClick={() => setEditTx(null)} className="text-xl text-gray-400">&times;</button>\r
            </div>\r
            <div className="mb-2">\r
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Nominal</label>\r
              <input value={editNominal} onChange={e => setEditNominal(formatThousands(e.target.value))} inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />\r
            </div>\r
            <div className="mb-2">\r
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Admin</label>\r
              <input value={editAdmin} onChange={e => setEditAdmin(formatThousands(e.target.value))} inputMode="numeric" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />\r
            </div>\r
            <div className="mb-3.5">\r
              <label className="text-[11px] font-semibold text-gray-500 block mb-1">Keterangan</label>\r
              <input value={editKeterangan} onChange={e => setEditKeterangan(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none" />\r
            </div>\r
            <button onClick={handleEditSave} disabled={editSaving} className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold py-3 rounded-full text-sm disabled:opacity-60">\r
              {editSaving ? "Menyimpan..." : "Simpan Perubahan"}\r
            </button>\r
          </div>\r
        </div>\r
      )}\r
    </div>\r
  );\r
}\r
`,Pr=`{\r
  "name": "Alfaza Link",\r
  "short_name": "Alfaza Link",\r
  "description": "Sistem Kasir Pro - Alfaza Cell",\r
  "start_url": "/",\r
  "id": "/",\r
  "display": "standalone",\r
  "background_color": "#ffffff",\r
  "theme_color": "#3b82f6",\r
  "orientation": "portrait",\r
  "icons": [\r
    {\r
      "src": "icon-192.png",\r
      "sizes": "192x192",\r
      "type": "image/png",\r
      "purpose": "any"\r
    },\r
    {\r
      "src": "icon-192.png",\r
      "sizes": "192x192",\r
      "type": "image/png",\r
      "purpose": "maskable"\r
    },\r
    {\r
      "src": "icon-512.png",\r
      "sizes": "512x512",\r
      "type": "image/png",\r
      "purpose": "any"\r
    },\r
    {\r
      "src": "icon-512.png",\r
      "sizes": "512x512",\r
      "type": "image/png",\r
      "purpose": "maskable"\r
    }\r
  ]\r
}\r
`,Tr=`const CACHE_NAME = "alfaza-link-v14";
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
  "/icon-192.png",
  "/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  
  // Skip cross-origin requests like Firebase or Google Fonts for dynamic caching
  // to avoid issues with non-CORS responses.
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Only cache valid same-origin responses
        if (!response || response.status !== 200 || response.type !== 'basic' || !isSameOrigin) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Fallback for offline if index.html is missing
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
`,Dr=`{\r
    "$schema": "https://ui.shadcn.com/schema.json",\r
    "style": "new-york",\r
    "rsc": false,\r
    "tsx": true,\r
    "tailwind": {\r
      "config": "",\r
      "css": "src/index.css",\r
      "baseColor": "neutral",\r
      "cssVariables": true,\r
      "prefix": ""\r
    },\r
    "aliases": {\r
      "components": "@/components",\r
      "utils": "@/lib/utils",\r
      "ui": "@/components/ui",\r
      "lib": "@/lib",\r
      "hooks": "@/hooks"\r
    }\r
}`,Ar=`{\r
  "hosting": {\r
    "site": "alfaza-kasir",\r
\r
    "public": "dist",\r
    "ignore": [\r
      "firebase.json",\r
      "**/.*",\r
      "**/node_modules/**"\r
    ],\r
    "headers": [\r
      {\r
        "source": "/index.html",\r
        "headers": [\r
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }\r
        ]\r
      },\r
      {\r
        "source": "/sw.js",\r
        "headers": [\r
          { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }\r
        ]\r
      }\r
    ],\r
    "rewrites": [\r
      {\r
        "source": "**",\r
        "destination": "/index.html"\r
      }\r
    ]\r
  }\r
}\r
`,Mr=`{\r
  "indexes": [],\r
  "fieldOverrides": []\r
}\r
`,Lr=`rules_version = '2';\r
service cloud.firestore {\r
  match /databases/{database}/documents {\r
    match /{document=**} {\r
      allow read, write: if request.auth != null;\r
    }\r
  }\r
}\r
`,_r=`<!DOCTYPE html>\r
<html lang="en">\r
  <head>\r
    <meta charset="UTF-8" />\r
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1" />\r
    <title>Alfaza Link</title>\r
    <link rel="manifest" href="/manifest.json" />\r
    <link rel="icon" type="image/png" href="/icon-192.png" />\r
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />\r
    <meta name="theme-color" content="#2b67f6" />\r
    <link rel="preconnect" href="https://fonts.googleapis.com">\r
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\r
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">\r
  </head>\r
  <body>\r
    <div id="root"></div>\r
    <script type="module" src="/src/main.tsx"><\/script>\r
  </body>\r
</html>\r
`,Ir=`{\r
  "name": "@workspace/alfaza-link",\r
  "version": "0.0.0",\r
  "private": true,\r
  "type": "module",\r
  "scripts": {\r
    "dev": "vite --config vite.config.ts --host 0.0.0.0",\r
    "build": "vite build --config vite.config.ts",\r
    "build:firebase": "FIREBASE_BUILD=true vite build --config vite.config.ts",\r
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",\r
    "typecheck": "tsc -p tsconfig.json --noEmit"\r
  },\r
  "devDependencies": {\r
    "@hookform/resolvers": "^3.10.0",\r
    "@radix-ui/react-accordion": "^1.2.4",\r
    "@radix-ui/react-alert-dialog": "^1.1.7",\r
    "@radix-ui/react-aspect-ratio": "^1.1.3",\r
    "@radix-ui/react-avatar": "^1.1.4",\r
    "@radix-ui/react-checkbox": "^1.1.5",\r
    "@radix-ui/react-collapsible": "^1.1.4",\r
    "@radix-ui/react-context-menu": "^2.2.7",\r
    "@radix-ui/react-dialog": "^1.1.7",\r
    "@radix-ui/react-dropdown-menu": "^2.1.7",\r
    "@radix-ui/react-hover-card": "^1.1.7",\r
    "@radix-ui/react-label": "^2.1.3",\r
    "@radix-ui/react-menubar": "^1.1.7",\r
    "@radix-ui/react-navigation-menu": "^1.2.6",\r
    "@radix-ui/react-popover": "^1.1.7",\r
    "@radix-ui/react-progress": "^1.1.3",\r
    "@radix-ui/react-radio-group": "^1.2.4",\r
    "@radix-ui/react-scroll-area": "^1.2.4",\r
    "@radix-ui/react-select": "^2.1.7",\r
    "@radix-ui/react-separator": "^1.1.3",\r
    "@radix-ui/react-slider": "^1.2.4",\r
    "@radix-ui/react-slot": "^1.2.0",\r
    "@radix-ui/react-switch": "^1.1.4",\r
    "@radix-ui/react-tabs": "^1.1.4",\r
    "@radix-ui/react-toast": "^1.2.7",\r
    "@radix-ui/react-toggle": "^1.1.3",\r
    "@radix-ui/react-toggle-group": "^1.1.3",\r
    "@radix-ui/react-tooltip": "^1.2.0",\r
    "@tailwindcss/typography": "^0.5.15",\r
    "@tailwindcss/vite": "^4.1.4",\r
    "@tanstack/react-query": "^5.74.4",\r
    "@types/node": "^22.14.1",\r
    "@types/react": "^19.1.2",\r
    "@types/react-dom": "^19.1.2",\r
    "@vitejs/plugin-react": "^4.4.1",\r
    "class-variance-authority": "^0.7.1",\r
    "clsx": "^2.1.1",\r
    "cmdk": "^1.1.1",\r
    "date-fns": "^3.6.0",\r
    "embla-carousel-react": "^8.6.0",\r
    "framer-motion": "^12.7.3",\r
    "input-otp": "^1.4.2",\r
    "lucide-react": "^0.487.0",\r
    "next-themes": "^0.4.6",\r
    "react": "^19.1.0",\r
    "react-day-picker": "^9.11.1",\r
    "react-dom": "^19.1.0",\r
    "react-hook-form": "^7.55.0",\r
    "react-icons": "^5.4.0",\r
    "react-resizable-panels": "^2.1.7",\r
    "recharts": "^2.15.2",\r
    "sonner": "^2.0.7",\r
    "tailwind-merge": "^3.2.0",\r
    "tailwindcss": "^4.1.4",\r
    "tw-animate-css": "^1.4.0",\r
    "vaul": "^1.1.2",\r
    "vite": "^6.3.2",\r
    "wouter": "^3.3.5",\r
    "zod": "^3.24.2"\r
  },\r
  "dependencies": {\r
    "firebase": "^10.14.1",\r
    "html-to-image": "^1.11.13",\r
    "html2canvas": "^1.4.1",\r
    "jspdf": "^2.5.2",\r
    "jszip": "^3.10.1",\r
    "xlsx": "^0.18.5"\r
  }\r
}\r
\r
`,Er=`{\r
  "include": ["src/**/*"],\r
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],\r
  "compilerOptions": {\r
    "noEmit": true,\r
    "jsx": "react-jsx",\r
    "lib": ["esnext", "dom", "dom.iterable"],\r
    "target": "ESNext",\r
    "module": "ESNext",\r
    "esModuleInterop": true,\r
    "strict": true,\r
    "skipLibCheck": true,\r
    "forceConsistentCasingInFileNames": true,\r
    "resolveJsonModule": true,\r
    "allowImportingTsExtensions": true,\r
    "moduleResolution": "bundler",\r
    "types": ["node", "vite/client"],\r
    "paths": {\r
      "@/*": ["./src/*"]\r
    }\r
  }\r
}\r
\r
`,Br=`import { defineConfig } from "vite";\r
import react from "@vitejs/plugin-react";\r
import tailwindcss from "@tailwindcss/vite";\r
import path from "path";\r
\r
export default defineConfig({\r
  base: "/",\r
  plugins: [\r
    react(),\r
    tailwindcss(),\r
  ],\r
  resolve: {\r
    alias: {\r
      "@": path.resolve(import.meta.dirname, "src"),\r
    },\r
    dedupe: ["react", "react-dom"],\r
  },\r
  root: path.resolve(import.meta.dirname),\r
  build: {\r
    outDir: path.resolve(import.meta.dirname, "dist"),\r
    emptyOutDir: true,\r
  },\r
  server: {\r
    port: 5173,\r
    host: "0.0.0.0",\r
    allowedHosts: true,\r
  },\r
});\r
\r
`,Hr=`{\r
  "name": "alfaza-link-functions",\r
  "description": "Cloud Functions for Alfaza Link POS",\r
  "scripts": {\r
    "build": "tsc",\r
    "serve": "npm run build && firebase emulators:start --only functions",\r
    "deploy": "firebase deploy --only functions"\r
  },\r
  "engines": {\r
    "node": "18"\r
  },\r
  "main": "lib/index.js",\r
  "dependencies": {\r
    "firebase-admin": "^12.0.0",\r
    "firebase-functions": "^5.0.0"\r
  },\r
  "devDependencies": {\r
    "typescript": "^5.4.0"\r
  },\r
  "private": true\r
}\r
`,zr=`import * as functions from "firebase-functions";\r
import * as admin from "firebase-admin";\r
\r
admin.initializeApp();\r
\r
const db = admin.firestore();\r
\r
function getWibDate(): string {\r
  const now = new Date();\r
  const wibOffset = 7 * 60 * 60 * 1000;\r
  const wibDate = new Date(now.getTime() + wibOffset);\r
  const y = wibDate.getUTCFullYear();\r
  const m = String(wibDate.getUTCMonth() + 1).padStart(2, "0");\r
  const d = String(wibDate.getUTCDate()).padStart(2, "0");\r
  return \`\${y}-\${m}-\${d}\`;\r
}\r
\r
export const autoLockReports = functions.pubsub\r
  .schedule("every 1 minutes")\r
  .timeZone("Asia/Jakarta")\r
  .onRun(async () => {\r
    const now = new Date();\r
    const wibOffset = 7 * 60 * 60 * 1000;\r
    const wibDate = new Date(now.getTime() + wibOffset);\r
    const currentHour = wibDate.getUTCHours();\r
    const currentMinute = wibDate.getUTCMinutes();\r
\r
    const settingsDoc = await db.collection("settings").doc("main").get();\r
    if (!settingsDoc.exists) return null;\r
    const settings = settingsDoc.data();\r
    if (!settings) return null;\r
\r
    const lockHour = settings.autoLockHour ?? 22;\r
    const lockMinute = settings.autoLockMinute ?? 0;\r
\r
    if (currentHour === lockHour && currentMinute === lockMinute) {\r
      const today = getWibDate();\r
      const usersSnap = await db.collection("users").get();\r
      const batch = db.batch();\r
\r
      for (const userDoc of usersSnap.docs) {\r
        const userData = userDoc.data();\r
        if (userData.role === "kasir" && userData.isActive) {\r
          const kasirName = userData.name;\r
          const snapshotRef = db.collection("daily_snapshots").doc(\`\${kasirName}_\${today}\`);\r
          batch.set(snapshotRef, {\r
            locked: true,\r
            lockedAt: new Date().toISOString(),\r
          }, { merge: true });\r
        }\r
      }\r
\r
      await batch.commit();\r
      console.log(\`Reports locked at \${currentHour}:\${currentMinute} WIB for date \${today}\`);\r
    }\r
\r
    return null;\r
  });\r
\r
export const autoResetBalances = functions.pubsub\r
  .schedule("every 1 minutes")\r
  .timeZone("Asia/Jakarta")\r
  .onRun(async () => {\r
    const now = new Date();\r
    const wibOffset = 7 * 60 * 60 * 1000;\r
    const wibDate = new Date(now.getTime() + wibOffset);\r
    const currentHour = wibDate.getUTCHours();\r
    const currentMinute = wibDate.getUTCMinutes();\r
\r
    const settingsDoc = await db.collection("settings").doc("main").get();\r
    if (!settingsDoc.exists) return null;\r
    const settings = settingsDoc.data();\r
    if (!settings) return null;\r
\r
    const resetHour = settings.autoResetHour ?? 6;\r
    const resetMinute = settings.autoResetMinute ?? 0;\r
\r
    if (currentHour === resetHour && currentMinute === resetMinute) {\r
      const usersSnap = await db.collection("users").get();\r
      const batch = db.batch();\r
      const zeroBalance = {\r
        bank: 0,\r
        cash: 0,\r
        tarik: 0,\r
        aks: 0,\r
        adminTotal: 0,\r
        bankNonTunai: 0,\r
        cashNonTunai: 0,\r
        tarikNonTunai: 0,\r
        aksNonTunai: 0,\r
      };\r
\r
      for (const userDoc of usersSnap.docs) {\r
        const userData = userDoc.data();\r
        if (userData.role === "kasir" && userData.isActive) {\r
          const kasirName = userData.name;\r
          const balanceRef = db.collection("balances").doc(kasirName);\r
          batch.set(balanceRef, zeroBalance);\r
        }\r
      }\r
\r
      await batch.commit();\r
      console.log(\`Balances reset at \${currentHour}:\${currentMinute} WIB\`);\r
    }\r
\r
    return null;\r
  });\r
`,jr=`{\r
  "compilerOptions": {\r
    "module": "commonjs",\r
    "noImplicitReturns": true,\r
    "noUnusedLocals": true,\r
    "outDir": "lib",\r
    "sourceMap": true,\r
    "strict": true,\r
    "target": "es2017"\r
  },\r
  "compileOnSave": true,\r
  "include": [\r
    "src"\r
  ]\r
}\r
`,Kr=Object.assign({"/src/App.tsx":a,"/src/components/layout/bottom-nav.tsx":o,"/src/components/layout/header.tsx":s,"/src/components/modals/add-saldo-modal.tsx":i,"/src/components/ui/accordion.tsx":l,"/src/components/ui/alert-dialog.tsx":d,"/src/components/ui/alert.tsx":c,"/src/components/ui/aspect-ratio.tsx":m,"/src/components/ui/avatar.tsx":p,"/src/components/ui/badge.tsx":u,"/src/components/ui/breadcrumb.tsx":f,"/src/components/ui/button-group.tsx":g,"/src/components/ui/button.tsx":b,"/src/components/ui/calendar.tsx":x,"/src/components/ui/card.tsx":h,"/src/components/ui/carousel.tsx":v,"/src/components/ui/chart.tsx":y,"/src/components/ui/checkbox.tsx":N,"/src/components/ui/collapsible.tsx":w,"/src/components/ui/command.tsx":k,"/src/components/ui/context-menu.tsx":R,"/src/components/ui/dialog.tsx":S,"/src/components/ui/drawer.tsx":C,"/src/components/ui/dropdown-menu.tsx":P,"/src/components/ui/empty.tsx":T,"/src/components/ui/field.tsx":D,"/src/components/ui/form.tsx":A,"/src/components/ui/hover-card.tsx":M,"/src/components/ui/input-group.tsx":L,"/src/components/ui/input-otp.tsx":_,"/src/components/ui/input.tsx":I,"/src/components/ui/item.tsx":E,"/src/components/ui/kbd.tsx":B,"/src/components/ui/label.tsx":H,"/src/components/ui/menubar.tsx":z,"/src/components/ui/navigation-menu.tsx":j,"/src/components/ui/pagination.tsx":K,"/src/components/ui/popover.tsx":O,"/src/components/ui/progress.tsx":F,"/src/components/ui/radio-group.tsx":U,"/src/components/ui/resizable.tsx":G,"/src/components/ui/scroll-area.tsx":W,"/src/components/ui/select.tsx":$,"/src/components/ui/separator.tsx":V,"/src/components/ui/sheet.tsx":X,"/src/components/ui/sidebar.tsx":q,"/src/components/ui/skeleton.tsx":J,"/src/components/ui/slider.tsx":Q,"/src/components/ui/sonner.tsx":Y,"/src/components/ui/spinner.tsx":Z,"/src/components/ui/switch.tsx":rr,"/src/components/ui/table.tsx":er,"/src/components/ui/tabs.tsx":nr,"/src/components/ui/textarea.tsx":tr,"/src/components/ui/toast.tsx":ar,"/src/components/ui/toaster.tsx":or,"/src/components/ui/toggle-group.tsx":sr,"/src/components/ui/toggle.tsx":ir,"/src/components/ui/tooltip.tsx":lr,"/src/hooks/use-auto-scheduler.ts":dr,"/src/hooks/use-display-mode.tsx":cr,"/src/hooks/use-mobile.tsx":mr,"/src/hooks/use-toast.ts":pr,"/src/index.css":ur,"/src/lib/auth.tsx":fr,"/src/lib/firebase.ts":gr,"/src/lib/firestore.ts":br,"/src/lib/utils.ts":xr,"/src/main.tsx":hr,"/src/pages/beranda.tsx":vr,"/src/pages/catatan.tsx":yr,"/src/pages/laporan.tsx":Nr,"/src/pages/login.tsx":wr,"/src/pages/non-tunai.tsx":kr,"/src/pages/not-found.tsx":Rr,"/src/pages/owner.tsx":Sr,"/src/pages/riwayat.tsx":Cr}),Or=Object.assign({"/public/manifest.json":Pr,"/public/sw.js":Tr}),Fr=Object.assign({"/components.json":Dr,"/firebase.json":Ar,"/firestore.indexes.json":Mr,"/firestore.rules":Lr,"/index.html":_r,"/package.json":Ir,"/tsconfig.json":Er,"/vite.config.ts":Br}),Ur=Object.assign({"/functions/package.json":Hr,"/functions/src/index.ts":zr,"/functions/tsconfig.json":jr});function Gr(){const e={...Kr,...Or,...Fr,...Ur},r={};for(const[n,t]of Object.entries(e))r[n.replace(/^\//,"")]=t;return r}export{Gr as getSourceFiles};
