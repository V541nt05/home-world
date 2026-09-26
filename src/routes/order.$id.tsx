import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Loading, ErrorState, Empty } from "@/components/Layout";
import { inr } from "@/lib/store";
import { toast } from "sonner";

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
  const [orderRating, setOrderRating] = useState(5);
  const [orderReview, setOrderReview] = useState("");
  const [productRatings, setProductRatings] = useState<Record<string, number>>({});
  const [productReviews, setProductReviews] = useState<Record<string, string>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [markingDelivered, setMarkingDelivered] = useState(false);
  const markDelivered = async () => {
    setMarkingDelivered(true);

    try {
      const { error } = await supabase.rpc("mark_order_delivered", {
        p_order_id: Number(id),
      });

      if (error) throw error;

      toast.success("Order marked as delivered!");

      await order.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not mark order as delivered.");
    } finally {
      setMarkingDelivered(false);
    }
  };
  const submitReview = async () => {
    setSubmittingReview(true);

    try {
      const productReviewPayload = o.order_items.map((item) => ({
        product_id: Number(item.product_id),
        rating: productRatings[String(item.product_id)] ?? 5,
        review_text: productReviews[String(item.product_id)] ?? "",
      }));
      const { error } = await supabase.rpc("submit_order_review", {
        p_order_id: Number(id),
        p_order_rating: orderRating,
        p_order_review_text: orderReview,
        p_product_reviews: productReviewPayload,
      });

      if (error) throw error;

      toast.success("Thanks for your feedback! ⭐");

      await order.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit your review.");
    } finally {
      setSubmittingReview(false);
    }
  };
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

  if (order.isLoading)
    return (
      <Layout>
        <Loading />
      </Layout>
    );
  if (order.error)
    return (
      <Layout>
        <ErrorState />
      </Layout>
    );
  if (!order.data)
    return (
      <Layout>
        <Empty label="Order not found." />
      </Layout>
    );
  const o = order.data;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Order #{String(o.id).slice(-6)}</h1>
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
              <span className="font-medium capitalize text-foreground">{o.order_status}</span>
            </p>
          </div>
          <div className="mt-4 border-t pt-4">
            <h2 className="font-semibold">Delivery Address</h2>
            <p className="mt-2 text-sm text-muted-foreground">{o.customer_name}</p>
            <p className="text-sm text-muted-foreground">{o.customer_phone}</p>
            <p className="mt-2 text-sm text-muted-foreground">{o.delivery_address}</p>
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
        {o.order_status === "ready_for_delivery" && (
          <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 p-4">
            <h2 className="font-semibold">Your order is ready!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Once you have received your order, confirm the delivery below.
            </p>

            <button
              onClick={markDelivered}
              disabled={markingDelivered}
              className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {markingDelivered ? "Confirming..." : "Mark as Delivered"}
            </button>
          </div>
        )}
        {o.order_status === "delivered" && !o.order_rating && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-semibold">How was your order?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We'd love to hear about your experience.
            </p>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">Overall order rating</p>

              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setOrderRating(star)}
                    className={`text-2xl ${
                      star <= orderRating ? "text-yellow-500" : "text-muted-foreground"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={orderReview}
              onChange={(e) => setOrderReview(e.target.value)}
              placeholder="Tell us about your experience (optional)"
              className="mt-4 w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={3}
            />

            <div className="mt-5">
              <h3 className="font-semibold">Rate your products</h3>

              <div className="mt-3 space-y-4">
                {o.order_items.map((item) => {
                  const productId = String(item.product_id);

                  return (
                    <div key={item.id} className="rounded-md border p-3">
                      <p className="font-medium">
                        {item.product_name}
                        {item.quantity > 1 && ` × ${item.quantity}`}
                      </p>

                      <div className="mt-2 flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const rating = productRatings[productId] ?? 5;

                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setProductRatings({
                                  ...productRatings,
                                  [productId]: star,
                                })
                              }
                              className={`text-xl ${
                                star <= rating ? "text-yellow-500" : "text-muted-foreground"
                              }`}
                            >
                              ★
                            </button>
                          );
                        })}
                      </div>

                      <textarea
                        value={productReviews[productId] ?? ""}
                        onChange={(e) =>
                          setProductReviews({
                            ...productReviews,
                            [productId]: e.target.value,
                          })
                        }
                        placeholder="Review this product (optional)"
                        className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
                        rows={2}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={submitReview}
              disabled={submittingReview}
              className="mt-5 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        )}
        {o.order_status === "delivered" && o.order_rating && (
          <div className="mt-6 border-t pt-6">
            <h2 className="font-semibold">Thanks for your feedback! ⭐</h2>

            <p className="mt-1 text-sm text-muted-foreground">
              You rated this order {o.order_rating}/5.
            </p>

            {o.order_review_text && (
              <p className="mt-2 text-sm text-muted-foreground">"{o.order_review_text}"</p>
            )}
          </div>
        )}
        <Link to="/shop" className="mt-6 inline-block text-sm text-primary">
          Continue shopping
        </Link>
      </div>
    </Layout>
  );
}
