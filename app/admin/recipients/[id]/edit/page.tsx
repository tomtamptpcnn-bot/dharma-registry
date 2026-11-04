import { getRegistryOptions } from "@/lib/options";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { getRecipient } from "@/lib/recipients";
export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipient = await getRecipient(id);
  const options = await getRegistryOptions(undefined, recipient.temple_id);
  return <RecipientForm recipient={recipient} options={options} />;
}
