import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    // Check if user is already authenticated
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      throw redirect({ to: "/" });
    }
    // Redirect to login page
    throw redirect({ to: "/login" });
  },
  component: () => null,
});

