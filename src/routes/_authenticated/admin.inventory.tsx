import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorState, Empty } from "@/components/Layout";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/inventory")({
  component: AdminInventory,
});

function AdminInventory() {
  const qc = useQueryClient();

  const products = useQuery({
    queryKey: ["inventory-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,brand,stock_quantity")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const txns = useQuery({
    queryKey: ["inventory-txns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("*,products(name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const adjust = async (id: string, stock: number, delta: number) => {
    const reason = window.prompt("Reason for adjustment", delta > 0 ? "Stock received" : "Stock removed");
    if (reason === null) return;
    const next = Math.max(0, stock + delta);
    const { error } = await supabase.from("products").update({ stock_quantity: next }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase
      .from("inventory_transactions")
      .insert({ product_id: id, quantity: next - stock, notes: reason });
    toast.success("Stock updated");
    qc.invalidateQueries({ queryKey: ["inventory-products"] });
    qc.invalidateQueries({ queryKey: ["inventory-txns"] });
  };

  if (products.isLoading) return <Loading />;
  if (products.error) return <ErrorState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Inventory</h1>

      {!products.data?.length ? (
        <Empty label="No products yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Adjust</th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                  </td>
                  <td className={`p-2 ${p.stock_quantity <= 3 ? "text-destructive" : ""}`}>{p.stock_quantity}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={() => adjust(p.id, p.stock_quantity, -1)} className="rounded border px-2">
                        −1
                      </button>
                      <button onClick={() => adjust(p.id, p.stock_quantity, 1)} className="rounded border px-2">
                        +1
                      </button>
                      <button
                        onClick={() => {
                          const v = window.prompt("Set new stock", String(p.stock_quantity));
                          if (v === null) return;
                          adjust(p.id, p.stock_quantity, Number(v) - p.stock_quantity);
                        }}
                        className="rounded border px-2"
                      >
                        Set
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Transaction history</h2>
        {txns.isLoading ? (
          <Loading />
        ) : !txns.data?.length ? (
          <Empty label="No stock movements recorded yet." />
        ) : (
          <ul className="rounded-md border bg-card text-sm">
            {txns.data.map((t) => (
              <li key={t.id} className="flex flex-wrap gap-2 border-b p-2 last:border-0">
                <span className="text-muted-foreground">
                  {new Date(t.created_at).toLocaleString()}
                </span>
                <span>{t.products?.name}</span>
                <span className={t.quantity >= 0 ? "text-primary" : "text-destructive"}>
                  {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                </span>
                <span className="text-muted-foreground">{t.notes}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

