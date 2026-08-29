import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "./admin";
import { Route as AdminRoute } from "./admin/index";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Restocash — لوحة التحكم الرئيسية" },
      {
        name: "description",
        content: "نظام إدارة المطاعم والمحاسبة ERP ونقطة البيع المتكاملة.",
      },
    ],
  }),
  component: DashboardHome,
});

function DashboardHome() {
  const Dashboard = AdminRoute.options.component as React.ElementType;
  return (
    <AdminLayout>
      <Dashboard />
    </AdminLayout>
  );
}
