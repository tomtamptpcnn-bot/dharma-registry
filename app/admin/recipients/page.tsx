import { getRegistryOptions } from "@/lib/options";
import { listRecipients, type ListFilters } from "@/lib/recipients";
import { RecipientList } from "@/components/recipients/recipient-list";
export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<ListFilters>;
}) {
  const filters = await searchParams;
  const [result, options] = await Promise.all([
    listRecipients(filters),
    getRegistryOptions(),
  ]);
  return <RecipientList {...result} filters={filters} options={options} />;
}
