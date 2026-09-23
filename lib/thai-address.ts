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
function escapePattern(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Match from the end so village/street names are not mistaken for districts.
function takeSuffix(
  value: string,
  names: string[],
  prefix: string,
  allowBare = false,
) {
  for (const name of [...names].sort((a, b) => b.length - a.length)) {
    const pattern = new RegExp(`(?:${prefix})\\s*${escapePattern(name)}$`);
    const match = pattern.exec(value);
    if (match) return { name, rest: value.slice(0, match.index).trim() };
    if (allowBare && (value === name || value.endsWith(` ${name}`))) {
      return { name, rest: value.slice(0, -name.length).trim() };
    }
  }
  return undefined;
}

export function splitAddress(value: string | null | undefined): AddressParts {
  if (!value) return { detail: "" };
  const original = { detail: value };
  let text = value.trim();
  const postal = text.match(/(?:\s*)(\d{5})$/)?.[1];
  if (postal) text = text.slice(0, -postal.length).trim();
  // Normalize Bangkok aliases only at the province position.
  text = text.replace(/(?:กรุงเทพฯ|กทม\.?)$/, "กรุงเทพมหานคร");
  const province = takeSuffix(
    text,
    Object.keys(thaiAddresses),
    "จังหวัด|จ\\.|(?=กรุงเทพมหานคร)",
    true,
  );
  if (!province) return original;
  const districts = thaiAddresses[province.name];
  const district = takeSuffix(
    province.rest,
    Object.keys(districts),
    "อำเภอ|อําเภอ|อ\\.|เขต",
    true,
  );
  const subdistrict =
    district &&
    takeSuffix(
      district.rest,
      districts[district.name].map(([name]) => name),
      "ตำบล|ตําบล|ต\\.|แขวง",
      true,
    );
  const detail = subdistrict?.rest ?? district?.rest ?? province.rest;
  // A labeled but unrecognized area must not silently become a different area.
  if (/(?:จังหวัด|จ\.|อำเภอ|อําเภอ|อ\.|เขต|ตำบล|ตําบล|ต\.|แขวง)/.test(detail))
    return original;
  // A bare province alone might be a street or village name; require a district.
  if (
    !district &&
    !/(?:จังหวัด|จ\.)\s*\S+$/.test(text) &&
    province.name !== "กรุงเทพมหานคร"
  )
    return original;
  const expectedPostal =
    subdistrict &&
    districts[district!.name].find(([name]) => name === subdistrict.name)?.[1];
  // Preserve an explicit postal code we cannot safely reproduce.
  if (postal && postal !== expectedPostal) return original;
  return {
    detail,
    province: province.name,
    district: district?.name,
    subdistrict: subdistrict?.name,
  };
}
