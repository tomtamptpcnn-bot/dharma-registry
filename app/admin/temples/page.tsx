import { requireSuperAdmin } from "@/lib/auth";
import { TempleManager } from "@/components/admin/temple-manager";

export default async function TemplesPage() {
  const { supabase } = await requireSuperAdmin();
  const { data, error } = await supabase.from("dharma_temples").select("id,name,caretaker_name,manager_username,created_at").order("name");
  if (error) throw new Error("ไม่สามารถโหลดรายชื่อสถานธรรมได้");
  const temples = await Promise.all((data ?? []).map(async (temple) => {
    let recipientCount = 0;
    let totalMerit = 0;
    for (let offset = 0; ; offset += 500) {
      const { data: recipients, error: recipientError } = await supabase
        .from("dharma_recipients")
        .select("merit_amount")
        .eq("temple_id", temple.id)
        .order("id")
        .range(offset, offset + 499);
      if (recipientError) throw new Error("ไม่สามารถโหลดข้อมูลสรุปของแต่ละสาขาได้");
      recipientCount += recipients.length;
      totalMerit += recipients.reduce((sum, row) => sum + Number(row.merit_amount ?? 0), 0);
      if (recipients.length < 500) break;
    }
    return { ...temple, recipient_count: recipientCount, total_merit: totalMerit };
  }));
  return <TempleManager temples={temples} />;
}
