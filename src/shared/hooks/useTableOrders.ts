import { useState, useEffect } from "react";
import { tableOrdersStore, TableOrder } from "@/shared/services/tableOrdersStore";

export function useTableOrders() {
  const [orders, setOrders] = useState<TableOrder[]>(() => tableOrdersStore.getAllOrders());

  useEffect(() => {
    setOrders(tableOrdersStore.getAllOrders());
    return tableOrdersStore.subscribe(() => {
      setOrders([...tableOrdersStore.getAllOrders()]);
    });
  }, []);

  return {
    orders,
    pendingCashierOrders: orders.filter((o) => o.status === "sent_to_cashier"),
    getOrderByTableId: (tableId: string) =>
      orders.find(
        (o) => o.table_id === tableId && (o.status === "draft" || o.status === "sent_to_cashier"),
      ),
    saveOrder: tableOrdersStore.saveOrder.bind(tableOrdersStore),
    updateStatus: tableOrdersStore.updateStatus.bind(tableOrdersStore),
    removeOrder: tableOrdersStore.removeOrder.bind(tableOrdersStore),
    clearTableOrder: tableOrdersStore.clearTableOrder.bind(tableOrdersStore),
  };
}
