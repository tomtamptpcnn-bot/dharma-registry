import { getRegistryOptionStats } from "@/lib/options";
import { OptionsManager } from "@/components/admin/options-manager";
import { requireUser } from "@/lib/auth";
export default async function OptionsPage({ searchParams }: { searchParams: Promise<{ temple?: string }> }) {
  const { supabase, access } = await requireUser();
  let temples: { id: string; name: string }[] = [];
  let templeId = access.temple_id;
  if (access.role === "super_admin") {
    const [{ data }, params] = await Promise.all([
      supabase.from("dharma_temples").select("id,name").order("name"),
      searchParams,
    ]);
    temples = data ?? [];
    templeId = temples.find((temple) => temple.id === params.temple)?.id ?? temples[0]?.id ?? null;
  }
  if (!templeId) throw new Error("ไม่พบสถานธรรมสำหรับจัดการตัวเลือก");
  const stats = await getRegistryOptionStats(templeId);
  return <OptionsManager {...stats} temples={temples} canSelectTemple={access.role === "super_admin"} />;
}
