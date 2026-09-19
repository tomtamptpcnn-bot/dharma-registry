import test from "node:test";
import assert from "node:assert/strict";
import { summarizeDashboard, type DashboardRow } from "../lib/dashboard-stats";
const row: DashboardRow = {
  age: 0,
  phone: null,
  address: null,
  received_date: "2026-09-18",
  merit_amount: 0.1,
  recommended_by: "A",
  certified_by: "A",
  class_name: null,
  level: "c",
  received_place: "Place",
};
test("dashboard respects date boundaries, missing values and exact money", () => {
  const stats = summarizeDashboard(
    [
      row,
      { ...row, received_date: "2026-09-19", merit_amount: 0.2 },
      { ...row, received_date: "2025-12-28", merit_amount: null, age: null },
      { ...row, received_date: null, merit_amount: 0 },
    ],
    "2026-09-18",
  );
  assert.equal(stats.total, 4);
  assert.equal(stats.monthCount, 1);
  assert.equal(stats.yearCount, 1);
  assert.equal(stats.totalMerit, 0.3);
  assert.equal(stats.monthMerit, 0.1);
  assert.equal(stats.knownMerit, 3);
  assert.equal(stats.future, 1);
  assert.equal(
    stats.monthly.find((y) => y.year === "2026")?.months[8].count,
    2,
  );
  assert.equal(
    stats.monthly.find((y) => y.year === "2026")?.months[8].merit,
    0.3,
  );
  assert.equal(
    stats.groups.find((g) => g.category === "class_name")?.missing,
    4,
  );
  assert.equal(
    stats.groups.find((g) => g.category === "recommended_by")?.items[0].count,
    4,
  );
  assert.equal(stats.ageRanges[0].count, 3);
});
test("empty dashboard has twelve empty months and zero totals", () => {
  const stats = summarizeDashboard([], "2026-01-01");
  assert.equal(stats.total, 0);
  assert.equal(stats.monthly[0].months.length, 12);
  assert.equal(stats.totalMerit, 0);
  assert.ok(stats.groups.every((g) => g.items.length === 0 && g.missing === 0));
});
