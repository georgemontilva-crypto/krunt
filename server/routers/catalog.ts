import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProc, publicProc, resolveWholesale, router } from "../appTrpc";
import * as db from "../db";

/**
 * Public catalogue. Wholesale prices and case sizes are only included for a
 * signed-in, approved wholesale account; everyone else gets retail.
 */
export const catalogRouter = router({
  list: publicProc.query(async ({ ctx }) => {
    const account = await resolveWholesale(ctx);
    const wholesale = account?.status === "approved";
    const rows = await db.listCatalog({ publishedOnly: true });
    return {
      wholesale,
      products: rows.map(({ wholesalePriceCents, caseSize, ...p }) => ({
        ...p,
        wholesalePriceCents: wholesale ? wholesalePriceCents : null,
        caseSize: wholesale ? caseSize : null,
      })),
    };
  }),

  adminList: adminProc.query(() => db.listCatalog()),

  update: adminProc
    .input(
      z.object({
        id: z.number().int(),
        name: z.string().min(1).max(255).optional(),
        shortName: z.string().min(1).max(120).optional(),
        tagline: z.string().max(255).nullable().optional(),
        description: z.string().max(5000).nullable().optional(),
        netWeight: z.string().max(120).nullable().optional(),
        retailPriceCents: z.number().int().min(0).max(10_000_00).optional(),
        wholesalePriceCents: z.number().int().min(0).max(10_000_00).optional(),
        caseSize: z.number().int().min(1).max(1000).optional(),
        published: z.boolean().optional(),
      })
    )
    .mutation(async ({ input: { id, ...data } }) => {
      const row = await db.updateProduct(id, data);
      if (!row) throw new TRPCError({ code: "NOT_FOUND" });
      return row;
    }),

  setStock: adminProc
    .input(z.object({ variantId: z.number().int(), inStock: z.boolean() }))
    .mutation(async ({ input }) => {
      await db.setVariantStock(input.variantId, input.inStock);
      return { success: true };
    }),
});
