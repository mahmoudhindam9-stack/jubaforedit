import { MenuItem } from "@/shared/types";

export interface TableCartLine {
  item: MenuItem;
  quantity: number;
  notes?: string;
  selectedAdditions?: any[];
}

export interface TableOrder {
  id: string;
  table_id: string;
  table_number: number;
  table_name?: string | null;
  items: TableCartLine[];
  order_type: "dine_in" | "takeaway" | "delivery";
  notes: string;
  selectedAdditions: string[];
  subtotal: number;
  tax: number;
  total: number;
  status: "draft" | "sent_to_cashier" | "in_checkout" | "completed" | "cancelled";
  sentToKitchen?: boolean;
  kitchenCompleted?: boolean;
  kitchenOrderId?: string;
  is_self_order?: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "restocash_table_orders_v1";

class TableOrdersStore {
  private orders: TableOrder[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadState();
    if (typeof window !== "undefined") {
      window.addEventListener("storage", (e) => {
        if (e.key === STORAGE_KEY) {
          this.loadState();
          this.notify();
        }
      });
      window.addEventListener("table-orders-updated", () => {
        this.loadState();
        this.notify();
      });
    }
  }

  private loadState() {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") {
        this.orders = [];
        return;
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        this.orders = JSON.parse(raw);
      } else {
        this.orders = [];
      }
    } catch (e) {
      console.error("Failed to load table orders:", e);
      this.orders = [];
    }
  }

  private saveState() {
    try {
      if (typeof window === "undefined" || typeof localStorage === "undefined") return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.orders));
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("table-orders-updated"));
      }
    } catch (e) {
      console.error("Failed to save table orders:", e);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getAllOrders(): TableOrder[] {
    return this.orders;
  }

  public getOrderByTableId(tableId: string): TableOrder | undefined {
    return this.orders.find(
      (o) => o.table_id === tableId && (o.status === "draft" || o.status === "sent_to_cashier"),
    );
  }

  public getPendingCashierOrders(): TableOrder[] {
    return this.orders.filter((o) => o.status === "sent_to_cashier");
  }

  public saveOrder(orderData: Omit<TableOrder, "id" | "created_at" | "updated_at">): TableOrder {
    const existingIndex = this.orders.findIndex(
      (o) =>
        o.table_id === orderData.table_id &&
        (o.status === "draft" || o.status === "sent_to_cashier"),
    );

    const now = new Date().toISOString();

    if (existingIndex >= 0) {
      const existing = this.orders[existingIndex];
      const updated: TableOrder = {
        ...existing,
        ...orderData,
        updated_at: now,
      };
      this.orders[existingIndex] = updated;
      this.saveState();
      this.notify();
      return updated;
    } else {
      const newOrder: TableOrder = {
        id: `tbl-ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        ...orderData,
        created_at: now,
        updated_at: now,
      };
      this.orders.push(newOrder);
      this.saveState();
      this.notify();
      return newOrder;
    }
  }

  public updateStatus(orderId: string, status: TableOrder["status"]) {
    const target = this.orders.find((o) => o.id === orderId);
    if (target) {
      target.status = status;
      target.updated_at = new Date().toISOString();
      this.saveState();
      this.notify();
    }
  }

  public removeOrder(orderId: string) {
    this.orders = this.orders.filter((o) => o.id !== orderId);
    this.saveState();
    this.notify();
  }

  public clearTableOrder(tableId: string) {
    this.orders = this.orders.filter((o) => o.table_id !== tableId);
    this.saveState();
    this.notify();
  }

  public clearAll() {
    this.orders = [];
    this.saveState();
    this.notify();
  }

  public markKitchenCompletedByTableId(tableId: string) {
    let updated = false;
    this.orders.forEach((target) => {
      if (target.table_id === tableId && target.sentToKitchen && !target.kitchenCompleted) {
        target.kitchenCompleted = true;
        target.updated_at = new Date().toISOString();
        updated = true;
      }
    });
    if (updated) {
      this.saveState();
      this.notify();
    }
  }
}

export const tableOrdersStore = new TableOrdersStore();
