import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Empty } from "@/components/Layout";
import { cartTotals, clearCart, inr, useCart } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Home World" },
      { name: "description", content: "Place your appliance order with cash on delivery or UPI at Home World, Pune." },
      { property: "og:title", content: "Checkout — Home World" },
      { property: "og:description", content: "Place your order with COD or UPI." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const items = useCart();
  const navigate = useNavigate();
  const { subtotal, discount, total } = cartTotals(items);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "Pune",
    pincode: "",
    notes: "",
    payment_method: "cod",
  });

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
    className: "w-full rounded-md border bg-card px-3 py-2 text-sm",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;
    setBusy(true);
    try {
      const { data: customer, error: cErr } = await supabase
        .from("customers")
        .insert({
          name: form.name,
          phone: form.phone,
          email: form.email,
          address: form.address,
          city: form.city,
          pincode: form.pincode,
        })
        .select("id")
        .single();
      if (cErr) throw cErr;

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          customer_id: customer.id,
          customer_name: form.name,
          customer_phone: form.phone,
          delivery_address: form.address,
          city: form.city,
          pincode: form.pincode,
          subtotal,
          discount,
          total,
          payment_method: form.payment_method,
          notes: form.notes,
          order_status: "pending",
        })
        .select("id")
        .single();
      if (oErr) throw oErr;

      const { error: iErr } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          product_id: i.id,
          product_name: i.name,
          quantity: i.qty,
          unit_price: i.price,
          total:i.price * i.qty,
        })),
      );
      if (iErr) throw iErr;

      clearCart();
      navigate({ to: "/order/$id", params: { id: order.id } });
      } catch (error) {
      console.error("ORDER ERROR:", error);
      toast.error(
          error instanceof Error
          ? error.message
          : "Could not place order. Please try again."
        );
      } finally {
      setBusy(false);
    }
  };

  if (!items.length)
    return (
      <Layout>
        <Empty label="Your cart is empty." />
      </Layout>
    );

  return (
    <Layout>
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-3">
          <h1 className="text-2xl font-bold">Checkout</h1>
          <input placeholder="Full name" required {...field("name")} />
          <input placeholder="Phone number" required {...field("phone")} />
          <input placeholder="Email (optional)" type="email" {...field("email")} />
          <textarea placeholder="Address" required rows={3} {...field("address")} />
          <div className="grid grid-cols-2 gap-3">
            <input placeholder="City" required {...field("city")} />
            <input placeholder="Pincode" required {...field("pincode")} />
          </div>
          <textarea placeholder="Order notes (optional)" rows={2} {...field("notes")} />
          <div className="rounded-md border bg-card p-3 text-sm">
            <div className="font-medium">Payment method</div>
            {["cod", "upi"].map((m) => (
              <label key={m} className="mt-2 flex items-center gap-2">
                <input
                  type="radio"
                  name="payment"
                  checked={form.payment_method === m}
                  onChange={() => setForm({ ...form, payment_method: m })}
                />
                {m === "cod" ? "Cash on delivery" : "UPI (pay on delivery via UPI)"}
              </label>
            ))}
          </div>
          <button
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? "Placing order..." : "Place order"}
          </button>
        </form>

        <aside className="h-fit rounded-md border bg-card p-4 text-sm">
          <div className="font-semibold">Order summary</div>
          <ul className="mt-2 space-y-1">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-2">
                <span className="truncate text-muted-foreground">
                  {i.name} × {i.qty}
                </span>
                <span>{inr(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t pt-2">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal</span>
              <span>{inr(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Discount</span>
              <span>− {inr(discount)}</span>
            </div>
            <div className="mt-1 flex justify-between text-base font-semibold">
              <span>Total</span>
              <span>{inr(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

