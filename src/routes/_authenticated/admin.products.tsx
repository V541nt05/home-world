import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loading, ErrorState, Empty } from "@/components/Layout";
import { inr } from "@/lib/store";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

type Form = {
  id?: string;
  name: string;
  brand: string;
  category_id: string;
  description: string;
  warranty: string;
  price: string;
  discount: string;
  stock: string;
  specifications: string;
  image_file?: File | null;
};

const empty: Form = {
  name: "",
  brand: "",
  category_id: "",
  description: "",
  warranty: "",
  price: "0",
  discount: "0",
  stock: "0",
  specifications: "{}",
  image_file: null,
};

function AdminProducts() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*,product_images(id,image_url,is_primary)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-products"] });

  const uploadImage = async (productId: number | string, file: File): Promise<string | null> => {
    try {
      const timestamp = Date.now();
      // Sanitize filename: remove special chars and convert to lowercase
      const sanitizedName = file.name
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, "-")
        .replace(/-+/g, "-");
      const filename = `products/${productId}/${timestamp}-${sanitizedName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filename, file);

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return null;
      }

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(filename);

      return data.publicUrl;
    } catch (err) {
      toast.error("Failed to upload image");
      console.error(err);
      return null;
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    setUploading(true);
    try {
      let specs: Record<string, string> = {};
      try {
        specs = JSON.parse(form.specifications || "{}");
      } catch {
        toast.error("Specifications must be valid JSON");
        setUploading(false);
        return;
      }
      const payload = {
        name: form.name,
        brand: form.brand,
        category_id: form.category_id || null,
        description: form.description,
        warranty: form.warranty,
        price: Number(form.price),
        discount: Number(form.discount),
        stock_quantity: Number(form.stock),
        specifications: specs,
      };
      const res = form.id
        ? await supabase.from("products").update(payload).eq("id", form.id).select("id").single()
        : await supabase.from("products").insert(payload).select("id").single();
      if (res.error) {
        toast.error(res.error.message);
        setUploading(false);
        return;
      }
      if (form.image_file) {
        const imageUrl = await uploadImage(res.data.id, form.image_file);
        if (imageUrl) {
          const { error: insertError } = await supabase
            .from("product_images")
            .insert({ product_id: res.data.id, image_url: imageUrl, is_primary: true });

          if (insertError) {
            toast.error(`Image saved but DB insert failed: ${insertError.message}`);
          }
        } else {
          toast.warning("Product saved but image upload failed");
        }
      }
      toast.success("Product saved");
      setForm(null);
      refresh();
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("products").update({ active }).eq("id", id);
    refresh();
  };

  if (products.isLoading) return <Loading />;
  if (products.error) return <ErrorState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={() => setForm({ ...empty })}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Add product
        </button>
      </div>

      {form && (
        <form onSubmit={save} className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2">
          <input required placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
            <option value="">No category</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input placeholder="Warranty" value={form.warranty} onChange={(e) => setForm({ ...form, warranty: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="number" placeholder="Price" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="number" placeholder="Discount %" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="number" placeholder="Stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="file" accept="image/*" onChange={(e) => setForm({ ...form, image_file: e.target.files?.[0] || null })} className="rounded-md border px-3 py-2 text-sm" />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-md border px-3 py-2 text-sm sm:col-span-2" />
          <textarea placeholder='Specifications JSON e.g. {"Capacity":"265 L"}' value={form.specifications} onChange={(e) => setForm({ ...form, specifications: e.target.value })} className="rounded-md border px-3 py-2 text-sm sm:col-span-2" />
          <div className="flex gap-2 sm:col-span-2">
            <button disabled={uploading} className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60">{uploading ? "Uploading..." : "Save"}</button>
            <button type="button" onClick={() => setForm(null)} disabled={uploading} className="rounded-md border px-4 py-2 text-sm disabled:opacity-60">Cancel</button>
          </div>
        </form>
      )}

      {!products.data?.length ? (
        <Empty label="No products yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">Price</th>
                <th className="p-2">Discount</th>
                <th className="p-2">Stock</th>
                <th className="p-2">Active</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {products.data.map((p) => (
                <tr key={p.id} className="border-t">
                  <td className="p-2">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.brand}</div>
                  </td>
                  <td className="p-2">{inr(p.price)}</td>
                  <td className="p-2">{p.discount}%</td>
                  <td className="p-2">{p.stock_quantity}</td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleActive(p.id, !p.active)}
                      className={p.active ? "text-primary" : "text-muted-foreground"}
                    >
                      {p.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-2">
                    <button
                      className="text-primary"
                      onClick={() =>
                        setForm({
                          id: p.id,
                          name: p.name,
                          brand: p.brand,
                          category_id: p.category_id || "",
                          description: p.description || "",
                          warranty: p.warranty || "",
                          price: String(p.price),
                          discount: String(p.discount),
                          stock: String(p.stock_quantity),
                          specifications: JSON.stringify(p.specifications ?? {}),
                          image_file: null,
                        })
                      }
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

