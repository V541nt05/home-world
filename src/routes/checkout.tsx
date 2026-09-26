import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Empty } from "@/components/Layout";
import { cartTotals, clearCart, inr, useCart } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Home World" },
      {
        name: "description",
        content: "Place your appliance order with cash on delivery or UPI at Home World, Pune.",
      },
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
  useEffect(() => {
    const loadCustomerDetails = async () => {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) return;

      try {
        const { data: customer, error } = await supabase.rpc("get_my_customer_details");

        if (error) throw error;

        if (customer?.length) {
          const saved = customer[0];

          setForm((current) => ({
            ...current,
            name: saved.name || "",
            phone: saved.phone || "",
            email: saved.email || "",
            address: saved.address || "",
            city: saved.city || "Pune",
            pincode: saved.pincode || "",
          }));
        }
      } catch (error) {
        console.error("CUSTOMER LOAD ERROR:", error);
        toast.error(
          error instanceof Error ? error.message : "Could not load saved customer details.",
        );
      }
    };

    loadCustomerDetails();
  }, []);
  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm({ ...form, [k]: e.target.value }),
    className: "w-full rounded-md border bg-card px-3 py-2 text-sm",
  });
  const saveCustomerDetails = async () => {
    try {
      const { error } = await supabase.rpc("update_my_customer_details", {
        p_name: form.name,
        p_phone: form.phone,
        p_email: form.email || null,
        p_address: form.address,
        p_city: form.city,
        p_pincode: form.pincode,
      });

      if (error) throw error;

      toast.success("Customer details saved!");
    } catch (error) {
      console.error("CUSTOMER SAVE ERROR:", error);
      toast.error(error instanceof Error ? error.message : "Could not save customer details.");
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) return;

    setBusy(true);

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!userData.user) {
        throw new Error("Please sign in before placing an order.");
      }

      const { data: customerId, error: linkError } = await supabase.rpc("link_customer_to_auth");

      if (linkError) throw linkError;

      const { data: orderId, error: orderError } = await supabase.rpc("place_order", {
        p_customer_id: customerId,
        p_customer_name: form.name,
        p_customer_phone: form.phone,
        p_customer_email: form.email || null,
        p_delivery_address: form.address,
        p_city: form.city,
        p_pincode: form.pincode,
        p_notes: form.notes || null,
        p_payment_method: form.payment_method,
        p_items: items.map((item) => ({
          product_id: Number(item.id),
          quantity: item.qty,
        })),
      });

      if (orderError) throw orderError;

      if (!orderId) {
        throw new Error("Order was created but no order ID was returned.");
      }

      clearCart();

      navigate({
        to: "/order/$id",
        params: { id: orderId },
      });
    } catch (error) {
      console.error("ORDER ERROR:", error);

      toast.error(
        error instanceof Error ? error.message : "Could not place order. Please try again.",
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
          <button
            type="button"
            onClick={saveCustomerDetails}
            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Save Customer Details
          </button>
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
