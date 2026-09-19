import { z } from "zod";

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9._-]{2,31}$/,
      "ชื่อผู้ใช้ต้องยาว 3–32 ตัว และใช้ตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง",
    ),
  password: z.string().min(1, "กรุณาระบุรหัสผ่าน"),
});

// Only call on the server. Overrides let existing accounts keep their identity.
export function usernameToEmail(username: string): string {
  const normalized = loginSchema.shape.username.parse(username);
  const aliases = z
    .record(z.string(), z.email())
    .parse(JSON.parse(process.env.AUTH_USERNAME_EMAIL_MAP || "{}"));
  return aliases[normalized] ?? `${normalized}@admin.example.com`;
}
