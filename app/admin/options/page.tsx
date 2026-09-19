import { getRegistryOptionStats } from "@/lib/options";
import { OptionsManager } from "@/components/admin/options-manager";
export default async function OptionsPage() {
  return <OptionsManager {...await getRegistryOptionStats()} />;
}
