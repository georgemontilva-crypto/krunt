import { flavorByKey } from "@shared/const";
import { toast } from "sonner";
import { Field, Input, Textarea } from "@/components/Form";
import { packImage } from "@/lib/store";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AdminTitle } from "./AdminApp";

const toCents = (v: string) => Math.round(parseFloat(v || "0") * 100);

export function AdminProducts() {
  const utils = trpc.useUtils();
  const { data } = trpc.catalog.adminList.useQuery();
  const update = trpc.catalog.update.useMutation();
  const stock = trpc.catalog.setStock.useMutation();

  return (
    <>
      <AdminTitle title="Products" />
      <div className="space-y-8">
        {data?.map(p => (
          <form
            key={p.id}
            className="border-2 border-white/10 p-5 md:p-7"
            onSubmit={async e => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const g = (k: string) => String(fd.get(k) ?? "").trim();
              try {
                await update.mutateAsync({
                  id: p.id,
                  name: g("name"),
                  shortName: g("shortName"),
                  tagline: g("tagline") || null,
                  description: g("description") || null,
                  netWeight: g("netWeight") || null,
                  retailPriceCents: toCents(g("retail")),
                  wholesalePriceCents: toCents(g("wholesale")),
                  caseSize: Math.max(1, parseInt(g("caseSize") || "1")),
                  published: fd.get("published") === "on",
                });
                toast.success(`${g("shortName")} saved`);
                utils.catalog.invalidate();
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Failed");
              }
            }}
          >
            <div className="flex flex-wrap items-center gap-4">
              <img src={packImage(p.slug, "candy-gas")} alt="" className="h-20 w-auto" />
              <h2 className="font-display flex-1 text-4xl">{p.shortName}</h2>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="published" defaultChecked={p.published} className="h-5 w-5 accent-[var(--flavor)]" /> Visible on site
              </label>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Field label="Name"><Input name="name" defaultValue={p.name} required /></Field>
              <Field label="Short name"><Input name="shortName" defaultValue={p.shortName} required /></Field>
              <Field label="Tagline"><Input name="tagline" defaultValue={p.tagline ?? ""} /></Field>
              <Field label="Net weight"><Input name="netWeight" defaultValue={p.netWeight ?? ""} /></Field>
              <Field label="Description" className="md:col-span-2"><Textarea name="description" defaultValue={p.description ?? ""} /></Field>
              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <Field label="Retail price $"><Input name="retail" type="number" step="0.01" min="0" defaultValue={(p.retailPriceCents / 100).toFixed(2)} /></Field>
                <Field label="Wholesale $ / unit"><Input name="wholesale" type="number" step="0.01" min="0" defaultValue={(p.wholesalePriceCents / 100).toFixed(2)} /></Field>
                <Field label="Case size"><Input name="caseSize" type="number" min="1" defaultValue={p.caseSize} /></Field>
              </div>
            </div>
            <p className="label mt-6 text-smoke">Flavors in stock (click to toggle)</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {p.variants.map(v => {
                const f = flavorByKey(v.flavorKey);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={async () => {
                      await stock.mutateAsync({ variantId: v.id, inStock: !v.inStock });
                      utils.catalog.invalidate();
                    }}
                    className={cn("label border-2 px-3 py-2 text-[0.65rem]", v.inStock ? "text-black" : "border-white/20 text-smoke line-through")}
                    style={v.inStock ? { background: f.color, borderColor: f.color } : undefined}
                  >
                    {f.name} {v.inStock ? "" : "· sold out"}
                  </button>
                );
              })}
            </div>
            <button type="submit" className="btn btn-spray mt-6" disabled={update.isPending}>Save {p.shortName}</button>
          </form>
        ))}
      </div>
    </>
  );
}
