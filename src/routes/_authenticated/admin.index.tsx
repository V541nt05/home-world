import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorState, Empty } from "@/components/Layout";
import { inr } from "@/lib/store";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const stats = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [products, orders] = await Promise.all([
        supabase.from("products").select("id,name,stock_quantity,active"),
        supabase.from("orders").select("id,total,order_status,created_at,payment_method").order("created_at", { ascending: false }),
      ]);
      if (products.error) throw products.error;
      if (orders.error) throw orders.error;
      return { products: products.data, orders: orders.data };
    },
  });

  if (stats.isLoading) return <Loading />;
  if (stats.error) return <ErrorState />;
  const { products, orders } = stats.data!;
  const pending = orders.filter((o) => o.order_status === "pending");
  const sales = orders
    .filter((o) => o.order_status !== "rejected" && o.order_status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);
  const lowStock = products.filter((p) => p.stock_quantity <= 3);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total products" value={String(products.length)} />
        <Stat label="Pending orders" value={String(pending.length)} />
        <Stat label="Sales" value={inr(sales)} />
        <Stat label="Low stock" value={String(lowStock.length)} />
      </div>

      <section>
        <h2 className="mb-2 font-semibold">Recent orders</h2>
        {!orders.length ? (
          <Empty label="No orders yet." />
        ) : (
          <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="p-2">Order</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 10).map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2">{o.id.slice(0, 8)}</td>
                    <td className="p-2">{new Date(o.created_at).toLocaleDateString()}</td>
                    <td className="p-2">{inr(o.total)}</td>
                    <td className="p-2">{o.payment_method}</td>
                    <td className="p-2">{o.order_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-semibold">Low stock products</h2>
        {!lowStock.length ? (
          <Empty label="All products are well stocked." />
        ) : (
          <ul className="rounded-md border bg-card text-sm">
            {lowStock.map((p) => (
              <li key={p.id} className="flex justify-between border-b p-2 last:border-0">
                <span>{p.name}</span>
                <span className="text-destructive">{p.stock_quantity} left</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}

