import { describe, expect, it } from "vitest";
import { isSupportRequestValid } from "./support-form";

describe("support request validation", () => {
  it("requires a meaningful subject and description", () => {
    expect(isSupportRequestValid("账单问题", "请帮我核对这次订阅扣款")).toBe(true);
    expect(isSupportRequestValid(" ", "完整的问题描述")).toBe(false);
    expect(isSupportRequestValid("标题", "太短")).toBe(false);
  });
});
