import { expect, test } from "bun:test";
import { isIatRevoked } from "./tokenRevocation";
import { parseExpiryToSeconds } from "@/models/TokenRevocation";

test("isIatRevoked rejects only tokens issued before the revocation timestamp", () => {
  expect(isIatRevoked(1000, 1001)).toBe(true);
  expect(isIatRevoked(1001, 1001)).toBe(false); // strictly-less-than
  expect(isIatRevoked(1002, 1001)).toBe(false);
});

test("isIatRevoked allows when the user has no revocation entry", () => {
  expect(isIatRevoked(1000, null)).toBe(false);
  expect(isIatRevoked(undefined, null)).toBe(false);
});

test("isIatRevoked fails closed when the lookup errored", () => {
  expect(isIatRevoked(1000, "error")).toBe(true);
  expect(isIatRevoked(undefined, "error")).toBe(true);
});

test("parseExpiryToSeconds handles the units jose accepts, else falls back", () => {
  expect(parseExpiryToSeconds("90d")).toBe(7776000);
  expect(parseExpiryToSeconds("15m")).toBe(900);
  expect(parseExpiryToSeconds("2 h")).toBe(7200);
  expect(parseExpiryToSeconds("2 days", 42)).toBe(42);
  expect(parseExpiryToSeconds("", 42)).toBe(42);
});
