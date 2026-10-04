/**
 * Persistent customer support service for premium members.
 * Tickets are stored in PostgreSQL so members and admins share the same workflow.
 */

import { desc, eq } from "drizzle-orm";
import { memberships, supportTickets, SupportTicket } from "../../drizzle/schema";
import { getDb } from "../db";

export type SupportCategory = "technical" | "feedback" | "billing" | "other";
export type SupportStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportPriority = "high" | "medium" | "low";

export interface CustomerSupportTicket extends SupportTicket {
  responseTimeHours?: number | null;
}

function numericUserId(userId: string | number): number {
  const parsed = typeof userId === "number" ? userId : Number(userId);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("Invalid user id");
  }
  return parsed;
}

/** Check the persisted membership before exposing priority support. */
export async function hasPremiumSupport(userId: string | number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [membership] = await db
    .select({ membershipType: memberships.membershipType, membershipExpiry: memberships.membershipExpiry })
    .from(memberships)
    .where(eq(memberships.userId, numericUserId(userId)))
    .limit(1);

  if (!membership || membership.membershipType !== "yearly") return false;
  return !membership.membershipExpiry || membership.membershipExpiry.getTime() > Date.now();
}

/** Create a high-priority support ticket for an eligible member. */
export async function createSupportTicket(
  userId: string | number,
  subject: string,
  description: string,
  category: SupportCategory = "other",
): Promise<CustomerSupportTicket | null> {
  const normalizedSubject = subject.trim();
  const normalizedDescription = description.trim();
  if (!normalizedSubject || !normalizedDescription) {
    throw new Error("Subject and description are required");
  }

  const numericId = numericUserId(userId);
  if (!(await hasPremiumSupport(numericId))) return null;

  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [inserted] = await db.insert(supportTickets).values({
    userId: numericId,
    subject: normalizedSubject,
    description: normalizedDescription,
    category,
    priority: "high",
    status: "open",
  }).returning({ id: supportTickets.id });

  if (!inserted) return null;

  const [ticket] = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.id, inserted.id));

  return ticket ?? null;
}

export async function getUserSupportTickets(userId: string | number): Promise<CustomerSupportTicket[]> {
  const numericId = numericUserId(userId);
  const db = await getDb();
  if (!db || !(await hasPremiumSupport(numericId))) return [];

  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, numericId))
    .orderBy(desc(supportTickets.createdAt));

  return tickets.map(withResponseTime);
}

export async function getAllSupportTickets(status?: SupportStatus | "all"): Promise<CustomerSupportTicket[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
  const filtered = status && status !== "all" ? tickets.filter((ticket) => ticket.status === status) : tickets;
  return filtered.map(withResponseTime);
}

export async function updateSupportTicket(
  ticketId: number,
  adminId: number,
  input: { status: SupportStatus; response?: string },
): Promise<CustomerSupportTicket | null> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [existing] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  if (!existing) return null;

  const now = new Date();
  const response = input.response?.trim() || undefined;
  await db
    .update(supportTickets)
    .set({
      status: input.status,
      assignedAdminId: adminId,
      response,
      firstResponseAt: response && !existing.firstResponseAt ? now : existing.firstResponseAt,
      resolvedAt: ["resolved", "closed"].includes(input.status) ? existing.resolvedAt ?? now : null,
      updatedAt: now,
    })
    .where(eq(supportTickets.id, ticketId));

  const [updated] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).limit(1);
  return updated ? withResponseTime(updated) : null;
}

export async function getSupportMetrics() {
  const tickets = await getAllSupportTickets();
  const responseTimes = tickets
    .filter((ticket) => ticket.firstResponseAt)
    .map((ticket) => (ticket.firstResponseAt!.getTime() - ticket.createdAt.getTime()) / 3_600_000);

  return {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "open").length,
    inProgress: tickets.filter((ticket) => ticket.status === "in_progress").length,
    resolved: tickets.filter((ticket) => ticket.status === "resolved" || ticket.status === "closed").length,
    averageResponseTimeHours: responseTimes.length
      ? Number((responseTimes.reduce((sum, hours) => sum + hours, 0) / responseTimes.length).toFixed(2))
      : null,
  };
}

function withResponseTime(ticket: SupportTicket): CustomerSupportTicket {
  return {
    ...ticket,
    responseTimeHours: ticket.firstResponseAt
      ? Number(((ticket.firstResponseAt.getTime() - ticket.createdAt.getTime()) / 3_600_000).toFixed(2))
      : null,
  };
}

export function getPremiumSupportResponseTime() {
  return {
    responseTime: "24小时内",
    workingHours: "周一至周日 09:00-22:00",
    channels: ["站内工单", "邮件支持"],
  };
}

export function getPremiumSupportBenefits() {
  return {
    title: "优先客服支持",
    description: "享受24小时内的优先响应服务",
    benefits: [
      "24小时内优先响应",
      "专属客服账号",
      "站内工单与邮件支持",
      "问题优先处理",
      "专业技术支持",
      "账户安全保护",
    ],
    responseTime: getPremiumSupportResponseTime(),
  };
}
