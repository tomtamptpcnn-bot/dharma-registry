export const optionCategories = [
  "recommended_by",
  "certified_by",
  "transmitted_by",
  "class_name",
  "level",
  "received_place",
] as const;
export type OptionCategory = (typeof optionCategories)[number];
export const optionLabels: Record<OptionCategory, string> = {
  recommended_by: "อาจารย์แนะนำ",
  certified_by: "อาจารย์รับรอง",
  transmitted_by: "อาจารย์ถ่ายทอดเบิกธรรม",
  class_name: "ชั้น",
  level: "ระดับ",
  received_place: "สถานที่รับธรรม",
};
export type RegistryOption = {
  id: string;
  category: OptionCategory;
  value: string;
  created_at: string;
};
