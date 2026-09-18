import { z } from "zod";
import { adminProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  createSupportTicket,
  getAllSupportTickets,
  getSupportMetrics,
  getUserSupportTickets,
  hasPremiumSupport,
  updateSupportTicket,
} from "../services/customer-support";

const category = z.enum(["technical", "feedback", "billing", "other"]);
const status = z.enum(["open", "in_progress", "resolved", "closed"]);

export const supportRouter = router({
  eligibility: protectedProcedure.query(async ({ ctx }) => ({
    eligible: await hasPremiumSupport(ctx.user.id),
  })),

  listMine: protectedProcedure.query(async ({ ctx }) => getUserSupportTickets(ctx.user.id)),

  create: protectedProcedure
    .input(
      z.object({
        subject: z.string().trim().min(2).max(200),
        description: z.string().trim().min(5).max(10_000),
        category,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await createSupportTicket(ctx.user.id, input.subject, input.description, input.category);
      if (!ticket) {
        throw new Error("只有有效的高级会员可以提交优先客服工单");
      }
      return ticket;
    }),

  adminList: adminProcedure
    .input(z.object({ status: z.union([status, z.literal("all")]).default("all") }))
    .query(async ({ input }) => getAllSupportTickets(input.status)),

  adminMetrics: adminProcedure.query(async () => getSupportMetrics()),

  adminUpdate: adminProcedure
    .input(
      z.object({
        ticketId: z.number().int().positive(),
        status,
        response: z.string().trim().max(10_000).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ticket = await updateSupportTicket(input.ticketId, ctx.user.id, {
        status: input.status,
        response: input.response,
      });
      if (!ticket) throw new Error("客服工单不存在");
      return ticket;
    }),
});
