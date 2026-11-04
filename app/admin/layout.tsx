import { requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { createClient } from "@/lib/supabase/server";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, access } = await requireUser();
  let templeName: string | null = null;
  if (access.role === "temple_admin" && access.temple_id) {
    const supabase = await createClient();
    const { data: temple } = await supabase.from("dharma_temples").select("name").eq("id", access.temple_id).maybeSingle();
    templeName = temple?.name ?? null;
  }
  const displayName = typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : "";
  return <AdminShell email={user.email ?? ""} role={access.role} templeName={templeName} displayName={displayName}>{children}</AdminShell>;
}
