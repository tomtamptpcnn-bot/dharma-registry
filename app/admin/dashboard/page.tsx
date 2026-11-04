import { getDashboard } from "@/lib/recipients";
import { DashboardOverview } from "@/components/admin/dashboard-overview";
import { requireUser } from "@/lib/auth";
import { requireSuperAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function Dashboard({ searchParams }: { searchParams: Promise<{ temple?: string }> }) {
  const { access } = await requireUser();
  let templeId = access.temple_id ?? undefined;
  let temples: { id: string; name: string }[] = [];
  if (access.role === "super_admin") {
    const { supabase } = await requireSuperAdmin();
    const params = await searchParams;
    const { data } = await supabase.from("dharma_temples").select("id,name").order("name");
    temples = data ?? [];
    if (params.temple && params.temple !== "all" && temples.some((temple) => temple.id === params.temple)) templeId = params.temple;
    else if (params.temple === "all") templeId = undefined;
    else if (params.temple) redirect("/admin/dashboard");
  }
  return <DashboardOverview {...await getDashboard(templeId)} temples={temples} selectedTempleId={templeId} />;
}
