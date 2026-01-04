import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardFooter } from "@/components/dashboard-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-gray-50 to-white">
      <DashboardHeader />
      <main className="flex-1 container mx-auto px-4 py-8">{children}</main>
      <DashboardFooter />
    </div>
  );
}
