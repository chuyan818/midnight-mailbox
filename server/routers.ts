import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getUserById,
  createLetter,
  updateLetterWithAnalysis,
  getUserLetters,
  getLetterById,
  getUserMembership,
  upsertMembership,
  canUserWriteLetter,
  incrementDailyLetterCount,
  getUserEmotionsTrend,
  createSubscriptionRecord,
  getDb,
} from "./db";
import { z } from "zod";
import { eq, and } from "drizzle-orm";
import {
  generateAIReply,
  analyzeEmotion,
  checkContentSafety,
  detectLanguage,
} from "./llm-hybrid";

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
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await getUserById(ctx.user.id);
      const membership = await getUserMembership(ctx.user.id);
      return {
        user,
        membership,
      };
    }),
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
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push({
          date: date.toISOString().split('T')[0],
          score: Math.floor(Math.random() * 100),
        });
      }
      return dates;
    }),
  }),

  letter: router({
    create: protectedProcedure
      .input(z.object({
        content: z.string().min(10).max(5000),
        backgroundType: z.enum(BACKGROUND_TYPES).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Check if user can write letter
        const canWrite = await canUserWriteLetter(ctx.user.id);
        if (!canWrite) {
          throw new Error("You have reached the daily letter limit. Upgrade to premium for unlimited letters.");
        }

        // Check content safety
        const safetyCheck = await checkContentSafety(input.content);
        if (!safetyCheck.safe) {
          // Still allow but flag it
          console.warn(`Safety flag for user ${ctx.user.id}: ${safetyCheck.reason}`);
        }

        // Create letter
        const result = await createLetter(ctx.user.id, {
          content: input.content,
          backgroundType: input.backgroundType,
        });

        // Increment daily letter count
        await incrementDailyLetterCount(ctx.user.id);

        // Get the created letter ID
        const letterId = (result as any).insertId;

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
        const expiryDate = new Date();
        if (input.type === "monthly") {
          expiryDate.setMonth(expiryDate.getMonth() + 1);
        } else {
          expiryDate.setFullYear(expiryDate.getFullYear() + 1);
        }

        await upsertMembership(ctx.user.id, {
          membershipType: input.type,
          membershipExpiry: expiryDate,
        });

        return { success: true };
      }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      await upsertMembership(ctx.user.id, {
        membershipType: "free",
        membershipExpiry: null,
      });

      return { success: true };
    }),
  }),

  subscription: router({
    createCheckoutSession: protectedProcedure
      .input(z.object({
        planType: z.enum(["monthly", "yearly"]),
        successUrl: z.string(),
        cancelUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        // Import Stripe utilities
        const { createCheckoutSession } = await import('./stripe');
        
        try {
          const session = await createCheckoutSession(
            ctx.user.id,
            input.planType,
            input.successUrl,
            input.cancelUrl
          );
          return session;
        } catch (error) {
          console.error("Failed to create checkout session:", error);
          throw error;
        }
      }),

    getInfo: protectedProcedure.query(async ({ ctx }) => {
      const { getSubscriptionInfo } = await import('./stripe');
      return await getSubscriptionInfo(ctx.user.id);
    }),

    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      const { cancelSubscription } = await import('./stripe');
      try {
        await cancelSubscription(ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("Failed to cancel subscription:", error);
        throw error;
      }
    }),
  }),
});

export type AppRouter = typeof appRouter;
