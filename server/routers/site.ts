import { CONTACT_TOPICS, SETTING_KEYS } from "@shared/const";
import { z } from "zod";
import { adminProc, publicProc, router } from "../appTrpc";
import * as db from "../db";
import { isMailConfigured, mailContact } from "../mailer";
import { rateLimit } from "../util";

export const siteRouter = router({
  settings: publicProc.query(() => db.getSettings()),

  contact: publicProc
    .input(
      z.object({
        name: z.string().trim().min(1).max(255),
        email: z.string().trim().email(),
        phone: z.string().trim().max(64).optional(),
        topic: z.enum(CONTACT_TOPICS).optional(),
        message: z.string().trim().min(5).max(5000),
        /** Honeypot: real people never see this field. */
        website: z.string().max(0).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      rateLimit(ctx.req, "contact", 5, 15 * 60_000);
      const msg = {
        name: input.name,
        email: input.email,
        phone: input.phone || null,
        topic: input.topic ?? null,
        message: input.message,
      };
      await db.createContactMessage(msg);
      const settings = await db.getSettings();
      void mailContact(msg, settings.email);
      return { success: true };
    }),

  /* ─── Admin ───────────────────────────────────────────────────────────── */

  dashboard: adminProc.query(async () => ({ ...(await db.dashboardStats()), mailConfigured: isMailConfigured() })),

  messages: adminProc
    .input(z.object({ page: z.number().int().min(1).default(1) }))
    .query(({ input }) => db.listContactMessages({ limit: 30, offset: (input.page - 1) * 30 })),

  setMessageHandled: adminProc
    .input(z.object({ id: z.number().int(), handled: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.setMessageHandled(input.id, input.handled);
      return { success: true };
    }),

  deleteMessage: adminProc.input(z.object({ id: z.number().int() })).mutation(async ({ input }) => {
    await db.deleteMessage(input.id);
    return { success: true };
  }),

  updateSettings: adminProc
    .input(z.partialRecord(z.enum(SETTING_KEYS), z.string().max(2000)))
    .mutation(async ({ input }) => {
      for (const [k, v] of Object.entries(input)) await db.setSetting(k, v ?? "");
      return db.getSettings();
    }),
});
