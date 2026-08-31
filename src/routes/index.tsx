import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Layout, Loading, ErrorState, Empty } from "@/components/Layout";
import { ProductCard, type ProductRow } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home World — Home Appliance Store in Dhayari, Pune" },
      {
        name: "description",
        content:
          "Buy refrigerators, washing machines, ACs, TVs and kitchen appliances at Home World, Dhayari, Pune. Best prices, genuine warranty, fast local delivery.",
      },
      { property: "og:title", content: "Home World — Home Appliances in Dhayari, Pune" },
      {
        property: "og:description",
        content: "Refrigerators, washing machines, ACs, TVs and more at best local prices.",
      },
    ],
  }),
  component: Home,
});

const SELECT = "id,name,brand,price,discount_percent,stock,product_images(image_url,is_primary)";

function Home() {
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const featured = useQuery({
    queryKey: ["featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("is_active", true)
        .eq("is_featured", true)
        .limit(8);
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const popular = useQuery({
    queryKey: ["popular"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(SELECT)
        .eq("is_active", true)
        .order("discount_percent", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  return (
    <Layout>
      <section className="border-b bg-secondary">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Home appliances for every Pune home
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Refrigerators, washing machines, ACs, TVs and kitchen appliances — genuine brands,
            honest prices and local service in Dhayari.
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-block rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            Shop now
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        {categories.isLoading ? (
          <Loading />
        ) : categories.error ? (
          <ErrorState />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories.data?.map((c) => (
              <Link
                key={c.id}
                to="/shop"
                search={{ category: c.slug }}
                className="rounded-lg border bg-card p-4 text-center text-sm font-medium hover:border-primary"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </section>

      <ProductSection title="Featured products" q={featured} />
      <ProductSection title="Popular deals" q={popular} />

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold">Visit our store</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Main Road, Dhayari, Pune 411041 · Open daily 10 AM – 9 PM
            <br />
            Call us: +91 98765 43210
          </p>
        </div>
      </section>
    </Layout>
  );
}

function ProductSection({
  title,
  q,
}: {
  title: string;
  q: { isLoading: boolean; error: unknown; data?: ProductRow[] | undefined };
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {q.isLoading ? (
        <Loading />
      ) : q.error ? (
        <ErrorState />
      ) : !q.data?.length ? (
        <Empty label="No products yet." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {q.data.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </section>
  );
}
