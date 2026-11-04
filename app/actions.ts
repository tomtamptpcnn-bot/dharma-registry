"use server";
import { loginSchema, usernameToEmail, usernameToPreviousEmail } from "@/lib/login-identity";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { recipientSchema, uuidSchema } from "@/lib/validation";
export async function login(values: unknown) {
  let loginValues = values;
  if (values && typeof values === "object" && "username" in values && typeof values.username === "string") {
    const identifier = values.username.trim().toLowerCase();
    const emailMatch = identifier.match(/^([a-z0-9][a-z0-9._-]{2,31})@(dharma\.com|gmail\.com)$/);
    if (emailMatch) loginValues = { ...values, username: emailMatch[1] };
  }
  const parsed = loginSchema.safeParse(loginValues);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const supabase = await createClient();
    const email = usernameToEmail(parsed.data.username);
    let { error } = await supabase.auth.signInWithPassword({
      email,
      password: parsed.data.password,
    });
    const previousEmail = usernameToPreviousEmail(parsed.data.username);
    let migratedPreviousAccount = false;
    if (error?.code === "invalid_credentials" && previousEmail) {
      const previousAttempt = await supabase.auth.signInWithPassword({
        email: previousEmail,
        password: parsed.data.password,
      });
      error = previousAttempt.error;
      migratedPreviousAccount = !previousAttempt.error;
    }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (migratedPreviousAccount) {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const admin = createAdminClient();
        const { error: emailUpdateError } = await admin.auth.admin.updateUserById(user.id, {
          email,
          email_confirm: true,
        });
        if (emailUpdateError) {
          // Keep the authenticated session: email migration is secondary to
          // allowing the existing administrator to regain access.
          console.error("[login] Legacy email migration failed", {
            userId: user.id,
            code: emailUpdateError.code,
            message: emailUpdateError.message,
          });
        }
      }
      const { data: access, error: accessError } = await supabase
        .from("dharma_user_access")
        .select("role,temple_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (accessError || !access) {
        await supabase.auth.signOut();
        return {
          error: "รหัสผ่านถูกต้อง แต่บัญชีนี้ยังไม่มีสิทธิ์เข้าใช้ระบบ กรุณาให้ Super Admin ตรวจสอบการผูกบัญชีในตาราง dharma_user_access",
        };
      }
      await supabase.rpc("log_activity_event", {
        event_action: "login",
        event_type: "auth",
        event_id: user.id,
        target_temple_id: access.temple_id,
        event_details: { method: "password" },
      });
    }
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง" };
  }
  return { success: true };
}
export async function logout() {
  const { supabase, access } = await requireUser();
  // Activity logging is best-effort; logout must still complete if the audit
  // endpoint is unavailable or the log policy rejects the event.
  await supabase.rpc("log_activity_event", {
    event_action: "logout",
    event_type: "auth",
    target_temple_id: access.temple_id,
  });
  const { error } = await supabase.auth.signOut();
  if (error) return { error: "ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง" };
  return { success: true };
}
export async function saveRecipient(values: unknown, id?: string, requestedTempleId?: string) {
  const { supabase, access } = await requireUser();
  const parsed = recipientSchema.safeParse(values);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  if (id && !uuidSchema.safeParse(id).success)
    return { error: "รหัสทะเบียนไม่ถูกต้อง" };
  const targetTempleId = access.role === "super_admin" ? requestedTempleId : access.temple_id;
  if (!targetTempleId || !uuidSchema.safeParse(targetTempleId).success)
    return { error: "กรุณาเลือกสถานธรรม" };
  try {
    const query = id
      ? supabase.from("dharma_recipients").update(parsed.data).eq("id", id)
      : supabase.from("dharma_recipients").insert({
          ...parsed.data,
          temple_id: targetTempleId,
        });
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
  // Navigate in the action response instead of refreshing the form first
  // and then making a separate client navigation request.
  redirect("/admin/recipients");
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
