import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { socialCompleteRouter } from "./routers/social-complete";
import { adminRouter } from "./routers/admin";
import { supportRouter } from "./routers/support";
import { membershipReminderRouter } from "./membership-reminder-router";
import { cancelPayPalSubscription, registerPayPalSubscription } from "./paypal";
import {
  getUserById,
  createLetter,
  updateLetterWithAnalysis,
  getUserLetters,
  getLetterById,
  getUserMembership,
  isPaidMembershipActive,
  getUserSubscriptionRecords,
  upsertMembership,
  reserveLetterQuota,
  getUserEmotionsTrend,
  getUserProfileStats,
  createSubscriptionRecord,
  getDb,
  createLetterTemplate,
  getUserLetterTemplates,
  getLetterTemplateById,
  deleteLetterTemplate,
  updateLetterTemplate,
} from "./db";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  generateAIReply,
  analyzeEmotion,
  checkContentSafety,
  detectLanguage,
} from "./llm-hybrid";
import { crisisCases, users } from "../drizzle/schema";
import { detectDeterministicRisk } from "./safety/risk";
import { getOnlineCount, heartbeat } from "./presence";
import { changeEmailPassword, getRecentLoginEvents } from "./auth/email-auth";

// Emotion types
const EMOTION_TYPES = ["快乐", "悲伤", "焦虑", "愤怒", "孤独", "迷茫", "压力", "思念"] as const;

// Background types
const BACKGROUND_TYPES = ["星空漫漫", "牛皮纸", "樱花来信", "秋日落信", "节日灯火"] as const;

// LLM functions are now imported from llm-hybrid module
// which provides fallback from Manus LLM to OpenAI

/**
 * Helper to get DB connection
 */
async function getDbConnection() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/**
 * Create the main router
 */
export const appRouter = router({
  system: systemRouter,
  presence: router({
    heartbeat: publicProcedure
      .input(z.object({ visitorId: z.string().min(16).max(128) }))
      .mutation(({ input }) => heartbeat(input.visitorId)),
    onlineCount: publicProcedure.query(() => getOnlineCount()),
  }),
  admin: adminRouter,
  social: socialCompleteRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    register: publicProcedure
      .input(z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(8, "Password must be at least 8 characters"),
        confirmPassword: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Validate passwords match
        if (input.password !== input.confirmPassword) {
          throw new Error("Passwords do not match");
        }

        // Check if user already exists
        const db = await getDbConnection();
        const existingUsers = await db.select().from(users).where(eq(users.email, input.email));

        if (existingUsers.length > 0) {
          throw new Error("Email already registered");
        }

        // Create new user with a unique openId
        const openId = `email_${input.email}_${Date.now()}`;
        await db.insert(users).values({
          openId,
          email: input.email,
          name: input.email.split('@')[0],
          loginMethod: "email",
        });

        // Fetch the created user
        const newUsers = await db.select().from(users).where(eq(users.openId, openId));
        const newUser = newUsers[0];

        return {
          success: true,
          user: newUser,
        };
      }),
    changePassword: protectedProcedure
      .input(z.object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8),
        confirmPassword: z.string().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.newPassword !== input.confirmPassword) throw new Error("两次输入的新密码不一致");
        return changeEmailPassword(ctx.user.id, input.currentPassword, input.newPassword);
      }),
  }),

  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      const membership = await getUserMembership(ctx.user.id);
      return {
        user: user ? {
          id: user.id,
          email: user.email,
          name: user.name,
          loginMethod: user.loginMethod,
          role: user.role,
          emailVerifiedAt: user.emailVerifiedAt,
          hasPassword: Boolean(user.passwordHash),
        } : null,
        membership,
      };
    }),
    loginHistory: protectedProcedure.query(({ ctx }) => getRecentLoginEvents(ctx.user.id)),
    profileStats: protectedProcedure.query(({ ctx }) => getUserProfileStats(ctx.user.id)),
  }),

  emotion: router({
    analyze: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(async ({ input }) => {
        return await analyzeEmotion(input.content);
      }),

    getTodayScore: protectedProcedure.query(async ({ ctx }) => {
      return {
        type: "孤独",
        score: 45,
        count: 1,
      };
    }),

    getTrendData: protectedProcedure.query(async ({ ctx }) => {
      const membership = await getUserMembership(ctx.user.id);
      if (!isPaidMembershipActive(membership)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "7天情绪趋势仅限已确认付款的会员使用，请先升级会员",
        });
      }

      const rows = await getUserEmotionsTrend(ctx.user.id, 7);
      return rows.map(({ emotions }) => ({
        date: emotions.createdAt.toISOString().split("T")[0],
        score: emotions.emotionScore,
        type: emotions.emotionType,
      }));
    }),
  }),

  letter: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(1).max(5000),
        backgroundType: z.enum(BACKGROUND_TYPES).optional(),
        publicConsent: z.boolean().default(false),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check content safety
        const deterministicRisk = detectDeterministicRisk(input.content);
        const safetyCheck = await checkContentSafety(input.content);
        const riskLevel = safetyCheck.riskLevel || deterministicRisk.riskLevel;
        const requiresHumanReview = safetyCheck.requiresHumanReview || deterministicRisk.requiresHumanReview;
        const crisisDetectedAt = riskLevel === "high" ? new Date() : undefined;

        // Reserve the quota atomically immediately before persistence. A
        // separate read-then-increment pair is vulnerable to concurrent
        // requests bypassing the free-tier limit.
        const quotaReserved = await reserveLetterQuota(ctx.user.id);
        if (!quotaReserved) {
          throw new Error("You have reached the daily letter limit. Upgrade to premium for unlimited letters.");
        }

        // Create letter
        const result = await createLetter(ctx.user.id, {
          content: input.content,
          backgroundType: input.backgroundType,
          publicConsent: input.publicConsent && riskLevel === "low" && !requiresHumanReview,
          safetyFlag: !safetyCheck.safe,
          riskLevel,
          riskCategory: safetyCheck.riskCategory || deterministicRisk.riskCategory,
          requiresHumanReview,
          crisisDetectedAt,
        });

        // Get the created letter ID
        const letterId = (result as any).insertId;

        if (riskLevel === "high" || requiresHumanReview) {
          try {
            const db = await getDb();
            if (db) {
              await db.insert(crisisCases).values({
                letterId,
                userId: ctx.user.id,
                priority: riskLevel === "high" ? "highest" : "high",
                riskLevel,
                riskCategory: safetyCheck.riskCategory || deterministicRisk.riskCategory,
                status: "pending",
              }).onConflictDoNothing({ target: crisisCases.letterId });
            }
          } catch (error) {
            console.error("Failed to create crisis review case:", error);
          }
        }

        // Analyze emotion asynchronously
        analyzeEmotion(input.content)
          .then(async (analysis) => {
            // Generate AI reply
            const reply = await generateAIReply(input.content, analysis.emotionType);

            // Update letter with analysis and reply
            await updateLetterWithAnalysis(letterId, {
              emotionScore: analysis.emotionScore,
              emotionType: analysis.emotionType,
              keywords: analysis.keywords,
              reply,
            });
            
            // Create emotion record
            try {
              const db = await getDb();
              if (db) {
                const { emotions } = await import('../drizzle/schema');
                await db.insert(emotions).values({
                  letterId,
                  emotionType: analysis.emotionType,
                  emotionScore: analysis.emotionScore,
                  keywords: analysis.keywords,
                });
              }
            } catch (error) {
              console.error("Failed to create emotion record:", error);
            }
          })
          .catch((error) => {
            console.error("Error processing letter:", error);
          });

        return {
          id: letterId,
          message: "Letter created successfully. AI is generating your reply...",
          safety: {
            riskLevel,
            riskCategory: safetyCheck.riskCategory || deterministicRisk.riskCategory,
            requiresHumanReview,
            crisisIntervention: riskLevel === "high",
          },
        };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const db = await getDbConnection();
        const { letters } = await import('../drizzle/schema');
        const letter = await db.select().from(letters).where(and(eq(letters.id, input.id), eq(letters.userId, ctx.user.id))).limit(1);
        if (letter.length === 0) throw new Error("Letter not found");
        return letter[0];
      }),

    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50), offset: z.number().default(0) }))
      .query(async ({ ctx, input }) => {
        const db = await getDbConnection();
        const { letters } = await import('../drizzle/schema');
        return await db.select().from(letters).where(eq(letters.userId, ctx.user.id)).limit(input.limit).offset(input.offset);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDbConnection();
        const { letters } = await import('../drizzle/schema');
        await db.delete(letters).where(and(eq(letters.id, input.id), eq(letters.userId, ctx.user.id)));
        return { success: true };
      }),
  }),

  membership: router({
    getInfo: protectedProcedure.query(async ({ ctx }) => {
      return await getUserMembership(ctx.user.id);
    }),

    upgrade: protectedProcedure
      .input(z.object({ type: z.enum(["monthly", "yearly"]) }))
      .mutation(async ({ ctx, input }) => {
        void input;
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "请先完成 PayPal 付款，服务端确认支付后才能升级会员",
        });
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      await upsertMembership(ctx.user.id, {
        membershipType: "free",
        membershipExpiry: null,
      });

      return { success: true };
    }),
  }),

  paypal: router({
    history: protectedProcedure.query(async ({ ctx }) => getUserSubscriptionRecords(ctx.user.id)),

    registerPending: protectedProcedure
      .input(z.object({ subscriptionId: z.string().min(10).max(80), planType: z.enum(["monthly", "yearly"]) }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await registerPayPalSubscription(ctx.user.id, input.subscriptionId, input.planType);
        } catch (error) {
          console.error("[PayPal] Failed to register pending subscription", error);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "PayPal 订阅验证失败，请重试",
            cause: error,
          });
        }
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        return await cancelPayPalSubscription(ctx.user.id);
      } catch (error) {
        console.error("[PayPal] Failed to cancel subscription", error);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "取消 PayPal 订阅失败，请稍后重试",
          cause: error,
        });
      }
    }),
  }),

  templates: router({
    create: protectedProcedure
      .input(z.object({
        templateName: z.string().min(1, "Template name is required"),
        content: z.string().min(1, "Content is required"),
        backgroundType: z.string(),
        emotionTags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          await createLetterTemplate(ctx.user.id, {
            templateName: input.templateName,
            content: input.content,
            backgroundType: input.backgroundType,
            emotionTags: input.emotionTags,
          });
          return { success: true, message: "Template saved successfully" };
        } catch (error) {
          console.error("Failed to create template:", error);
          throw error;
        }
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      try {
        return await getUserLetterTemplates(ctx.user.id);
      } catch (error) {
        console.error("Failed to get templates:", error);
        throw error;
      }
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        try {
          const template = await getLetterTemplateById(input.id, ctx.user.id);
          if (!template) throw new Error("Template not found");
          return template;
        } catch (error) {
          console.error("Failed to get template:", error);
          throw error;
        }
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await deleteLetterTemplate(input.id, ctx.user.id);
          return { success: true, message: "Template deleted successfully" };
        } catch (error) {
          console.error("Failed to delete template:", error);
          throw error;
        }
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        templateName: z.string().optional(),
        content: z.string().optional(),
        backgroundType: z.string().optional(),
        emotionTags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          const { id, ...updateData } = input;
          await updateLetterTemplate(id, ctx.user.id, updateData);
          return { success: true, message: "Template updated successfully" };
        } catch (error) {
          console.error("Failed to update template:", error);
          throw error;
        }
      }),
  }),

  support: supportRouter,
  membershipReminder: membershipReminderRouter,
});

export type AppRouter = typeof appRouter;
