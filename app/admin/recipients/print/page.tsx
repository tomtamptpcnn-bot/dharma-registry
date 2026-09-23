import Link from "next/link";
import { getPrintRecipients, type ListFilters } from "@/lib/recipients";
import { formatDate, formatMoney } from "@/lib/format";
import { PrintButton } from "@/components/recipients/print-button";
export default async function PrintPage({
  searchParams,
}: {
  searchParams: Promise<ListFilters>;
}) {
  const filters = await searchParams;
  const recipients = await getPrintRecipients(filters);
  const headers = [
    "ลำดับ",
    "ชื่อ-นามสกุล",
    "อายุ",
    "ชื่อเล่น",
    "ที่อยู่",
    "เบอร์โทร",
    "อาจารย์แนะนำ",
    "อาจารย์รับรอง",
    "อาจารย์ถ่ายทอดเบิกธรรม",
    "วันที่รับธรรม",
    "สร้างบุญ (บาท)",
    "ชั้น",
    "ระดับ",
    "สถานที่รับธรรม",
  ];
  return (
    <main className="print-report p-4 md:p-8 bg-white min-h-screen">
      <div className="print-controls flex flex-wrap gap-4 items-center mb-6">
        <PrintButton />
        <Link href="/admin/recipients" className="text-[#176854]">
          กลับหน้าทะเบียน
        </Link>
        <p className="w-full text-sm text-gray-500">
          ส่งออกเป็น PDF ได้จากหน้าต่างพิมพ์ เลือกกระดาษ A4 แนวนอน
          และปิดหัว/ท้ายกระดาษของเบราว์เซอร์
        </p>
      </div>
      <h1 className="text-xl font-bold mb-2">ทะเบียนประวัติผู้รับธรรมะ</h1>
      <p className="text-sm mb-2">
        ทั้งหมด {recipients.length} รายการ ·{" "}
        {filters.sort === "date_asc"
          ? "เรียงวันที่รับธรรมเก่าสุดก่อน"
          : filters.sort === "date_desc"
            ? "เรียงวันที่รับธรรมล่าสุดก่อน"
            : "เรียงตามทะเบียนที่เพิ่มล่าสุด"}
      </p>
      <p className="text-xs mb-4">
        คำค้น: {filters.q || "ทั้งหมด"} · ระดับ: {filters.level || "ทั้งหมด"} ·
        วันที่รับธรรม: {filters.from ? formatDate(filters.from) : "ไม่จำกัด"}{" "}
        ถึง {filters.to ? formatDate(filters.to) : "ไม่จำกัด"}
      </p>
      <div className="print-table-container overflow-x-auto">
        <table className="print-table">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recipients.map((r, i) => (
              <tr key={r.id}>
                {[
                  i + 1,
                  r.full_name,
                  r.age,
                  r.nickname,
                  r.address,
                  r.phone,
                  r.recommended_by,
                  r.certified_by,
                  r.transmitted_by,
                  formatDate(r.received_date),
                  formatMoney(r.merit_amount),
                  r.class_name,
                  r.level,
                  r.received_place,
                ].map((value, j) => (
                  <td key={j}>{value ?? "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!recipients.length && (
        <p className="text-center py-6">ไม่พบข้อมูลที่ตรงกับเงื่อนไข</p>
      )}
    </main>
  );
}
