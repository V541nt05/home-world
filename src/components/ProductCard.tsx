import { Link } from "@tanstack/react-router";
import { inr } from "@/lib/store";

export type ProductRow = {
  id: string;
  name: string;
  brand: string;
  mrp: number;
  price: number;
  discount: number;
  stock_quantity: number;
  product_images?: { image_url: string; is_primary: boolean }[] | null;
};

export function productImage(p: ProductRow) {
  const imgs = p.product_images || [];
  return (imgs.find((i) => i.is_primary) || imgs[0])?.image_url || null;
}

export function ProductCard({ p }: { p: ProductRow }) {
  const img = productImage(p);
  const price = p.price;
  console.log("PRODUCT CARD DATA:", p);
  return (
    <Link
      to="/product/$id"
      params={{ id: p.id }}
      className="flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-md"
    >
      <div className="flex aspect-square items-center justify-center bg-muted">
        {img ? (
          <img src={img} alt={p.name} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="text-xs text-muted-foreground">No image</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <div className="text-xs text-muted-foreground">{p.brand}</div>
        <div className="line-clamp-2 text-sm font-medium">{p.name}</div>
        <div className="mt-auto flex items-baseline gap-2 pt-2">
          <span className="text-base font-semibold">{inr(price)}</span>
          {p.discount > 0 && (
            <>
              <span className="text-xs text-muted-foreground line-through">{inr(p.mrp)}</span>
              <span className="text-xs font-medium text-primary">{p.discount}% off</span>
            </>
          )}
        </div>
        <div className={`text-xs ${p.stock_quantity > 0 ? "text-muted-foreground" : "text-destructive"}`}>
          {p.stock_quantity > 0 ? `In stock (${p.stock_quantity})` : "Out of stock"}
        </div>
      </div>
    </Link>
  );
}

