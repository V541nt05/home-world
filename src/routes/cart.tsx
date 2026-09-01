import { createFileRoute, Link } from "@tanstack/react-router";
import { Layout, Empty } from "@/components/Layout";
import { cartTotals, finalPrice, inr, removeFromCart, setQty, useCart } from "@/lib/store";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart — Home World" },
      { name: "description", content: "Review the appliances in your Home World cart before checkout." },
      { property: "og:title", content: "Your Cart — Home World" },
      { property: "og:description", content: "Review your appliances before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const items = useCart();
  const { subtotal, discount, total } = cartTotals(items);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="text-2xl font-bold">Your cart</h1>
        {!items.length ? (
          <Empty label="Your cart is empty." />
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {items.map((i) => (
                <li key={i.id} className="flex gap-3 rounded-md border bg-card p-3">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-muted">
                    {i.image && <img src={i.image} alt={i.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">{i.brand}</div>
                    <Link to="/product/$id" params={{ id: i.id }} className="text-sm font-medium">
                      {i.name}
                    </Link>
                    <div className="mt-1 text-sm font-semibold">
                      {inr(finalPrice(i.price, i.discount))}
                    </div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-md border">
                        <button className="px-2 py-1" onClick={() => setQty(i.id, i.qty - 1)}>
                          −
                        </button>
                        <span className="w-8 text-center text-sm">{i.qty}</span>
                        <button
                          className="px-2 py-1"
                          onClick={() => setQty(i.id, Math.min(i.stock, i.qty + 1))}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(i.id)}
                        className="text-xs text-destructive"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-md border bg-card p-4 text-sm">
              <Row label="Subtotal" value={inr(subtotal)} />
              <Row label="Discount" value={"− " + inr(discount)} />
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{inr(total)}</span>
              </div>
              <Link
                to="/checkout"
                className="mt-4 block rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground"
              >
                Proceed to checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

