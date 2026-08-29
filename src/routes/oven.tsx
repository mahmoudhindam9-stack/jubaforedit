// @ts-nocheck
import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { tableOrdersStore } from "@/shared/services/tableOrdersStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { CheckCircle2, UtensilsCrossed, ArrowRight, Trash2, Flame, Pencil } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { OrderTimer } from "@/components/OrderTimer";
import { useToast } from "@/hooks/use-toast";

export const Route = createFileRoute("/oven")({
  head: () => ({ meta: [{ title: "شاشة الفرن والمطبخ (KDS)" }] }),
  component: OvenPage,
});

function OvenPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filterOvenOnly, setFilterOvenOnly] = useState<boolean>(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [editNotes, setEditNotes] = useState("");
  const [editTotal, setEditTotal] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingOrders();

    const unsubscribeStore = tableOrdersStore.subscribe(() => {
      fetchPendingOrders();
    });

    const channel = supabase
      .channel("oven_orders_channel")
      .on("broadcast", { event: "NEW_OVEN_ORDER" }, () => {
        toast({
          title: "طلب جديد! 👨‍🍳",
          description: "تم استلام طلب جديد من الكاشير.",
        });
        fetchPendingOrders();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchPendingOrders();
      })
      .subscribe();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "force_oven_refresh") {
        fetchPendingOrders();
      }
    };
    const handleCustomRefresh = () => {
      toast({
        title: "طلب جديد! 👨‍🍳",
        description: "تم استلام طلب جديد في المطبخ.",
      });
      fetchPendingOrders();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("force_oven_refresh", handleCustomRefresh);

    return () => {
      unsubscribeStore();
      supabase.removeChannel(channel);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("force_oven_refresh", handleCustomRefresh);
    };
  }, []);

  const getOrderCurrency = (notes: string | null) => {
    if (!notes) return "USD";
    if (notes.includes("العملة: EGP") || notes.includes("EGP")) return "EGP";
    if (notes.includes("العملة: SSP") || notes.includes("SSP")) return "SSP";
    if (notes.includes("العملة: USD") || notes.includes("USD")) return "USD";
    return "USD";
  };

  const formatOrderPrice = (amount: number, notes: string | null) => {
    const curr = getOrderCurrency(notes);
    const val = Number(amount || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    if (curr === "EGP") return `${val} ج.م`;
    if (curr === "SSP") return `${val} ج.ج.س`;
    return `${val} $`;
  };

  const fetchPendingOrders = async () => {
    try {
      let dbOrders: any[] = [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or("status.eq.pending,status.eq.in_kitchen")
        .order("created_at", { ascending: true });

      if (!error && data) {
        dbOrders = data;
      }

      const allLocal = tableOrdersStore.getAllOrders();
      const localStoreOrders = allLocal
        .filter(
          (o) =>
            (o.status === "draft" || o.status === "sent_to_cashier") &&
            o.sentToKitchen &&
            !o.kitchenCompleted,
        )
        .map((lo) => ({
          id: lo.kitchenOrderId || lo.id,
          table_id: lo.table_id,
          table_number: lo.table_number,
          order_type: lo.order_type || "dine_in",
          status: "pending",
          notes: lo.notes || `طاولة #${lo.table_number}`,
          created_at: lo.created_at || new Date().toISOString(),
          total: lo.total || 0,
          items: Array.isArray(lo.items)
            ? lo.items.map((i) => ({
                id: i?.item?.id || i?.id || Math.random().toString(),
                name_ar: i?.item?.name_ar || i?.name_ar || "عنصر غير معروف",
                quantity: i?.quantity || 1,
                requires_oven: i?.item?.requires_oven || i?.requires_oven || false,
              }))
            : [],
          isLocalStore: true,
          localStoreId: lo.id,
        }));

      // Also get POS local orders (Takeaway / Delivery) that are pending
      let posLocalOrders: any[] = [];
      try {
        const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
        posLocalOrders = stored
          .filter((o: any) => o.status === "pending" || o.status === "in_kitchen")
          .map((lo: any) => ({
            ...lo,
            isLocalStore: true,
            isPosLocal: true,
            localStoreId: lo.id,
          }));
      } catch (err) {
        console.warn("Failed to parse pos_local_orders in oven", err);
      }

      const dbOrderIds = new Set(dbOrders.map((o) => o.id));
      const extraLocal = localStoreOrders.filter((l) => !dbOrderIds.has(l.id));
      const extraPosLocal = posLocalOrders.filter((l) => !dbOrderIds.has(l.id));

      const combined = [...dbOrders, ...extraLocal, ...extraPosLocal].sort(
        (a, b) => new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime(),
      );

      setOrders(combined);
    } catch (err) {
      console.error("fetchPendingOrders error:", err);
    }
  };

  const markAsCompleted = async (order: any) => {
    try {
      if (order.id && !order.isLocalStore) {
        const { error } = await supabase
          .from("orders")
          .update({ status: "served" })
          .eq("id", order.id);
        if (error) throw error;
      }
      if (order.table_id) {
        tableOrdersStore.markKitchenCompletedByTableId(order.table_id);
      }
      if (order.isPosLocal && order.id) {
        try {
          const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
          const updated = stored.map((o: any) =>
            o.id === order.id ? { ...o, status: "served" } : o,
          );
          localStorage.setItem("pos_local_orders", JSON.stringify(updated));
        } catch (err) {}
      }
      toast({ title: "الطلب جاهز! 👨‍🍳", description: "تم تحديث حالة الطلب إلى جاهز/مكتمل." });
      fetchPendingOrders();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل تحديث الطلب", variant: "destructive" });
    }
  };

  const deleteSingleOrder = async (order: any) => {
    try {
      if (!order.isLocalStore && order.id) {
        const { error } = await supabase.from("orders").delete().eq("id", order.id);
        if (error) throw error;
      }
      if (order.table_id) {
        tableOrdersStore.markKitchenCompletedByTableId(order.table_id);
      }
      if (order.isPosLocal && order.id) {
        try {
          const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
          const updated = stored.filter((o: any) => o.id !== order.id);
          localStorage.setItem("pos_local_orders", JSON.stringify(updated));
        } catch (err) {}
      }
      toast({ title: "تم الحذف", description: "تم حذف الطلب بنجاح." });
      fetchPendingOrders();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل حذف الطلب", variant: "destructive" });
    }
  };

  const clearAllOrders = async () => {
    try {
      const { error } = await supabase.from("orders").delete().not("id", "is", null);
      if (error) throw error;

      const localOrders = tableOrdersStore.getAllOrders();
      localOrders.forEach((o) => {
        if (o.table_id) {
          tableOrdersStore.markKitchenCompletedByTableId(o.table_id);
        }
      });

      try {
        const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
        const updated = stored.map((o: any) => ({ ...o, status: "served" }));
        localStorage.setItem("pos_local_orders", JSON.stringify(updated));
      } catch (err) {}

      toast({
        title: "تم حذف كافة الطلبات",
        description: "تم حذف جميع الطلبات نهائياً بنجاح.",
      });
      fetchPendingOrders();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل حذف الطلبات", variant: "destructive" });
    }
  };

  const updateOrder = async () => {
    if (!editingOrder) return;
    try {
      const newTotal = Number(editTotal) || 0;
      if (!editingOrder.isLocalStore && editingOrder.id) {
        const { error } = await supabase
          .from("orders")
          .update({ notes: editNotes, total: newTotal })
          .eq("id", editingOrder.id);
        if (error) throw error;
      }
      toast({ title: "تم التعديل", description: "تم تحديث بيانات الطلب بنجاح." });
      setEditingOrder(null);
      fetchPendingOrders();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل تعديل الطلب", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-cairo" dir="rtl">
      <header className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
        <div className="w-full px-2 lg:px-6 mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
              <ArrowRight size={20} className="rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                <Flame className="text-orange-500 fill-orange-500 animate-pulse" />
                شاشة الفرن المباشرة (Oven KDS)
              </h1>
              <p className="text-xs text-slate-400">إدارة ومتابعة تحضير وجبات الفرن</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
              <Switch
                id="filter-oven"
                checked={filterOvenOnly}
                onCheckedChange={setFilterOvenOnly}
              />
              <Label
                htmlFor="filter-oven"
                className="text-xs font-bold text-slate-200 cursor-pointer"
              >
                أصناف الفرن فقط 🍕
              </Label>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 text-xs font-bold h-9 shadow-xs">
                  <Trash2 size={16} />
                  حذف جميع الطلبات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl font-cairo text-right" dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-right">
                    هل أنت متأكد من حذف جميع الطلبات؟
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-right">
                    سيتم حذف كافة الطلبات من قاعدة البيانات والفرن نهائياً. لا يمكن التراجع عن هذا
                    الإجراء.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearAllOrders}
                    className="bg-destructive hover:bg-destructive/90 rounded-xl text-white"
                  >
                    نعم، احذف الكل
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="p-4 w-full px-2 lg:px-6 mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <UtensilsCrossed size={48} className="mx-auto mb-3 text-slate-300" />
            <p className="text-base">لا توجد طلبات معلقة في الفرن حالياً</p>
          </div>
        )}

        {orders.map((order) => {
          const rawItems = Array.isArray(order.items)
            ? order.items
            : typeof order.items === "string"
              ? (() => {
                  try {
                    return JSON.parse(order.items);
                  } catch {
                    return [];
                  }
                })()
              : [];

          const displayItems = filterOvenOnly
            ? rawItems.filter((i: any) => i.requires_oven)
            : rawItems;

          if (filterOvenOnly && displayItems.length === 0) return null;

          return (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border-2 border-orange-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow"
            >
              <div className="bg-orange-50 p-3.5 border-b border-orange-200 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-black text-lg text-slate-900">
                      طلب #{String(order.order_number || order.id).slice(-6)}
                    </div>
                    <div className="text-xs text-slate-500 font-bold">
                      {order.created_at ? format(new Date(order.created_at), "hh:mm a") : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge
                      variant="outline"
                      className="bg-orange-100 text-orange-800 border-orange-300 font-bold"
                    >
                      {order.order_type === "dine_in"
                        ? `صالة ${order.table_number ? `(#${order.table_number})` : ""}`
                        : order.order_type === "takeaway"
                          ? "تيك أواي"
                          : "توصيل"}
                    </Badge>
                    <OrderTimer createdAt={order.created_at} />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1">
                {order.notes && (
                  <div className="mb-3 p-2 bg-amber-50 rounded-lg text-xs font-bold border border-amber-200 text-amber-900">
                    {order.notes}
                  </div>
                )}

                <div className="space-y-2.5">
                  {displayItems.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-sm text-slate-800">
                        {item.requires_oven && (
                          <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-extrabold border border-orange-200">
                            فرن 🍕
                          </span>
                        )}
                        <span>{item.name_ar || item.name}</span>
                      </div>
                      <div className="font-black bg-slate-900 text-white px-2 py-0.5 rounded text-xs">
                        x{item.quantity}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-100 mt-auto flex items-center justify-between gap-2">
                <div className="font-black text-sm text-emerald-600">
                  {formatOrderPrice(order.total, order.notes)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    onClick={() => {
                      setEditingOrder(order);
                      setEditNotes(order.notes || "");
                      setEditTotal(order.total ? order.total.toString() : "0");
                    }}
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 text-blue-600 hover:bg-blue-50"
                    title="تعديل الطلب"
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    onClick={() => deleteSingleOrder(order)}
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 shadow-xs"
                    title="حذف الطلب"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="px-3 pb-3 bg-slate-50">
                <Button
                  onClick={() => markAsCompleted(order)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 font-bold gap-2 text-white shadow-xs"
                >
                  <CheckCircle2 size={18} />
                  الطلب جاهز
                </Button>
              </div>
            </div>
          );
        })}
      </main>

      {/* Edit Order Modal */}
      {editingOrder && (
        <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
          <DialogContent className="max-w-md text-right rounded-3xl font-cairo" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-lg font-black block border-b border-border/40 pb-2">
                تعديل الطلب #{String(editingOrder.order_number || editingOrder.id).slice(-6)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">ملاحظات الطلب</Label>
                <Input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="ملاحظات أو تعليمات خاصة..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">الإجمالي</Label>
                <Input
                  type="number"
                  value={editTotal}
                  onChange={(e) => setEditTotal(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button
                  variant="outline"
                  onClick={() => setEditingOrder(null)}
                  className="rounded-xl"
                >
                  إلغاء
                </Button>
                <Button onClick={updateOrder} className="rounded-xl">
                  حفظ التعديلات
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
