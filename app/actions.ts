"use server";
import { loginSchema, usernameToEmail } from "@/lib/login-identity";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { recipientSchema, uuidSchema } from "@/lib/validation";
export async function login(values: unknown) {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(parsed.data.username),
      password: parsed.data.password,
    });
    if (error) {
      if (error.code === "invalid_credentials")
        return {
          error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง",
        };
      if (error.code === "email_not_confirmed")
        return {
          error: "บัญชียังไม่ได้รับการยืนยัน กรุณาติดต่อผู้ดูแลระบบ",
        };
      if (error.status === 429)
        return {
          error: "พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่",
        };
      if (error.code === "email_provider_disabled")
        return {
          error: "ระบบยังไม่เปิดให้เข้าสู่ระบบด้วยอีเมล กรุณาติดต่อผู้ดูแลระบบ",
        };
      return {
        error: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบ",
      };
    }
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" };
  }
  redirect("/admin/recipients");
}
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { error: "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง" };
  redirect("/login");
}
export async function saveRecipient(values: unknown, id?: string) {
  const { supabase } = await requireUser();
  const parsed = recipientSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !uuidSchema.safeParse(id).success)
    return { error: "รหัสทะเบียนไม่ถูกต้อง" };
  try {
    const query = id
      ? supabase.from("dharma_recipients").update(parsed.data).eq("id", id)
      : supabase.from("dharma_recipients").insert(parsed.data);
    const { data, error } = await query.select("id").single();
    if (error?.code === "23503")
      return {
        error: "กรุณาเลือกข้อมูลจากรายการที่มีอยู่ หรือเพิ่มตัวเลือกก่อนบันทึก",
      };
    if (error || !data) return { error: "บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง" };
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" };
  }
  revalidatePath("/admin/recipients");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/options");
  if (id) {
    revalidatePath(`/admin/recipients/${id}`);
    revalidatePath(`/admin/recipients/${id}/edit`);
  }
  return { success: true };
}
export async function deleteRecipient(id: string) {
  const { supabase } = await requireUser();
  if (!uuidSchema.safeParse(id).success)
    return { error: "รหัสทะเบียนไม่ถูกต้อง" };
  try {
    const { data, error } = await supabase
      .from("dharma_recipients")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error || !data)
      return { error: "ลบไม่สำเร็จ ข้อมูลอาจถูกลบไปแล้ว กรุณาโหลดหน้าใหม่" };
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" };
  }
  revalidatePath("/admin/recipients");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/options");
  if (id) {
    revalidatePath(`/admin/recipients/${id}`);
    revalidatePath(`/admin/recipients/${id}/edit`);
  }
  return { success: true };
}
