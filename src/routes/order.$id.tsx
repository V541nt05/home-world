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
        <h1 className="text-2xl font-bold">Thank you! Your order is placed.</h1>
        <p className="mt-1 text-sm text-muted-foreground">Order ID: {o.id}</p>

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
          <div className="mt-3 text-muted-foreground">
            Payment: {o.payment_method} · Status:{" "}
            <span className="font-medium text-foreground">{o.order_status}</span>
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

