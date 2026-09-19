import { requireUser } from "@/lib/auth";
import { AdminShell } from "@/components/admin/admin-shell";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();
  return <AdminShell email={user.email ?? ""}>{children}</AdminShell>;
}
