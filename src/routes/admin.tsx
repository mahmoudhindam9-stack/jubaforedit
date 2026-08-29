// @ts-nocheck
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  Package,
  BarChart3,
  Users,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Landmark,
  BookOpen,
  Wallet,
  UserCheck,
  Receipt,
  FileSpreadsheet,
  Menu,
  Utensils,
  Store,
  Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { RestocashLogo } from "@/components/RestocashLogo";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة" }] }),
  component: () => <AdminLayout />,
});

const nav = [
  { to: "/admin", label: "الرئيسية", icon: LayoutDashboard, exact: true },
  { to: "/admin/restaurant", label: "إدارة المطعم (البرنامج الشامل)", icon: Store },
  { to: "/admin/mall", label: "إدارة المول والحديقة", icon: Building2 },
  { to: "/admin", search: { tab: "treasury" }, label: "إدارة الخزائن", icon: Wallet },
  { to: "/admin/receipts", label: "تصميم وإدارة الإيصالات والسندات", icon: Receipt },
  { to: "/admin/accounts", label: "إدارة الحسابات", icon: Landmark },
  { to: "/admin/ledger", label: "حساب الأستاذ", icon: BookOpen },
  { to: "/admin/hr", label: "إدارة الموارد البشرية", icon: UserCheck },
  { to: "/admin/reports", label: "التقارير", icon: BarChart3 },
  { to: "/admin/users", label: "المستخدمين", icon: Users },
  {
    to: "/admin/system-update",
    search: { tab: "system" },
    label: "تحديث السيستم",
    icon: RefreshCw,
  },
  {
    to: "/admin/system-update",
    search: { tab: "access" },
    label: "حزمة أكسس (Access)",
    icon: FileSpreadsheet,
  },
];

export function AdminLayout({ children }: { children?: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const localUser = localStorage.getItem("restocash_auth_user");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user?.email) {
        setUser({ email: session.user.email });
      } else if (localUser) {
        setUser({ email: localUser });
      } else {
        navigate({ to: "/login" });
      }
    }

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const localUser = localStorage.getItem("restocash_auth_user");
      if (session?.user?.email) {
        setUser({ email: session.user.email });
      } else if (localUser) {
        setUser({ email: localUser });
      } else if (event === "SIGNED_OUT" || !session) {
        navigate({ to: "/login" });
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleSignOut = async () => {
    localStorage.removeItem("restocash_auth_user");
    localStorage.removeItem("restocash_user_role");
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
    navigate({ to: "/login" });
  };

  if (!user) return null;

  const searchParams = new URLSearchParams(location.search);
  const activeNavItem = nav.find((item) => {
    if (item.search) {
      return pathname === item.to && searchParams.get("tab") === item.search.tab;
    }
    return item.exact ? pathname === item.to : pathname.startsWith(item.to);
  });

  const renderSidebarNav = (onItemClick?: () => void) => (
    <div className="flex flex-col h-full bg-card text-card-foreground">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div>
          <RestocashLogo size={20} />
          <p className="text-[10px] text-muted-foreground mt-1">نظام الإدارة المتكامل</p>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {location.pathname.startsWith("/admin") ? "لوحة التحكم الرئيسية" : "الإدارة"}
        </div>
        {nav.map((item) => {
          const active = item.search
            ? pathname === item.to && searchParams.get("tab") === item.search.tab
            : item.exact
              ? pathname === item.to
              : pathname.startsWith(item.to);
          return (
            <Link
              key={item.to + (item.search ? "?" + new URLSearchParams(item.search).toString() : "")}
              to={item.to}
              search={item.search}
              onClick={() => {
                if (onItemClick) onItemClick();
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-border space-y-2 shrink-0">
        <p className="px-3 text-xs text-muted-foreground truncate">{user?.email}</p>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-muted-foreground"
          onClick={() => {
            if (onItemClick) onItemClick();
            handleSignOut();
          }}
        >
          <LogOut size={18} />
          تسجيل الخروج
        </Button>
        <Link
          to="/"
          onClick={() => {
            if (onItemClick) onItemClick();
          }}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted transition"
        >
          <ArrowLeft size={18} />
          الرئيسية
        </Link>

        <div className="pt-2 border-t border-border/60 space-y-1">
          <span className="px-1 text-[11px] font-bold text-muted-foreground block">
            عملة عرض اللوحة:
          </span>
          <CurrencySwitcher compact className="w-full justify-between" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background" dir="rtl">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-l border-border bg-card flex-col h-screen sticky top-0">
        {renderSidebarNav()}
      </aside>

      {/* Mobile Drawer Navigation (Sheet) */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent side="right" className="w-[280px] p-0 border-l border-border bg-card dir-rtl">
          {renderSidebarNav(() => setIsMobileMenuOpen(false))}
        </SheetContent>
      </Sheet>

      <main className="flex-1 flex flex-col min-w-0 overflow-auto">
        {/* Admin Header with Page Title, Mobile Toggle, and Currency Switcher */}
        <header className="sticky top-0 z-20 bg-card/95 backdrop-blur border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            {/* Mobile Sidebar Toggle Icon Button */}
            <Button
              variant="outline"
              size="icon"
              className="md:hidden shrink-0 h-9 w-9 border-border"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="فتح القائمة الجانبية"
            >
              <Menu size={20} />
            </Button>
            <span className="font-black text-sm text-foreground">
              {activeNavItem?.label || "لوحة التحكم"}
            </span>
            <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
              | نظام إدارة المطاعم والمحاسبة ERP
            </span>
          </div>
          <CurrencySwitcher />
        </header>
        <div className="p-4 sm:p-6 flex-1">{children || <Outlet />}</div>
      </main>
    </div>
  );
}
