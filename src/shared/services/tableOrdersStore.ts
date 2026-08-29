import { MenuItem } from "@/shared/types";

export interface TableCartLine { item: MenuItem; quantity: number; notes?: string; selectedAdditions?: any[]; }
export interface TableOrder {
  id: string; table_id: string; table_number: number; table_name?: string | null;
  items: TableCartLine[]; order_type: "dine_in" | "takeaway" | "delivery"; notes: string;
  selectedAdditions: string[]; subtotal: number; tax: number; total: number;
  status: "draft" | "sent_to_cashier" | "in_checkout" | "completed" | "cancelled";
  sentToKitchen?: boolean; kitchenCompleted?: boolean; kitchenOrderId?: string;
  is_self_order?: boolean; created_at: string; updated_at: string;
}

const STORAGE_KEY = "restocash_table_orders_v1";
const EVENT = "table-orders-updated";
const CHANNEL = "restocash_table_orders_channel";

class TableOrdersStore {
  private orders: TableOrder[] = [];
  private listeners = new Set<() => void>();
  private bc: BroadcastChannel | null = null;

  constructor() {
    this.loadState();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) { this.loadState(); this.notify(); }
      });
      window.addEventListener(EVENT, () => { this.loadState(); this.notify(); });
      if ("BroadcastChannel" in window) {
        this.bc = new BroadcastChannel(CHANNEL);
        this.bc.onmessage = (e) => {
          if (e.data?.type === "SYNC") { this.loadState(); this.notify(); }
        };
      }
    }
  }

  private loadState() {
    try {
      const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
      this.orders = raw ? JSON.parse(raw) : [];
    } catch { this.orders = []; }
  }

  private saveState() {
    if (typeof window === "undefined" || typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
    window.dispatchEvent(new Event(EVENT));
    try { this.bc?.postMessage({ type: "SYNC", at: Date.now() }); } catch {}
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  private notify() { this.listeners.forEach((fn) => fn()); }
  public getAllOrders() { return this.orders; }

  public getOrderByTableId(tableId: string) {
    return this.orders.find(o => o.table_id === tableId && ["draft", "sent_to_cashier", "in_checkout"].includes(o.status));
  }
  public getPendingCashierOrders() { return this.orders.filter(o => o.status === "sent_to_cashier"); }

  public saveOrder(orderData: Omit<TableOrder, "id" | "created_at" | "updated_at">): TableOrder {
    const idx = this.orders.findIndex(o => o.table_id === orderData.table_id && ["draft", "sent_to_cashier", "in_checkout"].includes(o.status));
    const now = new Date().toISOString();
    const order: TableOrder = idx >= 0
      ? { ...this.orders[idx], ...orderData, updated_at: now }
      : { id: `tbl-ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`, ...orderData, created_at: now, updated_at: now };
    if (idx >= 0) this.orders[idx] = order; else this.orders.push(order);
    this.saveState(); this.notify();
    return order;
  }

  public updateStatus(orderId: string, status: TableOrder["status"]) {
    const o = this.orders.find(x => x.id === orderId); if (!o) return;
    o.status = status; o.updated_at = new Date().toISOString(); this.saveState(); this.notify();
  }

  public sendOrderToKitchen(orderId: string) {
    const o = this.orders.find(x => x.id === orderId); if (!o) return;
    o.sentToKitchen = true; o.kitchenCompleted = false;
    o.kitchenOrderId = o.kitchenOrderId || `KITCHEN-${Date.now()}`;
    o.updated_at = new Date().toISOString(); this.saveState(); this.notify();
  }

  public completeKitchenOrder(orderId: string) {
    const o = this.orders.find(x => x.id === orderId); if (!o) return;
    o.kitchenCompleted = true; o.updated_at = new Date().toISOString(); this.saveState(); this.notify();
  }

  public markKitchenCompletedByTableId(tableId: string) {
    let changed = false;
    this.orders.forEach(o => {
      if (o.table_id === tableId && o.sentToKitchen && !o.kitchenCompleted) {
        o.kitchenCompleted = true; o.updated_at = new Date().toISOString(); changed = true;
      }
    });
    if (changed) { this.saveState(); this.notify(); }
  }

  public removeOrder(orderId: string) { this.orders = this.orders.filter(o => o.id !== orderId); this.saveState(); this.notify(); }
  public clearTableOrder(tableId: string) { this.orders = this.orders.filter(o => o.table_id !== tableId); this.saveState(); this.notify(); }
  public clearOrder(tableId: string) { this.clearTableOrder(tableId); }
  public clearAll() { this.orders = []; this.saveState(); this.notify(); }
}

export const tableOrdersStore = new TableOrdersStore();
