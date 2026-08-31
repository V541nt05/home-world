import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorState, Empty } from "@/components/Layout";
import { inr } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: AdminOrders,
});

const STATUSES = ["pending", "accepted", "packed", "delivered", "rejected"];

function AdminOrders() {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);

  const orders = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*,order_items(*),customers(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = async (id: string, patch: { status?: string; rejection_reason?: string | null }) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Order updated");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    }
  };

  if (orders.isLoading) return <Loading />;
  if (orders.error) return <ErrorState />;
  if (!orders.data?.length) return <Empty label="No orders yet." />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <ul className="space-y-3">
        {orders.data.map((o) => (
          <li key={o.id} className="rounded-md border bg-card p-3 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-medium">#{o.id.slice(0, 8)}</span>
              <span className="text-muted-foreground">
                {new Date(o.created_at).toLocaleString()}
              </span>
              <span className="font-semibold">{inr(o.total)}</span>
              <span className="rounded bg-muted px-2 py-0.5">{o.status}</span>
              <span className="text-muted-foreground">{o.payment_method}</span>
              <button
                className="ml-auto text-primary"
                onClick={() => setOpenId(openId === o.id ? null : o.id)}
              >
                {openId === o.id ? "Hide" : "Details"}
              </button>
            </div>

            {openId === o.id && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <div>
                  <div className="font-medium">Customer</div>
                  <div className="text-muted-foreground">
                    {o.customers?.name} · {o.customers?.phone} · {o.customers?.email}
                    <br />
                    {o.customers?.address}, {o.customers?.city} {o.customers?.pincode}
                  </div>
                  {o.notes && <div className="mt-1 text-muted-foreground">Notes: {o.notes}</div>}
                </div>
                <ul>
                  {o.order_items.map((it) => (
                    <li key={it.id} className="flex justify-between">
                      <span className="text-muted-foreground">
                        {it.product_name} × {it.quantity}
                      </span>
                      <span>{inr(it.total_price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={o.status}
                    onChange={(e) => update(o.id, { status: e.target.value })}
                    className="rounded-md border px-2 py-1"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => update(o.id, { status: "accepted", rejection_reason: null })}
                    className="rounded-md bg-primary px-3 py-1 text-primary-foreground"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      const reason = window.prompt("Rejection reason");
                      if (reason) update(o.id, { status: "rejected", rejection_reason: reason });
                    }}
                    className="rounded-md border border-destructive px-3 py-1 text-destructive"
                  >
                    Reject
                  </button>
                </div>
                {o.rejection_reason && (
                  <div className="text-destructive">Reason: {o.rejection_reason}</div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
