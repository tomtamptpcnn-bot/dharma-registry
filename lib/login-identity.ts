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

// Only call on the server.
export function usernameToEmail(username: string): string {
  const normalized = loginSchema.shape.username.parse(username);
  return `${normalized}@dharma.com`;
}

// Temporary bridge for accounts created before the app standardized on @dharma.com.
export function usernameToPreviousEmail(username: string): string | null {
  const normalized = loginSchema.shape.username.parse(username);
  const previousEmails: Record<string, string> = {
    tomtamptpcnn: "tomtamptpcnn@gmail.com",
    "super-admin": "super-admin@gmail.com",
  };
  return previousEmails[normalized] ?? null;
}
