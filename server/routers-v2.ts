import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { letters, publicLetters } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";
import * as publicMailbox from "./public-mailbox";
import * as specialFeatures from "./special-features";

/**
 * 新版本的tRPC路由 - 支持所有7个功能
 */
export const v2Router = router({
  // 公共信箱相关
  publicMailbox: router({
    /**
     * 获取公共信箱列表
     */
    list: publicProcedure
      .input(
        z.object({
          sortBy: z.enum(["latest", "mostShared"]).default("latest"),
          limit: z.number().default(20),
          offset: z.number().default(0),
        })
      )
      .query(async ({ input }) => {
        return await publicMailbox.getPublicMailbox(input.sortBy, input.limit, input.offset);
      }),

    /**
     * 获取单条公共信件
     */
    getOne: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await publicMailbox.getPublicLetter(input.id);
      }),

    /**
     * 发布信件到公共信箱
     */
    publish: protectedProcedure
      .input(
        z.object({
          letterId: z.number(),
          excerpt: z.string().max(500),
          emotionTags: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await publicMailbox.publishToPublicMailbox(
          input.letterId,
          ctx.user.id,
          input.excerpt,
          input.emotionTags
        );
      }),

    /**
     * 点亮星星（共鸣互动）
     */
    toggleStar: protectedProcedure
      .input(z.object({ publicLetterId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        return await publicMailbox.toggleStar(ctx.user.id, input.publicLetterId);
      }),

    /**
     * 检查用户是否已点亮
     */
    hasStarred: protectedProcedure
      .input(z.object({ publicLetterId: z.number() }))
      .query(async ({ input, ctx }) => {
        return await publicMailbox.hasUserStarred(ctx.user.id, input.publicLetterId);
      }),
  }),

  // 每日一句相关
  dailyQuote: router({
    /**
     * 获取今日一句
     */
    today: publicProcedure.query(async () => {
      return await publicMailbox.getTodayQuote();
    }),

    /**
     * 自动选择今日一句（后台任务）
     */
    select: publicProcedure.mutation(async () => {
      return await publicMailbox.selectDailyQuote();
    }),
  }),

  // 深夜信件相关
  nightLetters: router({
    /**
     * 获取最近7天的深夜信件
     */
    list: publicProcedure.query(async () => {
      return await publicMailbox.getNightLetters();
    }),
  }),

  // 时间胶囊相关
  timeCapsule: router({
    /**
     * 创建时间胶囊
     */
    create: protectedProcedure
      .input(
        z.object({
          content: z.string().min(10).max(5000),
          openDate: z.date(),
          autoReply: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        return await specialFeatures.createTimeCapsule(
          ctx.user.id,
          input.content,
          input.openDate,
          input.autoReply
        );
      }),

    /**
     * 获取用户的时间胶囊
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      return await specialFeatures.getUserTimeCapsules(ctx.user.id);
    }),

    /**
     * 检查并打开已到期的时间胶囊
     */
    checkAndOpen: publicProcedure.mutation(async () => {
      return await specialFeatures.checkAndOpenTimeCapsules();
    }),
  }),

  // 情绪星球相关
  emotionStar: router({
    /**
     * 获取所有情绪星球的星星
     */
    all: publicProcedure
      .input(z.object({ limit: z.number().default(1000) }))
      .query(async ({ input }) => {
        return await specialFeatures.getAllEmotionStars(input.limit);
      }),

    /**
     * 按情绪类型筛选星星
     */
    byType: publicProcedure
      .input(z.object({ emotionType: z.string() }))
      .query(async ({ input }) => {
        return await specialFeatures.getEmotionStarsByType(input.emotionType);
      }),

    /**
     * 获取情绪统计
     */
    statistics: publicProcedure.query(async () => {
      return await specialFeatures.getEmotionStatistics();
    }),

    /**
     * 创建情绪星球中的星星（内部API）
     */
    create: publicProcedure
      .input(
        z.object({
          letterId: z.number(),
          emotionType: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const color = specialFeatures.getEmotionColor(input.emotionType);
        const coords = specialFeatures.generateRandomCoordinates();
        return await specialFeatures.createEmotionStar(
          input.letterId,
          input.emotionType,
          color,
          coords.x,
          coords.y,
          coords.z
        );
      }),
  }),

  // 写信相关（扩展）
  letter: router({
    /**
     * 创建新信件
     */
    create: protectedProcedure
      .input(
        z.object({
          content: z.string().min(10).max(5000),
          backgroundType: z.string().optional(),
          emotionTags: z.array(z.string()).optional(),
          isPublic: z.boolean().default(false),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db.insert(letters).values({
          userId: ctx.user.id,
          content: input.content,
          backgroundType: input.backgroundType,
          emotionTags: input.emotionTags,
          isPublic: input.isPublic,
          safetyFlag: false,
        });

        // 如果是公开信件，添加到公共信箱
        if (input.isPublic) {
          const excerpt = input.content.substring(0, 100);
          // 获取刚创建的信件ID
          const newLetters = await db
            .select()
            .from(letters)
            .where(eq(letters.userId, ctx.user.id))
            .orderBy(desc(letters.createdAt))
            .limit(1);

          if (newLetters.length > 0) {
            const letterId = newLetters[0].id;
            await publicMailbox.publishToPublicMailbox(
              letterId,
              ctx.user.id,
              excerpt,
              input.emotionTags
            );

            // 创建情绪星球中的星星
            if (input.emotionTags && input.emotionTags.length > 0) {
              await specialFeatures.createEmotionStar(
                letterId,
                input.emotionTags[0],
                specialFeatures.getEmotionColor(input.emotionTags[0]),
                0,
                0,
                0
              );
            }
          }
        }

        return result;
      }),

    /**
     * 获取用户的所有信件
     */
    list: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      return await db.select().from(letters).where(eq(letters.userId, ctx.user.id));
    }),

    /**
     * 获取单条信件
     */
    getOne: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(letters)
          .where(eq(letters.id, input.id))
          .limit(1);

        if (result.length === 0) throw new Error("Letter not found");
        if (result[0].userId !== ctx.user.id) throw new Error("Unauthorized");

        return result[0];
      }),

    /**
     * 删除信件
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const result = await db
          .select()
          .from(letters)
          .where(eq(letters.id, input.id))
          .limit(1);

        if (result.length === 0) throw new Error("Letter not found");
        if (result[0].userId !== ctx.user.id) throw new Error("Unauthorized");

        return await db.delete(letters).where(eq(letters.id, input.id));
      }),
  }),
});

export type V2Router = typeof v2Router;
