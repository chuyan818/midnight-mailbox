import { describe, expect, it } from "vitest";
import { DEFAULT_OAUTH_PORTAL_URL, resolveOAuthPortalUrl } from "@/const";

describe("OAuth portal URL resolution", () => {
  it("uses the Manus OAuth portal when Railway omits the variable", () => {
    expect(resolveOAuthPortalUrl()).toBe(DEFAULT_OAUTH_PORTAL_URL);
  });

  it("falls back when the configured value is not a valid absolute URL", () => {
    expect(resolveOAuthPortalUrl("undefined/app-auth")).toBe(DEFAULT_OAUTH_PORTAL_URL);
    expect(resolveOAuthPortalUrl("not a url")).toBe(DEFAULT_OAUTH_PORTAL_URL);
  });

  it("normalizes a configured portal URL to its origin", () => {
    expect(resolveOAuthPortalUrl("https://oauth.example.com/custom/path")).toBe("https://oauth.example.com");
  });
});
