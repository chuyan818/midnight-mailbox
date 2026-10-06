import type { Express, Request, Response } from "express";
import { runScheduledExpiryReminder } from "../membership-expiry-reminder";

/** Register the daily Heartbeat endpoint configured for this project. */
export function registerMembershipExpiryReminderRoute(app: Express) {
  app.post("/api/internal/membership-expiry-reminder", async (req: Request, res: Response) => {
    const configuredSecret = process.env.HEARTBEAT_SECRET;
    const providedSecret = req.header("x-heartbeat-secret");
    if (configuredSecret && providedSecret !== configuredSecret) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const result = await runScheduledExpiryReminder();
    res.json({ success: result.failed === 0, ...result });
  });
}
