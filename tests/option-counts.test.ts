import test from "node:test";
import assert from "node:assert/strict";
import {
  createOptionCounts,
  addOptionCounts,
  countedOptions,
  type RecipientOptionValues,
} from "../lib/option-counts";
test("counts across batches, separates categories and includes unused options", () => {
  const counts = createOptionCounts();
  const row: RecipientOptionValues = {
    recommended_by: "Teacher",
    transmitted_by: null,
    certified_by: "Teacher",
    class_name: null,
    level: "c",
    received_place: "Place",
  };
  addOptionCounts(
    counts,
    Array.from({ length: 500 }, () => row),
  );
  addOptionCounts(counts, [
    { ...row, certified_by: null },
    { ...row, recommended_by: null, class_name: " ", level: null },
  ]);
  const result = countedOptions(
    [
      { id: "1", category: "recommended_by", value: "Teacher", created_at: "" },
      { id: "2", category: "certified_by", value: "Teacher", created_at: "" },
      { id: "3", category: "class_name", value: "Unused", created_at: "" },
    ],
    counts,
  );
  assert.deepEqual(
    result.map((r) => r.recipientCount),
    [501, 501, 0],
  );
  assert.equal(counts.received_place.get("Place"), 502);
  assert.equal(counts.level.get("c"), 501);
  assert.equal(counts.class_name.size, 0);
});
test("empty registry produces zero counts", () => {
  assert.deepEqual(countedOptions([], createOptionCounts()), []);
});
