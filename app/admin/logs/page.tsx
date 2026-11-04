import { requireUser } from "@/lib/auth";
import { ActivityLogTable, type ActivityLog } from "@/components/admin/activity-log-table";

export default async function ActivityLogsPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("dharma_activity_logs")
    .select("id,actor_name,actor_email,actor_role,temple_id,action,entity_type,entity_id,details,created_at,dharma_temples(name)")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error("ไม่สามารถโหลดประวัติกิจกรรมได้ กรุณารัน migration 202611040008_activity_logs.sql");
  return (
    <>
      <h1 className="page-heading">ประวัติกิจกรรม</h1>
      <p className="page-description mb-6">แสดงกิจกรรมล่าสุดไม่เกิน 500 รายการ โดย Super Admin เห็นทุกสาขา และผู้ดูแลเห็นเฉพาะสาขาตนเอง</p>
      <ActivityLogTable logs={(data ?? []) as unknown as ActivityLog[]} />
    </>
  );
}
