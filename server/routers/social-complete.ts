/**
 * 完整的社交功能API路由
 * 包含公共信箱、点赞、每日一句、时间胶囊、情绪星球
 */

import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import {
  publicLetters,
  stars,
  dailyQuotes,
  timeCapsules,
  letters,
  emotionStars,
  emotions,
} from "../../drizzle/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export const socialCompleteRouter = router({
  /**
   * 公共信箱 - 获取公开信件列表
   */
  publicLetters: {
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(20),
          offset: z.number().int().nonnegative().default(0),
          sortBy: z.enum(["recent", "popular"]).default("recent"),
        })
      )
      .query(async ({ input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 排序
          const results = await db
            .select()
            .from(publicLetters)
            .orderBy(
              input.sortBy === "popular"
                ? desc(publicLetters.starCount)
                : desc(publicLetters.createdAt)
            )
            .limit(input.limit)
            .offset(input.offset);

          return {
            data: results,
            total: results.length,
          };
        } catch (error) {
          console.error("获取公开信件列表失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "获取公开信件列表失败",
          });
        }
      }),

    /**
     * 发布信件到公共信箱
     */
    publish: protectedProcedure
      .input(
        z.object({
          letterId: z.number().int().positive(),
          excerpt: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 检查信件是否存在且属于当前用户
          const letter = await db
            .select()
            .from(letters)
            .where(
              and(
                eq(letters.id, input.letterId),
                eq(letters.userId, ctx.user.id)
              )
            )
            .limit(1);

          if (!letter.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "信件不存在",
            });
          }

          // 检查是否已发布
          const existing = await db
            .select()
            .from(publicLetters)
            .where(eq(publicLetters.letterId, input.letterId))
            .limit(1);

          if (existing.length) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "该信件已发布到公共信箱",
            });
          }

          // 发布到公共信箱
          const result = await db.insert(publicLetters).values({
            letterId: input.letterId,
            userId: ctx.user.id,
            excerpt: input.excerpt,
            emotionTags: letter[0].emotionTags,
            starCount: 0,
          });

          return {
            success: true,
            id: (result as any).insertId || 0,
          };
        } catch (error: any) {
          console.error("发布失败:", error);
          if (error.code === "CONFLICT" || error.code === "NOT_FOUND") {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "发布失败",
          });
        }
      }),

    /**
     * 撤销发布
     */
    unpublish: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 检查公开信件是否属于当前用户
          const publicLetter = await db
            .select()
            .from(publicLetters)
            .where(eq(publicLetters.id, input.id))
            .limit(1);

          if (!publicLetter.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "公开信件不存在",
            });
          }

          if (publicLetter[0].userId !== ctx.user.id) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "无权撤销此发布",
            });
          }

          // 删除公开信件
          await db.delete(publicLetters).where(eq(publicLetters.id, input.id));

          return { success: true };
        } catch (error: any) {
          console.error("撤销发布失败:", error);
          if (error.code === "NOT_FOUND" || error.code === "FORBIDDEN") {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "撤销发布失败",
          });
        }
      }),
  },

  /**
   * 共鸣互动 - 点赞
   */
  stars: {
    /**
     * 添加点赞
     */
    add: protectedProcedure
      .input(z.object({ publicLetterId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 检查公开信件是否存在
          const publicLetter = await db
            .select()
            .from(publicLetters)
            .where(eq(publicLetters.id, input.publicLetterId))
            .limit(1);

          if (!publicLetter.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "公开信件不存在",
            });
          }

          // 检查是否已点赞
          const existing = await db
            .select()
            .from(stars)
            .where(
              and(
                eq(stars.publicLetterId, input.publicLetterId),
                eq(stars.userId, ctx.user.id)
              )
            )
            .limit(1);

          if (existing.length) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "已点赞过此信件",
            });
          }

          // 添加点赞
          await db.insert(stars).values({
            userId: ctx.user.id,
            publicLetterId: input.publicLetterId,
          });

          // 更新公开信件的星星数
          await db
            .update(publicLetters)
            .set({
              starCount: (publicLetter[0].starCount || 0) + 1,
            })
            .where(eq(publicLetters.id, input.publicLetterId));

          return { success: true };
        } catch (error: any) {
          console.error("点赞失败:", error);
          if (error.code === "CONFLICT" || error.code === "NOT_FOUND") {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "点赞失败",
          });
        }
      }),

    /**
     * 取消点赞
     */
    remove: protectedProcedure
      .input(z.object({ publicLetterId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 检查点赞是否存在
          const star = await db
            .select()
            .from(stars)
            .where(
              and(
                eq(stars.publicLetterId, input.publicLetterId),
                eq(stars.userId, ctx.user.id)
              )
            )
            .limit(1);

          if (!star.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "未点赞此信件",
            });
          }

          // 删除点赞
          await db
            .delete(stars)
            .where(
              and(
                eq(stars.publicLetterId, input.publicLetterId),
                eq(stars.userId, ctx.user.id)
              )
            );

          // 更新公开信件的星星数
          const publicLetter = await db
            .select()
            .from(publicLetters)
            .where(eq(publicLetters.id, input.publicLetterId))
            .limit(1);

          if (publicLetter.length) {
            await db
              .update(publicLetters)
              .set({
                starCount: Math.max(0, (publicLetter[0].starCount || 1) - 1),
              })
              .where(eq(publicLetters.id, input.publicLetterId));
          }

          return { success: true };
        } catch (error: any) {
          console.error("取消点赞失败:", error);
          if (error.code === "NOT_FOUND") {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "取消点赞失败",
          });
        }
      }),

    /**
     * 检查是否已点赞
     */
    check: protectedProcedure
      .input(z.object({ publicLetterId: z.number().int().positive() }))
      .query(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const star = await db
            .select()
            .from(stars)
            .where(
              and(
                eq(stars.publicLetterId, input.publicLetterId),
                eq(stars.userId, ctx.user.id)
              )
            )
            .limit(1);

          return { starred: star.length > 0 };
        } catch (error) {
          console.error("检查点赞状态失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "检查点赞状态失败",
          });
        }
      }),
  },

  /**
   * 每日一句
   */
  dailyQuote: {
    /**
     * 获取今日金句
     */
    today: publicProcedure.query(async () => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const today = new Date().toISOString().split("T")[0];
        // 转换日期格式
        const todayDate = new Date(today);
        const quote = await db
          .select()
          .from(dailyQuotes)
          .where(eq(dailyQuotes.date, todayDate as any))
          .limit(1);

        if (quote.length) {
          return quote[0];
        }

        // 如果没有今日金句，返回最新的
        const latest = await db
          .select()
          .from(dailyQuotes)
          .orderBy(desc(dailyQuotes.createdAt))
          .limit(1);

        return latest[0] || { content: "", author: "" };
      } catch (error) {
        console.error("获取今日金句失败:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "获取今日金句失败",
        });
      }
    }),

    /**
     * 获取金句列表
     */
    list: publicProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(10),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const results = await db
            .select()
            .from(dailyQuotes)
            .orderBy(desc(dailyQuotes.createdAt))
            .limit(input.limit)
            .offset(input.offset);

          return { data: results, total: results.length };
        } catch (error) {
          console.error("获取金句列表失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "获取金句列表失败",
          });
        }
      }),
  },

  /**
   * 时间胶囊
   */
  timeCapsule: {
    /**
     * 创建时间胶囊
     */
    create: protectedProcedure
      .input(
        z.object({
          content: z.string().trim().min(1).max(5000),
          openDate: z.date(),
          autoReply: z.string().max(2000).optional(),
        })
      )
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const [created] = await db
            .insert(timeCapsules)
            .values({
              userId: ctx.user.id,
              content: input.content,
              openDate: input.openDate,
              autoReply: input.autoReply || null,
              status: "pending",
            })
            .returning({ id: timeCapsules.id });

          return {
            success: true,
            id: created?.id || 0,
          };
        } catch (error) {
          console.error("创建时间胶囊失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "创建时间胶囊失败",
          });
        }
      }),

    /**
     * 获取时间胶囊列表
     */
    list: protectedProcedure
      .input(
        z.object({
          status: z.enum(["pending", "opened", "all"]).default("all"),
        })
      )
      .query(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          let conditions = [eq(timeCapsules.userId, ctx.user.id)];

          if (input.status !== "all") {
            conditions.push(eq(timeCapsules.status, input.status as any));
          }

          const query = db
            .select()
            .from(timeCapsules)
            .where(and(...conditions));

          const results = await query.orderBy(desc(timeCapsules.openDate));

          return { data: results };
        } catch (error) {
          console.error("获取时间胶囊列表失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "获取时间胶囊列表失败",
          });
        }
      }),

    /**
     * 打开时间胶囊
     */
    open: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          // 检查时间胶囊是否存在且属于当前用户
          const capsule = await db
            .select()
            .from(timeCapsules)
            .where(
              and(
                eq(timeCapsules.id, input.id),
                eq(timeCapsules.userId, ctx.user.id)
              )
            )
            .limit(1);

          if (!capsule.length) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "时间胶囊不存在",
            });
          }

          // 检查是否可以打开（时间是否到达）
          const openDate = new Date(capsule[0].openDate);
          if (new Date() < openDate) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "时间未到，还不能打开",
            });
          }

          // 标记为已打开
          await db
            .update(timeCapsules)
            .set({
              status: "opened",
              openedAt: new Date(),
            })
            .where(eq(timeCapsules.id, input.id));

          return {
            success: true,
            content: capsule[0].content,
          };
        } catch (error: any) {
          console.error("打开时间胶囊失败:", error);
          if (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST") {
            throw error;
          }
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "打开时间胶囊失败",
          });
        }
      }),

    /**
     * 删除属于当前用户的时间胶囊
     */
    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const result = await db
            .delete(timeCapsules)
            .where(
              and(
                eq(timeCapsules.id, input.id),
                eq(timeCapsules.userId, ctx.user.id)
              )
            );
          if (!result.rowCount) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "时间胶囊不存在",
            });
          }
          return { success: true };
        } catch (error: any) {
          console.error("删除时间胶囊失败:", error);
          if (error.code === "NOT_FOUND") throw error;
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "删除时间胶囊失败",
          });
        }
      }),
  },

  /**
   * 情绪星球
   */
  emotionPlanet: {
    /**
     * 获取用户的情绪数据
     */
    stats: protectedProcedure.query(async ({ ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // 获取用户的所有情绪记录
        const userEmotions = await db
          .select()
          .from(emotions)
          .innerJoin(letters, eq(emotions.letterId, letters.id))
          .where(eq(letters.userId, ctx.user.id));

        // 统计各情绪类型的数量
        const emotionStats: Record<string, number> = {};
        userEmotions.forEach(record => {
          const emotionType = record.emotions.emotionType;
          emotionStats[emotionType] = (emotionStats[emotionType] || 0) + 1;
        });

        return {
          total: userEmotions.length,
          stats: emotionStats,
        };
      } catch (error) {
        console.error("获取情绪数据失败:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "获取情绪数据失败",
        });
      }
    }),

    /**
     * 获取情绪趋势
     */
    trend: protectedProcedure
      .input(
        z.object({
          days: z.number().int().positive().default(7),
        })
      )
      .query(async ({ ctx, input }: any) => {
        try {
          const db = await getDb();
          if (!db) throw new Error("Database not available");

          const startDate = new Date();
          startDate.setDate(startDate.getDate() - input.days);

          // 获取指定天数内的情绪记录
          const userEmotions = await db
            .select()
            .from(emotions)
            .innerJoin(letters, eq(emotions.letterId, letters.id))
            .where(
              and(
                eq(letters.userId, ctx.user.id),
                gte(letters.createdAt, startDate)
              )
            );

          // 按日期统计
          const trendData: Record<string, Record<string, number>> = {};
          userEmotions.forEach(record => {
            const date = record.letters.createdAt.toISOString().split("T")[0];
            const emotionType = record.emotions.emotionType;

            if (!trendData[date]) {
              trendData[date] = {};
            }
            trendData[date][emotionType] =
              (trendData[date][emotionType] || 0) + 1;
          });

          return { trend: trendData };
        } catch (error) {
          console.error("获取情绪趋势失败:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "获取情绪趋势失败",
          });
        }
      }),
  },
});
