import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Grid3X3,
  Wallet,
  UtensilsCrossed,
  ClipboardList,
  Receipt,
  Utensils,
  Package,
  ArrowUpRight,
  Store,
  ChefHat,
  BadgePercent,
  Layers,
  Sparkles,
  Clock,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { erpStore } from "@/shared/services/erpStore";

export const Route = createFileRoute("/admin/restaurant")({
  head: () => ({ meta: [{ title: "إدارة المطعم - النظام الشامل" }] }),
  component: RestaurantHubPage,
});

function RestaurantHubPage() {
  const menuCount = (erpStore.getState() as any).menu?.length || 0;
  const inventoryCount = (erpStore.getState() as any).inventoryItems?.length || 0;
  const ordersCount = (erpStore.getState() as any).orders?.length || 0;

  const modules = [
    {
      title: "نقطة البيع (POS)",
      description: "شاشة البيع السريعة لإدخال الطلبات، الدفع، وطباعة الفواتير",
      to: "/pos",
      icon: Grid3X3,
      color: "from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400",
      badge: "الرئيسية",
      stats: "مبيعات سريعة",
    },
    {
      title: "شاشة الكاشير والخزينة",
      description: "إدارة النقدية اليومية، فتح وإغلاق الشيفتات، وحركات الخزينة",
      to: "/cashier-treasury",
      icon: Wallet,
      color: "from-emerald-500/25 to-teal-500/25 text-emerald-600 dark:text-emerald-400",
      badge: "مالي",
      stats: "الخزينة والشيفتات",
    },
    {
      title: "شاشة المطبخ (الفرن)",
      description: "متابعة الطلبات الواردة للمطبخ والفرن وأوقات التجهيز الفعلي",
      to: "/oven",
      icon: UtensilsCrossed,
      color: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
      badge: "تشغيل",
      stats: "المطبخ والفرن",
    },
    {
      title: "شاشة طلبات العملاء (Captain)",
      description: "تسجيل طلبات الطاولات والصالة بواسطة الكابتن والويتر",
      to: "/captain",
      icon: ClipboardList,
      color: "from-purple-500/20 to-pink-500/20 text-purple-600 dark:text-purple-400",
      badge: "الصالة",
      stats: "طلبات الكابتن",
    },
    {
      title: "إدارة الطلبات والفواتير",
      description: "سجل كامل للطلبات، متابعة الحالات، وتعديل أو إلغاء الطلبات",
      to: "/admin/orders",
      icon: Receipt,
      color: "from-cyan-500/20 to-blue-500/20 text-cyan-600 dark:text-cyan-400",
      badge: "متابعة",
      stats: `${ordersCount} طلب مسجل`,
    },
    {
      title: "إدارة المنيو والصور والأصناف",
      description: "إضافة وتعديل الأقسام، الأسعار، الشعارات (خصم، جديد)، والمكونات",
      to: "/admin/menu",
      icon: Utensils,
      color: "from-rose-500/20 to-red-500/20 text-rose-600 dark:text-rose-400",
      badge: "القائمة",
      stats: `${menuCount} صنف في المنيو`,
    },
    {
      title: "المخزن والمستودع",
      description: "متابعة أرصدة المواد الخام، الوارد والصادر، وجرد المستودع",
      to: "/admin/inventory",
      icon: Package,
      color: "from-amber-600/20 to-yellow-600/20 text-amber-700 dark:text-amber-400",
      badge: "المخزون",
      stats: `${inventoryCount} صنف مخزني`,
    },
  ];

  return (
    <div className="space-y-6 w-full px-2 lg:px-6 mx-auto pb-12" dir="rtl">
      {/* Standalone App Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-amber-300">
              <Sparkles size={14} />
              <span>نظام إدارة المطاعم المتقدم - Standalone Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              إدارة تشغيل المطعم بالكامل
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              منصة مركزية متكاملة لجميع عمليات المطعم الكاشير، نقاط البيع، المطبخ، المنيو والمخزن.
              انقر على أي قسم لفتحه مباشرة.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link to="/pos">
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-black gap-2 shadow-lg cursor-pointer">
                <Grid3X3 size={18} />
                فتح نقطة البيع الآن
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid of Modules */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-foreground flex items-center gap-2">
            <Store size={20} className="text-primary" />
            أقسام نظام تشغيل المطعم
          </h2>
          <span className="text-xs text-muted-foreground font-bold">7 أقسام أساسية</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod) => (
            <Link key={mod.to} to={mod.to} className="group">
              <Card className="h-full border border-border/80 bg-card hover:bg-accent/30 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl rounded-2xl overflow-hidden flex flex-col">
                <CardHeader className="pb-3 flex flex-row items-start justify-between space-y-0">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${mod.color} shadow-inner`}>
                    <mod.icon size={24} />
                  </div>
                  <span className="text-[11px] font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded-full border border-border/60">
                    {mod.badge}
                  </span>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <h3 className="font-black text-lg text-foreground group-hover:text-primary transition flex items-center justify-between">
                      <span>{mod.title}</span>
                      <ArrowUpRight
                        size={18}
                        className="opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-primary"
                      />
                    </h3>
                    <CardDescription className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                      {mod.description}
                    </CardDescription>
                  </div>
                  <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs font-bold text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-primary font-black">
                      <Clock size={13} />
                      {mod.stats}
                    </span>
                    <span className="text-primary group-underline flex items-center gap-1">
                      فتح الواجهة
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
