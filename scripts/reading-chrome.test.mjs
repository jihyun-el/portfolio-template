import assert from "node:assert/strict";
import test from "node:test";
import { readingRange, advanceReadingShift, settledReadingShift } from "./reading-chrome.mjs";
const dimensions = { sideHeight: 240, keepHeight: 60, headerHeight: 100 };
test("two side rails stay open; either rail can independently move across the top", () => {
  assert.equal(readingRange(dimensions), 0);
  assert.equal(readingRange({ ...dimensions, outerAcross: true }), 180);
  assert.equal(readingRange({ ...dimensions, detailAcross: true }), 100);
  assert.equal(readingRange({ ...dimensions, outerAcross: true, detailAcross: true }), 280);
});
test("reading down hides only the available chrome and reading up reveals it", () => {
  assert.equal(advanceReadingShift(0, 120, 280, 120), -120);
  assert.equal(advanceReadingShift(-120, 500, 280, 620), -280);
  assert.equal(advanceReadingShift(-280, -100, 280, 520), -180);
  assert.equal(advanceReadingShift(-180, -500, 280, 20), 0);
});
test("top and resize constraints prevent a blank strip or a positive shift", () => {
  assert.equal(advanceReadingShift(-280, 0, 100, 300), -100);
  assert.equal(advanceReadingShift(-100, 0, 100, 20), -20);
  assert.equal(advanceReadingShift(-100, -50, 0, 300), 0);
  assert.equal(settledReadingShift(true, 280, 600), -280);
  assert.equal(settledReadingShift(false, 280, 600), 0);
  assert.equal(settledReadingShift(true, 280, 10), 0);
});
