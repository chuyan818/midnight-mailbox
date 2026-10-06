import { describe, expect, it, vi } from "vitest";
import {
  MEMBERSHIP_EXPIRY_REMINDER_SCHEDULE,
  runScheduledExpiryReminder,
} from "./membership-expiry-reminder";

describe("membership expiry schedule", () => {
  it("runs daily at UTC midnight", () => {
    expect(MEMBERSHIP_EXPIRY_REMINDER_SCHEDULE.cron).toBe("0 0 * * *");
    expect(MEMBERSHIP_EXPIRY_REMINDER_SCHEDULE.timezone).toBe("UTC");
  });

  it("returns runner results and records failures safely", async () => {
    await expect(
      runScheduledExpiryReminder(async () => ({ total: 4, sent: 3, failed: 1 })),
    ).resolves.toEqual({ total: 4, sent: 3, failed: 1 });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(runScheduledExpiryReminder(async () => { throw new Error("boom"); })).resolves.toEqual({
      total: 0,
      sent: 0,
      failed: 1,
    });
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
