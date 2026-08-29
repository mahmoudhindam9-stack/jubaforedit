// @ts-nocheck
import { supabase } from "@/integrations/supabase/client";
import { Order, OrderStatus, PaymentMethod, OrderType } from "@/shared/types";
import { erpStore } from "@/shared/services/erpStore";
import { cleanTableId } from "@/shared/utils/inventoryUtils";

export interface CreateOrderPayload {
  subtotal: number;
  tax: number;
  total: number;
  currency?: string;
  payment_method: PaymentMethod;
  order_type: OrderType;
  table_id: string | null;
  status: string;
  notes: string | null;
  items: { id: string; name_ar: string; price: number; quantity: number }[];
}

export const orderService = {
  async getOrders(statusFilter?: string): Promise<Order[]> {
    let q = supabase.from("orders").select("*").order("order_number", { ascending: false });
    if (statusFilter) {
      q = q.eq("status", statusFilter);
    }
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as unknown as Order[];
  },

  async getLastOrders(limit = 5): Promise<Order[]> {
    const { data, error } = await supabase
      .from("orders")
      .select("order_number,subtotal,tax,total,payment_method,order_type,status,items,created_at")
      .order("order_number", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as unknown as Order[];
  },

  async updateOrderStatus(id: string, status: string): Promise<void> {
    if (status === "preparing") {
      const allowNegative = erpStore.getState().inventorySettings?.allowNegativeStock ?? true;
      const { data, error } = await (supabase.rpc as any)("start_order_preparing", {
        p_order_id: id,
        p_allow_negative: allowNegative,
      });
      if (error) throw error;
      const result = data as any;
      if (result && !result.success) {
        throw new Error(result.error_ar || result.error || "Failed to process order inventory");
      }
    } else if (status === "cancelled") {
      const { data, error } = await (supabase.rpc as any)("cancel_order", {
        p_order_id: id,
      });
      if (error) throw error;
      const result = data as any;
      if (result && !result.success) {
        throw new Error(
          result.error_ar || result.error || "Failed to cancel order and reverse inventory",
        );
      }
    } else {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    }
  },

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    const { data, error } = await supabase
      .from("orders")
      .insert({
        subtotal: payload.subtotal,
        tax: payload.tax,
        total: payload.total,
        payment_method: payload.payment_method,
        order_type: payload.order_type,
        table_id: cleanTableId(payload.table_id),
        status: payload.status,
        notes: payload.notes,
        items: payload.items as any,
      })
      .select(
        "order_number,subtotal,tax,total,payment_method,order_type,table_id,status,items,created_at",
      )
      .single();

    if (error) throw error;

    // Post to ERP automated journal entries and update treasury balances
    try {
      erpStore.postSalesInvoiceJournal(
        data.order_number,
        Number(payload.total),
        Number(payload.subtotal),
        Number(payload.tax),
        payload.payment_method,
        erpStore.getState().currentBranchId,
        payload.currency || "EGP",
      );
    } catch (erpErr) {
      console.error("Error posting sales to ERP system:", erpErr);
    }

    return data as unknown as Order;
  },
};
