"use server";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { loginSchema } from "@/lib/login-identity";
import { usernameToEmail } from "@/lib/login-identity";
import { createAdminClient } from "@/lib/supabase/admin";

export async function createTemple(input: unknown) {
  const { supabase, user } = await requireSuperAdmin();
  const parsed = z.object({
    templeName: z.string().trim().min(1, "กรุณาระบุชื่อสถานธรรม").max(200),
    managerName: z.string().trim().min(1, "กรุณาระบุชื่อคนดูแล").max(200),
    username: loginSchema.shape.username,
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(72),
  }).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ฝั่ง server" };
  }

  const { data: templeId, error: templeError } = await supabase.rpc(
    "create_dharma_temple",
    { temple_name: parsed.data.templeName },
  );
  if (templeError || !templeId)
    return { error: templeError?.code === "23505" ? "มีชื่อสถานธรรมนี้แล้ว" : "สร้างสถานธรรมไม่สำเร็จ" };

  const email = usernameToEmail(parsed.data.username);
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { full_name: parsed.data.managerName },
  });
  if (authError || !authData.user) {
    await admin.from("dharma_temples").delete().eq("id", templeId);
    return { error: "สร้างบัญชีผู้ดูแลไม่สำเร็จ ตรวจว่า username นี้ยังไม่ถูกใช้" };
  }

  const { error: accessError } = await admin.from("dharma_user_access").insert({
    user_id: authData.user.id,
    role: "temple_admin",
    temple_id: templeId,
  });
  const { error: managerError } = await supabase
    .from("dharma_temples")
    .update({ caretaker_name: parsed.data.managerName, manager_username: parsed.data.username })
    .eq("id", templeId);
  if (accessError || managerError) {
    await admin.auth.admin.deleteUser(authData.user.id);
    await admin.from("dharma_temples").delete().eq("id", templeId);
    return { error: "สร้างบัญชีหรือกำหนดผู้ดูแลไม่สำเร็จ ระบบยกเลิกข้อมูลที่สร้างแล้ว" };
  }

  await admin.from("dharma_activity_logs").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    actor_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    actor_email: user.email ?? null,
    temple_id: templeId,
    action: "manager_account_created",
    entity_type: "temple_manager",
    entity_id: authData.user.id,
    details: { username: parsed.data.username },
  });

  revalidatePath("/admin/temples");
  return { success: true, username: parsed.data.username, email };
}

export async function manageTemple(input: unknown) {
  const { supabase } = await requireSuperAdmin();
  const parsed = z.discriminatedUnion("operation", [
    z.object({
      id: z.uuid(),
      operation: z.literal("rename"),
      name: z.string().trim().min(1, "กรุณาระบุชื่อสถานธรรม").max(200),
      caretakerName: z.string().trim().min(1, "กรุณาระบุชื่อผู้ดูแล").max(200),
    }),
    z.object({ id: z.uuid(), operation: z.literal("delete") }),
  ]).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { error } = await supabase.rpc("manage_dharma_temple", {
    target_temple_id: parsed.data.id,
    operation: parsed.data.operation,
    new_name: parsed.data.operation === "rename" ? parsed.data.name : null,
    new_caretaker_name: parsed.data.operation === "rename" ? parsed.data.caretakerName : null,
  });
  if (error) {
    if (error.code === "P0002") return { error: "ไม่พบสถานธรรม อาจถูกลบไปแล้ว" };
    if (error.code === "23505") return { error: "มีชื่อสถานธรรมนี้แล้ว" };
    if (error.code === "23503") return { error: "ลบสถานธรรมไม่ได้ เพราะยังมีทะเบียนผู้รับธรรมะอยู่" };
    if (error.code === "55000") return { error: "ต้องเหลือสถานธรรมอย่างน้อยหนึ่งแห่งในระบบ" };
    return { error: "จัดการสถานธรรมไม่สำเร็จ" };
  }
  revalidatePath("/admin/temples");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/recipients");
  return { success: true };
}

export async function resetTempleManagerPassword(input: unknown) {
  const { supabase, user } = await requireSuperAdmin();
  const parsed = z.object({
    id: z.uuid(),
    password: z.string().min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร").max(72),
  }).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ฝั่ง server" };
  }
  const { data: assignments, error: assignmentError } = await supabase
    .from("dharma_user_access")
    .select("user_id")
    .eq("temple_id", parsed.data.id)
    .eq("role", "temple_admin")
    .limit(2);
  if (assignmentError)
    return { error: `ตรวจสอบบัญชีผู้ดูแลไม่สำเร็จ: ${assignmentError.message}` };
  if (assignments.length === 0)
    return { error: "ไม่พบบัญชีผู้ดูแลที่ผูกกับสถานธรรมนี้ ตรวจสอบรายการใน dharma_user_access" };
  if (assignments.length > 1)
    return { error: `พบผู้ดูแล ${assignments.length} บัญชีในสาขานี้ ต้องเหลือบัญชี temple_admin เพียงหนึ่งบัญชีก่อนรีเซ็ตรหัสผ่าน` };
  const { error } = await admin.auth.admin.updateUserById(assignments[0].user_id, {
    password: parsed.data.password,
  });
  if (error) {
    const status = error.status ? ` (${error.status})` : "";
    return { error: `รีเซ็ตรหัสผ่านไม่สำเร็จ${status}: ${error.message}` };
  }
  await admin.from("dharma_activity_logs").insert({
    actor_id: user.id,
    actor_role: "super_admin",
    actor_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
    actor_email: user.email ?? null,
    temple_id: parsed.data.id,
    action: "manager_password_reset",
    entity_type: "temple_manager",
    entity_id: assignments[0].user_id,
  });
  revalidatePath("/admin/temples");
  return { success: true };
}

export async function migrateLegacyManagerEmails() {
  const { supabase, user } = await requireSuperAdmin();
  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "ยังไม่ได้ตั้งค่า SUPABASE_SERVICE_ROLE_KEY ฝั่ง server" };
  }

  const assignments: { user_id: string; role: string; temple_id: string | null }[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await supabase
      .from("dharma_user_access")
      .select("user_id,role,temple_id")
      .order("user_id")
      .range(offset, offset + 499);
    if (error) return { error: `อ่านบัญชีผู้ใช้งานไม่สำเร็จ: ${error.message}` };
    assignments.push(...data);
    if (data.length < 500) break;
  }
  const assignmentByUser = new Map(assignments.map((row) => [row.user_id, row]));

  const { data: temples, error: templesError } = await supabase
    .from("dharma_temples")
    .select("id,manager_username");
  if (templesError) return { error: `อ่านชื่อผู้ใช้สาขาไม่สำเร็จ: ${templesError.message}` };
  const usernameByTemple = new Map(temples.map((temple) => [temple.id, temple.manager_username]));

  const users = [];
  const perPage = 500;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) return { error: `อ่านบัญชี Auth ไม่สำเร็จ: ${error.message}` };
    users.push(...data.users);
    if (data.users.length < perPage) break;
  }
  const emailOwners = new Map(
    users.filter((account) => account.email).map((account) => [account.email!.toLowerCase(), account.id]),
  );
  let updated = 0;
  let skipped = 0;
  let unchanged = 0;
  const failures: string[] = [];

  for (const account of users) {
    const oldEmail = account.email?.toLowerCase();
    const assignment = assignmentByUser.get(account.id);
    if (!oldEmail || !assignment) continue;
    let username = assignment.role === "temple_admin" && assignment.temple_id
      ? usernameByTemple.get(assignment.temple_id)
      : null;
    if (!username) username = oldEmail.slice(0, oldEmail.lastIndexOf("@"));
    const parsedUsername = loginSchema.shape.username.safeParse(username);
    if (!parsedUsername.success) {
      skipped++;
      continue;
    }
    username = parsedUsername.data;
    const newEmail = `${username}@dharma.com`;
    if (oldEmail === newEmail) {
      unchanged++;
      continue;
    }
    const ownerId = emailOwners.get(newEmail);
    if (ownerId && ownerId !== account.id) {
      skipped++;
      continue;
    }
    const { error } = await admin.auth.admin.updateUserById(account.id, {
      email: newEmail,
      email_confirm: true,
    });
    if (error) {
      failures.push(`${username}: ${error.message}`);
      continue;
    }
    emailOwners.set(newEmail, account.id);
    updated++;
    await admin.from("dharma_activity_logs").insert({
      actor_id: user.id,
      actor_role: "super_admin",
      actor_name: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null,
      actor_email: user.email ?? null,
      temple_id: assignment.temple_id,
      action: "manager_email_migrated",
      entity_type: "temple_manager",
      entity_id: account.id,
      details: { username, old_email: oldEmail, new_email: newEmail },
    });
  }

  revalidatePath("/admin/temples");
  revalidatePath("/admin/logs");
  return { success: true, updated, unchanged, skipped, failures };
}
