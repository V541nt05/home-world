import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    const{error: customerError } = await supabase.rpc("link_customer_to_auth");
    if (customerError) console.error("Error linking customer to auth:", customerError);
    return { user: data.user };
  },
  component: () => <Outlet />,
});

