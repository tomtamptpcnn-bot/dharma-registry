import assert from "node:assert/strict";
import test from "node:test";
import { formatDateTime } from "../lib/format";

test("activity timestamps display Bangkok time, seconds and Buddhist years", () => {
  assert.equal(
    formatDateTime("2026-09-25T06:04:05Z"),
    "25/09/2569 13:04:05 น.",
  );
  assert.equal(
    formatDateTime("2026-09-25T13:04:05+07:00"),
    "25/09/2569 13:04:05 น.",
  );
  assert.equal(
    formatDateTime("2025-12-31T17:00:00Z"),
    "01/01/2569 00:00:00 น.",
  );
  assert.equal(formatDateTime(null), "—");
});
