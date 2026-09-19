import { LoginForm } from "@/components/shared/login-form";
import { isConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default async function LoginPage() {
  const configured = isConfigured();
  if (configured) {
    const client = await createClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user && !user.is_anonymous) redirect("/admin/recipients");
  }
  return <LoginForm configured={configured} />;
}
