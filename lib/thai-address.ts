import data from "./data/thai-addresses.json";
export const thaiAddresses: Record<string, Record<string, string[][]>> = data;
export interface AddressParts {
  detail: string;
  province?: string;
  district?: string;
  subdistrict?: string;
}
export function joinAddress(parts: AddressParts): string {
  const bangkok = parts.province === "กรุงเทพมหานคร";
  const postal = thaiAddresses[parts.province ?? ""]?.[
    parts.district ?? ""
  ]?.find(([name]) => name === parts.subdistrict)?.[1];
  return [
    parts.detail.trim(),
    parts.subdistrict && `${bangkok ? "แขวง" : "ต."}${parts.subdistrict}`,
    parts.district && `${bangkok ? "เขต" : "อ."}${parts.district}`,
    parts.province && `จ.${parts.province}`,
    postal,
  ]
    .filter(Boolean)
    .join(" ");
}
// Only split a recognized suffix. Legacy free-text addresses remain intact.
export function splitAddress(value: string | null | undefined): AddressParts {
  if (!value) return { detail: "" };
  const match = value.match(
    /^(.*?)\s*(?:(?:ต\.|แขวง)(\S+) )?(?:(?:อ\.|เขต)(\S+) )?จ\.(\S+)(?: (\d{5}))?$/,
  );
  if (!match) return { detail: value };
  const [, detail, subdistrict, district, province] = match;
  if (
    !thaiAddresses[province] ||
    (district && !thaiAddresses[province][district]) ||
    (subdistrict &&
      !thaiAddresses[province][district]?.some(
        ([name]) => name === subdistrict,
      ))
  )
    return { detail: value };
  const parts = { detail, province, district, subdistrict };
  return joinAddress(parts) === value.trim() ? parts : { detail: value };
}
