import { requireSuperAdmin } from "@/lib/auth";
import { TempleManager } from "@/components/admin/temple-manager";

export default async function TemplesPage() {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.from("dharma_temples").select("id,name,caretaker_name,manager_username,created_at").order("name");
  if (error) throw new Error("ไม่สามารถโหลดรายชื่อสถานธรรมได้");
  const temples = await Promise.all((data ?? []).map(async (temple) => {
    const { count, error: countError } = await supabase
      .from("dharma_recipients")
      .select("id", { count: "exact", head: true })
      .eq("temple_id", temple.id);
    if (countError) throw new Error("ไม่สามารถตรวจสอบทะเบียนของแต่ละสาขาได้");
    return { ...temple, recipient_count: count ?? 0 };
  }));
  return <TempleManager temples={temples} />;
}
