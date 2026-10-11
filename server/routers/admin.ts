import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, letters, reports, operationLogs, subscriptionRecords, crisisCases, publicModerationRequests, publicLetters } from "../../drizzle/schema";
import { eq, gte, desc } from "drizzle-orm";

/**
 * Admin router - all procedures require admin role
 */
export const adminRouter = router({
  /**
   * Dashboard - Get overview statistics
   */
  getDashboardStats: adminProcedure.query(async ({ ctx }) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const totalUsers = await db.select().from(users);
      const totalLetters = await db.select().from(letters);
      const totalReports = await db.select().from(reports);

      const pendingReports = await db
        .select()
        .from(reports)
        .where(eq(reports.status, "pending"));

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const newUsersToday = await db
        .select()
        .from(users)
        .where(gte(users.createdAt, todayStart));

      return {
        totalUsers: totalUsers.length,
        totalLetters: totalLetters.length,
        totalReports: totalReports.length,
        pendingReports: pendingReports.length,
        newUsersToday: newUsersToday.length,
      };
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      throw error;
    }
  }),

  /**
   * User Management - Get all users with pagination
   */
  getUsers: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(10).max(100).default(20),
        search: z.string().optional(),
        role: z.enum(["user", "admin"]).optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const offset = (input.page - 1) * input.pageSize;
        const allUsers = await db.select().from(users);
        
        let filtered: any[] = allUsers;
        if (input.search) {
          filtered = filtered.filter(
            (u: any) =>
              u.name?.toLowerCase().includes(input.search!.toLowerCase()) ||
              u.email?.toLowerCase().includes(input.search!.toLowerCase())
          );
        }
        if (input.role) {
          filtered = filtered.filter((u: any) => u.role === input.role);
        }

        const total = filtered.length;
        const data = filtered.slice(offset, offset + input.pageSize);

        return {
          data,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      } catch (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
    }),

  /**
   * User Management - Ban/Unban user
   */
  banUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        banned: z.boolean(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(users)
          .set({
            updatedAt: new Date(),
          })
          .where(eq(users.id, input.userId));

        await db.insert(operationLogs).values({
          adminId: ctx.user.id,
          action: input.banned ? "ban_user" : "unban_user",
          targetType: "user",
          targetId: input.userId,
          details: JSON.stringify({ reason: input.reason }),
        });

        return { success: true, message: `User ${input.banned ? "banned" : "unbanned"} successfully` };
      } catch (error) {
        console.error("Error banning user:", error);
        throw error;
      }
    }),

  /**
   * Letter Management - Get all letters with filters
   */
  getLetters: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(10).max(100).default(20),
        status: z.enum(["all", "flagged", "safe"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const offset = (input.page - 1) * input.pageSize;
        let allLetters = await db.select().from(letters);

        if (input.status === "flagged") {
          allLetters = allLetters.filter((l: any) => l.safetyFlag === true);
        } else if (input.status === "safe") {
          allLetters = allLetters.filter((l: any) => l.safetyFlag === false);
        }

        allLetters = allLetters.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        const total = allLetters.length;
        const data = allLetters.slice(offset, offset + input.pageSize);

        return {
          data,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      } catch (error) {
        console.error("Error fetching letters:", error);
        throw error;
      }
    }),

  /**
   * Letter Management - Delete letter
   */
  deleteLetter: adminProcedure
    .input(
      z.object({
        letterId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.delete(letters).where(eq(letters.id, input.letterId));

        await db.insert(operationLogs).values({
          adminId: ctx.user.id,
          action: "delete_letter",
          targetType: "letter",
          targetId: input.letterId,
          details: JSON.stringify({ reason: input.reason }),
        });

        return { success: true, message: "Letter deleted successfully" };
      } catch (error) {
        console.error("Error deleting letter:", error);
        throw error;
      }
    }),

  /**
   * Emotion Statistics - Get emotion trends
   */
  getEmotionStats: adminProcedure
    .input(
      z.object({
        days: z.number().min(1).max(90).default(30),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const letterData = await db
          .select()
          .from(letters)
          .where(gte(letters.createdAt, startDate));

        const emotionCounts: Record<string, number> = {};
        letterData.forEach((letter: any) => {
          if (letter.emotionType) {
            emotionCounts[letter.emotionType] = (emotionCounts[letter.emotionType] || 0) + 1;
          }
        });

        return {
          total: letterData.length,
          emotionDistribution: emotionCounts,
          period: `${input.days} days`,
        };
      } catch (error) {
        console.error("Error fetching emotion stats:", error);
        throw error;
      }
    }),

  /**
   * Member Management - Get VIP orders
   */
  getVipOrders: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(10).max(100).default(20),
        status: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const offset = (input.page - 1) * input.pageSize;
        const allOrders = await db.select().from(subscriptionRecords);

        const total = allOrders.length;
        const data = allOrders.slice(offset, offset + input.pageSize);

        const totalRevenue = allOrders.reduce((sum: number, order: any) => {
          return sum + (parseFloat(order.amount.toString()) || 0);
        }, 0);

        return {
          data,
          total,
          totalRevenue,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      } catch (error) {
        console.error("Error fetching VIP orders:", error);
        throw error;
      }
    }),

  /**
   * Report Management - Get all reports
   */
  getReports: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(10).max(100).default(20),
        status: z.enum(["pending", "reviewing", "resolved", "dismissed", "all"]).default("all"),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const offset = (input.page - 1) * input.pageSize;
        let allReports = await db.select().from(reports);

        if (input.status !== "all") {
          allReports = allReports.filter((r: any) => r.status === input.status);
        }

        allReports = allReports.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        const total = allReports.length;
        const data = allReports.slice(offset, offset + input.pageSize);

        return {
          data,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      } catch (error) {
        console.error("Error fetching reports:", error);
        throw error;
      }
    }),

  /**
   * Report Management - Handle report
   */
  handleReport: adminProcedure
    .input(
      z.object({
        reportId: z.number(),
        status: z.enum(["reviewing", "resolved", "dismissed"]),
        resolution: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db
          .update(reports)
          .set({
            status: input.status,
            resolution: input.resolution,
            handledBy: ctx.user.id,
            handledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(reports.id, input.reportId));

        await db.insert(operationLogs).values({
          adminId: ctx.user.id,
          action: "handle_report",
          targetType: "report",
          targetId: input.reportId,
          details: JSON.stringify({ status: input.status, resolution: input.resolution }),
        });

        return { success: true, message: "Report handled successfully" };
      } catch (error) {
        console.error("Error handling report:", error);
        throw error;
      }
    }),

  /**
   * System Configuration - Get all configs
   */
  getSystemConfigs: adminProcedure.query(async () => {
    try {
      return {
        configs: [
          { key: "max_letter_length", value: "5000", type: "number", description: "Maximum letter length" },
          { key: "daily_letter_limit", value: "10", type: "number", description: "Daily letter limit for free users" },
          { key: "maintenance_mode", value: "false", type: "boolean", description: "Enable maintenance mode" },
          { key: "ai_response_enabled", value: "true", type: "boolean", description: "Enable AI responses" },
        ],
      };
    } catch (error) {
      console.error("Error fetching system configs:", error);
      throw error;
    }
  }),

  /** High-priority safety queue; raw letter content is only available to authorized admins. */
  getCrisisQueue: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select({
      id: crisisCases.id,
      letterId: crisisCases.letterId,
      userId: crisisCases.userId,
      priority: crisisCases.priority,
      riskLevel: crisisCases.riskLevel,
      riskCategory: crisisCases.riskCategory,
      status: crisisCases.status,
      createdAt: crisisCases.createdAt,
      reviewedAt: crisisCases.reviewedAt,
    }).from(crisisCases).orderBy(desc(crisisCases.createdAt));
  }),

  resolveCrisisCase: adminProcedure
    .input(z.object({ caseId: z.number(), status: z.enum(["reviewing", "resolved", "dismissed"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(crisisCases).set({ status: input.status, reviewedBy: ctx.user.id, reviewedAt: new Date() }).where(eq(crisisCases.id, input.caseId));
      await db.insert(operationLogs).values({ adminId: ctx.user.id, action: "resolve_crisis_case", targetType: "crisis_case", targetId: input.caseId, details: { status: input.status } });
      return { success: true };
    }),

  getPublicModerationQueue: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(publicModerationRequests).where(eq(publicModerationRequests.status, "pending")).orderBy(desc(publicModerationRequests.createdAt));
  }),

  reviewPublicModeration: adminProcedure
    .input(z.object({ requestId: z.number(), status: z.enum(["approved", "rejected"]), approvedExcerpt: z.string().max(500).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const request = await db.select().from(publicModerationRequests).where(eq(publicModerationRequests.id, input.requestId)).limit(1);
      if (!request[0]) throw new Error("Moderation request not found");
      await db.update(publicModerationRequests).set({ status: input.status, reviewedBy: ctx.user.id, reviewedAt: new Date() }).where(eq(publicModerationRequests.id, input.requestId));
      if (input.status === "approved") {
        await db.insert(publicLetters).values({
          letterId: request[0].letterId,
          userId: request[0].userId,
          excerpt: (input.approvedExcerpt || request[0].redactedExcerpt).slice(0, 500),
          moderationStatus: "approved",
          redactionFields: request[0].redactionFields,
          reviewedBy: ctx.user.id,
          reviewedAt: new Date(),
          starCount: 0,
        }).onConflictDoNothing({ target: publicLetters.letterId });
      }
      return { success: true };
    }),

  /**
   * System Configuration - Update config
   */
  updateSystemConfig: adminProcedure
    .input(
      z.object({
        key: z.string(),
        value: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        await db.insert(operationLogs).values({
          adminId: ctx.user.id,
          action: "update_config",
          targetType: "system_config",
          details: JSON.stringify({ key: input.key, value: input.value }),
        });

        return { success: true, message: "Configuration updated successfully" };
      } catch (error) {
        console.error("Error updating config:", error);
        throw error;
      }
    }),

  /**
   * Get operation logs
   */
  getOperationLogs: adminProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(10).max(100).default(20),
        adminId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        
        const offset = (input.page - 1) * input.pageSize;
        let allLogs = await db.select().from(operationLogs);

        if (input.adminId) {
          allLogs = allLogs.filter((l: any) => l.adminId === input.adminId);
        }

        allLogs = allLogs.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
        const total = allLogs.length;
        const data = allLogs.slice(offset, offset + input.pageSize);

        return {
          data,
          total,
          page: input.page,
          pageSize: input.pageSize,
          totalPages: Math.ceil(total / input.pageSize),
        };
      } catch (error) {
        console.error("Error fetching operation logs:", error);
        throw error;
      }
    }),
});
