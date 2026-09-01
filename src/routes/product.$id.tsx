import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Loading, ErrorState, Empty } from "@/components/Layout";
import { addToCart, finalPrice, inr } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product Details — Home World" },
      { name: "description", content: "Product details, specifications, warranty and reviews at Home World, Dhayari, Pune." },
      { property: "og:title", content: "Product Details — Home World" },
      { property: "og:description", content: "Specifications, warranty, price and customer reviews." },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [review, setReview] = useState({ customer_name: "", rating: 5, comment: "" });

  const product = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*,product_images(image_url,is_primary),categories(name)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const reviews = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("product_id", id)
        .eq("visible", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (product.isLoading) return <Layout><Loading /></Layout>;
  if (product.error) return <Layout><ErrorState /></Layout>;
  const p = product.data;
  if (!p) return <Layout><Empty label="Product not found." /></Layout>;

  const images = p.product_images || [];  const price = finalPrice(p.price, p.discount);
  const specs = (p.specifications || {}) as Record<string, string>;
  const avg = reviews.data?.length
    ? reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length
    : 0;

  const item = {
    id: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    discount: p.discount,
    image: images[0]?.image_url || null,
    stock: p.stock_quantity,
    qty,
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!review.customer_name.trim()) return;
    const { error } = await supabase.from("reviews").insert({
      product_id: id,
      customer_name: review.customer_name,
      rating: review.rating,
      review_text: review.comment,
    });
    if (error) toast.error("Could not submit review");
    else {
      toast.success("Review submitted");
      setReview({ customer_name: "", rating: 5, comment: "" });
      qc.invalidateQueries({ queryKey: ["reviews", id] });
    }
  };

  return (
    <Layout>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 lg:grid-cols-2">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-muted">
            {images[activeImg] ? (
              <img src={images[activeImg]!.image_url} alt={p.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm text-muted-foreground">No image</span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.image_url + i}
                  onClick={() => setActiveImg(i)}
                  className={`h-16 w-16 overflow-hidden rounded border ${i === activeImg ? "border-primary" : ""}`}
                >
                  <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="text-sm text-muted-foreground">{p.brand}</div>
          <h1 className="text-2xl font-bold">{p.name}</h1>
          <div className="mt-1 flex items-center gap-1 text-sm">
            <Star className="h-4 w-4 fill-accent text-accent" />
            {avg ? avg.toFixed(1) : "No ratings"}{" "}
            <span className="text-muted-foreground">({reviews.data?.length || 0} reviews)</span>
          </div>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-bold">{inr(price)}</span>
            {p.discount > 0 && (
              <>
                <span className="text-muted-foreground line-through">{inr(p.price)}</span>
                <span className="font-medium text-primary">{p.discount}% off</span>
              </>
            )}
          </div>
          <div className={`mt-1 text-sm ${p.stock_quantity > 0 ? "text-muted-foreground" : "text-destructive"}`}>
            {p.stock_quantity > 0 ? `In stock (${p.stock_quantity} available)` : "Out of stock"}
          </div>

          {p.stock_quantity > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded-md border">
                <button className="px-3 py-2" onClick={() => setQty(Math.max(1, qty - 1))}>
                  −
                </button>
                <span className="w-10 text-center text-sm">{qty}</span>
                <button className="px-3 py-2" onClick={() => setQty(Math.min(p.stock_quantity, qty + 1))}>
                  +
                </button>
              </div>
              <button
                onClick={() => {
                  addToCart(item);
                  toast.success("Added to cart");
                }}
                className="rounded-md border border-primary px-5 py-2 text-sm font-medium text-primary"
              >
                Add to cart
              </button>
              <button
                onClick={() => {
                  addToCart(item);
                  navigate({ to: "/checkout" });
                }}
                className="rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Buy now
              </button>
            </div>
          )}

          {p.description && <p className="mt-6 text-sm text-muted-foreground">{p.description}</p>}

          {Object.keys(specs).length > 0 && (
            <div className="mt-6">
              <h2 className="font-semibold">Specifications</h2>
              <dl className="mt-2 divide-y rounded-md border text-sm">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between px-3 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd>{String(v)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {p.warranty && (
            <div className="mt-6 text-sm">
              <span className="font-semibold">Warranty: </span>
              <span className="text-muted-foreground">{p.warranty}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-10">
        <h2 className="text-xl font-semibold">Customer reviews</h2>
        {reviews.isLoading ? (
          <Loading />
        ) : !reviews.data?.length ? (
          <Empty label="No reviews yet. Be the first to review." />
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.data.map((r) => (
              <li key={r.id} className="rounded-md border bg-card p-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  {r.customer_name}
                  <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-accent text-accent" />
                    {r.rating}
                  </span>
                </div>
                {r.review_text && <p className="mt-1 text-sm text-muted-foreground">{r.review_text}</p>}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submitReview} className="mt-6 max-w-md space-y-3 rounded-md border bg-card p-4">
          <h3 className="font-semibold">Write a review</h3>
          <input
            value={review.customer_name}
            onChange={(e) => setReview({ ...review, customer_name: e.target.value })}
            placeholder="Your name"
            required
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <select
            value={review.rating}
            onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          <textarea
            value={review.comment}
            onChange={(e) => setReview({ ...review, comment: e.target.value })}
            placeholder="Your experience"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
          <button className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
            Submit review
          </button>
        </form>
      </div>
    </Layout>
  );
}

