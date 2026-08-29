import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { menuService } from "../services/menuService";
import { Category, MenuItem } from "@/shared/types";

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["admin", "menu_categories"],
    queryFn: () => menuService.getCategories(),
  });
}

export function useMenuItems(onlyAvailable = false) {
  return useQuery<MenuItem[]>({
    queryKey: ["admin", "menu_items", onlyAvailable],
    queryFn: () => menuService.getMenuItems(onlyAvailable),
  });
}

export function useUpsertCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payload,
      id,
    }: {
      payload: { name_ar: string; sort_order: number };
      id?: string;
    }) => menuService.upsertCategory(payload, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu_categories"] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu_categories"] });
    },
  });
}

export function useUpsertMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ payload, id }: { payload: Partial<MenuItem>; id?: string }) =>
      menuService.upsertMenuItem(payload, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu_items"] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => menuService.deleteMenuItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu_items"] });
    },
  });
}

export function useToggleMenuItemAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      menuService.toggleMenuItemAvailability(id, isAvailable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "menu_items"] });
    },
  });
}
