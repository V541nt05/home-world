import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorState, Empty } from "@/components/Layout";

export const Route = createFileRoute("/_authenticated/admin/reviews")({
  component: AdminReviews,
});

function AdminReviews() {
  const qc = useQueryClient();
  const reviews = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*,products(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const toggle = async (id: string, visible: boolean) => {
    await supabase.from("reviews").update({ visible }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-reviews"] });
  };

  if (reviews.isLoading) return <Loading />;
  if (reviews.error) return <ErrorState />;
  if (!reviews.data?.length) return <Empty label="No reviews yet." />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Reviews</h1>
      <ul className="space-y-2 text-sm">
        {reviews.data.map((r) => (
          <li key={r.id} className="rounded-md border bg-card p-3">
            <div className="flex items-center gap-2">
              <span className="font-medium">{r.customer_name}</span>
              <span className="text-muted-foreground">{r.rating}★</span>
              <span className="text-muted-foreground">· {r.products?.name}</span>
              <button
                onClick={() => toggle(r.id, !r.visible)}
                className="ml-auto text-primary"
              >
                {r.visible ? "Hide" : "Show"}
              </button>
            </div>
            {r.review_text && <p className="mt-1 text-muted-foreground">{r.review_text}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

