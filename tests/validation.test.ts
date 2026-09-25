import assert from "node:assert/strict";
import test from "node:test";
import { formatTimeRange } from "../lib/format";
import { recipientSchema, safeSearch } from "../lib/validation";
const valid = {
  full_name: "  สมชาย ใจดี  ",
  age: null,
  nickname: null,
  address: null,
  phone: "0812345678",
  recommended_by: null,
  transmitted_by: null,
  certified_by: null,
  received_date: "2024-02-29",
  received_time: null,
  received_end_time: null,
  merit_amount: 100.25,
  class_name: null,
  level: null,
  received_place: null,
};
test("validates and trims a real recipient input", () => {
  assert.equal(recipientSchema.parse(valid).full_name, "สมชาย ใจดี");
});
test("rejects invalid names, phones, ages, amounts and dates", () => {
  for (const patch of [
    { full_name: " " },
    { phone: "081-234" },
    { age: 1.2 },
    { age: -1 },
    { merit_amount: -1 },
    { merit_amount: 1.001 },
    { received_date: "2025-02-29" },
    { received_date: "garbage" },
  ]) {
    assert.equal(
      recipientSchema.safeParse({ ...valid, ...patch }).success,
      false,
      JSON.stringify(patch),
    );
  }
});
test("permits optional fields and zero amounts", () => {
  assert.equal(
    recipientSchema.safeParse({
      ...valid,
      phone: null,
      received_date: null,
      age: 0,
      merit_amount: 0,
    }).success,
    true,
  );
});
test("search removes PostgREST operators and SQL wildcards", () => {
  assert.equal(
    /[(),.%_\\"']/.test(safeSearch("a%,full_name.eq.x_(test)")),
    false,
  );
  assert.equal(safeSearch("ก".repeat(120)).length, 100);
});

test("validates optional reception time ranges", () => {
  for (const [received_time, received_end_time] of [
    [null, null],
    ["09:00", "11:00"],
    ["00:00", "23:59"],
  ]) {
    assert.equal(
      recipientSchema.safeParse({ ...valid, received_time, received_end_time })
        .success,
      true,
    );
  }
  for (const [received_time, received_end_time] of [
    ["09:00", null],
    [null, "11:00"],
    ["11:00", "09:00"],
    ["09:00", "09:00"],
    ["23:00", "01:00"],
    ["24:00", "25:00"],
    ["09:00", "11:60"],
    ["9:00", "11:00"],
    ["09:00:00", "11:00"],
    ["", "garbage"],
  ]) {
    assert.equal(
      recipientSchema.safeParse({ ...valid, received_time, received_end_time })
        .success,
      false,
    );
  }
});

test("formats database times as a range and preserves legacy start times", () => {
  assert.equal(formatTimeRange("13:00:00", "15:00:00"), "13:00–15:00");
  assert.equal(formatTimeRange(null, null), "—");
  assert.equal(formatTimeRange("09:00:00", null), "09:00");
});
