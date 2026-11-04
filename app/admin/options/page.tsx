import { getRegistryOptionStats } from "@/lib/options";
import { OptionsManager } from "@/components/admin/options-manager";
import { requireUser } from "@/lib/auth";
export default async function OptionsPage({ searchParams }: { searchParams: Promise<{ temple?: string }> }) {
  const { supabase, access } = await requireUser();
  let temples: { id: string; name: string }[] = [];
  let templeId: string | null = access.temple_id;
  if (access.role === "super_admin") {
    const [{ data }, params] = await Promise.all([
      supabase.from("dharma_temples").select("id,name").order("name"),
      searchParams,
    ]);
    temples = data ?? [];
    templeId = temples.find((temple) => temple.id === params.temple)?.id ?? null;
  }
  if (!templeId) {
    const unassigned = Object.fromEntries(
      ["recommended_by", "certified_by", "transmitted_by", "class_name", "level", "received_place"].map((key) => [key, 0]),
    ) as Record<import("@/types/options").OptionCategory, number>;
    return <OptionsManager options={[]} total={0} unassigned={unassigned} templeId={null} temples={temples} canSelectTemple={access.role === "super_admin"} />;
  }
  const stats = await getRegistryOptionStats(templeId);
  return <OptionsManager {...stats} temples={temples} canSelectTemple={access.role === "super_admin"} />;
}
