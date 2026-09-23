import { summarizeDashboard, type DashboardRow } from "@/lib/dashboard-stats";
import "server-only";
import { requireUser } from "@/lib/auth";
import { safeSearch, uuidSchema } from "@/lib/validation";
import { notFound } from "next/navigation";
export interface ListFilters {
  q?: string;
  from?: string;
  to?: string;
  level?: string;
  page?: string;
  pageSize?: string;
  sort?: string;
}
function recipientQuery(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  filters: ListFilters,
) {
  let query = supabase
    .from("dharma_recipients")
    .select("*", { count: "exact" });
  const q = safeSearch(filters.q || "");
  if (q)
    query = query.or(
      `full_name.ilike.%${q}%,phone.ilike.%${q}%,address.ilike.%${q}%`,
    );
  if (filters.level) query = query.eq("level", filters.level.slice(0, 1000));
  if (filters.from && /^\d{4}-\d{2}-\d{2}$/.test(filters.from))
    query = query.gte("received_date", filters.from);
  if (filters.to && /^\d{4}-\d{2}-\d{2}$/.test(filters.to))
    query = query.lte("received_date", filters.to);
  if (filters.sort === "date_asc" || filters.sort === "date_desc") {
    query = query.order("received_date", {
      ascending: filters.sort === "date_asc",
      nullsFirst: false,
    });
  }
  return query.order("created_at", { ascending: false }).order("id");
}
export async function getPrintRecipients(filters: ListFilters) {
  const { supabase } = await requireUser();
  const rows: import("@/types/recipient").DharmaRecipient[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await recipientQuery(supabase, filters).range(
      offset,
      offset + 499,
    );
    if (error) throw new Error("ไม่สามารถโหลดข้อมูลสำหรับพิมพ์ได้");
    rows.push(...data);
    if (data.length < 500) break;
  }
  return rows;
}
export async function listRecipients(filters: ListFilters) {
  const { supabase } = await requireUser();
  const page = Math.max(
    1,
    Math.min(100000, Math.floor(Number(filters.page) || 1)),
  );
  const pageSize = [10, 20, 50].includes(Number(filters.pageSize))
    ? Number(filters.pageSize)
    : 10;
  const query = recipientQuery(supabase, filters);
  const { data, count, error } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1,
  );
  if (error)
    throw new Error(
      "ไม่สามารถโหลดทะเบียนได้ กรุณาตรวจสอบการเชื่อมต่อและการติดตั้งฐานข้อมูล",
    );
  return { data: data ?? [], total: count ?? 0, page, pageSize };
}
export async function getRecipient(id: string) {
  const { supabase } = await requireUser();
  if (!uuidSchema.safeParse(id).success) notFound();
  const { data, error } = await supabase
    .from("dharma_recipients")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("ไม่สามารถโหลดข้อมูลผู้รับธรรมะได้");
  if (!data) notFound();
  return data;
}
export async function getDashboard() {
  const { supabase } = await requireUser();
  const rows: DashboardRow[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("dharma_recipients")
      .select(
        "age,phone,address,received_date,merit_amount,recommended_by,certified_by,transmitted_by,class_name,level,received_place",
      )
      .order("id")
      .range(offset, offset + 499);
    if (error) throw new Error("ไม่สามารถโหลดภาพรวมได้");
    rows.push(...data);
    if (data.length < 500) break;
  }
  const { data: recent, error } = await supabase
    .from("dharma_recipients")
    .select("id,full_name,received_date,received_place,created_at")
    .order("created_at", { ascending: false })
    .order("id")
    .limit(5);
  if (error) throw new Error("ไม่สามารถโหลดทะเบียนล่าสุดได้");
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  return { stats: summarizeDashboard(rows, today), recent: recent ?? [] };
}
