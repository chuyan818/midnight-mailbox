import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";
import { hashPassword, verifyPassword } from "./auth/email-auth";

const state: {
  securityQuestion: string | null;
  securityAnswerHash: string | null;
  securityQuestionUpdatedAt: Date | null;
  passwordHash: string;
} = {
  securityQuestion: null,
  securityAnswerHash: null,
  securityQuestionUpdatedAt: null,
  passwordHash: "",
};

const fakeDb = {
  select() {
    return {
      from() {
        return {
          where() {
            return {
              limit: async () => [{ ...state }],
            };
          },
        };
      },
    };
  },
  update() {
    return {
      set(values: Record<string, unknown>) {
        return {
          where: async () => {
            if ("securityQuestion" in values) state.securityQuestion = values.securityQuestion as string | null;
            if ("securityAnswerHash" in values) state.securityAnswerHash = values.securityAnswerHash as string | null;
            if ("securityQuestionUpdatedAt" in values) state.securityQuestionUpdatedAt = values.securityQuestionUpdatedAt as Date | null;
            if ("passwordHash" in values) state.passwordHash = values.passwordHash as string;
            return [];
          },
        };
      },
    };
  },
};

vi.mock("./db", async () => {
  const actual = await vi.importActual<typeof import("./db")>("./db");
  return { ...actual, getDb: async () => fakeDb };
});

const { appRouter } = await import("./routers");

function createContext(user: TrpcContext["user"]): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("security settings end-to-end route flow", () => {
  beforeEach(async () => {
    state.securityQuestion = null;
    state.securityAnswerHash = null;
    state.securityQuestionUpdatedAt = null;
    state.passwordHash = await hashPassword("CurrentPass123");
  });

  it("supports first setup, verification, answer change, and password reset", async () => {
    const user = {
      id: 42,
      openId: "security-flow-user",
      email: "security@example.com",
      name: "Security Flow",
      loginMethod: "email",
      role: "user" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const caller = appRouter.createCaller(createContext(user));

    expect(await caller.security.get()).toMatchObject({ configured: false, question: null });

    const firstSave = await caller.security.update({
      question: "你最喜欢的书籍或电影是什么？",
      answer: "星际穿越",
    });
    expect(firstSave).toEqual({ success: true });
    expect(state.securityQuestion).toBe("你最喜欢的书籍或电影是什么？");
    expect(state.securityAnswerHash).not.toBe("星际穿越");
    expect(await verifyPassword("星际穿越", state.securityAnswerHash!)).toBe(true);

    expect(await caller.security.get()).toMatchObject({
      configured: true,
      question: "你最喜欢的书籍或电影是什么？",
    });
    expect(await caller.security.verify({ answer: "错误答案" })).toEqual({ configured: true, verified: false });
    expect(await caller.security.verify({ answer: "星际穿越" })).toEqual({ configured: true, verified: true });

    await expect(caller.security.update({
      currentAnswer: "错误答案",
      question: "你出生的城市是哪里？",
      answer: "杭州",
    })).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    await expect(caller.security.update({
      currentAnswer: "星际穿越",
      question: "你出生的城市是哪里？",
      answer: "杭州",
    })).resolves.toEqual({ success: true });
    expect(await caller.security.verify({ answer: "星际穿越" })).toEqual({ configured: true, verified: false });
    expect(await caller.security.verify({ answer: "杭州" })).toEqual({ configured: true, verified: true });

    await expect(caller.security.reset({ currentPassword: "WrongPass123" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.security.reset({ currentPassword: "CurrentPass123" })).resolves.toEqual({ success: true });
    expect(await caller.security.get()).toMatchObject({ configured: false, question: null });
    expect(state.securityAnswerHash).toBeNull();
  });

  it("rejects all security procedures without an authenticated user", async () => {
    const caller = appRouter.createCaller(createContext(null));
    await expect(caller.security.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.security.verify({ answer: "some answer" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(caller.security.reset({ currentPassword: "CurrentPass123" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });
});
