import { expect, test } from "bun:test";
import { isOverLimit, windowStartFor } from "./rateLimit";

test("isOverLimit blocks only once the count exceeds the max", () => {
  expect(isOverLimit({ count: 10, resetAt: 0 }, 10)).toBe(false);
  expect(isOverLimit({ count: 11, resetAt: 0 }, 10)).toBe(true);
});

test("isOverLimit fails open when the shared counter is unavailable", () => {
  expect(isOverLimit(null, 10)).toBe(false);
  expect(isOverLimit(null, 0)).toBe(false);
});

test("windowStartFor buckets to fixed boundaries so instances agree", () => {
  expect(windowStartFor(60_000, 60_000)).toBe(60_000);
  expect(windowStartFor(119_999, 60_000)).toBe(60_000);
  expect(windowStartFor(120_000, 60_000)).toBe(120_000);
});
