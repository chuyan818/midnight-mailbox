import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { eq, desc, and, sql } from "drizzle-orm";
import { getDb } from "../db";
import {
  publicLetters,
  stars,
  letters,
  users,
} from "../../drizzle/schema";

/**
 * Public Mailbox Router - v2.0
 * Handles public letter browsing and star interactions
 */
export const publicMailboxRouter = router({
  /**
   * Get public letters with pagination and filtering
   */
  getPublicLetters: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(50).default(20),
        emotionTag: z.string().optional(),
        sortBy: z.enum(["newest", "mostStars"]).default("newest"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const offset = (input.page - 1) * input.pageSize;

      // Build base query
      const results = await db
        .select({
          id: publicLetters.id,
          letterId: publicLetters.letterId,
          excerpt: publicLetters.excerpt,
          emotionTags: publicLetters.emotionTags,
          starCount: publicLetters.starCount,
          createdAt: publicLetters.createdAt,
          userName: users.name,
        })
        .from(publicLetters)
        .leftJoin(letters, eq(publicLetters.letterId, letters.id))
        .leftJoin(users, eq(publicLetters.userId, users.id))
        .where(
          input.emotionTag
            ? sql`JSON_CONTAINS(${publicLetters.emotionTags}, JSON_QUOTE(${input.emotionTag}))`
            : sql`1=1`
        )
        .orderBy(
          input.sortBy === "mostStars"
            ? desc(publicLetters.starCount)
            : desc(publicLetters.createdAt)
        )
        .limit(input.pageSize)
        .offset(offset);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(publicLetters);
      const total = countResult[0]?.count || 0;

      return {
        data: results,
        total,
        page: input.page,
        pageSize: input.pageSize,
        totalPages: Math.ceil(total / input.pageSize),
      };
    }),

  /**
   * Get a specific public letter with full content
   */
  getPublicLetter: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select({
          id: publicLetters.id,
          letterId: publicLetters.letterId,
          excerpt: publicLetters.excerpt,
          emotionTags: publicLetters.emotionTags,
          starCount: publicLetters.starCount,
          createdAt: publicLetters.createdAt,
          letterContent: letters.content,
          letterReply: letters.reply,
          userName: users.name,
        })
        .from(publicLetters)
        .leftJoin(letters, eq(publicLetters.letterId, letters.id))
        .leftJoin(users, eq(publicLetters.userId, users.id))
        .where(eq(publicLetters.id, input.id));

      return result[0] || null;
    }),

  /**
   * Star a public letter (add resonance)
   */
  starLetter: protectedProcedure
    .input(z.object({ publicLetterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user already starred this letter
      const existing = await db
        .select()
        .from(stars)
        .where(
          and(
            eq(stars.userId, ctx.user.id),
            eq(stars.publicLetterId, input.publicLetterId)
          )
        );

      if (existing.length > 0) {
        // Already starred, remove the star
        await db
          .delete(stars)
          .where(
            and(
              eq(stars.userId, ctx.user.id),
              eq(stars.publicLetterId, input.publicLetterId)
            )
          );

        // Decrement star count
        await db
          .update(publicLetters)
          .set({ starCount: sql`${publicLetters.starCount} - 1` })
          .where(eq(publicLetters.id, input.publicLetterId));

        return { starred: false };
      } else {
        // Add new star
        await db.insert(stars).values({
          userId: ctx.user.id,
          publicLetterId: input.publicLetterId,
        });

        // Increment star count
        await db
          .update(publicLetters)
          .set({ starCount: sql`${publicLetters.starCount} + 1` })
          .where(eq(publicLetters.id, input.publicLetterId));

        return { starred: true };
      }
    }),

  /**
   * Check if user has starred a letter
   */
  hasStarred: protectedProcedure
    .input(z.object({ publicLetterId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .select()
        .from(stars)
        .where(
          and(
            eq(stars.userId, ctx.user.id),
            eq(stars.publicLetterId, input.publicLetterId)
          )
        );

      return result.length > 0;
    }),

  /**
   * Get trending public letters (most starred)
   */
  getTrendingLetters: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const results = await db
        .select({
          id: publicLetters.id,
          letterId: publicLetters.letterId,
          excerpt: publicLetters.excerpt,
          emotionTags: publicLetters.emotionTags,
          starCount: publicLetters.starCount,
          createdAt: publicLetters.createdAt,
          userName: users.name,
        })
        .from(publicLetters)
        .leftJoin(users, eq(publicLetters.userId, users.id))
        .orderBy(desc(publicLetters.starCount))
        .limit(input.limit);

      return results;
    }),

  /**
   * Get emotion distribution for public letters
   */
  getEmotionDistribution: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const results = await db
      .select({
        emotion: sql<string>`JSON_UNQUOTE(JSON_EXTRACT(${publicLetters.emotionTags}, '$[0]'))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(publicLetters)
      .groupBy(
        sql`JSON_UNQUOTE(JSON_EXTRACT(${publicLetters.emotionTags}, '$[0]'))`
      );

    return results.reduce(
      (acc, row) => {
        if (row.emotion) {
          acc[row.emotion] = row.count;
        }
        return acc;
      },
      {} as Record<string, number>
    );
  }),
});
