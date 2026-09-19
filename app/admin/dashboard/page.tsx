import { getDashboard } from "@/lib/recipients";
import { DashboardOverview } from "@/components/admin/dashboard-overview";
export default async function Dashboard() {
  return <DashboardOverview {...await getDashboard()} />;
}
