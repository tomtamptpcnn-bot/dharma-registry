import { getRecipient } from "@/lib/recipients";
import { RecipientDetail } from "@/components/recipients/recipient-detail";
export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RecipientDetail recipient={await getRecipient(id)} />;
}
