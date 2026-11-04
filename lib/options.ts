import "server-only";
import { requireUser } from "@/lib/auth";
import {
  optionCategories,
  type OptionCategory,
  type RegistryOption,
} from "@/types/options";
import {
  createOptionCounts,
  addOptionCounts,
  countedOptions,
} from "@/lib/option-counts";
export async function getRegistryOptions(
  category?: OptionCategory,
  requestedTempleId?: string,
): Promise<RegistryOption[]> {
  const { supabase, access } = await requireUser();
  const result: RegistryOption[] = [];
  const templeId = access.role === "super_admin" ? requestedTempleId : access.temple_id;
  for (let offset = 0; ; offset += 500) {
    let query = supabase.from("registry_options").select("*");
    if (templeId) query = query.eq("temple_id", templeId);
    if (category) query = query.eq("category", category);
    const { data, error } = await query
      .order("category")
      .order("value")
      .order("id")
      .range(offset, offset + 499);
    if (error)
      throw new Error(
        "ไม่สามารถโหลดตัวเลือกได้ กรุณาติดตั้ง migration ข้อมูลตัวเลือกก่อน",
      );
    result.push(...data);
    if (data.length < 500) break;
  }
  return result;
}

export async function getRegistryOptionStats(templeId: string) {
  const { supabase, access } = await requireUser();
  const scopedTempleId = access.role === "super_admin" ? templeId : access.temple_id;
  if (!scopedTempleId) throw new Error("กรุณาเลือกสถานธรรม");
  const options = await getRegistryOptions(undefined, scopedTempleId);
  const counts = createOptionCounts();
  let total = 0;
  // Count all rows, not only the first API page; never send recipient details to the UI.
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("dharma_recipients")
      .select(
        "recommended_by, certified_by, transmitted_by, class_name, level, received_place",
      )
      .eq("temple_id", scopedTempleId)
      .order("id")
      .range(offset, offset + 499);
    if (error)
      throw new Error("ไม่สามารถนับจำนวนผู้รับธรรมะได้ กรุณาลองอีกครั้ง");
    addOptionCounts(counts, data);
    total += data.length;
    if (data.length < 500) break;
  }
  const unassigned = Object.fromEntries(
    optionCategories.map((category) => [
      category,
      total -
        [...counts[category].values()].reduce((sum, count) => sum + count, 0),
    ]),
  ) as Record<OptionCategory, number>;
  return { options: countedOptions(options, counts), total, unassigned, templeId: scopedTempleId };
}
