import { getRegistryOptions } from "@/lib/options";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { getRecipient } from "@/lib/recipients";
export default async function EditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [recipient, options] = await Promise.all([
    getRecipient(id),
    getRegistryOptions(),
  ]);
  return <RecipientForm recipient={recipient} options={options} />;
}
