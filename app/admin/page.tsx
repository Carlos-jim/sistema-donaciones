import { redirect } from "next/navigation";
import { getAdminFromCookie } from "@/lib/admin-auth";
import AdminDashboardClient from "./dashboard-client";

export default async function AdminPage() {
  const admin = await getAdminFromCookie();
  if (!admin) redirect("/admin/login");

  return <AdminDashboardClient />;
}
