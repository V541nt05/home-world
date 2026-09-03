import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Loading, ErrorState, Empty } from "@/components/Layout";
import { inr } from "@/lib/store";

export const Route = createFileRoute("/order/$id")({
  head: () => ({
    meta: [
      { title: "Order Confirmation — Home World" },
      { name: "description", content: "Your Home World order details and status." },
      { property: "og:title", content: "Order Confirmation — Home World" },
      { property: "og:description", content: "Your order details and status." },
    ],
  }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const order = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*,order_items(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (order.isLoading) return <Layout><Loading /></Layout>;
  if (order.error) return <Layout><ErrorState /></Layout>;
  if (!order.data) return <Layout><Empty label="Order not found." /></Layout>;
  const o = order.data;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">
        Order #{String(o.id).slice(-6)}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
        Placed on {new Date(o.created_at).toLocaleDateString()}
        </p>
        <div className="mt-6 rounded-md border bg-card p-4 text-sm">
          <ul className="space-y-1">
            {o.order_items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span className="text-muted-foreground">
                  {it.product_name} × {it.quantity}
                </span>
                <span>{inr(it.total)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{inr(o.total)}</span>
          </div>
          <div className="mt-3 border-t pt-3 text-sm">
            <p className="mt-2 text-muted-foreground">
              Status:{" "}
              <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${
               o.order_status === "accepted"
               ? "bg-green-100 text-green-700"
               : o.order_status === "rejected"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700"
               }`}
             >
             {o.order_status}
            </span>
          </p>
            <p className="mt-2 text-muted-foreground">
              Status:{" "}
              <span className="font-medium capitalize text-foreground">
                {o.order_status}
                </span>
              </p>
          </div>
          <div className="mt-4 border-t pt-4">
            <h2 className="font-semibold">Delivery Address</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {o.customer_name}
            </p>
            <p className="text-sm text-muted-foreground">
            {o.customer_phone}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
            {o.delivery_address}
            </p>
          {(o.city || o.pincode) && (
            <p className="text-sm text-muted-foreground">
              {o.city}
              {o.city && o.pincode ? " - " : ""}
              {o.pincode}
            </p>
          )}
        </div>
          {o.rejection_reason && (
            <div className="mt-2 text-destructive">Reason: {o.rejection_reason}</div>
          )}
        </div>

        <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
          Continue shopping
        </Link>
      </div>
    </Layout>
  );
}

