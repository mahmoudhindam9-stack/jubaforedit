import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService, CreateOrderPayload } from "../services/orderService";
import { Order } from "@/shared/types";

export function useOrders(statusFilter?: string) {
  return useQuery<Order[]>({
    queryKey: ["admin", "orders", statusFilter],
    queryFn: () => orderService.getOrders(statusFilter),
  });
}

export function useRecentOrders(limit = 5) {
  return useQuery<Order[]>({
    queryKey: ["orders", "last", limit],
    queryFn: () => orderService.getLastOrders(limit),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      orderService.updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => orderService.createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "reports", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    },
  });
}
