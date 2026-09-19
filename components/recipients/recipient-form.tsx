"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { unstable_rethrow, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
} from "antd";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { saveRecipient } from "@/app/actions";
import type { DharmaRecipient, RecipientInput } from "@/types/recipient";
import { OptionSelect } from "@/components/recipients/option-select";
import type { RegistryOption } from "@/types/options";
type Values = Omit<RecipientInput, "received_date"> & {
  received_date?: Dayjs | null;
};
export function RecipientForm({
  recipient,
  options,
}: {
  recipient?: DharmaRecipient;
  options: RegistryOption[];
}) {
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();
  function submit(values: Values) {
    if (busy) return;
    setError("");
    const nullable = (value: string | null | undefined) =>
      value?.trim() || null;
    const input: RecipientInput = {
      full_name: values.full_name.trim(),
      age: values.age ?? null,
      nickname: nullable(values.nickname),
      address: nullable(values.address),
      phone: nullable(values.phone),
      recommended_by: nullable(values.recommended_by),
      certified_by: nullable(values.certified_by),
      received_date: values.received_date?.format("YYYY-MM-DD") ?? null,
      merit_amount: values.merit_amount ?? null,
      class_name: nullable(values.class_name),
      level: nullable(values.level),
      received_place: nullable(values.received_place),
    };
    startTransition(async () => {
      try {
        const result = await saveRecipient(input, recipient?.id);
        setError(result.error);
      } catch (error) {
        // Let Next.js handle the successful action's redirect.
        unstable_rethrow(error);
        setError("ไม่สามารถบันทึกข้อมูลได้ กรุณาลองอีกครั้ง");
      }
    });
  }
  return (
    <>
      <Link
        href="/admin/recipients"
        className="inline-flex gap-2 items-center text-gray-500 text-sm mb-6"
      >
        <ArrowLeftOutlined /> กลับหน้ารายการ
      </Link>
      <h1 className="page-heading">
        {recipient ? "แก้ไขข้อมูลผู้รับธรรมะ" : "เพิ่มผู้รับธรรมะ"}
      </h1>
      <p className="page-description mb-7">
        กรอกข้อมูลทะเบียนให้ครบถ้วน ช่องที่มี * จำเป็นต้องระบุ
      </p>
      <div className="section-card max-w-5xl">
        {error && (
          <Alert type="error" showIcon message={error} className="mb-6" />
        )}
        <Form<Values>
          layout="vertical"
          onFinish={submit}
          disabled={busy}
          initialValues={
            recipient
              ? {
                  ...recipient,
                  received_date: recipient.received_date
                    ? dayjs(recipient.received_date)
                    : null,
                }
              : {}
          }
          scrollToFirstError
        >
          <h2 className="text-base font-semibold mb-5">ข้อมูลส่วนบุคคล</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item
              name="full_name"
              label="ชื่อ-นามสกุล"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "กรุณาระบุชื่อ-นามสกุล",
                },
                { max: 200, message: "ระบุชื่อได้ไม่เกิน 200 ตัวอักษร" },
              ]}
            >
              <Input maxLength={200} placeholder="ระบุชื่อและนามสกุล" />
            </Form.Item>
            <Form.Item name="nickname" label="ชื่อเล่น">
              <Input maxLength={1000} placeholder="ระบุชื่อเล่น" />
            </Form.Item>
            <Form.Item
              name="age"
              label="อายุ"
              rules={[
                {
                  type: "integer",
                  min: 0,
                  max: 150,
                  message: "ระบุอายุเป็นจำนวนเต็ม 0–150 ปี",
                },
              ]}
            >
              <InputNumber
                className="!w-full"
                min={0}
                max={150}
                placeholder="ระบุอายุ (ปี)"
              />
            </Form.Item>
            <Form.Item
              name="phone"
              label="เบอร์โทร"
              rules={[
                { pattern: /^\d*$/, message: "เบอร์โทรต้องมีเฉพาะตัวเลข" },
              ]}
            >
              <Input
                inputMode="numeric"
                maxLength={20}
                placeholder="ระบุเบอร์โทร ไม่ต้องใส่ขีด"
              />
            </Form.Item>
            <Form.Item name="address" label="ที่อยู่" className="md:col-span-2">
              <Input.TextArea
                rows={3}
                maxLength={1000}
                placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด และรหัสไปรษณีย์"
              />
            </Form.Item>
          </div>
          <Divider />
          <h2 className="text-base font-semibold mb-5">ข้อมูลการรับธรรมะ</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <Form.Item name="recommended_by" label="อาจารย์แนะนำ">
              <OptionSelect
                category="recommended_by"
                options={options}
                disabled={busy}
              />
            </Form.Item>
            <Form.Item name="certified_by" label="อาจารย์รับรอง">
              <OptionSelect
                category="certified_by"
                options={options}
                disabled={busy}
              />
            </Form.Item>
            <Form.Item name="received_date" label="วันที่รับธรรม">
              <DatePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder="เลือกวันที่รับธรรม"
              />
            </Form.Item>
            <Form.Item
              name="merit_amount"
              label="สร้างบุญ (บาท)"
              rules={[
                {
                  type: "number",
                  min: 0,
                  max: 9999999999.99,
                  message: "ระบุจำนวนเงินตั้งแต่ 0 ถึง 9,999,999,999.99 บาท",
                },
              ]}
            >
              <InputNumber
                className="!w-full"
                min={0}
                max={9999999999.99}
                precision={2}
                placeholder="0.00"
              />
            </Form.Item>
            <Form.Item name="class_name" label="ชั้น">
              <OptionSelect
                category="class_name"
                options={options}
                disabled={busy}
              />
            </Form.Item>
            <Form.Item name="level" label="ระดับ">
              <OptionSelect
                category="level"
                options={options}
                disabled={busy}
              />
            </Form.Item>
            <Form.Item
              name="received_place"
              label="สถานที่รับธรรม"
              className="md:col-span-2"
            >
              <OptionSelect
                category="received_place"
                options={options}
                disabled={busy}
              />
            </Form.Item>
          </div>
          <div className="border-t border-gray-100 pt-6 mt-2 flex justify-end gap-3">
            <Button
              disabled={busy}
              onClick={() => router.push("/admin/recipients")}
            >
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={busy}
              icon={<SaveOutlined />}
            >
              บันทึกข้อมูล
            </Button>
          </div>
        </Form>
      </div>
    </>
  );
}
