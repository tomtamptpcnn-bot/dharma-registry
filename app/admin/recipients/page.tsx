import { getRegistryOptions } from "@/lib/options";
import { listRecipients, type ListFilters } from "@/lib/recipients";
import { RecipientList } from "@/components/recipients/recipient-list";
import { requireUser } from "@/lib/auth";
export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<ListFilters>;
}) {
  const filters = await searchParams;
  const { supabase, access } = await requireUser();
  let temples: { id: string; name: string }[] = [];
  if (access.role === "super_admin") {
    const { data } = await supabase.from("dharma_temples").select("id,name").order("name");
    temples = data ?? [];
  }
  const [result, options] = await Promise.all([
    listRecipients(filters),
    getRegistryOptions("level", filters.temple),
  ]);
  return <RecipientList {...result} filters={filters} options={options} temples={temples} canSelectTemple={access.role === "super_admin"} />;
}
