import { z } from "zod";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);
const optionalText = z.string().trim().max(1000, "ข้อความยาวเกินไป").nullable();
export const recipientSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อ-นามสกุล")
    .max(200, "ชื่อยาวเกินไป"),
  age: z
    .number()
    .int("อายุต้องเป็นจำนวนเต็ม")
    .min(0, "อายุต้องไม่ติดลบ")
    .max(150, "อายุต้องไม่เกิน 150 ปี")
    .nullable(),
  nickname: optionalText,
  address: optionalText,
  phone: z
    .string()
    .regex(/^\d*$/, "เบอร์โทรต้องมีเฉพาะตัวเลข")
    .max(20, "เบอร์โทรยาวเกินไป")
    .nullable(),
  recommended_by: optionalText,
  certified_by: optionalText,
  transmitted_by: optionalText,
  received_date: z
    .string()
    .refine((v) => dayjs(v, "YYYY-MM-DD", true).isValid(), "วันที่ไม่ถูกต้อง")
    .nullable(),
  merit_amount: z
    .number()
    .finite()
    .min(0, "จำนวนเงินต้องไม่ติดลบ")
    .max(9999999999.99, "จำนวนเงินสูงเกินไป")
    .multipleOf(0.01, "ระบุทศนิยมได้ไม่เกิน 2 ตำแหน่ง")
    .nullable(),
  class_name: optionalText,
  level: optionalText,
  received_place: z
    .string()
    .trim()
    .max(10000, "สถานที่รับธรรมยาวเกินไป")
    .nullable(),
});
export const uuidSchema = z.uuid();
export function safeSearch(value: string) {
  return value
    .replace(/[%_(),.\\"']/g, " ")
    .trim()
    .slice(0, 100);
}
