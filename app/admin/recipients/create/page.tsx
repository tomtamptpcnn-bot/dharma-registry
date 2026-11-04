import { RecipientForm } from "@/components/recipients/recipient-form";
import { getRegistryOptions } from "@/lib/options";
import { requireUser } from "@/lib/auth";
export default async function CreatePage({ searchParams }: { searchParams: Promise<{ temple?: string }> }) {
  const { supabase, access } = await requireUser();
  let templeId = access.temple_id ?? undefined;
  let temples: { id: string; name: string }[] = [];
  if (access.role === "super_admin") {
    const [{ data }, params] = await Promise.all([
      supabase.from("dharma_temples").select("id,name").order("name"),
      searchParams,
    ]);
    temples = data ?? [];
    templeId = temples.find((temple) => temple.id === params.temple)?.id ?? temples[0]?.id;
  }
  return <RecipientForm options={await getRegistryOptions(undefined, templeId)} temples={temples} initialTempleId={templeId} />;
}
