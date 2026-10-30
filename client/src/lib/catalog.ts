import { flavorByKey, formatMoney, RETAIL_MAX_QTY } from "@shared/const";
import { trpc } from "./trpc";
import type { CartLine } from "./store";

export { formatMoney };

export function useCatalog() {
  return trpc.catalog.list.useQuery(undefined, { staleTime: 60_000 });
}

export type CatalogData = NonNullable<ReturnType<typeof useCatalog>["data"]>;
export type CatalogProduct = CatalogData["products"][number];

/** Joins cart lines with the live catalogue, so prices are always current. */
export function resolveCart(lines: CartLine[], data: CatalogData | undefined) {
  if (!data) return { items: [], subtotal: 0, problems: [] as string[] };
  const items = [];
  const problems: string[] = [];
  for (const line of lines) {
    for (const p of data.products) {
      const v = p.variants.find(x => x.id === line.variantId);
      if (!v) continue;
      const flavor = flavorByKey(v.flavorKey);
      const unit = data.wholesale && p.wholesalePriceCents != null ? p.wholesalePriceCents : p.retailPriceCents;
      const step = data.wholesale && p.caseSize ? p.caseSize : 1;
      if (!v.inStock) problems.push(`${p.shortName} ${flavor.name} is sold out`);
      if (step > 1 && line.quantity % step !== 0) problems.push(`${p.shortName} ${flavor.name}: order in cases of ${step}`);
      if (!data.wholesale && line.quantity > RETAIL_MAX_QTY) problems.push(`Max ${RETAIL_MAX_QTY} per flavor on retail`);
      items.push({ line, product: p, variant: v, flavor, unit, step, total: unit * line.quantity });
    }
  }
  return { items, subtotal: items.reduce((s, i) => s + i.total, 0), problems };
}
