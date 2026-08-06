import { expect, test } from "bun:test";
import { isStalePending } from "./invitation.service";

const HOUR = 60 * 60 * 1000;
const now = new Date("2026-08-06T12:00:00Z");

test("a pending invitation past its expiry is stale", () => {
  expect(isStalePending({ status: "pending", expiresAt: new Date(now.getTime() - HOUR) }, now)).toBe(true);
});

test("a pending invitation still in date is not stale", () => {
  expect(isStalePending({ status: "pending", expiresAt: new Date(now.getTime() + HOUR) }, now)).toBe(false);
});

test("expiry exactly at now counts as stale", () => {
  // <= rather than <, so an invitation never sits in a one-instant limbo where
  // it is neither acceptable (acceptInvitation rejects it) nor re-invitable.
  expect(isStalePending({ status: "pending", expiresAt: new Date(now.getTime()) }, now)).toBe(true);
});

test("only pending invitations go stale — settled ones keep their outcome", () => {
  const lapsed = new Date(now.getTime() - HOUR);
  for (const status of ["accepted", "declined", "cancelled", "expired"] as const) {
    expect(`${status}: ${isStalePending({ status, expiresAt: lapsed }, now)}`).toBe(`${status}: false`);
  }
});

test("a missing expiresAt is never stale", () => {
  // Defensive: expiresAt is required by the schema, but treating "unknown" as
  // expired would silently retire live invitations.
  expect(isStalePending({ status: "pending" }, now)).toBe(false);
  expect(isStalePending({ status: "pending", expiresAt: null }, now)).toBe(false);
});
