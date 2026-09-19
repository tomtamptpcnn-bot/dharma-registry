import { RecipientForm } from "@/components/recipients/recipient-form";
import { getRegistryOptions } from "@/lib/options";
export default async function CreatePage() {
  return <RecipientForm options={await getRegistryOptions()} />;
}
