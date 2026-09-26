import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Tesseract from "tesseract.js";
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
  mrp: string;
  price: string;
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
  mrp: "",
  price: "",
  stock: "",
  specifications: "{}",
  image_file: null,
};
function parseProductText(text: string) {
  const normalizedText = text
    .replace(/[|]/g, "I")
    .replace(/\bM\s*\.?\s*R\s*\.?\s*P\b/gi, "MRP")
    .replace(/\bS\s*\.?\s*K\s*\.?\s*U\b/gi, "SKU")
    .replace(/\bM\s*\.?\s*O\s*\.?\s*D\s*\.?\s*E\s*\.?\s*L\b/gi, "MODEL");

  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  // -----------------------------
  // MRP
  // -----------------------------
  const mrpMatch = normalizedText.match(
    /(?:MRP|maximum\s+retail\s+price)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
  );

  const mrp = mrpMatch ? mrpMatch[1].replace(/,/g, "") : "";

  // -----------------------------
  // Brand
  // -----------------------------
  const brands = [
    "Prestige",
    "Pigeon",
    "Butterfly",
    "Glen",
    "Sunflame",
    "Hawkins",
    "Philips",
    "Bajaj",
    "Havells",
    "Crompton",
    "Usha",
    "Orient",
    "LG",
    "Samsung",
    "Whirlpool",
    "Godrej",
    "IFB",
    "Bosch",
    "Voltas",
    "Blue Star",
    "Panasonic",
    "Morphy Richards",
    "Eureka Forbes",
    "O General",
  ];

  const lowerText = normalizedText.toLowerCase();

  const brand = brands.find((b) => lowerText.includes(b.toLowerCase())) || "";

  // -----------------------------
  // Model
  // -----------------------------
  const modelMatch = normalizedText.match(
    /(?:MODEL(?:\s*(?:NO|NUMBER))?|MODEL\s*CODE|PRODUCT\s*CODE)\s*[:#\-]?\s*([A-Z0-9][A-Z0-9._\/-]{2,})/i,
  );

  let model = modelMatch?.[1]?.trim() || "";

  // Fallback: detect common appliance model codes
  if (!model) {
    const modelFallback = normalizedText.match(/\b[A-Z]{1,5}\d{2,}[A-Z0-9-]*\b/i);

    model = modelFallback?.[0] || "";
  }

  // -----------------------------
  // SKU
  // -----------------------------
  const skuMatch = normalizedText.match(
    /(?:SKU|SKU\s*CODE|PRODUCT\s*CODE)\s*[:#\-]?\s*([A-Z0-9._\/-]{3,})/i,
  );

  const sku = skuMatch?.[1]?.trim() || "";

  // -----------------------------
  // Category
  // -----------------------------
  const categoryRules = [
    {
      name: "Gas Stove",
      keywords: ["gas stove", "gas cooktop", "cooktop", "burner stove"],
    },
    {
      name: "Refrigerator",
      keywords: ["refrigerator", "fridge"],
    },
    {
      name: "Washing Machine",
      keywords: ["washing machine", "washer"],
    },
    {
      name: "Air Conditioner",
      keywords: ["air conditioner", "air-conditioner", "split ac", "window ac"],
    },
    {
      name: "Microwave",
      keywords: ["microwave", "microwave oven"],
    },
    {
      name: "Mixer Grinder",
      keywords: ["mixer grinder", "mixer-grinder", "mixer", "grinder"],
    },
    {
      name: "Geyser",
      keywords: ["geyser", "water heater"],
    },
    {
      name: "Iron",
      keywords: ["steam iron", "dry iron", "iron"],
    },
    {
      name: "Fan",
      keywords: ["ceiling fan", "table fan", "pedestal fan", "fan"],
    },
    {
      name: "Induction Cooktop",
      keywords: ["induction cooktop", "induction stove", "induction"],
    },
    {
      name: "Kitchen Chimney",
      keywords: ["kitchen chimney", "chimney"],
    },
    {
      name: "Television",
      keywords: ["television", "smart tv", "led tv", "android tv", "tv"],
    },
  ];

  const category =
    categoryRules.find((rule) => rule.keywords.some((keyword) => lowerText.includes(keyword)))
      ?.name || "";

  // -----------------------------
  // Product Name
  // -----------------------------
  const nameMatch = normalizedText.match(/(?:PRODUCT\s*NAME|MODEL\s*NAME|PRODUCT)\s*[:\-]\s*(.+)/i);

  let name = nameMatch?.[1]?.trim() || "";

  // Remove obvious metadata from the name
  if (name) {
    name = name
      .replace(/\bMRP\b.*$/i, "")
      .replace(/\bSKU\b.*$/i, "")
      .replace(/\bMODEL\b.*$/i, "")
      .trim();
  }

  // Try to find a useful product line
  if (!name) {
    const ignored = [
      "mrp",
      "maximum retail price",
      "sku",
      "sku code",
      "model",
      "model no",
      "model number",
      "product code",
      "serial",
      "serial number",
      "barcode",
      "made in india",
      "manufactured",
      "manufactured by",
      "marketed by",
      "customer care",
      "warranty",
      "www.",
      "www",
      "imported by",
    ];

    name =
      lines.find((line) => {
        const lower = line.toLowerCase();

        return (
          line.length >= 4 &&
          !ignored.some((word) => lower.includes(word)) &&
          !/^\d+$/.test(line) &&
          !/^[\d₹,.\- ]+$/.test(line)
        );
      }) || "";
  }

  // If we know the brand but OCR name didn't include it,
  // prepend it.
  if (brand && name && !name.toLowerCase().includes(brand.toLowerCase())) {
    name = `${brand} ${name}`;
  }

  // -----------------------------
  // Clean description
  // -----------------------------
  const descriptionLines = lines.filter((line) => {
    const lower = line.toLowerCase();

    return (
      line.length > 3 &&
      !lower.includes("mrp") &&
      !lower.includes("maximum retail price") &&
      !lower.includes("sku code") &&
      !lower.startsWith("sku") &&
      !lower.includes("model no") &&
      !lower.includes("model number") &&
      !lower.startsWith("model") &&
      !lower.includes("serial number") &&
      !lower.includes("barcode") &&
      !lower.includes("made in india") &&
      !lower.includes("manufactured by") &&
      !lower.includes("marketed by") &&
      !lower.includes("customer care")
    );
  });

  let description = descriptionLines.join(" ");

  // Don't let OCR produce an enormous description.
  if (description.length > 500) {
    description = description.substring(0, 500).trim() + "...";
  }

  // Add structured information
  const details: string[] = [];

  if (model) details.push(`Model: ${model}`);
  if (sku) details.push(`SKU: ${sku}`);
  if (category) details.push(`Category: ${category}`);

  if (details.length > 0) {
    description = description
      ? `${description} ${details.join(" | ")}.`
      : details.join(" | ") + ".";
  }

  return {
    name,
    brand,
    model,
    sku,
    mrp,
    category,
    description,
  };
}
function AdminProducts() {
  const qc = useQueryClient();
  const [form, setForm] = useState<Form | null>(null);
  const [uploading, setUploading] = useState(false);

  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanImage, setScanImage] = useState<string | null>(null);
  const [scanText, setScanText] = useState("");
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
        .from("product_images")
        .upload(filename, file);

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`);
        return null;
      }

      const { data } = supabase.storage.from("product_images").getPublicUrl(filename);

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

    const mrp = Number(form.mrp);
    const price = Number(form.price);

    if (mrp <= 0 || price <= 0) {
      toast.error("MRP and discounted price must be greater than 0");
      return;
    }
    if (price > mrp) {
      toast.error("Discounted price cannot be greater than MRP");
      return;
    }
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
      const discount = mrp > 0 && price < mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;
      const payload = {
        name: form.name,
        brand: form.brand,
        category_id: form.category_id || null,
        description: form.description,
        warranty: form.warranty,
        mrp,
        price,
        discount,
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

        <div className="flex gap-2">
          <button
            onClick={() => setForm({ ...empty })}
            className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            Add product
          </button>
          <button
            onClick={() => {
              setScannerOpen(true);
              setScanImage(null);
              setScanText("");
            }}
            className="rounded-md border px-4 py-2 text-sm"
          >
            📷 Scan Product
          </button>
        </div>
      </div>
      {form && (
        <form onSubmit={save} className="grid gap-3 rounded-md border bg-card p-4 sm:grid-cols-2">
          <input
            required
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            placeholder="Brand"
            value={form.brand}
            onChange={(e) => setForm({ ...form, brand: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <select
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="">No category</option>
            {categories.data?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Warranty"
            value={form.warranty}
            onChange={(e) => setForm({ ...form, warranty: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="MRP (e.g. 49999)"
            value={form.mrp}
            min="0"
            onChange={(e) => setForm({ ...form, mrp: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Discounted Price (e.g. 42999)"
            value={form.price}
            min="0"
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="number"
            placeholder="Stock Quantity (e.g. 10)"
            value={form.stock}
            min="0"
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm({ ...form, image_file: e.target.files?.[0] || null })}
            className="rounded-md border px-3 py-2 text-sm"
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <textarea
            placeholder='Specifications JSON e.g. {"Capacity":"265 L"}'
            value={form.specifications}
            onChange={(e) => setForm({ ...form, specifications: e.target.value })}
            className="rounded-md border px-3 py-2 text-sm sm:col-span-2"
          />
          <div className="flex gap-2 sm:col-span-2">
            <button
              disabled={uploading}
              className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-60"
            >
              {uploading ? "Uploading..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setForm(null)}
              disabled={uploading}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Scan Product Sticker</h2>

              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="text-xl text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-sm text-gray-600">
              Upload a clear photo of the product sticker.
            </p>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="mb-4 block w-full rounded-md border p-2 text-sm"
              onChange={async (event) => {
                const file = event.target.files?.[0];

                if (!file) return;

                const imageUrl = URL.createObjectURL(file);
                setScanImage(imageUrl);
                setScanText("");
                setScanning(true);

                try {
                  const result = await Tesseract.recognize(file, "eng", {
                    logger: (message) => {
                      console.log(message);
                    },
                  });

                  setScanText(result.data.text);
                } catch (error) {
                  console.error("OCR error:", error);
                  toast.error("Could not read the sticker.");
                } finally {
                  setScanning(false);
                }
              }}
            />

            {scanImage && (
              <img
                src={scanImage}
                alt="Product sticker preview"
                className="mb-4 max-h-64 w-full rounded-lg border object-contain"
              />
            )}

            {scanning && (
              <p className="mb-4 text-sm text-blue-600">🔍 Reading sticker... Please wait.</p>
            )}

            {scanText && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium">Extracted Text</label>

                <textarea
                  value={scanText}
                  onChange={(event) => setScanText(event.target.value)}
                  rows={8}
                  className="w-full rounded-md border p-3 text-sm"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setScannerOpen(false)}
                className="rounded-md border px-4 py-2 text-sm"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!scanText || scanning}
                onClick={() => {
                  const parsed = parseProductText(scanText);

                  setForm({
                    ...empty,
                    name: parsed.name,
                    mrp: parsed.mrp,
                    description: parsed.description,
                  });

                  setScannerOpen(false);
                  toast.success("Product name and MRP extracted!");
                }}
                className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                Use Text
              </button>
            </div>
          </div>
        </div>
      )}
      {!products.data?.length ? (
        <Empty label="No products yet." />
      ) : (
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="p-2">Product</th>
                <th className="p-2">MRP</th>
                <th className="p-2">Selling Price</th>
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
                  <td className="p-2">{inr(p.mrp)}</td>
                  <td className="p-2">{inr(p.price)}</td>
                  <td className="p-2">{p.discount}% OFF</td>
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
                          mrp: String(p.mrp),
                          price: String(p.price),
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
