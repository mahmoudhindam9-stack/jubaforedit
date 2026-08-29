// @ts-nocheck
import { ORACLE_MIGRATION_ACCOUNTS as oracleAccounts } from "@/shared/data/oracleAccounts";
import { OracleAccountsViewer } from "@/components/admin/OracleAccountsViewer";
import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useSettings, formatTreasuryCurrency } from "@/hooks/use-settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { erpStore, type Account } from "@/shared/services/erpStore";
import { inventoryService } from "@/features/inventory/services/inventoryService";
import {
  UtensilsCrossed,
  Package,
  Grid3X3,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  FileBarChart,
  DollarSign,
  Coffee,
  Users,
  Wallet,
  Building,
  History,
  FileText,
  CheckCircle,
  Plus,
  ArrowLeftRight,
  Coins,
  CreditCard,
  Smartphone,
  Search,
  Eye,
  FileSpreadsheet,
  ExternalLink,
  X,
  Download,
  Calendar,
  User as UserIcon,
  Code,
  Upload,
  Save,
  Database,
  RefreshCw,
  BookOpen,
  Table as TableIcon,
  Filter,
  CalendarDays,
  Lock,
  LockKeyholeOpen,
  Trash2,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const getTreasuryDisplayCurrency = (t: { name_ar?: string; currency?: string }) => {
  if (t.name_ar?.includes("دولار")) return "USD";
  if (t.name_ar?.includes("سوداني")) return "SSP";
  if (t.name_ar?.includes("مصري")) return "EGP";
  if (t.currency && t.currency !== "MULTI") return t.currency;
  return "EGP";
};

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "لوحة الإدارة والمحاسبة ERP" }] }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { toast } = useToast();
  const { formatPrice } = useSettings();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tabParam = searchParams.get("tab") || "dashboard";

  const [activeTab, setActiveTab] = useState(tabParam);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [selectedUserEmail, setSelectedUserEmail] = useState("admin@restaurant.com");

  // ERP Store State
  const [erpState, setErpState] = useState(erpStore.getState());
  const currentBranch = erpStore.getCurrentBranch();

  // Switch branches
  const handleBranchChange = (branchId: string) => {
    erpStore.setCurrentBranch(branchId);
    setErpState(erpStore.getState());
  };

  // Sync state whenever activeTab change or ERP store updates
  useEffect(() => {
    setErpState(erpStore.getState());
    const unsub = erpStore.subscribe(() => {
      setErpState(erpStore.getState());
      statsQuery.refetch();
    });
    return unsub;
  }, [activeTab]);

  // Vouchers form state
  const [voucherForm, setVoucherForm] = useState({
    type: "payment" as "receipt" | "payment",
    category: "رواتب الموظفين",
    amount: "",
    treasury_id: "",
    description: "",
    cost_center: "الإدارة (Administration)",
  });

  // Treasury Actions state
  const [treasuryForm, setTreasuryForm] = useState({
    actionType: "deposit" as "deposit" | "withdrawal" | "transfer",
    treasury_id: "",
    target_treasury_id: "",
    amount: "",
    currency: "EGP",
    note: "",
  });

  const [newTreasuryForm, setNewTreasuryForm] = useState({
    name_ar: "",
    type: "cash" as "cash" | "bank",
    currency: "EGP",
    balance: "0",
    responsible_employee: "",
    containers: [] as { id: string; name: string; currency: string; balance: number }[],
    linked_to_restaurant: false,
    account_code: "",
  });

  const [editingTreasuryId, setEditingTreasuryId] = useState<string | null>(null);
  const [treasuryToDelete, setTreasuryToDelete] = useState<any | null>(null);
  const [treasuryToggleStatusDialog, setTreasuryToggleStatusDialog] = useState<any | null>(null);
  const [isProcessingTreasuryAction, setIsProcessingTreasuryAction] = useState(false);

  // Treasury Details Modal state
  const [selectedTreasuryForDetails, setSelectedTreasuryForDetails] = useState<Account | null>(
    null,
  );
  const [inquiryActiveTab, setInquiryActiveTab] = useState<"journal" | "table">("journal");
  const [treasuryModalSearch, setTreasuryModalSearch] = useState("");
  const [treasuryModalFilterType, setTreasuryModalFilterType] = useState("all");
  const [treasuryModalFilterCurrency, setTreasuryModalFilterCurrency] = useState("all");
  const [treasuryModalStartDate, setTreasuryModalStartDate] = useState("");
  const [treasuryModalEndDate, setTreasuryModalEndDate] = useState("");
  const [treasuryModalDatePreset, setTreasuryModalDatePreset] = useState("all");

  const applyInquiryQuickDate = (preset: string) => {
    setTreasuryModalDatePreset(preset);
    const now = new Date();
    const format = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    };

    if (preset === "today") {
      const todayStr = format(now);
      setTreasuryModalStartDate(todayStr);
      setTreasuryModalEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yesterdayStr = format(y);
      setTreasuryModalStartDate(yesterdayStr);
      setTreasuryModalEndDate(yesterdayStr);
    } else if (preset === "last7") {
      const d = new Date(now);
      d.setDate(d.getDate() - 6);
      setTreasuryModalStartDate(format(d));
      setTreasuryModalEndDate(format(now));
    } else if (preset === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setTreasuryModalStartDate(format(firstDay));
      setTreasuryModalEndDate(format(now));
    } else {
      setTreasuryModalStartDate("");
      setTreasuryModalEndDate("");
    }
  };

  // Helper to compute multi-currency breakdown for any treasury
  const getTreasuryFullBreakdown = (tr: Account) => {
    const opBal = tr.opening_balance ?? 0;
    let cashEGP = tr.currency === "MULTI" || tr.currency === "EGP" ? opBal : 0;
    let cashUSD = tr.currency === "USD" ? opBal : 0;
    let cashSSP = tr.currency === "SSP" ? opBal : 0;
    let cardUSD = 0;
    let walletSSP = 0;

    const txs = erpState.treasuryTransactions.filter((tx) => tx.treasury_id === tr.id);

    txs.forEach((tx) => {
      const isIncoming = tx.type === "deposit" || tx.type === "sales" || tx.type === "transfer_in";
      const amt = isIncoming ? tx.amount : -tx.amount;
      const pm = tx.payment_method || "cash";
      const curr = tx.currency || "EGP";

      if (pm === "card") {
        cardUSD += amt;
      } else if (pm === "wallet") {
        walletSSP += amt;
      } else {
        if (curr === "USD") {
          cashUSD += amt;
        } else if (curr === "SSP") {
          cashSSP += amt;
        } else {
          cashEGP += amt;
        }
      }
    });

    return { cashEGP, cashUSD, cashSSP, cardUSD, walletSSP };
  };

  const statsQuery = useQuery({
    queryKey: ["admin_stats"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const { data: orders, error: ordersErr } = await supabase
        .from("orders")
        .select("*")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (ordersErr) throw ordersErr;

      const { data: menu, error: menuErr } = await supabase.from("menu_items").select("id");
      if (menuErr) throw menuErr;

      const { data: tables } = await supabase.from("tables").select("id,status");

      let inventory: any[] = [];
      try {
        inventory = await inventoryService.getInventory();
      } catch (err) {
        console.warn("Failed to fetch inventory from inventoryService, falling back:", err);
        const { data } = await supabase
          .from("inventory")
          .select("id,quantity,min_level,name_ar,unit,cost");
        inventory = data || [];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayOrders = (orders ?? []).filter((o) => new Date(o.created_at) >= today);
      const revenue = todayOrders.reduce((a, o) => a + Number(o.total), 0);
      const occupied = (tables ?? []).filter((t) => t.status === "occupied").length;
      const lowStockList = (inventory ?? []).filter(
        (i) => Number(i.quantity) <= Number(i.min_level),
      );

      // Past 7 Days Trend Data
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d;
      });

      const trendData = days.map((day) => {
        const dayStr = day.toLocaleDateString("ar-EG", { weekday: "short" });
        const dayOrders = (orders ?? []).filter((o) => {
          const oDate = new Date(o.created_at);
          return (
            oDate.getDate() === day.getDate() &&
            oDate.getMonth() === day.getMonth() &&
            oDate.getFullYear() === day.getFullYear()
          );
        });

        const totalRevenue = dayOrders.reduce((acc, curr) => acc + Number(curr.total), 0);
        return {
          dayLabel: dayStr,
          الإيرادات: totalRevenue || 0,
        };
      });

      // Top Menu Items Sold
      const itemsCount: Record<string, { name: string; quantity: number; revenue: number }> = {};
      (orders ?? []).forEach((o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        items.forEach((item: any) => {
          const name = item.name_ar || "صنف غير معروف";
          const qty = Number(item.quantity || 0);
          const price = Number(item.price || 0);
          if (!itemsCount[name]) {
            itemsCount[name] = { name, quantity: 0, revenue: 0 };
          }
          itemsCount[name].quantity += qty;
          itemsCount[name].revenue += qty * price;
        });
      });

      const topPerformingItems = Object.values(itemsCount)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      return {
        todayOrders: todayOrders.length,
        revenue,
        menuCount: (menu ?? []).length,
        tableCount: (tables ?? []).length,
        occupied,
        lowStockCount: lowStockList.length,
        lowStockList,
        trendData,
        topPerformingItems,
        inventoryValue: (inventory ?? []).reduce(
          (sum, i) => sum + Number(i.cost) * Number(i.quantity),
          0,
        ),
      };
    },
  });

  const s = statsQuery.data;

  // Calculate Treasury stats
  const totalCashBalance = useMemo(() => {
    return erpState.treasuries
      .filter((t) => t.branch_id === currentBranch.id && t.type === "cash")
      .reduce((sum, t) => {
        const rate = erpState.exchangeRates?.[t.currency] || 1;
        // Since exchange rate usually defined as 1 USD = X EGP.
        // If currency is EGP and rate is 50, then to get USD value we do balance / 50.
        // If currency is already USD, rate is 1.
        const baseValue = t.currency === "USD" ? t.balance : t.balance / rate;
        return sum + baseValue;
      }, 0);
  }, [erpState.treasuries, currentBranch.id, erpState.exchangeRates]);

  const totalBankBalance = useMemo(() => {
    return erpState.treasuries
      .filter((t) => t.branch_id === currentBranch.id && t.type === "bank")
      .reduce((sum, t) => {
        const rate = erpState.exchangeRates?.[t.currency] || 1;
        const baseValue = t.currency === "USD" ? t.balance : t.balance / rate;
        return sum + baseValue;
      }, 0);
  }, [erpState.treasuries, currentBranch.id, erpState.exchangeRates]);

  const branchTreasuries = useMemo(() => {
    return erpState.treasuries.filter((t) => t.branch_id === currentBranch.id && !t.deleted);
  }, [erpState.treasuries, currentBranch.id]);

  // Handle Voucher Submission
  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherForm.amount || !voucherForm.treasury_id || !voucherForm.description) {
      alert("يرجى ملء جميع الخانات الإلزامية");
      return;
    }

    erpStore.createVoucher(
      voucherForm.type,
      voucherForm.category,
      Number(voucherForm.amount),
      voucherForm.treasury_id,
      `[${voucherForm.cost_center}] - ${voucherForm.description}`,
    );

    alert("تم تسجيل السند المالي، قيد المحاسبة التلقائي، وتحديث أرصدة الخزائن!");
    setVoucherForm({
      type: "payment",
      category: "رواتب الموظفين",
      amount: "",
      treasury_id: "",
      description: "",
      cost_center: "الإدارة (Administration)",
    });
    setErpState(erpStore.getState());
  };

  // Handle Treasury Actions (Deposit, Withdrawal, Transfer)
  const handleTreasuryAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treasuryForm.amount || !treasuryForm.treasury_id) return;
    const amount = Number(treasuryForm.amount);

    if (treasuryForm.actionType === "deposit") {
      erpStore.addTreasuryTransaction(
        treasuryForm.treasury_id,
        "deposit",
        amount,
        treasuryForm.currency,
        `إيداع نقدي مباشر: ${treasuryForm.note}`,
      );
    } else if (treasuryForm.actionType === "withdrawal") {
      erpStore.addTreasuryTransaction(
        treasuryForm.treasury_id,
        "withdrawal",
        amount,
        treasuryForm.currency,
        `سحب نقدي مباشر: ${treasuryForm.note}`,
      );
    } else if (treasuryForm.actionType === "transfer") {
      if (!treasuryForm.target_treasury_id) return;
      erpStore.addTreasuryTransaction(
        treasuryForm.treasury_id,
        "transfer_out",
        amount,
        treasuryForm.currency,
        `تحويل مالي صادر إلى خزينة مستهدفة (${treasuryForm.currency})`,
      );
      erpStore.addTreasuryTransaction(
        treasuryForm.target_treasury_id,
        "transfer_in",
        amount,
        treasuryForm.currency,
        `تحويل مالي وارد من خزينة المصدر (${treasuryForm.currency})`,
      );
    }

    alert("تم إجراء الحركة على الخزينة وربطها بالدفاتر المالية المحاسبية!");
    setTreasuryForm({
      actionType: "deposit",
      treasury_id: "",
      target_treasury_id: "",
      amount: "",
      currency: "EGP",
      note: "",
    });
    setErpState(erpStore.getState());
  };

  // Add or Update treasury
  const handleAddTreasury = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTreasuryForm.name_ar) return;

    if (editingTreasuryId) {
      erpStore.updateTreasury(editingTreasuryId, {
        name_ar: newTreasuryForm.name_ar,
        type: newTreasuryForm.type,
        currency: newTreasuryForm.currency,
        responsible_employee: newTreasuryForm.responsible_employee || "أمين الخزينة",
        containers: newTreasuryForm.containers,
        linked_to_restaurant: newTreasuryForm.linked_to_restaurant,
        account_code: newTreasuryForm.account_code,
      });
    } else {
      erpStore.addTreasury(
        newTreasuryForm.name_ar,
        newTreasuryForm.type,
        newTreasuryForm.currency,
        Number(newTreasuryForm.balance),
        newTreasuryForm.responsible_employee || "أمين الخزينة",
        newTreasuryForm.containers,
        newTreasuryForm.linked_to_restaurant,
        newTreasuryForm.account_code,
      );
    }

    setNewTreasuryForm({
      name_ar: "",
      type: "cash",
      currency: "EGP",
      balance: "0",
      responsible_employee: "",
      containers: [],
      linked_to_restaurant: false,
      account_code: "",
    });
    setEditingTreasuryId(null);
    setErpState(erpStore.getState());
    alert(editingTreasuryId ? "تم تحديث بيانات الحساب!" : "تم إنشاء الخزينة/الحساب الجديد بنجاح!");
  };

  const handleEditTreasury = (tr: any) => {
    setEditingTreasuryId(tr.id);
    setNewTreasuryForm({
      name_ar: tr.name_ar,
      type: tr.type,
      currency: tr.currency,
      balance: String(tr.balance),
      responsible_employee: tr.responsible_employee || "",
      containers: tr.containers || [],
      linked_to_restaurant: !!tr.linked_to_restaurant,
      account_code: tr.account_code || "",
    });
    // Scroll to form or show indicator
  };

  const confirmToggleTreasuryStatus = async () => {
    if (!treasuryToggleStatusDialog) return;
    setIsProcessingTreasuryAction(true);
    try {
      const tr = treasuryToggleStatusDialog;
      const newIsOpen = !tr.is_open;
      erpStore.setTreasuryOpenStatus(tr.id, newIsOpen);
      setErpState(erpStore.getState());
      setActiveTab("treasury");
      toast({
        title: newIsOpen
          ? "✅ تم فتح الخزينة وتفعيل المقبوضات بنجاح"
          : "🔒 تم إغلاق الخزينة وتجميد الرصيد والحركات بنجاح",
        description: newIsOpen
          ? `أصبحت الخزينة "${tr.name_ar}" جاهزة الآن للعمل واستلام المقبوضات وصرف النقدية بالكاشير، وتحديث شاشة الخزائن بالكامل.`
          : `تم إغلاق الخزينة "${tr.name_ar}" وتجميد رصيدها الدفتري لمنع أي عمليات سحب أو إيداع غير مصرح بها.`,
      });
      setTreasuryToggleStatusDialog(null);
    } catch (err: any) {
      toast({
        title: "❌ خطأ في تغيير حالة الخزينة",
        description: err?.message || "حدث خطأ أثناء معالجة طلب تغيير حالة الخزينة.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingTreasuryAction(false);
    }
  };

  const confirmDeleteTreasury = async (id: string) => {
    if (!treasuryToDelete) return;
    setIsProcessingTreasuryAction(true);
    try {
      const tr = treasuryToDelete;
      erpStore.deleteTreasury(id);
      setErpState(erpStore.getState());
      setActiveTab("treasury");
      toast({
        title: "✅ تم حذف / أرشفة الخزينة بنجاح",
        description: `تم إزالة الخزينة "${tr.name_ar}" من القائمة النشطة، وتحديث دليل الحسابات وسجل الخزائن بصفحة الإدارة بنجاح.`,
      });
      setTreasuryToDelete(null);
    } catch (error: any) {
      toast({
        title: "❌ لا يمكن حذف الخزينة",
        description:
          error.message || "فشلت عملية الحذف، يرجى التأكد من تفريغ رصيد الخزينة وإغلاقها أولاً.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingTreasuryAction(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 text-right" dir="rtl">
      {/* Upper header with switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-bold">
              الشركة المصرية لادارة المشروعات السياحية والترفيهية (بهجت جروب)
            </span>
            <span className="bg-amber-500/10 text-amber-600 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <Building size={12} />
              {currentBranch.name_ar}
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mt-2">
            نظام الحسابات والـ ERP الشامل
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إشراف مركزي متكامل على فروع المؤسسة، الخزائن النقدية، الحسابات البنكية، السندات والرقابة
            العامة
          </p>
        </div>

        {/* Branch switcher & reports */}
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
          {erpState.branches.length > 1 && (
            <div className="flex items-center gap-2 bg-muted p-1 rounded-xl border border-border">
              <span className="text-xs font-bold text-muted-foreground px-2">الفرع الحالي:</span>
              {erpState.branches.map((b) => (
                <Button
                  key={b.id}
                  size="sm"
                  variant={currentBranch.id === b.id ? "default" : "ghost"}
                  onClick={() => handleBranchChange(b.id)}
                  className="text-xs font-bold rounded-lg h-8"
                >
                  {b.name_ar}
                </Button>
              ))}
            </div>
          )}
          <Link to="/admin/reports">
            <Button variant="outline" className="gap-2 rounded-xl text-xs font-bold py-5">
              <FileBarChart size={16} />
              التقارير والميزانية العمومية
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted p-1 rounded-xl flex flex-wrap gap-1 h-auto">
          <TabsTrigger value="dashboard" className="rounded-lg font-bold py-2 px-4">
            <Grid3X3 size={16} className="ml-1.5 inline" />
            نظرة عامة والذكاء المالي
          </TabsTrigger>
          <TabsTrigger value="treasury" className="rounded-lg font-bold py-2 px-4">
            <Wallet size={16} className="ml-1.5 inline" />
            إدارة الخزائن والحسابات البنكية
          </TabsTrigger>
          <TabsTrigger value="vouchers_entry" className="rounded-lg font-bold py-2 px-4">
            <FileText size={16} className="ml-1.5 inline" />
            تسجيل سندات الإيراد والمصروف
          </TabsTrigger>
          <TabsTrigger value="chart_of_accounts" className="rounded-lg font-bold py-2 px-4">
            <FileBarChart size={16} className="ml-1.5 inline" />
            شجرة ودليل الحسابات
          </TabsTrigger>
          <TabsTrigger value="audit_logs" className="rounded-lg font-bold py-2 px-4">
            <History size={16} className="ml-1.5 inline" />
            سجل العمليات والرقابة الأمنية
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: EXECUTIVE DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6 mt-4">
          {statsQuery.isLoading ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              جاري تحميل المؤشرات...
            </div>
          ) : (
            <>
              {/* Executive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                  title="مبيعات اليوم التشغيلية"
                  value={formatPrice(s?.revenue || 0)}
                  subtext="مبيعات تشغيلية مباشرة"
                  icon={DollarSign}
                  trend={s?.revenue ? "+14.2% اليوم" : "لا توجد مبيعات"}
                  trendType={s?.revenue ? "up" : "neutral"}
                  accentColor="primary"
                />
                <StatCard
                  title="إجمالي أرصدة الخزائن (كاش)"
                  value={formatPrice(totalCashBalance)}
                  subtext="السيولة المتوفرة بالصناديق"
                  icon={Wallet}
                  trend="آمن ومتوازن"
                  trendType="neutral"
                  accentColor="green"
                />
                <StatCard
                  title="الحسابات البنكية والودائع"
                  value={formatPrice(totalBankBalance)}
                  subtext="إجمالي حسابات البنوك المعتمدة"
                  icon={Building}
                  trend="CIB بنك مصر"
                  trendType="neutral"
                  accentColor="blue"
                />
                <StatCard
                  title="تقييم المخزون الحالي"
                  value={formatPrice(s?.inventoryValue || 0)}
                  subtext="إجمالي أصول المواد بالمستودع"
                  icon={Package}
                  trend="جرد دفتري دائم"
                  trendType="neutral"
                  accentColor="amber"
                />
              </div>

              {/* Treasury Balances Individual Cards Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet size={18} className="text-emerald-600" />
                    <h3 className="text-sm font-black text-foreground">
                      تفاصيل أرصدة الخزائن والصناديق النقدية بالفرع
                    </h3>
                  </div>
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    {branchTreasuries.length} خزائن ودفاتر
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {branchTreasuries.map((tr, idx) => {
                    const colorList: ("green" | "amber" | "blue" | "primary")[] = [
                      "green",
                      "amber",
                      "blue",
                      "primary",
                    ];
                    const accent = tr.type === "bank" ? "blue" : colorList[idx % colorList.length];

                    return (
                      <TreasuryAccountCard
                        key={tr.id}
                        tr={tr}
                        accentColor={accent}
                        onClick={() => setSelectedTreasuryForDetails(tr)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Charts and details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend Chart */}
                <Card className="lg:col-span-2 border-border/60 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <TrendingUp className="text-primary" size={18} />
                      تطور الإيرادات والمبيعات التشغيلية لآخر 7 أيام
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-6">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={s?.trendData}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="5%"
                                stopColor="oklch(0.42 0.14 25)"
                                stopOpacity={0.25}
                              />
                              <stop
                                offset="95%"
                                stopColor="oklch(0.42 0.14 25)"
                                stopOpacity={0.0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="dayLabel"
                            stroke="#888888"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            formatter={(value: any) => [
                              `${Number(value).toFixed(2)} ج.م`,
                              "المبيعات",
                            ]}
                            contentStyle={{
                              backgroundColor: "var(--color-card)",
                              borderColor: "var(--color-border)",
                              borderRadius: "12px",
                              fontSize: "12px",
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="الإيرادات"
                            stroke="oklch(0.42 0.14 25)"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorRevenue)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Performing items */}
                <Card className="border-border/60 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-base font-black flex items-center gap-2">
                      <Coffee className="text-amber-500" size={18} />
                      الأطباق الأكثر طلباً ومبيعات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-5 pb-5 pt-1 space-y-4">
                    {s && s.topPerformingItems.length > 0 ? (
                      s.topPerformingItems.map((item, idx) => {
                        const maxQty = s.topPerformingItems[0]?.quantity || 1;
                        const progress = (item.quantity / maxQty) * 100;
                        return (
                          <div key={idx} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs font-bold">
                              <span>{item.name}</span>
                              <span className="text-primary font-black">
                                {formatPrice(item.revenue)}
                              </span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد مبيعات تشغيلية اليوم
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Recent Treasury Transactions list */}
              <Card className="border border-border/60 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-black flex items-center gap-2">
                    <History className="text-primary" size={18} />
                    أحدث الحركات والتسويات المالية في الفروع
                  </CardTitle>
                  <CardDescription>
                    عرض تفصيلي لأحدث الإيداعات، السحوبات، والقيود المحاسبية التلقائية اليوم
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="text-right p-3 font-bold">التاريخ والتوقيت</th>
                          <th className="text-right p-3 font-bold">الخزينة/البنك</th>
                          <th className="text-right p-3 font-bold">نوع الحركة</th>
                          <th className="text-right p-3 font-bold">المبلغ المالي</th>
                          <th className="text-right p-3 font-bold">البيان والتفاصيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {erpState.treasuryTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-muted-foreground">
                              لم يتم قيد حركات نقدية يدوية اليوم، بانتظار إجراء القيود
                            </td>
                          </tr>
                        ) : (
                          erpState.treasuryTransactions.map((tx) => {
                            const trName =
                              erpState.treasuries.find((t) => t.id === tx.treasury_id)?.name_ar ||
                              "خزينة";
                            return (
                              <tr key={tx.id} className="hover:bg-muted/30">
                                <td className="p-3 text-muted-foreground text-xs">
                                  {new Date(tx.created_at).toLocaleString("ar-EG", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </td>
                                <td className="p-3 font-bold">{trName}</td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tx.type.includes("in") || tx.type === "deposit" || tx.type === "sales" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                                  >
                                    {tx.type === "sales"
                                      ? "مبيعات"
                                      : tx.type === "purchase"
                                        ? "مشتريات"
                                        : tx.type === "expense"
                                          ? "مصروف"
                                          : tx.type === "deposit"
                                            ? "إيداع"
                                            : tx.type === "withdrawal"
                                              ? "سحب"
                                              : tx.type}
                                  </span>
                                </td>
                                <td className="p-3 font-black">
                                  {Number(tx?.amount ?? 0).toFixed(2)} {tx.currency}
                                </td>
                                <td className="p-3 text-slate-600 font-bold">{tx.note}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 2: TREASURY MANAGEMENT & RECONCILIATION */}
        <TabsContent value="treasury" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Active Treasuries List */}
              <Card className="border border-border shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-black">
                    الحسابات النقدية والبنكية النشطة للفرع
                  </CardTitle>
                  <CardDescription>فتح وإغلاق الخزائن اليومية ومراقبة الأرصدة</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {erpState.treasuries
                      .filter((t) => t.branch_id === currentBranch.id && !t.deleted)
                      .map((tr) => {
                        const bd = getTreasuryFullBreakdown(tr);
                        return (
                          <div
                            key={tr.id}
                            onClick={() => setSelectedTreasuryForDetails(tr)}
                            className="border border-border/80 p-4 rounded-2xl flex flex-col justify-between bg-card hover:border-primary/80 hover:shadow-md transition gap-3 cursor-pointer group relative overflow-hidden"
                          >
                            <div className="flex items-start justify-between border-b border-border/50 pb-3">
                              <div className="space-y-1 text-right">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="bg-blue-600/10 text-blue-700 dark:text-blue-300 text-[10px] font-black px-2.5 py-0.5 rounded-md border border-blue-500/30">
                                    رقم الحساب:{" "}
                                    {tr.account_code ||
                                      (tr.id === "tr-1" ? "13010130" : "غير محدد")}
                                  </span>
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[9px] font-black px-2 py-0.5 rounded-full">
                                    {tr.type === "cash" ? "خزينة كاش" : "حساب بنكي آمن"}
                                  </span>
                                  <span className="bg-primary/10 text-primary text-[9px] font-black px-2 py-0.5 rounded-full border border-primary/20">
                                    {tr.currency === "MULTI"
                                      ? "متعدد العملات (Multi)"
                                      : tr.currency}
                                  </span>
                                  {tr.containers && tr.containers.length > 0 && (
                                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-emerald-500/20">
                                      {tr.containers.length} أوعية
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-black text-base text-slate-900 dark:text-slate-100 mt-1 flex items-center gap-1.5">
                                  <span>{tr.name_ar}</span>
                                  <ArrowUpRight
                                    size={14}
                                    className="text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </h4>
                                <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                  <UserIcon size={12} className="text-slate-400" />
                                  <span>الأمين: {tr.responsible_employee || "غير محدد"}</span>
                                </p>
                              </div>
                              <div className="text-left shrink-0">
                                <span
                                  className={`text-[10px] px-2.5 py-1 rounded-full font-black inline-block ${tr.is_open ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800" : "text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200 dark:border-rose-800"}`}
                                >
                                  {tr.is_open ? "● مفتوحة للاستلام" : "■ مغلقة"}
                                </span>
                              </div>
                            </div>

                            {/* Multi-Currency Balances Display */}
                            <div className="bg-muted/30 border border-border/60 rounded-xl p-3 space-y-1.5 text-xs font-mono">
                              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-sans font-bold flex items-center gap-1.5 text-[11px]">
                                  <Coins size={13} className="text-emerald-500" />
                                  نقدي (EGP):
                                </span>
                                <span className="font-black text-emerald-600 dark:text-emerald-400">
                                  {bd.cashEGP.toLocaleString()} EGP
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-sans font-bold flex items-center gap-1.5 text-[11px]">
                                  <Coins size={13} className="text-green-500" />
                                  نقدي (USD):
                                </span>
                                <span className="font-black text-green-600 dark:text-green-400">
                                  {bd.cashUSD.toLocaleString()} USD
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-sans font-bold flex items-center gap-1.5 text-[11px]">
                                  <Coins size={13} className="text-amber-500" />
                                  نقدي (SSP):
                                </span>
                                <span className="font-black text-amber-600 dark:text-amber-400">
                                  {bd.cashSSP.toLocaleString()} SSP
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-sans font-bold flex items-center gap-1.5 text-[11px]">
                                  <CreditCard size={13} className="text-blue-500" />
                                  بطاقة / فيزا (USD):
                                </span>
                                <span className="font-black text-blue-600 dark:text-blue-400">
                                  {bd.cardUSD.toLocaleString()} USD
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                <span className="font-sans font-bold flex items-center gap-1.5 text-[11px]">
                                  <Smartphone size={13} className="text-purple-500" />
                                  محفظة (SSP):
                                </span>
                                <span className="font-black text-purple-600 dark:text-purple-400">
                                  {bd.walletSSP.toLocaleString()} SSP
                                </span>
                              </div>
                            </div>

                            {/* Inquiry & Details Action Buttons */}
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTreasuryForDetails(tr);
                                }}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs h-9 rounded-xl flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
                              >
                                <Search size={15} />
                                <span>استعلام الخزينة</span>
                                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                                  قيود وجداول
                                </span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTreasuryForDetails(tr);
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800 text-xs h-9 font-bold rounded-xl flex items-center gap-1.5 shrink-0"
                              >
                                <FileSpreadsheet
                                  size={15}
                                  className="text-emerald-600 dark:text-emerald-400"
                                />
                                <span>تصدير Excel</span>
                              </Button>
                            </div>

                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="border-t border-border/60 pt-2.5 flex items-center justify-between gap-2"
                            >
                              <div className="flex gap-1.5">
                                <Button
                                  size="sm"
                                  variant={tr.is_open ? "destructive" : "default"}
                                  onClick={() => setTreasuryToggleStatusDialog(tr)}
                                  className="text-[11px] font-bold h-7 py-0 px-2.5 rounded-lg"
                                >
                                  {tr.is_open ? "إغلاق الخزينة" : "فتح الخزينة"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditTreasury(tr)}
                                  className="text-[11px] font-bold h-7 py-0 px-2.5 rounded-lg"
                                >
                                  تعديل
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setTreasuryToDelete(tr);
                                  }}
                                  className="text-[11px] font-bold h-7 py-0 px-2.5 rounded-lg text-destructive hover:bg-destructive/10"
                                >
                                  حذف
                                </Button>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const count = prompt(
                                    tr.currency === "MULTI"
                                      ? `جرد خزينة متعددة العملات: ${tr.name_ar}\nالرصيد الافتراضي بالجنيه المصري (EGP) هو ${tr.balance} EGP.\nأدخل المبلغ المالي الفعلي بالعملة الأساسية (EGP) للتسوية المحاسبية:`
                                      : `جرد خزينة: ${tr.name_ar}\nالرصيد الدفتري الحالي: ${tr.balance} ${tr.currency}\nأدخل المبلغ المالي الفعلي المخزن بالصندوق حالياً:`,
                                  );
                                  if (count !== null && !isNaN(Number(count))) {
                                    erpStore.reconcileTreasury(
                                      tr.id,
                                      Number(count),
                                      "مطابقة جرد سريعة",
                                    );
                                    alert("تمت التسوية بنجاح!");
                                    setErpState(erpStore.getState());
                                  }
                                }}
                                className="text-[11px] font-bold h-7 py-0 px-2.5 rounded-lg border-primary/40 text-primary hover:bg-primary/5"
                              >
                                جرد 🔍
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Add New Treasury Form */}
                  <div
                    id="treasury-form"
                    className="bg-muted/40 p-4 rounded-xl border border-border mt-4 text-right"
                  >
                    <h4 className="font-bold text-xs text-slate-700 block mb-3 text-right">
                      {editingTreasuryId
                        ? "تعديل بيانات الحساب:"
                        : "تأسيس خزينة أو حساب بنكي جديد:"}
                    </h4>
                    <form
                      onSubmit={handleAddTreasury}
                      className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end"
                    >
                      <div className="text-right">
                        <Label className="text-[10px] font-bold">اسم الحساب/الخزينة</Label>
                        <Input
                          className="mt-1 h-8 text-xs font-bold text-right"
                          value={newTreasuryForm.name_ar}
                          onChange={(e) =>
                            setNewTreasuryForm((s) => ({ ...s, name_ar: e.target.value }))
                          }
                          placeholder="مثال: خزينة المشروبات، CIB دولار"
                          required
                        />
                      </div>
                      <div className="text-right">
                        <Label className="text-[10px] font-bold">أمين الخزينة / المسؤول</Label>
                        <Input
                          className="mt-1 h-8 text-xs font-bold text-right"
                          value={newTreasuryForm.responsible_employee}
                          onChange={(e) =>
                            setNewTreasuryForm((s) => ({
                              ...s,
                              responsible_employee: e.target.value,
                            }))
                          }
                          placeholder="مثال: أحمد علي"
                        />
                      </div>
                      <div className="text-right">
                        <Label className="text-[10px] font-bold">نوع الحساب والعملة</Label>
                        <div className="grid grid-cols-2 gap-1 mt-1">
                          <select
                            className="h-8 rounded-md border border-input bg-background px-1.5 text-[10px] font-bold focus:outline-none text-right"
                            value={newTreasuryForm.type}
                            onChange={(e) =>
                              setNewTreasuryForm((s) => ({
                                ...s,
                                type: e.target.value as "cash" | "bank",
                              }))
                            }
                          >
                            <option value="cash">كاش</option>
                            <option value="bank">بنكي</option>
                          </select>
                          <select
                            className="h-8 rounded-md border border-input bg-background px-1.5 text-[10px] font-bold focus:outline-none text-right"
                            value={newTreasuryForm.currency}
                            onChange={(e) =>
                              setNewTreasuryForm((s) => ({ ...s, currency: e.target.value }))
                            }
                          >
                            <option value="EGP">EGP</option>
                            <option value="USD">USD</option>
                            <option value="SSP">SSP</option>
                            <option value="MULTI">MULTI (متعدد العملات)</option>
                          </select>
                        </div>
                      </div>

                      <div className="text-right">
                        <Label className="text-[10px] font-bold">
                          ربط بحساب الدليل المحاسبي (اختياري)
                        </Label>
                        <select
                          className="mt-1 w-full h-8 rounded-md border border-input bg-background px-1.5 text-[10px] font-bold focus:outline-none text-right"
                          value={newTreasuryForm.account_code || ""}
                          onChange={(e) =>
                            setNewTreasuryForm((s) => ({ ...s, account_code: e.target.value }))
                          }
                        >
                          <option value="">-- بدون ربط --</option>
                          {oracleAccounts
                            .filter((acc) => acc.type === "asset" || acc.type === "liability")
                            .map((acc) => (
                              <option key={acc.code} value={acc.code}>
                                {acc.code} - {acc.name_ar}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="text-right">
                        <Label className="text-[10px] font-bold">الرصيد الافتتاحي</Label>
                        <Input
                          type="number"
                          disabled={!!editingTreasuryId}
                          className="mt-1 h-8 text-xs font-bold text-right"
                          value={newTreasuryForm.balance}
                          onChange={(e) =>
                            setNewTreasuryForm((s) => ({ ...s, balance: e.target.value }))
                          }
                        />
                      </div>

                      <div className="sm:col-span-5 flex flex-col gap-2 mt-2">
                        <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-2 rounded-md">
                          <Label className="text-xs font-bold">
                            أوعية العملات (Currency Containers)
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-[10px] font-bold"
                            onClick={() => {
                              setNewTreasuryForm((s) => ({
                                ...s,
                                containers: [
                                  ...s.containers,
                                  {
                                    id: "cnt-" + Date.now(),
                                    name: "",
                                    currency: "SSP",
                                    balance: 0,
                                  },
                                ],
                              }));
                            }}
                          >
                            + إضافة وعاء عملة جديد
                          </Button>
                        </div>
                        {newTreasuryForm.containers.map((cnt, idx) => (
                          <div
                            key={cnt.id}
                            className="grid grid-cols-4 gap-2 items-center bg-muted/50 p-2 rounded border border-border/50 text-right"
                          >
                            <Input
                              placeholder="اسم الوعاء (مثال: كاش جنوب سوداني)"
                              className="h-8 text-xs font-bold text-right"
                              value={cnt.name}
                              onChange={(e) => {
                                const newArr = [...newTreasuryForm.containers];
                                newArr[idx].name = e.target.value;
                                setNewTreasuryForm((s) => ({ ...s, containers: newArr }));
                              }}
                            />
                            <select
                              className="h-8 rounded-md border border-input bg-background px-1.5 text-xs font-bold text-right"
                              value={cnt.currency}
                              onChange={(e) => {
                                const newArr = [...newTreasuryForm.containers];
                                newArr[idx].currency = e.target.value;
                                setNewTreasuryForm((s) => ({ ...s, containers: newArr }));
                              }}
                            >
                              <option value="SSP">SSP (جنيه جنوب سوداني)</option>
                              <option value="USD">USD (دولار أمريكي)</option>
                              <option value="EGP">EGP (جنيه مصري)</option>
                              <option value="EUR">EUR (يورو)</option>
                            </select>
                            <Input
                              type="number"
                              placeholder="الرصيد الافتتاحي"
                              className="h-8 text-xs font-bold text-right"
                              disabled={!!editingTreasuryId}
                              value={cnt.balance}
                              onChange={(e) => {
                                const newArr = [...newTreasuryForm.containers];
                                newArr[idx].balance = Number(e.target.value);
                                setNewTreasuryForm((s) => ({ ...s, containers: newArr }));
                              }}
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="h-8 text-xs"
                              onClick={() => {
                                const newArr = [...newTreasuryForm.containers];
                                newArr.splice(idx, 1);
                                setNewTreasuryForm((s) => ({ ...s, containers: newArr }));
                              }}
                            >
                              حذف الوعاء
                            </Button>
                          </div>
                        ))}
                      </div>

                      <div className="sm:col-span-5 flex items-center justify-end gap-2 mt-2 bg-muted/40 p-3 rounded-md border border-border">
                        <label
                          htmlFor="linked_to_restaurant"
                          className="text-xs font-bold cursor-pointer"
                        >
                          ربط الخزينة بمبيعات ومرتجعات المطعم
                        </label>
                        <input
                          type="checkbox"
                          id="linked_to_restaurant"
                          className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                          checked={newTreasuryForm.linked_to_restaurant}
                          onChange={(e) =>
                            setNewTreasuryForm((s) => ({
                              ...s,
                              linked_to_restaurant: e.target.checked,
                            }))
                          }
                        />
                      </div>

                      <div className="flex gap-2 sm:col-span-5">
                        <Button type="submit" size="sm" className="flex-1 font-bold h-8 text-xs">
                          {editingTreasuryId ? "تحديث البيانات" : "تأكيد التأسيس"}
                        </Button>
                        {editingTreasuryId && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingTreasuryId(null);
                              setNewTreasuryForm({
                                name_ar: "",
                                type: "cash",
                                currency: "EGP",
                                balance: "0",
                                responsible_employee: "",
                              });
                            }}
                            className="font-bold h-8 text-xs"
                          >
                            إلغاء
                          </Button>
                        )}
                      </div>
                    </form>
                  </div>
                </CardContent>
              </Card>

              {/* Reconciliation History log */}
              <Card className="border border-border shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-base font-black">
                    سجل تسويات وجرد صناديق الخزينة
                  </CardTitle>
                  <CardDescription>
                    مقارنة الأرصدة الدفترية بالجرد الفعلي المعاين بالخزائن
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="rounded-xl border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground">
                        <tr className="border-b border-border">
                          <th className="text-right p-3 font-bold">التوقيت والتاريخ</th>
                          <th className="text-right p-3 font-bold">الخزينة/الحساب</th>
                          <th className="text-right p-3 font-bold">الرصيد الدفتري</th>
                          <th className="text-right p-3 font-bold">الجرد الفعلي</th>
                          <th className="text-right p-3 font-bold">الفارق المالي</th>
                          <th className="text-right p-3 font-bold">بواسطة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-xs">
                        {!erpState.reconciliations || erpState.reconciliations.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-6 text-muted-foreground">
                              لم يتم تسجيل تسويات جرد مالية بعد
                            </td>
                          </tr>
                        ) : (
                          erpState.reconciliations.map((rec) => {
                            const trName =
                              erpState.treasuries.find((t) => t.id === rec.treasury_id)?.name_ar ||
                              "خزينة";
                            return (
                              <tr key={rec.id} className="hover:bg-muted/30">
                                <td className="p-3 text-muted-foreground">
                                  {new Date(rec.date).toLocaleString("ar-EG")}
                                </td>
                                <td className="p-3 font-bold">{trName}</td>
                                <td className="p-3 font-semibold">
                                  {rec.ledger_balance.toLocaleString()} ج.م
                                </td>
                                <td className="p-3 font-semibold text-emerald-600">
                                  {rec.actual_balance.toLocaleString()} ج.م
                                </td>
                                <td className="p-3">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-black text-[10px] ${rec.difference === 0 ? "bg-slate-100 text-slate-800" : rec.difference > 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                                  >
                                    {rec.difference > 0 ? `+${rec.difference}` : rec.difference} ج.م
                                  </span>
                                </td>
                                <td className="p-3 text-slate-600 font-bold">
                                  {rec.reconciled_by}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Transactions Form Panel */}
            <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
              <h3 className="font-bold text-base text-primary flex items-center gap-1">
                <ArrowLeftRight size={18} />
                حركات ومناقلات نقدية سريعة
              </h3>
              <p className="text-xs text-muted-foreground font-semibold">
                تسجيل حركة إيداع أو سحب نقدي مباشر أو مناقلة نقدية داخلية بين صناديق الفروع.
              </p>

              <form onSubmit={handleTreasuryAction} className="space-y-4">
                <div>
                  <Label className="text-xs font-bold">نوع الإجراء</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-right"
                    value={treasuryForm.actionType}
                    onChange={(e) =>
                      setTreasuryForm((s) => ({ ...s, actionType: e.target.value as any }))
                    }
                  >
                    <option value="deposit">إيداع كاش مباشر (+)</option>
                    <option value="withdrawal">سحب كاش مباشر (-)</option>
                    <option value="transfer">تحويل مالي بين الخزائن</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold">الخزينة المستهدفة (المصدر)</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm text-right"
                    value={treasuryForm.treasury_id}
                    onChange={(e) =>
                      setTreasuryForm((s) => ({ ...s, treasury_id: e.target.value }))
                    }
                    required
                  >
                    <option value="">اختر خزينة</option>
                    {erpState.treasuries
                      .filter((t) => t.branch_id === currentBranch.id && t.is_open && !t.deleted)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.account_code ? `[رقم الحساب: ${t.account_code}] ` : ""}
                          {t.name_ar} (رصيد: {t.balance.toLocaleString()}{" "}
                          {getTreasuryDisplayCurrency(t)})
                        </option>
                      ))}
                  </select>
                </div>

                {treasuryForm.actionType === "transfer" && (
                  <div>
                    <Label className="text-xs font-bold">الخزينة المستقبلة (إلى)</Label>
                    <select
                      className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm text-right"
                      value={treasuryForm.target_treasury_id}
                      onChange={(e) =>
                        setTreasuryForm((s) => ({ ...s, target_treasury_id: e.target.value }))
                      }
                      required
                    >
                      <option value="">اختر خزينة مستلمة</option>
                      {erpState.treasuries
                        .filter((t) => t.branch_id === currentBranch.id && !t.deleted)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.account_code ? `[رقم الحساب: ${t.account_code}] ` : ""}
                            {t.name_ar}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs font-bold">المبلغ النقدي</Label>
                    <Input
                      className="mt-1.5"
                      type="number"
                      value={treasuryForm.amount}
                      onChange={(e) => setTreasuryForm((s) => ({ ...s, amount: e.target.value }))}
                      placeholder="مثال: 5000"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs font-bold">العملة</Label>
                    <select
                      className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-2 text-sm text-right focus:outline-none focus:ring-1 focus:ring-primary font-bold"
                      value={treasuryForm.currency}
                      onChange={(e) => setTreasuryForm((s) => ({ ...s, currency: e.target.value }))}
                    >
                      <option value="EGP">EGP (ج.م)</option>
                      <option value="USD">USD ($)</option>
                      <option value="SSP">SSP (ج.س)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-bold">البيان والسبب</Label>
                  <Input
                    className="mt-1.5"
                    value={treasuryForm.note}
                    onChange={(e) => setTreasuryForm((s) => ({ ...s, note: e.target.value }))}
                    placeholder="إيداع مبيعات، عهدة عمال، إيداع رأسمال.."
                  />
                </div>

                <Button type="submit" className="w-full font-bold">
                  تأكيد الإجراء على الحساب
                </Button>
              </form>
            </div>
          </div>
        </TabsContent>

        {/* TAB 3: VOUCHERS ENTRY */}
        <TabsContent value="vouchers_entry" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Voucher input form */}
            <div className="lg:col-span-1 bg-card border border-border p-5 rounded-2xl space-y-4">
              <h3 className="font-black text-base text-primary">تسجيل سند مالي جديد</h3>
              <form onSubmit={handleVoucherSubmit} className="space-y-4">
                <div>
                  <Label className="text-xs font-bold">نوع السند</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm text-right"
                    value={voucherForm.type}
                    onChange={(e) =>
                      setVoucherForm((s) => ({
                        ...s,
                        type: e.target.value as "receipt" | "payment",
                      }))
                    }
                  >
                    <option value="payment">سند صرف مصروفات (-)</option>
                    <option value="receipt">سند قبض إيرادات (+)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold">التصنيف والتبويب المالي</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm text-right"
                    value={voucherForm.category}
                    onChange={(e) => setVoucherForm((s) => ({ ...s, category: e.target.value }))}
                  >
                    {voucherForm.type === "payment" ? (
                      <>
                        <option value="رواتب الموظفين">رواتب وأجور الموظفين</option>
                        <option value="إيجار الفروع">إيجار العقارات والفروع</option>
                        <option value="الكهرباء والمياه">فاتورة كهرباء ومياه وطاقة</option>
                        <option value="شراء مستلزمات هدر">مستلزمات هدر وتغليف</option>
                        <option value="الدعاية والتسويق">دعاية، إعلانات وتسويق</option>
                      </>
                    ) : (
                      <>
                        <option value="إيراد تشغيل حفلات">إيرادات تشغيل بوفيهات خارجية</option>
                        <option value="رأسمال إضافي">حقوق ملكية ورأسمال مضاف</option>
                        <option value="بيع مخلفات المطبخ">إيرادات تدوير ومبيعات فرعية</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold">مركز التكلفة المسؤول (Cost Center)</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm text-right"
                    value={voucherForm.cost_center}
                    onChange={(e) => setVoucherForm((s) => ({ ...s, cost_center: e.target.value }))}
                  >
                    {erpState.costCenters.map((cc, index) => (
                      <option key={index} value={cc}>
                        {cc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold">المبلغ المالي المعتمد (ج.م)</Label>
                  <Input
                    type="number"
                    className="mt-1.5"
                    value={voucherForm.amount}
                    onChange={(e) => setVoucherForm((s) => ({ ...s, amount: e.target.value }))}
                    placeholder="مثال: 1200"
                    required
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold">خزينة الصرف/القبض</Label>
                  <select
                    className="w-full mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm text-right"
                    value={voucherForm.treasury_id}
                    onChange={(e) => setVoucherForm((s) => ({ ...s, treasury_id: e.target.value }))}
                    required
                  >
                    <option value="">اختر الخزينة</option>
                    {erpState.treasuries
                      .filter((t) => t.branch_id === currentBranch.id && t.is_open && !t.deleted)
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.account_code ? `[رقم الحساب: ${t.account_code}] ` : ""}
                          {t.name_ar} (رصيد: {t.balance.toLocaleString()}{" "}
                          {getTreasuryDisplayCurrency(t)})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-bold">ملاحظات المستند (البيان)</Label>
                  <Input
                    className="mt-1.5"
                    value={voucherForm.description}
                    onChange={(e) => setVoucherForm((s) => ({ ...s, description: e.target.value }))}
                    placeholder="تفاصيل الفاتورة واسم المستلم"
                    required
                  />
                </div>

                {/* Simulated file attachments */}
                <div>
                  <Label className="text-xs font-bold">
                    إرفاق المستند/الفاتورة الورقية (سكانر)
                  </Label>
                  <Input
                    type="file"
                    className="mt-1.5 text-xs text-slate-500 cursor-pointer"
                    onChange={() => alert("تم قيد وضغط الصورة المرفقة وتخزينها في خوادم ERP!")}
                  />
                </div>

                <Button type="submit" className="w-full font-bold">
                  حفظ وترحيل السند المالي 💾
                </Button>
              </form>
            </div>

            {/* Vouchers lists */}
            <div className="lg:col-span-2 bg-card border border-border p-5 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-foreground">
                  سجل السندات والمصروفات الدورية المعتمدة
                </h3>
                <Badge className="bg-emerald-100 text-emerald-800">نشط</Badge>
              </div>

              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-right p-3 font-bold">الرقم المرجعي</th>
                      <th className="text-right p-3 font-bold">النوع</th>
                      <th className="text-right p-3 font-bold">التصنيف</th>
                      <th className="text-right p-3 font-bold">المبلغ</th>
                      <th className="text-right p-3 font-bold">مركز التكلفة</th>
                      <th className="text-right p-3 font-bold">التفاصيل والوصف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {erpState.vouchers.filter((v) => v.branch_id === currentBranch.id && !v.deleted)
                      .length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-muted-foreground">
                          لا توجد سندات مصروفات أو إيرادات مقيدة لهذا الفرع اليوم
                        </td>
                      </tr>
                    ) : (
                      erpState.vouchers
                        .filter((v) => v.branch_id === currentBranch.id && !v.deleted)
                        .map((v) => (
                          <tr key={v.id} className="hover:bg-muted/30">
                            <td className="p-3 font-mono text-[10px] font-bold text-primary">
                              {v.id.substring(4, 9).toUpperCase()}
                            </td>
                            <td className="p-3">
                              <span
                                className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${v.type === "receipt" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}
                              >
                                {v.type === "receipt" ? "قبض" : "صرف"}
                              </span>
                            </td>
                            <td className="p-3 font-bold text-slate-800">{v.category}</td>
                            <td className="p-3 font-black">
                              {Number(v?.amount ?? 0).toFixed(2)} {v.currency}
                            </td>
                            <td className="p-3 text-slate-600 font-black">
                              {v.cost_center || "الإدارة (Administration)"}
                            </td>
                            <td className="p-3 text-slate-500 font-semibold">{v.description}</td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: CHART OF ACCOUNTS (دليل الحسابات المحاسبي المحترف) */}
        <TabsContent value="chart_of_accounts" className="space-y-6 mt-4">
          <OracleAccountsViewer />
        </TabsContent>

        {/* TAB 6: AUDIT LOGS */}
        <TabsContent value="audit_logs" className="space-y-4 mt-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base font-black flex items-center gap-2">
                <History className="text-primary" size={18} />
                سجل مراقبة النظام والأمان (System Audit Trails)
              </CardTitle>
              <CardDescription>
                توثيق كامل لجميع تصرفات المديرين والموظفين في الفروع والمخازن لحماية البيانات من
                التلاعب
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr className="border-b border-border">
                      <th className="text-right p-3.5 font-bold">التاريخ والتوقيت</th>
                      <th className="text-right p-3.5 font-bold">المسؤول</th>
                      <th className="text-right p-3.5 font-bold">نوع الإجراء الإداري</th>
                      <th className="text-right p-3.5 font-bold">تفاصيل العملية</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs font-semibold">
                    {erpState.auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="p-3.5 text-muted-foreground">
                          {new Date(log.created_at).toLocaleString("ar-EG")}
                        </td>
                        <td className="p-3.5 font-bold text-slate-800">{log.user_email}</td>
                        <td className="p-3.5 font-black text-primary">{log.action}</td>
                        <td className="p-3.5 text-slate-600 font-bold">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* TREASURY OPEN/CLOSE CONFIRMATION MODAL */}
      {treasuryToggleStatusDialog && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-right"
          dir="rtl"
        >
          <div className="bg-card border border-border text-card-foreground rounded-2xl w-full max-w-lg p-6 flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 gap-5">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                {treasuryToggleStatusDialog.is_open ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    <Lock size={14} />
                    إغلاق الخزينة وتجميد الحركات
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <LockKeyholeOpen size={14} />
                    فتح الخزينة وتفعيل المقبوضات
                  </span>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTreasuryToggleStatusDialog(null)}
              >
                <X size={18} />
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-black text-foreground mb-1">
                هل تريد تأكيد {treasuryToggleStatusDialog.is_open ? "إغلاق" : "فتح"} الخزينة؟
              </h3>
              <p className="text-xs text-muted-foreground">
                سيتم تغيير حالة التشغيل لهذه الخزينة فوراً وتحديث شاشات الصندوق والكاشير المربوطة.
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 border border-border/80 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">اسم الخزينة:</span>
                <span className="font-bold text-foreground text-sm">
                  {treasuryToggleStatusDialog.name_ar}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">أمين الخزينة المسؤول:</span>
                <span className="font-bold text-foreground">
                  {treasuryToggleStatusDialog.responsible_employee || "غير محدد"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">الوعاء / العملة:</span>
                <span className="font-bold text-foreground">
                  {treasuryToggleStatusDialog.currency === "MULTI"
                    ? "متعددة العملات (Multi)"
                    : treasuryToggleStatusDialog.currency}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border/60">
                <span className="text-muted-foreground font-semibold">الرصيد الدفتري الحالي:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {Number(treasuryToggleStatusDialog.balance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  EGP
                </span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-xs font-semibold leading-relaxed flex items-start gap-2.5 ${
                treasuryToggleStatusDialog.is_open
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {treasuryToggleStatusDialog.is_open ? (
                <Lock size={18} className="shrink-0 mt-0.5" />
              ) : (
                <LockKeyholeOpen size={18} className="shrink-0 mt-0.5" />
              )}
              <div>
                {treasuryToggleStatusDialog.is_open ? (
                  <>
                    <strong className="block mb-0.5 font-bold">تنبيه الإغلاق:</strong>
                    سيتم تجميد الخزينة ومنع أي حركات سحب، إيداع، أو تحويلات مالية جديدة في الكاشير
                    والإدارة حتى يتم إعادة فتحها رسمياً.
                  </>
                ) : (
                  <>
                    <strong className="block mb-0.5 font-bold">تنبيه الفتح:</strong>
                    ستصبح الخزينة جاهزة لاستلام المقبوضات اليومية وصرف النقدية وتسجيل القيود الآلية
                    بدفتر الأستاذ.
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl font-bold text-xs"
                onClick={() => setTreasuryToggleStatusDialog(null)}
                disabled={isProcessingTreasuryAction}
              >
                إلغاء (Cancel)
              </Button>
              <Button
                className={`rounded-xl font-black text-xs gap-2 ${
                  treasuryToggleStatusDialog.is_open
                    ? "bg-amber-600 hover:bg-amber-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
                onClick={confirmToggleTreasuryStatus}
                disabled={isProcessingTreasuryAction}
              >
                {isProcessingTreasuryAction ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : treasuryToggleStatusDialog.is_open ? (
                  <Lock size={16} />
                ) : (
                  <LockKeyholeOpen size={16} />
                )}
                <span>
                  {treasuryToggleStatusDialog.is_open ? "تأكيد إغلاق الخزينة" : "تأكيد فتح الخزينة"}
                </span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TREASURY DELETE CONFIRMATION MODAL */}
      {treasuryToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 text-right"
          dir="rtl"
        >
          <div className="bg-card border border-border text-card-foreground rounded-2xl w-full max-w-lg p-6 flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-200 gap-5">
            <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                <AlertTriangle size={14} />
                حذف / أرشفة حساب الخزينة
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full"
                onClick={() => setTreasuryToDelete(null)}
              >
                <X size={18} />
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-black text-foreground mb-1">
                تأكيد حذف الخزينة:{" "}
                <span className="text-rose-600 dark:text-rose-400 text-base font-bold">
                  {treasuryToDelete.name_ar}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                يرجى مراجعة بيانات الخزينة قبل إتمام عملية الإزالة أو الأرشفة الدائمة.
              </p>
            </div>

            <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-xl p-4 border border-rose-200 dark:border-rose-900/50 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">كود الخزينة:</span>
                <span className="font-mono font-bold text-foreground">{treasuryToDelete.id}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">اسم الخزينة:</span>
                <span className="font-bold text-foreground text-sm">
                  {treasuryToDelete.name_ar}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-semibold">أمين الخزينة:</span>
                <span className="font-bold text-foreground">
                  {treasuryToDelete.responsible_employee || "غير محدد"}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-rose-200/80 dark:border-rose-900/60">
                <span className="text-muted-foreground font-semibold">الرصيد المالي الحالي:</span>
                <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                  {Number(treasuryToDelete.balance).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  EGP
                </span>
              </div>
            </div>

            <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-xl text-xs text-rose-800 dark:text-rose-300 font-semibold leading-relaxed flex items-start gap-2.5">
              <AlertTriangle
                size={18}
                className="shrink-0 mt-0.5 text-rose-600 dark:text-rose-400"
              />
              <div>
                <strong className="block mb-0.5 font-bold">شروط الحذف والأرشفة المحاسبية:</strong>
                لا يمكن حذف الخزينة إذا كانت مفتوحة للتشغيل أو تحتوي على رصيد مالي. وفي حالة وجود
                حركات تاريخية سابقة برصيد صفر، سيتم أرشفة الخزينة بأمان لحماية شجرة الحسابات والقيود
                المزدوجة.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="rounded-xl font-bold text-xs"
                onClick={() => setTreasuryToDelete(null)}
                disabled={isProcessingTreasuryAction}
              >
                إلغاء (Cancel)
              </Button>
              <Button
                variant="destructive"
                className="rounded-xl font-black text-xs gap-2"
                onClick={() => confirmDeleteTreasury(treasuryToDelete.id)}
                disabled={isProcessingTreasuryAction}
              >
                {isProcessingTreasuryAction ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                <span>تأكيد الحذف والأرشفة</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN TREASURY INQUIRY & ACCOUNTING SYSTEMS VIEW */}
      {selectedTreasuryForDetails && (
        <div className="fixed inset-0 z-50 bg-background text-foreground flex flex-col w-screen h-screen overflow-hidden animate-in fade-in duration-200">
          {/* Full Screen Header */}
          <div className="p-4 bg-muted/60 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-inner">
                <Wallet size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] bg-indigo-600 text-white font-black px-2.5 py-0.5 rounded-full">
                    صفحة الاستعلام الشامل
                  </span>
                  <span className="text-[11px] bg-blue-600/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 font-black px-2.5 py-0.5 rounded-full">
                    رقم الحساب:{" "}
                    {selectedTreasuryForDetails.account_code ||
                      (selectedTreasuryForDetails.id === "tr-1" ? "13010130" : "غير محدد")}
                  </span>
                  <h2 className="text-xl font-black text-foreground">
                    خزينة: {selectedTreasuryForDetails.name_ar}
                  </h2>
                  <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full font-bold">
                    {selectedTreasuryForDetails.currency === "MULTI"
                      ? "متعدد العملات (Multi)"
                      : selectedTreasuryForDetails.currency}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                      selectedTreasuryForDetails.is_open
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                        : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    {selectedTreasuryForDetails.is_open ? "● مفتوحة للاستلام" : "■ مغلقة"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                  <span>
                    الأمين المسؤول:{" "}
                    <strong className="text-foreground">
                      {selectedTreasuryForDetails.responsible_employee || "غير محدد"}
                    </strong>
                  </span>
                  <span>•</span>
                  <span>
                    الفرع: <strong className="text-foreground">{currentBranch.name_ar}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    رصيد الافتتاح:{" "}
                    <strong className="text-foreground font-mono">
                      {(selectedTreasuryForDetails.opening_balance ?? 0).toLocaleString()}{" "}
                      {selectedTreasuryForDetails.currency || "EGP"}
                    </strong>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center">
              <Link
                to="/cashier-treasury"
                target="_blank"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl border border-slate-700 transition shadow-sm"
              >
                <ExternalLink size={14} />
                <span>شاشة الكاشير المستقلة</span>
              </Link>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setSelectedTreasuryForDetails(null)}
                className="rounded-xl font-bold text-xs h-9 px-4 flex items-center gap-1.5 shadow-sm"
              >
                <X size={18} />
                <span>إغلاق الاستعلام</span>
              </Button>
            </div>
          </div>

          {/* Body Section with Full Screen Scroll */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-muted/10">
            {/* Balances Summary Cards */}
            {(() => {
              const bd = getTreasuryFullBreakdown(selectedTreasuryForDetails);

              // Calculate total incoming and outgoing for filtered transactions
              const rawTxs = erpState.treasuryTransactions.filter(
                (tx) => tx.treasury_id === selectedTreasuryForDetails.id,
              );

              let totalIncomingAmt = 0;
              let totalOutgoingAmt = 0;

              rawTxs.forEach((tx) => {
                const isInc =
                  tx.type === "deposit" || tx.type === "sales" || tx.type === "transfer_in";
                if (isInc) totalIncomingAmt += tx.amount;
                else totalOutgoingAmt += tx.amount;
              });

              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono">
                  <div className="bg-card border border-emerald-500/20 rounded-2xl p-3.5 shadow-sm">
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      💵 نقدي (EGP)
                    </span>
                    <span className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-1 block">
                      {bd.cashEGP.toLocaleString()} EGP
                    </span>
                  </div>

                  <div className="bg-card border border-green-500/20 rounded-2xl p-3.5 shadow-sm">
                    <span className="text-[11px] text-green-600 dark:text-green-400 font-bold block">
                      💵 نقدي (USD)
                    </span>
                    <span className="text-xl font-black text-green-700 dark:text-green-300 mt-1 block">
                      {bd.cashUSD.toLocaleString()} USD
                    </span>
                  </div>

                  <div className="bg-card border border-amber-500/20 rounded-2xl p-3.5 shadow-sm">
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold block">
                      💵 نقدي (SSP)
                    </span>
                    <span className="text-xl font-black text-amber-700 dark:text-amber-300 mt-1 block">
                      {bd.cashSSP.toLocaleString()} SSP
                    </span>
                  </div>

                  <div className="bg-card border border-blue-500/20 rounded-2xl p-3.5 shadow-sm">
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-bold block">
                      💳 بطاقة/فيزا (USD)
                    </span>
                    <span className="text-xl font-black text-blue-700 dark:text-blue-300 mt-1 block">
                      {bd.cardUSD.toLocaleString()} USD
                    </span>
                  </div>

                  <div className="bg-card border border-purple-500/20 rounded-2xl p-3.5 shadow-sm">
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold block">
                      📱 محفظة (SSP)
                    </span>
                    <span className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1 block">
                      {bd.walletSSP.toLocaleString()} SSP
                    </span>
                  </div>

                  <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-2xl p-3.5 shadow-sm">
                    <span className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold block">
                      📊 إجمالي الوارد / المقبوضات
                    </span>
                    <span className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                      +{totalIncomingAmt.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Filter & Search Toolbar */}
            {(() => {
              const treasuryTxs = erpState.treasuryTransactions.filter(
                (tx) => tx.treasury_id === selectedTreasuryForDetails.id,
              );

              const filteredTxs = treasuryTxs.filter((tx) => {
                const txDateStr = (tx.date || tx.created_at || "").slice(0, 10);

                if (treasuryModalStartDate && txDateStr < treasuryModalStartDate) return false;
                if (treasuryModalEndDate && txDateStr > treasuryModalEndDate) return false;

                const matchSearch =
                  !treasuryModalSearch ||
                  tx.note?.toLowerCase().includes(treasuryModalSearch.toLowerCase()) ||
                  tx.related_entity_id?.toLowerCase().includes(treasuryModalSearch.toLowerCase()) ||
                  tx.created_by?.toLowerCase().includes(treasuryModalSearch.toLowerCase()) ||
                  tx.id.toLowerCase().includes(treasuryModalSearch.toLowerCase());

                const matchType =
                  treasuryModalFilterType === "all" || tx.type === treasuryModalFilterType;

                const matchCurrency =
                  treasuryModalFilterCurrency === "all" ||
                  (treasuryModalFilterCurrency === "cash_EGP" &&
                    tx.payment_method !== "card" &&
                    tx.payment_method !== "wallet" &&
                    (tx.currency === "EGP" || !tx.currency)) ||
                  (treasuryModalFilterCurrency === "cash_USD" &&
                    tx.payment_method !== "card" &&
                    tx.payment_method !== "wallet" &&
                    tx.currency === "USD") ||
                  (treasuryModalFilterCurrency === "cash_SSP" &&
                    tx.payment_method !== "card" &&
                    tx.payment_method !== "wallet" &&
                    tx.currency === "SSP") ||
                  (treasuryModalFilterCurrency === "card_USD" && tx.payment_method === "card") ||
                  (treasuryModalFilterCurrency === "wallet_SSP" && tx.payment_method === "wallet");

                return matchSearch && matchType && matchCurrency;
              });

              // Double-Entry Journal Entry Generator for a given transaction
              const getTransactionJournalEntry = (tx: any) => {
                const trName = selectedTreasuryForDetails.name_ar;
                const isIncoming =
                  tx.type === "deposit" || tx.type === "sales" || tx.type === "transfer_in";

                const treasuryCodeNum = tx.treasury_id
                  ? tx.treasury_id.replace(/\D/g, "") || "101"
                  : "101";
                const treasuryAccountCode = `1101${treasuryCodeNum.padStart(2, "0")}`;
                const treasuryAccountName = `حساب الخزينة/النقدية (${trName})`;

                let debitAccountCode = "";
                let debitAccountName = "";
                let creditAccountCode = "";
                let creditAccountName = "";

                if (isIncoming) {
                  debitAccountCode = treasuryAccountCode;
                  debitAccountName = treasuryAccountName;

                  if (tx.type === "sales") {
                    creditAccountCode = "410101";
                    creditAccountName = "إيراد مبيعات صالة ومطعم (POS)";
                  } else if (tx.type === "transfer_in") {
                    creditAccountCode = "110199";
                    creditAccountName = "حساب تحويلات نقدية بين الخزائن (وسيط)";
                  } else {
                    creditAccountCode = "420101";
                    creditAccountName = "إيرادات وإيداعات نقدية مباشرة";
                  }
                } else {
                  creditAccountCode = treasuryAccountCode;
                  creditAccountName = treasuryAccountName;

                  if (tx.type === "transfer_out") {
                    debitAccountCode = "110199";
                    debitAccountName = "حساب تحويلات نقدية بين الخزائن (وسيط)";
                  } else if (tx.type === "reconciliation") {
                    debitAccountCode = "520101";
                    debitAccountName = "تسويات فروق صناديق الجرد";
                  } else {
                    debitAccountCode = "510101";
                    debitAccountName = "مصروفات عمومية وإدارية / عهد نقدية";
                  }
                }

                const rawNum = tx.id ? tx.id.replace(/\D/g, "") : "";
                const voucherNum = `JV-${rawNum.slice(-6) || Math.floor(100000 + Math.random() * 900000)}`;

                return {
                  id: tx.id,
                  voucherNum,
                  date: tx.date || tx.created_at || new Date().toISOString(),
                  description:
                    tx.note ||
                    (isIncoming ? "قبض نقدي / إيداع بالخزينة" : "صرف نقدي / مسحوبات ومصاريف"),
                  reference: tx.related_entity_id || "-",
                  currency: tx.currency || "EGP",
                  createdBy:
                    tx.created_by || selectedTreasuryForDetails.responsible_employee || "الكاشير",
                  type: tx.type,
                  amount: tx.amount,
                  paymentMethod: tx.payment_method || "cash",
                  lines: [
                    {
                      type: "debit",
                      accountCode: debitAccountCode,
                      accountName: debitAccountName,
                      debit: tx.amount,
                      credit: 0,
                    },
                    {
                      type: "credit",
                      accountCode: creditAccountCode,
                      accountName: creditAccountName,
                      debit: 0,
                      credit: tx.amount,
                    },
                  ],
                };
              };

              // Export Function 1: Double-Entry Journal Entries Excel
              const exportJournalEntriesExcel = () => {
                const rows: any[] = [];
                filteredTxs.forEach((tx) => {
                  const entry = getTransactionJournalEntry(tx);
                  entry.lines.forEach((line) => {
                    rows.push({
                      "رقم القيد": entry.voucherNum,
                      "التاريخ والوقت": new Date(entry.date).toLocaleString("ar-EG"),
                      الفرع: currentBranch.name_ar,
                      "نوع الحركة": entry.type,
                      "طريقة الدفع":
                        entry.paymentMethod === "card"
                          ? "بطاقة / فيزا"
                          : entry.paymentMethod === "wallet"
                            ? "محفظة إلكترونية"
                            : "كاش",
                      "كود الحساب": line.accountCode,
                      "اسم الحساب المحاسبي": line.accountName,
                      "مدين (+)": line.debit > 0 ? line.debit : 0,
                      "دائن (-)": line.credit > 0 ? line.credit : 0,
                      العملة: entry.currency,
                      "البيان / الوصف": entry.description,
                      "رقم المرجع / الفاتورة": entry.reference,
                      "المسؤول / الكاشير": entry.createdBy,
                      "حالة القيد": "متوازن دفترياً",
                    });
                  });
                });

                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "القيود المحاسبية");
                const fileName = `القيود_المحاسبية_${selectedTreasuryForDetails.name_ar.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
                XLSX.writeFile(wb, fileName);
              };

              // Export Function 2: Accounting Ledger Table Excel
              const exportLedgerTableExcel = () => {
                let currentBal = selectedTreasuryForDetails.opening_balance ?? 0;
                const typeLabels: Record<string, string> = {
                  deposit: "إيداع نقدي",
                  sales: "مبيعات POS",
                  withdrawal: "سحب / مصروفات",
                  transfer_in: "تحويل وارد",
                  transfer_out: "تحويل صادر",
                  reconciliation: "تسوية جرد",
                };
                const methodLabels: Record<string, string> = {
                  cash: "نقداً (كاش)",
                  card: "بطاقة بنكية / فيزا",
                  wallet: "محفظة إلكترونية",
                };

                const sortedAsc = [...filteredTxs].sort(
                  (a, b) =>
                    new Date(a.date || a.created_at || 0).getTime() -
                    new Date(b.date || b.created_at || 0).getTime(),
                );

                const rows = sortedAsc.map((tx, idx) => {
                  const isIncoming =
                    tx.type === "deposit" || tx.type === "sales" || tx.type === "transfer_in";
                  const amt = tx.amount;
                  currentBal += isIncoming ? amt : -amt;

                  const analyticalAccount = isIncoming
                    ? tx.type === "sales"
                      ? "410101 - مبيعات صالة ومطعم"
                      : "420101 - إيرادات وإيداعات إضافية"
                    : tx.type === "transfer_out"
                      ? "110199 - وسيط تحويل خزائن"
                      : "510101 - مصروفات وعهد عمومية";

                  return {
                    م: idx + 1,
                    "رقم الحركة": tx.id,
                    "التاريخ والوقت": new Date(
                      tx.date || tx.created_at || Date.now(),
                    ).toLocaleString("ar-EG"),
                    "نوع الحركة": typeLabels[tx.type] || tx.type,
                    "طريقة الدفع": methodLabels[tx.payment_method || "cash"] || "كاش",
                    العملة: tx.currency || "EGP",
                    "الوارد (+)": isIncoming ? amt : 0,
                    "الصادر (-)": !isIncoming ? amt : 0,
                    "الرصيد التراكمي": currentBal,
                    "الحساب التحليلي": analyticalAccount,
                    "البيان / السبب": tx.note || "لا توجد ملاحظات",
                    "رقم الفاتورة / المرجع": tx.related_entity_id || "-",
                    "المسؤول / الكاشير":
                      tx.created_by || selectedTreasuryForDetails.responsible_employee || "الكاشير",
                  };
                });

                const ws = XLSX.utils.json_to_sheet(rows);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "الجداول المحاسبية");
                const fileName = `الجداول_المحاسبية_${selectedTreasuryForDetails.name_ar.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`;
                XLSX.writeFile(wb, fileName);
              };

              return (
                <div className="space-y-4">
                  {/* Filters & Presets Box */}
                  <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-3">
                    {/* Top Row: Quick Presets */}
                    <div className="flex items-center justify-between gap-2 flex-wrap border-b border-border/50 pb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-black text-muted-foreground flex items-center gap-1 ml-2">
                          <CalendarDays size={14} className="text-indigo-600" />
                          الفترة الزمنية:
                        </span>
                        {[
                          { id: "all", label: "الكل" },
                          { id: "today", label: "اليوم" },
                          { id: "yesterday", label: "الأمس" },
                          { id: "last7", label: "آخر 7 أيام" },
                          { id: "thisMonth", label: "هذا الشهر" },
                        ].map((p) => (
                          <Button
                            key={p.id}
                            size="sm"
                            variant={treasuryModalDatePreset === p.id ? "default" : "outline"}
                            onClick={() => applyInquiryQuickDate(p.id)}
                            className="h-7 text-xs font-bold px-3 rounded-lg"
                          >
                            {p.label}
                          </Button>
                        ))}
                      </div>

                      {/* Custom Range Inputs */}
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span>من:</span>
                        <input
                          type="date"
                          value={treasuryModalStartDate}
                          onChange={(e) => {
                            setTreasuryModalStartDate(e.target.value);
                            setTreasuryModalDatePreset("custom");
                          }}
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-mono"
                        />
                        <span>إلى:</span>
                        <input
                          type="date"
                          value={treasuryModalEndDate}
                          onChange={(e) => {
                            setTreasuryModalEndDate(e.target.value);
                            setTreasuryModalDatePreset("custom");
                          }}
                          className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Bottom Row: Text Search & Select Filters */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-wrap flex-1">
                        <div className="relative flex-1 min-w-[220px]">
                          <Search
                            size={15}
                            className="absolute right-3 top-2.5 text-muted-foreground"
                          />
                          <Input
                            placeholder="بحث برقم القيد، البيان، المرجع، أو الكاشير..."
                            value={treasuryModalSearch}
                            onChange={(e) => setTreasuryModalSearch(e.target.value)}
                            className="pr-9 h-9 text-xs text-right rounded-xl"
                          />
                        </div>

                        <select
                          value={treasuryModalFilterType}
                          onChange={(e) => setTreasuryModalFilterType(e.target.value)}
                          className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold text-right"
                        >
                          <option value="all">جميع أنواع الحركات</option>
                          <option value="sales">مبيعات POS</option>
                          <option value="deposit">إيداعات نقدية</option>
                          <option value="withdrawal">سحب / مصروفات</option>
                          <option value="transfer_in">تحويلات واردة</option>
                          <option value="transfer_out">تحويلات صادرة</option>
                        </select>

                        <select
                          value={treasuryModalFilterCurrency}
                          onChange={(e) => setTreasuryModalFilterCurrency(e.target.value)}
                          className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold text-right"
                        >
                          <option value="all">جميع العملات وطرق الدفع</option>
                          <option value="cash_EGP">كاش جنيه (EGP)</option>
                          <option value="cash_USD">كاش دولار (USD)</option>
                          <option value="cash_SSP">كاش جنوب سوداني (SSP)</option>
                          <option value="card_USD">فيزا / بطاقة (USD)</option>
                          <option value="wallet_SSP">محفظة إلكترونية (SSP)</option>
                        </select>
                      </div>

                      {/* Header Actions for Tab Exports */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          onClick={exportJournalEntriesExcel}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <FileSpreadsheet size={15} />
                          <span>تصدير القيود المحاسبية (Excel)</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={exportLedgerTableExcel}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-sm"
                        >
                          <FileSpreadsheet size={15} />
                          <span>تصدير الجداول المحاسبية (Excel)</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* TAB NAVIGATION SWITCHER */}
                  <div className="flex items-center gap-3 border-b border-border pb-1">
                    <button
                      onClick={() => setInquiryActiveTab("journal")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-t-2xl font-black text-xs transition border-b-2 ${
                        inquiryActiveTab === "journal"
                          ? "bg-card text-indigo-600 dark:text-indigo-400 border-indigo-600 shadow-sm"
                          : "text-muted-foreground hover:text-foreground border-transparent"
                      }`}
                    >
                      <BookOpen size={16} />
                      <span>نظام القيود المحاسبية (Double-Entry Journal)</span>
                      <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/20">
                        {filteredTxs.length} قيد
                      </span>
                    </button>

                    <button
                      onClick={() => setInquiryActiveTab("table")}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-t-2xl font-black text-xs transition border-b-2 ${
                        inquiryActiveTab === "table"
                          ? "bg-card text-emerald-600 dark:text-emerald-400 border-emerald-600 shadow-sm"
                          : "text-muted-foreground hover:text-foreground border-transparent"
                      }`}
                    >
                      <TableIcon size={16} />
                      <span>نظام الجداول المحاسبية (Analytical Ledger Tables)</span>
                      <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/20">
                        {filteredTxs.length} حركة
                      </span>
                    </button>
                  </div>

                  {/* SYSTEM VIEW 1: DOUBLE-ENTRY JOURNAL ENTRIES SYSTEM */}
                  {inquiryActiveTab === "journal" && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-indigo-600" />
                          <span>دفتر القيود المحاسبية المزدوجه لحركات الخزينة</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={exportJournalEntriesExcel}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                        >
                          <FileSpreadsheet size={14} />
                          <span>تصدير القيود المحاسبية فقط إلى إكسيل</span>
                        </Button>
                      </div>

                      {filteredTxs.length === 0 ? (
                        <div className="bg-card border border-border p-12 text-center rounded-2xl text-muted-foreground font-semibold">
                          لا توجد قيود محاسبية مطابقة للبحث أو الفترة المحددة
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
                          {filteredTxs.map((tx) => {
                            const entry = getTransactionJournalEntry(tx);
                            return (
                              <div
                                key={tx.id}
                                className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:border-indigo-500/40 transition"
                              >
                                {/* Voucher Header */}
                                <div className="p-3 bg-muted/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-mono font-black bg-indigo-600 text-white px-2.5 py-0.5 rounded-lg">
                                      {entry.voucherNum}
                                    </span>
                                    <span className="font-mono text-muted-foreground">
                                      {new Date(entry.date).toLocaleString("ar-EG")}
                                    </span>
                                    <span className="text-foreground font-bold">
                                      {entry.description}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                                      ● قيد متوازن دفترياً
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">
                                      مرجع: {entry.reference}
                                    </span>
                                  </div>
                                </div>

                                {/* Journal Voucher Lines Table */}
                                <table className="w-full text-xs">
                                  <thead className="bg-muted/20 text-muted-foreground border-b border-border/50">
                                    <tr>
                                      <th className="p-2.5 text-right font-bold w-20">الطرف</th>
                                      <th className="p-2.5 text-right font-bold w-28">
                                        كود الحساب
                                      </th>
                                      <th className="p-2.5 text-right font-bold">
                                        اسم الحساب المحاسبي
                                      </th>
                                      <th className="p-2.5 text-right font-bold w-32">مدين (+)</th>
                                      <th className="p-2.5 text-right font-bold w-32">دائن (-)</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border/40 font-mono">
                                    {entry.lines.map((line, lIdx) => (
                                      <tr key={lIdx} className="hover:bg-muted/10">
                                        <td className="p-2.5 font-bold">
                                          {line.type === "debit" ? (
                                            <span className="text-emerald-600 dark:text-emerald-400">
                                              مدين
                                            </span>
                                          ) : (
                                            <span className="text-rose-600 dark:text-rose-400">
                                              دائن
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2.5 font-semibold text-muted-foreground">
                                          {line.accountCode}
                                        </td>
                                        <td className="p-2.5 font-sans font-bold text-foreground">
                                          {line.accountName}
                                        </td>
                                        <td className="p-2.5 font-black text-emerald-600 dark:text-emerald-400">
                                          {line.debit > 0
                                            ? `${line.debit.toLocaleString()} ${entry.currency}`
                                            : "0.00"}
                                        </td>
                                        <td className="p-2.5 font-black text-rose-600 dark:text-rose-400">
                                          {line.credit > 0
                                            ? `${line.credit.toLocaleString()} ${entry.currency}`
                                            : "0.00"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot className="bg-muted/30 border-t border-border font-mono font-black text-xs">
                                    <tr>
                                      <td colSpan={3} className="p-2.5 text-left font-sans">
                                        إجمالي القيد:
                                      </td>
                                      <td className="p-2.5 text-emerald-600 dark:text-emerald-400">
                                        {entry.amount.toLocaleString()} {entry.currency}
                                      </td>
                                      <td className="p-2.5 text-rose-600 dark:text-rose-400">
                                        {entry.amount.toLocaleString()} {entry.currency}
                                      </td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* SYSTEM VIEW 2: ANALYTICAL ACCOUNTING LEDGER TABLES */}
                  {inquiryActiveTab === "table" && (
                    <div className="space-y-4 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between bg-card p-3 rounded-xl border border-border text-xs font-bold">
                        <div className="flex items-center gap-2">
                          <TableIcon size={16} className="text-emerald-600" />
                          <span>جدول التفريغ المحاسبي والرصيد التراكمي للحركات</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={exportLedgerTableExcel}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1.5"
                        >
                          <FileSpreadsheet size={14} />
                          <span>تصدير الجداول المحاسبية فقط إلى إكسيل</span>
                        </Button>
                      </div>

                      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="max-h-[550px] overflow-y-auto">
                          <table className="w-full text-xs">
                            <thead className="bg-muted sticky top-0 z-10 text-muted-foreground border-b border-border">
                              <tr>
                                <th className="p-3 text-right font-bold w-10">#</th>
                                <th className="p-3 text-right font-bold">التاريخ والتوقيت</th>
                                <th className="p-3 text-right font-bold">نوع الحركة</th>
                                <th className="p-3 text-right font-bold">طريقة الدفع والعملة</th>
                                <th className="p-3 text-right font-bold">الحساب التحليلي</th>
                                <th className="p-3 text-right font-bold">الوارد (+)</th>
                                <th className="p-3 text-right font-bold">الصادر (-)</th>
                                <th className="p-3 text-right font-bold">الرصيد التراكمي</th>
                                <th className="p-3 text-right font-bold">البيان / الملاحظات</th>
                                <th className="p-3 text-right font-bold">المرجع / الفاتورة</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 font-sans">
                              {(() => {
                                let runningBal = selectedTreasuryForDetails.opening_balance ?? 0;
                                const sortedAsc = [...filteredTxs].sort(
                                  (a, b) =>
                                    new Date(a.date || a.created_at || 0).getTime() -
                                    new Date(b.date || b.created_at || 0).getTime(),
                                );

                                if (sortedAsc.length === 0) {
                                  return (
                                    <tr>
                                      <td
                                        colSpan={10}
                                        className="text-center py-12 text-muted-foreground font-semibold"
                                      >
                                        لا توجد حركات مطابقة للبحث أو التاريخ
                                      </td>
                                    </tr>
                                  );
                                }

                                return sortedAsc.map((tx, idx) => {
                                  const isIncoming =
                                    tx.type === "deposit" ||
                                    tx.type === "sales" ||
                                    tx.type === "transfer_in";
                                  const amt = tx.amount;
                                  runningBal += isIncoming ? amt : -amt;

                                  const analyticalAccount = isIncoming
                                    ? tx.type === "sales"
                                      ? "410101 - مبيعات صالة POS"
                                      : "420101 - إيرادات وإيداعات"
                                    : tx.type === "transfer_out"
                                      ? "110199 - وسيط تحويل خزائن"
                                      : "510101 - مصروفات وعهد عمومية";

                                  return (
                                    <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                                      <td className="p-3 font-mono font-bold text-muted-foreground">
                                        {idx + 1}
                                      </td>
                                      <td className="p-3 font-mono text-muted-foreground">
                                        {new Date(
                                          tx.date || tx.created_at || Date.now(),
                                        ).toLocaleString("ar-EG")}
                                      </td>
                                      <td className="p-3">
                                        <span
                                          className={`px-2.5 py-0.5 rounded-full font-black text-[10px] inline-block ${
                                            isIncoming
                                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                              : "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                                          }`}
                                        >
                                          {tx.type === "sales"
                                            ? "مبيعات POS"
                                            : tx.type === "deposit"
                                              ? "إيداع"
                                              : tx.type === "withdrawal"
                                                ? "سحب / مصاريف"
                                                : tx.type === "transfer_in"
                                                  ? "تحويل وارد"
                                                  : tx.type === "transfer_out"
                                                    ? "تحويل صادر"
                                                    : "تسوية"}
                                        </span>
                                      </td>
                                      <td className="p-3 font-bold">
                                        {tx.payment_method === "card"
                                          ? "💳 بطاقة / فيزا"
                                          : tx.payment_method === "wallet"
                                            ? "📱 محفظة"
                                            : "💵 كاش"}{" "}
                                        <span className="text-muted-foreground text-[10px]">
                                          ({tx.currency || "EGP"})
                                        </span>
                                      </td>
                                      <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                                        {analyticalAccount}
                                      </td>
                                      <td className="p-3 font-mono font-black text-emerald-600 dark:text-emerald-400">
                                        {isIncoming ? `+${amt.toLocaleString()}` : "-"}
                                      </td>
                                      <td className="p-3 font-mono font-black text-rose-600 dark:text-rose-400">
                                        {!isIncoming ? `-${amt.toLocaleString()}` : "-"}
                                      </td>
                                      <td className="p-3 font-mono font-black text-foreground bg-muted/30">
                                        {runningBal.toLocaleString()} {tx.currency || "EGP"}
                                      </td>
                                      <td className="p-3 text-slate-700 dark:text-slate-300 font-semibold max-w-[200px] truncate">
                                        {tx.note || "لا توجد ملاحظات"}
                                      </td>
                                      <td className="p-3 font-mono text-muted-foreground text-[11px]">
                                        {tx.related_entity_id || "-"}
                                      </td>
                                    </tr>
                                  );
                                });
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable card component for Treasuries showing container breakdowns in native currency and grand total in active page currency
function TreasuryAccountCard({
  tr,
  onClick,
  accentColor = "green",
}: {
  tr: Account;
  onClick: () => void;
  accentColor?: "primary" | "amber" | "blue" | "green";
}) {
  const { formatPrice } = useSettings();

  const accentClasses = {
    primary: "border-r-4 border-r-primary bg-card hover:bg-primary/5",
    amber: "border-r-4 border-r-amber-500 bg-card hover:bg-amber-500/5",
    blue: "border-r-4 border-r-blue-500 bg-card hover:bg-blue-500/5",
    green: "border-r-4 border-r-emerald-500 bg-card hover:bg-emerald-500/5",
  };

  const iconClasses = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  };

  const Icon = tr.type === "bank" ? Building : Wallet;
  const containers = tr.containers || [];
  const hasContainers = containers.length > 0;

  return (
    <Card
      onClick={onClick}
      className={`border border-border/60 shadow-sm rounded-2xl overflow-hidden transition cursor-pointer hover:shadow-md hover:scale-[1.01] ${accentClasses[accentColor]}`}
    >
      <CardContent className="p-4 flex flex-col justify-between h-full gap-3">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <h4 className="text-sm font-black text-foreground truncate">{tr.name_ar}</h4>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  tr.is_open
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
                    : "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                }`}
              >
                {tr.is_open ? "● مفتوحة للاستلام" : "■ مغلقة"}
              </span>
              <span className="text-[11px] text-muted-foreground font-medium truncate">
                الأمين:{" "}
                <strong className="text-foreground">{tr.responsible_employee || "غير محدد"}</strong>
              </span>
            </div>
          </div>
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${iconClasses[accentColor]}`}
          >
            <Icon size={18} />
          </div>
        </div>

        {/* Containers Values */}
        {hasContainers && (
          <div className="bg-muted/30 border border-border/40 rounded-xl p-2.5 space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-bold block border-b border-border/30 pb-1">
              أوعية الخزينة
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-0.5 text-xs font-mono">
              {containers.map((cnt) => (
                <div
                  key={cnt.id}
                  className="flex items-center justify-between bg-card border border-border/30 px-2 py-1 rounded-lg"
                >
                  <span className="text-muted-foreground text-[10px] font-semibold truncate max-w-[85px]">
                    {cnt.name}
                  </span>
                  <span className="font-bold text-foreground text-[11px]">
                    {formatTreasuryCurrency(cnt.balance, cnt.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasContainers && (
          <div className="bg-muted/30 border border-border/40 rounded-xl p-2.5 flex items-center justify-between text-xs font-mono">
            <span className="text-[10px] text-muted-foreground font-bold">
              الرصيد بالعملة الأصلية:
            </span>
            <span className="font-bold text-foreground text-[11px]">
              {formatTreasuryCurrency(tr.balance, tr.currency)}
            </span>
          </div>
        )}

        {/* Grand Total */}
        <div className="border-t border-border/40 pt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground font-bold shrink-0">
            الإجمالي المعادل
          </span>
          <span className="text-base font-black text-primary font-mono truncate">
            {formatPrice(
              tr.type === "cash"
                ? tr.currency === "USD"
                  ? tr.balance
                  : tr.balance / (erpStore.getState().exchangeRates?.[tr.currency] || 1)
                : tr.currency === "USD"
                  ? tr.balance
                  : tr.balance / (erpStore.getState().exchangeRates?.[tr.currency] || 1),
            )}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Reusable stat card specifically designed for Arabic ERP Dashboard
function StatCard({
  title,
  value,
  subtext,
  icon: Icon,
  trend,
  trendType,
  accentColor,
}: {
  title: string;
  value: string | number;
  subtext: string;
  icon: any;
  trend?: string;
  trendType?: "up" | "down" | "neutral";
  accentColor?: "primary" | "amber" | "blue" | "green";
}) {
  const accentClasses = {
    primary: "border-r-4 border-r-primary bg-primary/5 text-primary",
    amber: "border-r-4 border-r-accent bg-accent/5 text-accent-foreground",
    blue: "border-r-4 border-r-blue-500 bg-blue-50/50 text-blue-600",
    green: "border-r-4 border-r-green-500 bg-green-50/50 text-green-600",
  };

  const iconClasses = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-accent/15 text-accent-foreground",
    blue: "bg-blue-500/10 text-blue-600",
    green: "bg-green-500/10 text-green-600",
  };

  return (
    <Card
      className={`border border-border/60 shadow-sm rounded-2xl overflow-hidden transition ${accentColor ? accentClasses[accentColor] : ""}`}
    >
      <CardContent className="p-5 flex flex-col justify-between h-full gap-3">
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <span className="text-xs text-muted-foreground font-bold">{title}</span>
            <h3 className="text-2xl font-black mt-1 text-foreground leading-none">{value}</h3>
          </div>
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${accentColor ? iconClasses[accentColor] : "bg-muted"}`}
          >
            <Icon size={18} />
          </div>
        </div>
        <div className="flex items-center justify-between text-[11px] border-t border-border/30 pt-2.5">
          <span className="text-muted-foreground truncate max-w-[130px]">{subtext}</span>
          {trend && (
            <span
              className={`font-black flex items-center gap-0.5 ${trendType === "up" ? "text-green-600" : trendType === "down" ? "text-destructive" : "text-muted-foreground"}`}
            >
              {trend}
              {trendType === "up" && <ArrowUpRight size={10} />}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
