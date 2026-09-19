import {
  optionCategories,
  type OptionCategory,
  type RegistryOption,
} from "@/types/options";
import type { DharmaRecipient } from "@/types/recipient";
export type RecipientOptionValues = Pick<DharmaRecipient, OptionCategory>;
export type CountedOption = RegistryOption & { recipientCount: number };
export function createOptionCounts() {
  return Object.fromEntries(
    optionCategories.map((category) => [category, new Map<string, number>()]),
  ) as Record<OptionCategory, Map<string, number>>;
}
export function addOptionCounts(
  counts: ReturnType<typeof createOptionCounts>,
  recipients: RecipientOptionValues[],
) {
  for (const recipient of recipients) {
    for (const category of optionCategories) {
      const value = recipient[category];
      if (value !== null && value.trim() !== "") {
        counts[category].set(value, (counts[category].get(value) ?? 0) + 1);
      }
    }
  }
}
export function countedOptions(
  options: RegistryOption[],
  counts: ReturnType<typeof createOptionCounts>,
): CountedOption[] {
  return options.map((option) => ({
    ...option,
    recipientCount: counts[option.category].get(option.value) ?? 0,
  }));
}
