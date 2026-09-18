import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import MembershipBadge from "./MembershipBadge";

describe("MembershipBadge rendering", () => {
  it.each([
    ["free", "普通用户", "👤"],
    ["standard", "标准会员", "⭐"],
    ["premium", "高级会员", "👑"],
  ] as const)("renders the %s tier and its tooltip", (tier, label, icon) => {
    const markup = renderToStaticMarkup(<MembershipBadge tier={tier} size="small" />);
    expect(markup).toContain(label);
    expect(markup).toContain(icon);
    expect(markup).toContain("会员");
  });
});
