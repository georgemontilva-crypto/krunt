import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { AdminTitle } from "./AdminApp";

export function AdminMessages() {
  const [page, setPage] = useState(1);
  const utils = trpc.useUtils();
  const { data } = trpc.site.messages.useQuery({ page });
  const handled = trpc.site.setMessageHandled.useMutation();
  const del = trpc.site.deleteMessage.useMutation();
  const refresh = () => {
    utils.site.messages.invalidate();
    utils.site.dashboard.invalidate();
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / 30)) : 1;

  return (
    <>
      <AdminTitle title="Messages" />
      <div className="space-y-4">
        {data?.rows.map(m => (
          <div key={m.id} className={cn("border-2 p-5", m.handled ? "border-white/5 opacity-60" : "border-white/15")}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-bold">{m.name} · <a className="underline" href={`mailto:${m.email}`}>{m.email}</a> {m.phone && `· ${m.phone}`}</p>
                <p className="text-xs text-smoke">{new Date(m.createdAt).toLocaleString()} {m.topic && `· ${m.topic}`}</p>
              </div>
              <div className="flex gap-3 text-sm">
                <button type="button" className="underline" onClick={async () => { await handled.mutateAsync({ id: m.id, handled: !m.handled }); refresh(); }}>
                  {m.handled ? "Mark open" : "Mark handled"}
                </button>
                <button type="button" className="text-smoke hover:text-blood" onClick={async () => { if (confirm("Delete this message?")) { await del.mutateAsync({ id: m.id }); refresh(); } }}>
                  Delete
                </button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap">{m.message}</p>
          </div>
        ))}
        {data && !data.rows.length && <p className="text-smoke">No messages yet.</p>}
      </div>
      {pages > 1 && (
        <div className="mt-4 flex items-center gap-3">
          <button type="button" className="btn btn-ghost min-h-10" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
          <span>{page} / {pages}</span>
          <button type="button" className="btn btn-ghost min-h-10" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </>
  );
}
