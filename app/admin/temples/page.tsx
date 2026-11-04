import { requireSuperAdmin } from "@/lib/auth";
import { TempleManager } from "@/components/admin/temple-manager";

export default async function TemplesPage() {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.from("dharma_temples").select("id,name,caretaker_name,manager_username,created_at").order("name");
  if (error) throw new Error("ไม่สามารถโหลดรายชื่อสถานธรรมได้");
  return <TempleManager temples={data} />;
}
