import { WHOLESALE_STATUSES, type WholesaleStatus } from "@shared/const";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AdminTitle } from "./AdminApp";

export function AdminWholesale() {
  const [filter, setFilter] = useState<WholesaleStatus | "">("pending");
  const utils = trpc.useUtils();
  const { data } = trpc.wholesale.adminList.useQuery({ status: filter || undefined });
  const setStatus = trpc.wholesale.setStatus.useMutation();
  const del = trpc.wholesale.delete.useMutation();

  const act = async (id: number, status: WholesaleStatus) => {
    try {
      await setStatus.mutateAsync({ id, status });
      toast.success(status === "approved" ? "Approved — they've been emailed" : `Marked ${status}`);
      utils.wholesale.adminList.invalidate();
      utils.site.dashboard.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  return (
    <>
      <AdminTitle title="Wholesale">
        <div className="flex border-2 border-white/10">
          {(["pending", "approved", "rejected", ""] as const).map(s => (
            <button key={s || "all"} type="button" onClick={() => setFilter(s)} className={cn("label px-3 py-2 text-[0.65rem]", filter === s ? "bg-[var(--flavor)] text-black" : "")}>
              {s || "All"}
            </button>
          ))}
        </div>
      </AdminTitle>
      <div className="grid gap-4 xl:grid-cols-2">
        {data?.map(a => (
          <div key={a.id} className="border-2 border-white/10 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-display text-3xl">{a.businessName}</p>
                <p className="text-sm text-smoke">Applied {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
              <span className={cn("label px-2 py-1 text-[0.6rem]", a.status === "approved" ? "bg-[var(--flavor)] text-black" : a.status === "pending" ? "bg-yellow-400 text-black" : "bg-blood text-white")}>{a.status}</span>
            </div>
            <dl className="mt-4 grid grid-cols-[110px_1fr] gap-y-1 text-sm">
              <dt className="text-smoke">Contact</dt><dd>{a.contactName}</dd>
              <dt className="text-smoke">Email</dt><dd><a className="underline" href={`mailto:${a.email}`}>{a.email}</a></dd>
              <dt className="text-smoke">Phone</dt><dd>{a.phone}</dd>
              <dt className="text-smoke">Tax ID</dt><dd>{a.taxId || "—"}</dd>
              <dt className="text-smoke">Web</dt><dd className="truncate">{a.website || "—"}</dd>
              <dt className="text-smoke">Address</dt><dd>{a.address}, {a.city}, {a.state} {a.zip}</dd>
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {WHOLESALE_STATUSES.filter(s => s !== a.status).map(s => (
                <button key={s} type="button" onClick={() => act(a.id, s)} className={cn("btn min-h-10 px-4 text-sm", s === "approved" ? "btn-spray" : "btn-ghost")}>
                  {s === "approved" ? "Approve" : s === "rejected" ? "Reject" : "Back to pending"}
                </button>
              ))}
              <button
                type="button"
                className="ml-auto text-sm text-smoke hover:text-blood"
                onClick={async () => {
                  if (!confirm(`Delete ${a.businessName}? Their past orders stay.`)) return;
                  await del.mutateAsync({ id: a.id });
                  utils.wholesale.adminList.invalidate();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {data && !data.length && <p className="text-smoke">Nothing here.</p>}
      </div>
    </>
  );
}
