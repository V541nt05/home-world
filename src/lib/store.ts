import { useEffect, useState } from "react";

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  price: number;
  discount: number;
  image: string | null;
  stock: number;
  qty: number;
};

const KEY = "hw_cart";
const EVT = "hw_cart_change";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]") as CartItem[];
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event(EVT));
}

export function addToCart(item: CartItem) {
  const items = readCart();
  const found = items.find((i) => i.id === item.id);
  if (found) found.qty = Math.min(found.qty + item.qty, Math.max(item.stock, 1));
  else items.push(item);
  writeCart(items);
}

export function setQty(id: string, qty: number) {
  const items = readCart()
    .map((i) => (i.id === id ? { ...i, qty } : i))
    .filter((i) => i.qty > 0);
  writeCart(items);
}

export function removeFromCart(id: string) {
  writeCart(readCart().filter((i) => i.id !== id));
}

export function clearCart() {
  writeCart([]);
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    const sync = () => setItems(readCart());
    sync();
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return items;
}

export function finalPrice(price: number, discount: number) {
  return Math.round(price - (price * discount) / 100);
}

export function inr(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const total = items.reduce((s, i) => s + finalPrice(i.price, i.discount) * i.qty, 0);
  return { subtotal, discount: subtotal - total, total };
}

