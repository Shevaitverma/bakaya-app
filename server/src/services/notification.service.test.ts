import { expect, test } from "bun:test";
import { selectStaleTokens } from "./notification.service";

test("selectStaleTokens prunes only permanently-invalid tokens", () => {
  const tokens = ["good", "dead", "transient", "invalid"];
  const responses = [
    { success: true },
    { success: false, error: { code: "messaging/registration-token-not-registered" } },
    { success: false, error: { code: "messaging/internal-error" } }, // transient — keep
    { success: false, error: { code: "messaging/invalid-argument" } },
  ];
  expect(selectStaleTokens(tokens, responses)).toEqual(["dead", "invalid"]);
});

test("selectStaleTokens returns empty when all succeed", () => {
  expect(selectStaleTokens(["a", "b"], [{ success: true }, { success: true }])).toEqual([]);
});
