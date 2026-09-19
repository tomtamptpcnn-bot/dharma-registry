"use server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { optionCategories } from "@/types/options";
const schema = z.object({
  category: z.enum(optionCategories),
  value: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อรายการ")
    .max(1000, "ระบุได้ไม่เกิน 1,000 ตัวอักษร"),
});
export async function createRegistryOption(input: unknown) {
  const { supabase } = await requireUser();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const { data, error } = await supabase
      .from("registry_options")
      .insert(parsed.data)
      .select("*")
      .single();
    if (error)
      return {
        error:
          error.code === "23505"
            ? "มีรายการนี้ในหมวดนี้แล้ว"
            : "เพิ่มตัวเลือกไม่สำเร็จ กรุณาลองอีกครั้ง",
      };
    revalidatePath("/admin/options");
    revalidatePath("/admin/recipients", "layout");
    revalidatePath("/admin/dashboard");
    return { data };
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้" };
  }
}

export async function manageRegistryOption(input: unknown) {
  const { supabase } = await requireUser();
  const parsed = z
    .discriminatedUnion("operation", [
      z.object({
        id: z.uuid(),
        operation: z.literal("rename"),
        value: schema.shape.value,
      }),
      z.object({ id: z.uuid(), operation: z.literal("delete") }),
    ])
    .safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  try {
    const { error } = await supabase.rpc("manage_registry_option", {
      option_id: parsed.data.id,
      operation: parsed.data.operation,
      new_value: parsed.data.operation === "rename" ? parsed.data.value : null,
    });
    if (error)
      return {
        error:
          error.code === "23503"
            ? "ลบไม่ได้ เนื่องจากมีทะเบียนใช้งานรายการนี้ กรุณาแก้ไขทะเบียนให้เลือกค่าอื่นก่อน"
            : error.code === "23505"
              ? "มีชื่อรายการนี้ในหมวดเดียวกันแล้ว"
              : error.code === "P0002"
                ? "ไม่พบรายการ ข้อมูลอาจถูกลบแล้ว"
                : "ดำเนินการไม่สำเร็จ กรุณาตรวจสอบว่ารัน migration สำหรับแก้ไขและลบแล้ว",
      };
    revalidatePath("/admin/options");
    revalidatePath("/admin/recipients", "layout");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch {
    return { error: "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองอีกครั้ง" };
  }
}
