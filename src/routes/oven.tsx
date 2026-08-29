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
import { CheckCircle2, UtensilsCrossed, ArrowRight, Trash2, Flame, Pencil, MessageSquare, ClipboardList } from "lucide-react";
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
      if (e.key === "force_oven_refresh") fetchPendingOrders();
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

  const fetchPendingOrders = async () => {
    try {
      let dbOrders: any[] = [];
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .or("status.eq.pending,status.eq.in_kitchen")
        .order("created_at", { ascending: true });

      if (!error && data) dbOrders = data;

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
          items: Array.isArray(lo.items)
            ? lo.items.map((i) => ({
                id: i?.item?.id || i?.id || Math.random().toString(),
                name_ar: i?.item?.name_ar || i?.name_ar || "عنصر غير معروف",
                quantity: i?.quantity || 1,
                notes: i?.notes || i?.item?.notes || "",
                selectedAdditions: i?.selectedAdditions || i?.item?.selectedAdditions || [],
                requires_oven: i?.item?.requires_oven || i?.requires_oven || false,
              }))
            : [],
          isLocalStore: true,
          localStoreId: lo.id,
        }));

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
      if (order.table_id) tableOrdersStore.markKitchenCompletedByTableId(order.table_id);
      if (order.isPosLocal && order.id) {
        try {
          const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
          const updated = stored.map((o: any) => o.id === order.id ? { ...o, status: "served" } : o);
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
      if (order.table_id) tableOrdersStore.markKitchenCompletedByTableId(order.table_id);
      if (order.isPosLocal && order.id) {
        try {
          const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
          localStorage.setItem("pos_local_orders", JSON.stringify(stored.filter((o: any) => o.id !== order.id)));
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
        if (o.table_id) tableOrdersStore.markKitchenCompletedByTableId(o.table_id);
      });
      try {
        const stored = JSON.parse(localStorage.getItem("pos_local_orders") || "[]");
        localStorage.setItem("pos_local_orders", JSON.stringify(stored.map((o: any) => ({ ...o, status: "served" }))));
      } catch (err) {}
      toast({ title: "تم حذف كافة الطلبات", description: "تم حذف جميع الطلبات نهائياً بنجاح." });
      fetchPendingOrders();
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message || "فشل حذف الطلبات", variant: "destructive" });
    }
  };

  const updateOrder = async () => {
    if (!editingOrder) return;
    try {
      if (!editingOrder.isLocalStore && editingOrder.id) {
        const { error } = await supabase
          .from("orders")
          .update({ notes: editNotes })
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

  const getItemNotes = (item: any) => {
    const notes = item?.notes ?? item?.item?.notes ?? item?.special_notes ?? item?.item?.special_notes ?? "";
    return typeof notes === "string" ? notes.trim() : "";
  };

  const getItemAdditions = (item: any) => {
    const additions = item?.selectedAdditions ?? item?.item?.selectedAdditions ?? item?.additions ?? [];
    if (Array.isArray(additions)) {
      return additions
        .map((a: any) => typeof a === "string" ? a : a?.label_ar || a?.name_ar || a?.name || "")
        .filter(Boolean);
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-cairo" dir="rtl">
      <header className="bg-slate-950 text-white p-4 shadow-lg sticky top-0 z-50 border-b border-orange-400/40">
        <div className="w-full px-2 lg:px-6 mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2.5 bg-white/10 rounded-xl hover:bg-white/15 transition">
              <ArrowRight size={20} className="rotate-180" />
            </Link>
            <div>
              <h1 className="text-xl font-black flex items-center gap-2">
                <Flame className="text-orange-500 fill-orange-500 animate-pulse" />
                شاشة الفرن والمطبخ
              </h1>
              <p className="text-xs text-slate-400">متابعة الطلبات وتحضير الأصناف لحظياً</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl border border-white/10">
              <Switch id="filter-oven" checked={filterOvenOnly} onCheckedChange={setFilterOvenOnly} />
              <Label htmlFor="filter-oven" className="text-xs font-bold text-slate-200 cursor-pointer">
                أصناف الفرن فقط 🍕
              </Label>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2 text-xs font-bold h-10 rounded-xl shadow-sm">
                  <Trash2 size={16} /> حذف جميع الطلبات
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-3xl font-cairo text-right" dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-right">هل أنت متأكد من حذف جميع الطلبات؟</AlertDialogTitle>
                  <AlertDialogDescription className="text-right">سيتم حذف كافة الطلبات من قاعدة البيانات والفرن نهائياً. لا يمكن التراجع عن هذا الإجراء.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl">إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={clearAllOrders} className="bg-destructive hover:bg-destructive/90 rounded-xl text-white">نعم، احذف الكل</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      <main className="p-4 lg:p-6 w-full mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {orders.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200 shadow-sm">
            <UtensilsCrossed size={52} className="mx-auto mb-3 text-slate-300" />
            <p className="text-base">لا توجد طلبات معلقة في الفرن حالياً</p>
          </div>
        )}

        {orders.map((order) => {
          const rawItems = Array.isArray(order.items)
            ? order.items
            : typeof order.items === "string"
              ? (() => { try { return JSON.parse(order.items); } catch { return []; } })()
              : [];

          const displayItems = filterOvenOnly ? rawItems.filter((i: any) => i.requires_oven) : rawItems;
          if (filterOvenOnly && displayItems.length === 0) return null;

          return (
            <div key={order.id} className="bg-white rounded-3xl shadow-sm border-2 border-orange-200/80 overflow-hidden flex flex-col min-h-[430px] hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200">
              <div className="bg-gradient-to-l from-orange-50 to-white p-4 border-b border-orange-200/80">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="font-black text-2xl text-slate-950">طلب #{String(order.order_number || order.id).slice(-6)}</div>
                    <div className="text-xs text-slate-500 font-bold mt-1">
                      {order.created_at ? format(new Date(order.created_at), "hh:mm a") : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 font-black rounded-full px-3 py-1">
                      {order.order_type === "dine_in"
                        ? `صالة ${order.table_number ? `(#${order.table_number})` : ""}`
                        : order.order_type === "takeaway" ? "تيك أواي" : "توصيل"}
                    </Badge>
                    <OrderTimer createdAt={order.created_at} />
                  </div>
                </div>
              </div>

              <div className="p-4 flex-1">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b-2 border-orange-100">
                  <ClipboardList size={20} className="text-orange-500" />
                  <h2 className="font-black text-lg text-slate-900">الصنف والملاحظات</h2>
                </div>

                <div className="space-y-3">
                  {displayItems.map((item: any, idx: number) => {
                    const itemNotes = getItemNotes(item);
                    const additions = getItemAdditions(item);
                    return (
                      <div key={idx} className="rounded-2xl border border-orange-200 bg-[#fffaf0] p-3.5 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="shrink-0 min-w-12 h-11 rounded-xl bg-slate-950 text-white flex items-center justify-center font-black text-base px-2">
                            x{item.quantity}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="font-black text-lg text-slate-950 leading-7">
                                {item.name_ar || item.name || "عنصر غير معروف"}
                              </div>
                              {item.requires_oven && (
                                <span className="shrink-0 text-[10px] bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-black border border-orange-200">فرن 🍕</span>
                              )}
                            </div>

                            {(itemNotes || additions.length > 0) && (
                              <div className="mt-2.5 rounded-xl border border-orange-200 bg-white/80 p-3">
                                {itemNotes && (
                                  <div className="flex items-start gap-2">
                                    <MessageSquare size={18} className="text-orange-500 shrink-0 mt-0.5" />
                                    <div className="min-w-0">
                                      <div className="text-xs font-black text-orange-700 mb-1">الملاحظات</div>
                                      <div className="text-sm font-bold text-slate-900 whitespace-pre-wrap break-words">{itemNotes}</div>
                                    </div>
                                  </div>
                                )}
                                {additions.length > 0 && (
                                  <div className={`${itemNotes ? "mt-3 pt-3 border-t border-orange-100" : ""}`}>
                                    <div className="text-xs font-black text-orange-700 mb-1">الإضافات</div>
                                    <div className="text-sm font-bold text-slate-800">{additions.join("، ")}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {order.notes && !displayItems.some((i: any) => getItemNotes(i)) && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700">
                    <span className="font-black text-slate-900">ملاحظة عامة:</span> {order.notes}
                  </div>
                )}
              </div>

              <div className="p-3.5 bg-slate-50 border-t border-slate-200 mt-auto">
                <div className="flex items-center justify-end gap-2 mb-3">
                  <Button
                    onClick={() => { setEditingOrder(order); setEditNotes(order.notes || ""); }}
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 rounded-xl text-blue-600 hover:bg-blue-50 border-slate-200 bg-white"
                    title="تعديل الطلب"
                  >
                    <Pencil size={18} />
                  </Button>
                  <Button
                    onClick={() => deleteSingleOrder(order)}
                    variant="destructive"
                    size="icon"
                    className="h-11 w-11 rounded-xl shadow-sm"
                    title="حذف الطلب"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                <Button onClick={() => markAsCompleted(order)} className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 font-black gap-2 text-white shadow-lg text-base">
                  <CheckCircle2 size={21} />
                  الطلب جاهز
                </Button>
              </div>
            </div>
          );
        })}
      </main>

      {editingOrder && (
        <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
          <DialogContent className="max-w-md text-right rounded-3xl font-cairo" dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-right text-lg font-black block border-b border-border/40 pb-2">
                تعديل ملاحظات الطلب #{String(editingOrder.order_number || editingOrder.id).slice(-6)}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">الملاحظات العامة</Label>
                <Input value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="ملاحظات أو تعليمات خاصة..." />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <Button variant="outline" onClick={() => setEditingOrder(null)} className="rounded-xl">إلغاء</Button>
                <Button onClick={updateOrder} className="rounded-xl">حفظ التعديلات</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
