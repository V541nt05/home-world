import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Admin Sign In — Home World" },
      { name: "description", content: "Staff sign in for the Home World store admin dashboard." },
      { property: "og:title", content: "Admin Sign In — Home World" },
      { property: "og:description", content: "Staff sign in for store management." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const fn =
      mode === "signin"
        ? supabase.auth.signInWithPassword({ email, password })
        : supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${window.location.origin}/admin` },
          });
    const { error } = await fn;
    setBusy(false);
    if (error) return toast.error(error.message);
    if (mode === "signup") toast.success("Account created. Ask an admin to grant access.");
    navigate({ to: "/admin" });
  };

  return (
    <Layout>
      <div className="mx-auto max-w-sm px-4 py-12">
        <h1 className="text-2xl font-bold">Admin sign in</h1>
        <form onSubmit={submit} className="mt-4 space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border bg-card px-3 py-2 text-sm"
          />
          <button
            disabled={busy}
            className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-3 text-sm text-primary"
        >
          {mode === "signin" ? "Create an account" : "Have an account? Sign in"}
        </button>
      </div>
    </Layout>
  );
}
