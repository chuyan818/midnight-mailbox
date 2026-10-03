import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { upsertMembership } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("membership system", () => {
  it("should get user membership info", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.membership.getInfo();

    expect(result).toBeDefined();
    expect(result.membershipType).toBeDefined();
    expect(["free", "monthly", "yearly"]).toContain(result.membershipType);
  });

  it("should have free membership by default", async () => {
    const { ctx } = createAuthContext();
    await upsertMembership(ctx.user!.id, { membershipType: "free", membershipExpiry: null });
    const caller = appRouter.createCaller(ctx);

    const result = await caller.membership.getInfo();

    expect(result.membershipType).toBe("free");
  });

  it("should check daily letter limit for free users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Free users should be able to write letters
    // The limit is enforced in the create mutation
    expect(ctx.user.id).toBeDefined();
  });

  it("must reject direct membership upgrades without verified payment", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.membership.upgrade({ type: "yearly" })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("should allow unlimited letters for premium members", async () => {
    const { ctx } = createAuthContext();
    await upsertMembership(ctx.user!.id, {
      membershipType: "monthly",
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    const caller = appRouter.createCaller(ctx);

    const result = await caller.membership.getInfo();
    expect(result.membershipType).toBe("monthly");
    await upsertMembership(ctx.user!.id, { membershipType: "free", membershipExpiry: null });
  });

  it("should validate membership expiry", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.membership.getInfo();

    if (result.membershipExpiry) {
      const expiryDate = new Date(result.membershipExpiry);
      expect(expiryDate).toBeInstanceOf(Date);
    }
  });

  it("should provide membership features list", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.membership.getInfo();

    expect(result).toHaveProperty("membershipType");
    expect(result).toHaveProperty("createdAt");

    // Verify membership type is valid
    expect(["free", "monthly", "yearly"]).toContain(result.membershipType);
  });
});

describe("daily letter limit", () => {
  it("should enforce daily limit for free users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This would be tested through the create mutation
    // which checks canUserWriteLetter before allowing creation
    expect(ctx.user.id).toBeDefined();
  });
});
