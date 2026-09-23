import test from "node:test";
import assert from "node:assert/strict";
import { joinAddress, splitAddress, thaiAddresses } from "../lib/thai-address";
import { formatDate } from "../lib/format";
test("address choices cover provinces and Waeng Noi, Khon Kaen", () => {
  assert.equal(Object.keys(thaiAddresses).length, 77);
  assert.ok(
    thaiAddresses["ขอนแก่น"]["แวงน้อย"].some(([name]) => name === "แวงน้อย"),
  );
  const parts = {
    detail: "12/3 หมู่ 4",
    province: "ขอนแก่น",
    district: "แวงน้อย",
    subdistrict: "แวงน้อย",
  };
  assert.equal(
    joinAddress(parts),
    "12/3 หมู่ 4 ต.แวงน้อย อ.แวงน้อย จ.ขอนแก่น 40230",
  );
  assert.deepEqual(splitAddress(joinAddress(parts)), parts);
});
test("legacy addresses survive without guessing and partial selections reopen", () => {
  for (const value of [
    "บ้านหนองทอน",
    "12 ถนนเดิม อำเภอแวงน้อย จังหวัดขอนแก่น",
    "12 จ.ไม่มีจริง",
  ]) {
    assert.deepEqual(splitAddress(value), { detail: value });
  }
  for (const parts of [
    { detail: "", province: "ขอนแก่น" },
    { detail: "12", province: "ขอนแก่น", district: "แวงน้อย" },
  ]) {
    assert.equal(
      joinAddress(splitAddress(joinAddress(parts))),
      joinAddress(parts),
    );
  }
});
test("Bangkok uses khwaeng and khet and reopens correctly", () => {
  const parts = {
    detail: "1",
    province: "กรุงเทพมหานคร",
    district: "พระนคร",
    subdistrict: "พระบรมมหาราชวัง",
  };
  assert.match(joinAddress(parts), /แขวงพระบรมมหาราชวัง เขตพระนคร/);
  assert.deepEqual(splitAddress(joinAddress(parts)), parts);
});
test("dates use Buddhist years including leap days and year boundaries", () => {
  assert.equal(formatDate("2024-02-29"), "29/02/2567");
  assert.equal(formatDate("2025-12-31"), "31/12/2568");
  assert.equal(formatDate("2026-01-01"), "01/01/2569");
  assert.equal(formatDate(null), "—");
});
