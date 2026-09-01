import { Link } from "@tanstack/react-router";
import { ShoppingCart, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useCart } from "@/lib/store";
import { UserMenu } from "./UserMenu";

export function Layout({ children }: { children: ReactNode }) {
  const cart = useCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const [q, setQ] = useState("");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-card">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="shrink-0 text-lg font-bold text-primary">
            Home<span className="text-accent-foreground">World</span>
          </Link>
          <form
            className="relative hidden flex-1 sm:block"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = `/shop?q=${encodeURIComponent(q)}`;
            }}
          >
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search appliances..."
              className="w-full rounded-md border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </form>
          <nav className="ml-auto flex items-center gap-4 text-sm">
            <Link to="/shop" className="hover:text-primary">
              Shop
            </Link>
            <Link to="/cart" className="relative flex items-center gap-1 hover:text-primary">
              <ShoppingCart className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground">
                  {count}
                </span>
              )}
            </Link>
            <UserMenu />
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="mt-12 border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 text-sm sm:grid-cols-3">
          <div>
            <div className="font-semibold">Home World</div>
            <p className="mt-1 text-muted-foreground">
              Your trusted local home appliance store in Dhayari, Pune.
            </p>
          </div>
          <div>
            <div className="font-semibold">Store</div>
            <p className="mt-1 text-muted-foreground">
              Main Road, Dhayari, Pune 411041
              <br />
              Mon–Sun, 10 AM – 9 PM
            </p>
          </div>
          <div>
            <div className="font-semibold">Contact</div>
            <p className="mt-1 text-muted-foreground">
              Phone: +91 98765 43210
              <br />
              Email: care@homeworld.in
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function Loading({ label = "Loading..." }: { label?: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{label}</div>;
}

export function ErrorState({ message }: { message?: string }) {
  return (
    <div className="py-12 text-center text-sm text-destructive">
      {message || "Something went wrong. Please try again."}
    </div>
  );
}

export function Empty({ label }: { label: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{label}</div>;
}

