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
  const update = async (
    id: number,
    patch: {
      order_status?: string;
      rejection_reason?: string | null;
    },
  ) => {
    // Accept orders through the secure stock-management RPC
    if (patch.order_status === "accepted") {
      const { error } = await supabase.rpc("accept_order_and_reduce_stock", {
        p_order_id: id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Order accepted and stock reduced");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      return;
    }

    // Handle rejection and other status updates normally
    const { error } = await supabase.from("orders").update(patch).eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
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
              <span className="font-medium">#{String(o.id).slice(0, 8)}</span>
              <span className="text-muted-foreground">
                {new Date(o.created_at).toLocaleString()}
              </span>
              <span className="font-semibold">{inr(o.total)}</span>
              <span className="rounded bg-muted px-2 py-0.5">{o.order_status}</span>
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
                      <span>{inr(it.total)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap items-center gap-2">
                  {o.order_status === "pending" && (
                    <>
                      <button
                        onClick={() => update(o.id, { order_status: "accepted" })}
                        className="rounded-md bg-green-500 px-2 py-1 text-white"
                      >
                        Accept
                      </button>

                      <button
                        onClick={() => {
                          const reason = window.prompt("Why are you rejecting this order?");
                          if (reason === null) return;

                          const trimmedReason = reason.trim();

                          if (!trimmedReason) {
                            toast.error("Please enter a rejection reason.");
                            return;
                          }

                          update(o.id, {
                            order_status: "rejected",
                            rejection_reason: trimmedReason,
                          });
                        }}
                        className="rounded-md bg-red-500 px-2 py-1 text-white"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {o.order_status === "accepted" && (
                    <button
                      onClick={() => update(o.id, { order_status: "processing" })}
                      className="rounded-md bg-blue-500 px-2 py-1 text-white"
                    >
                      Start Processing
                    </button>
                  )}

                  {o.order_status === "processing" && (
                    <button
                      onClick={() => update(o.id, { order_status: "ready_for_delivery" })}
                      className="rounded-md bg-purple-500 px-2 py-1 text-white"
                    >
                      Ready for Delivery / Pickup
                    </button>
                  )}

                  {o.order_status === "ready_for_delivery" && (
                    <span className="rounded-md bg-yellow-100 px-2 py-1 text-yellow-800">
                      Waiting for customer delivery confirmation
                    </span>
                  )}

                  {o.order_status === "delivered" && (
                    <span className="rounded-md bg-green-100 px-2 py-1 text-green-800">
                      Delivered
                    </span>
                  )}

                  {o.order_status === "rejected" && (
                    <span className="rounded-md bg-red-100 px-2 py-1 text-red-800">Rejected</span>
                  )}
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
