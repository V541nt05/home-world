import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loading, Empty, ErrorState } from "@/components/Layout";
import { inr } from "@/lib/store";

export const Route = createFileRoute("/orders")({
  component: OrdersPage,
});

type Order = {
  id: number;
  total: number;
  order_status: string;
  created_at: string;
};

function OrdersPage() {
  const orders = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, total, order_status, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Order[];
    },
  });

  if (orders.isLoading) {
    return <Loading label="Loading your orders..." />;
  }

  if (orders.error) {
    return <ErrorState message="Could not load your orders." />;
  }

  if (!orders.data?.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Empty label="You haven't placed any orders yet." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">My Orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        View your previous orders and their status.
      </p>

      <div className="mt-6 space-y-4">
        {orders.data.map((order) => (
          <Link
            key={order.id}
            to="/order/$id"
            params={{ id: String(order.id) }}
            className="block rounded-lg border bg-card p-5 transition-shadow hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  Order #{String(order.id).slice(-6)}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {new Date(order.created_at).toLocaleDateString()}
                </p>
              </div>

              <p className="font-semibold">{inr(order.total)}</p>
            </div>

            <div className="mt-4">
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
                {order.order_status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}