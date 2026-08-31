import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Loading, ErrorState, Empty } from "@/components/Layout";
import { ProductCard, type ProductRow } from "@/components/ProductCard";
import { finalPrice } from "@/lib/store";

type ShopSearch = { q?: string | undefined; category?: string | undefined; sort?: string | undefined };

export const Route = createFileRoute("/shop")({
  validateSearch: (s: Record<string, unknown>): ShopSearch => ({
    q: typeof s['q'] === "string" ? s['q'] : undefined,
    category: typeof s['category'] === "string" ? s['category'] : undefined,
    sort: typeof s['sort'] === "string" ? s['sort'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Shop Appliances — Home World, Pune" },
      {
        name: "description",
        content:
          "Browse all home appliances at Home World: refrigerators, washing machines, ACs, TVs, kitchen appliances and fans with live stock and prices.",
      },
      { property: "og:title", content: "Shop Appliances — Home World" },
      { property: "og:description", content: "Browse all appliances with live prices and stock." },
    ],
  }),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shop" });
  const set = (patch: ShopSearch) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["shop", search.q, search.category],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(
          "id,name,brand,price,discount_percent,stock,category_id,product_images(image_url,is_primary),reviews(rating)",
        )
        .eq("is_active", true);
      if (search.q) query = query.or(`name.ilike.%${search.q}%,brand.ilike.%${search.q}%`);
      if (search.category) {
        const cat = (categories.data || []).find((c) => c.slug === search.category);
        if (cat) query = query.eq("category_id", cat.id);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as (ProductRow & { reviews: { rating: number }[] })[];
    },
    enabled: !search.category || !!categories.data,
  });

  const list = [...(products.data || [])].sort((a, b) => {
    const pa = finalPrice(a.price, a.discount_percent);
    const pb = finalPrice(b.price, b.discount_percent);
    const avg = (r: { rating: number }[]) =>
      r.length ? r.reduce((s, x) => s + x.rating, 0) / r.length : 0;
    if (search.sort === "price_asc") return pa - pb;
    if (search.sort === "price_desc") return pb - pa;
    if (search.sort === "rating") return avg(b.reviews) - avg(a.reviews);
    return 0;
  });

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="text-2xl font-bold">Shop</h1>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            defaultValue={search.q || ""}
            onChange={(e) => set({ q: e.target.value || undefined })}
            placeholder="Search products"
            className="w-full rounded-md border bg-card px-3 py-2 text-sm sm:max-w-xs"
          />
          <select
            value={search.category || ""}
            onChange={(e) => set({ category: e.target.value || undefined })}
            className="rounded-md border bg-card px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={search.sort || ""}
            onChange={(e) => set({ sort: e.target.value || undefined })}
            className="rounded-md border bg-card px-3 py-2 text-sm"
          >
            <option value="">Sort by</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>

        <div className="mt-6">
          {products.isLoading ? (
            <Loading />
          ) : products.error ? (
            <ErrorState />
          ) : !list.length ? (
            <Empty label="No products match your search." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {list.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
