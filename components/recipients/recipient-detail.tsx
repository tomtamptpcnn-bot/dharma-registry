"use client";
import Link from "next/link";
import { Button, Descriptions, Tag } from "antd";
import { ArrowLeftOutlined, EditOutlined } from "@ant-design/icons";
import type { DharmaRecipient } from "@/types/recipient";
import {
  formatDateTime,
  formatDate,
  formatMoney,
  formatTimeRange,
} from "@/lib/format";
export function RecipientDetail({
  recipient: r,
}: {
  recipient: DharmaRecipient;
}) {
  const fields: [string, React.ReactNode][] = [
    ["ชื่อ-นามสกุล", r.full_name],
    ["อายุ", r.age === null ? null : `${r.age} ปี`],
    ["ชื่อเล่น", r.nickname],
    ["เบอร์โทร", r.phone],
    ["ที่อยู่", r.address],
    ["อาจารย์แนะนำ", r.recommended_by],
    ["อาจารย์รับรอง", r.certified_by],
    ["อาจารย์ถ่ายทอดเบิกธรรม", r.transmitted_by],
    ["วันที่รับธรรม", formatDate(r.received_date)],
    [
      "ช่วงเวลาที่รับธรรม",
      formatTimeRange(r.received_time, r.received_end_time),
    ],
    [
      "สร้างบุญ",
      r.merit_amount === null ? null : `${formatMoney(r.merit_amount)} บาท`,
    ],
    ["ชั้น", r.class_name],
    ["ระดับ", r.level ? <Tag color="green">{r.level}</Tag> : null],
    ["สถานที่รับธรรม", r.received_place],
    ["รหัสทะเบียน", r.id],
    ["วันเวลาที่สร้างข้อมูล", formatDateTime(r.created_at)],
    ["วันเวลาที่แก้ไขล่าสุด", formatDateTime(r.updated_at)],
  ];
  return (
    <>
      <Link
        href="/admin/recipients"
        className="inline-flex gap-2 items-center text-sm text-gray-500 mb-6"
      >
        <ArrowLeftOutlined /> กลับหน้ารายการ
      </Link>
      <div className="flex flex-wrap justify-between gap-4 items-center mb-7">
        <div>
          <h1 className="page-heading">รายละเอียดผู้รับธรรมะ</h1>
          <p className="page-description">{r.full_name}</p>
        </div>
        <Link href={`/admin/recipients/${r.id}/edit`}>
          <Button type="primary" icon={<EditOutlined />}>
            แก้ไข
          </Button>
        </Link>
      </div>
      <div className="section-card">
        <Descriptions
          bordered
          column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
          items={fields.map(([label, value]) => ({
            key: label,
            label,
            children: (
              <span className="whitespace-pre-wrap break-words">
                {value ?? "—"}
              </span>
            ),
            span: ["ที่อยู่", "สถานที่รับธรรม", "รหัสทะเบียน"].includes(label)
              ? "filled"
              : 1,
          }))}
        />
      </div>
    </>
  );
}
