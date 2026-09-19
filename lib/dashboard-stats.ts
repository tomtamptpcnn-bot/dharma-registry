import type { DharmaRecipient } from "@/types/recipient";
import { optionCategories } from "@/types/options";
export type DashboardRow = Pick<
  DharmaRecipient,
  | "age"
  | "phone"
  | "address"
  | "received_date"
  | "merit_amount"
  | (typeof optionCategories)[number]
>;
export function summarizeDashboard(rows: DashboardRow[], today: string) {
  const month = today.slice(0, 7);
  const year = today.slice(0, 4);
  const money = (items: DashboardRow[]) =>
    items.reduce((sum, r) => sum + Math.round((r.merit_amount ?? 0) * 100), 0) /
    100;
  const thisMonth = rows.filter(
    (r) =>
      r.received_date &&
      r.received_date.startsWith(month) &&
      r.received_date <= today,
  );
  const thisYear = rows.filter(
    (r) =>
      r.received_date &&
      r.received_date.startsWith(year) &&
      r.received_date <= today,
  );
  const years = [
    ...new Set([
      year,
      ...rows.flatMap((r) =>
        r.received_date ? [r.received_date.slice(0, 4)] : [],
      ),
    ]),
  ]
    .sort()
    .reverse();
  const monthly = years.map((y) => ({
    year: y,
    months: Array.from({ length: 12 }, (_, i) => {
      const key = `${y}-${String(i + 1).padStart(2, "0")}`;
      const selected = rows.filter((r) => r.received_date?.startsWith(key));
      return { month: key, count: selected.length, merit: money(selected) };
    }),
  }));
  const groups = optionCategories.map((category) => {
    const counts = new Map<string, number>();
    let missing = 0;
    for (const row of rows) {
      const value = row[category];
      if (!value?.trim()) missing++;
      else counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return {
      category,
      missing,
      items: [...counts]
        .map(([name, count]) => ({ name, count }))
        .sort(
          (a, b) => b.count - a.count || a.name.localeCompare(b.name, "th"),
        ),
    };
  });
  const missing = [
    {
      label: "ยังไม่ระบุวันที่รับธรรม",
      count: rows.filter((r) => !r.received_date).length,
    },
    {
      label: "ยังไม่ระบุเบอร์โทร",
      count: rows.filter((r) => !r.phone?.trim()).length,
    },
    {
      label: "ยังไม่ระบุที่อยู่",
      count: rows.filter((r) => !r.address?.trim()).length,
    },
    {
      label: "ยังไม่ระบุอายุ",
      count: rows.filter((r) => r.age === null).length,
    },
    {
      label: "ยังไม่ระบุยอดสร้างบุญ",
      count: rows.filter((r) => r.merit_amount === null).length,
    },
  ];
  const ageRanges = [
    { name: "ต่ำกว่า 20 ปี", min: 0, max: 19 },
    { name: "20–39 ปี", min: 20, max: 39 },
    { name: "40–59 ปี", min: 40, max: 59 },
    { name: "60 ปีขึ้นไป", min: 60, max: 150 },
  ].map((range) => ({
    name: range.name,
    count: rows.filter(
      (r) => r.age !== null && r.age >= range.min && r.age <= range.max,
    ).length,
  }));
  return {
    today,
    total: rows.length,
    monthCount: thisMonth.length,
    yearCount: thisYear.length,
    totalMerit: money(rows),
    monthMerit: money(thisMonth),
    knownMerit: rows.filter((r) => r.merit_amount !== null).length,
    monthly,
    groups,
    missing,
    ageRanges,
    future: rows.filter((r) => r.received_date && r.received_date > today)
      .length,
  };
}
export type DashboardStats = ReturnType<typeof summarizeDashboard>;
