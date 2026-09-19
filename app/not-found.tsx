import Link from "next/link";
export default function NotFound() {
  return (
    <main className="p-16 text-center">
      <h1 className="text-2xl font-bold mb-4">ไม่พบข้อมูลที่ต้องการ</h1>
      <p className="mb-6">ข้อมูลอาจถูกลบหรือที่อยู่ไม่ถูกต้อง</p>
      <Link href="/admin/recipients" className="text-[#176854] underline">
        กลับหน้ารายการ
      </Link>
    </main>
  );
}
