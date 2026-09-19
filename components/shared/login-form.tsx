"use client";
import { useState } from "react";
import { Alert, Button, Form, Input } from "antd";
import {
  SafetyCertificateOutlined,
  UserOutlined,
  LockOutlined,
  BookOutlined,
} from "@ant-design/icons";
import { login } from "@/app/actions";
export function LoginForm({ configured }: { configured: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(values: { username: string; password: string }) {
    setLoading(true);
    setError("");
    try {
      const result = await login(values);
      if (result?.error) setError(result.error);
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex bg-[#124c3e] text-white p-16 flex-col justify-between">
        <div className="flex items-center gap-3 text-lg">
          <BookOutlined className="text-3xl" /> ทะเบียนผู้รับธรรมะ
        </div>
        <div>
          <div className="w-16 h-1 bg-[#c5aa6e] mb-8" />
          <p className="text-[#c4d8cf] mb-5">ระบบทะเบียนสำหรับผู้ดูแล</p>
          <h1 className="text-4xl font-semibold leading-relaxed">
            บันทึกทุกก้าว
            <br />
            บนเส้นทางแห่งธรรม
          </h1>
          <p className="mt-6 text-[#c4d8cf] leading-8">
            จัดเก็บและดูแลประวัติผู้รับธรรมะอย่างเป็นระบบ
            <br />
            เพื่อการค้นหาและติดตามข้อมูลที่สะดวกยิ่งขึ้น
          </p>
        </div>
        <p className="text-sm text-[#b0c8bd]">
          ระบบงานภายใน · เข้าถึงได้เฉพาะผู้ดูแลระบบ
        </p>
      </section>
      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[400px]">
          <div className="w-14 h-14 rounded-2xl bg-[#e3eee8] flex items-center justify-center text-[#176854] text-2xl mb-7">
            <SafetyCertificateOutlined />
          </div>
          <p className="text-[#176854] text-sm mb-3">
            ทะเบียนประวัติผู้รับธรรมะ
          </p>
          <h2 className="text-3xl font-bold mb-3">เข้าสู่ระบบ</h2>
          <p className="text-[#7b8983] mb-8">
            กรอกชื่อผู้ใช้และรหัสผ่านสำหรับผู้ดูแลระบบ
          </p>
          {!configured && (
            <Alert
              className="mb-5"
              type="warning"
              showIcon
              message="ยังไม่ได้ตั้งค่า Supabase"
              description="กรุณาตั้งค่า .env.local และฐานข้อมูลตามคู่มือ README ก่อนเข้าสู่ระบบ"
            />
          )}
          {error && (
            <Alert className="mb-5" type="error" showIcon message={error} />
          )}
          <Form layout="vertical" onFinish={submit} requiredMark={false}>
            <Form.Item
              name="username"
              label="ชื่อผู้ใช้"
              rules={[
                { required: true, message: "กรุณาระบุชื่อผู้ใช้" },
                {
                  pattern: /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,31}$/,
                  message: "ใช้ภาษาอังกฤษหรือตัวเลข 3–32 ตัว และใช้ . _ - ได้",
                },
              ]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400 mr-2" />}
                autoComplete="username"
                placeholder="เช่น chaiya"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={32}
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="password"
              label="รหัสผ่าน"
              rules={[{ required: true, message: "กรุณาระบุรหัสผ่าน" }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400 mr-2" />}
                autoComplete="current-password"
                placeholder="กรอกรหัสผ่าน"
                size="large"
              />
            </Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={loading}
              disabled={!configured}
            >
              เข้าสู่ระบบ
            </Button>
          </Form>
          <p className="text-xs text-gray-500 text-center mt-7 leading-6">
            หากไม่สามารถเข้าสู่ระบบได้ กรุณาติดต่อผู้ดูแลระบบ
            <br />
            บัญชีผู้ใช้งานต้องได้รับการจัดสร้างโดยผู้ดูแลเท่านั้น
          </p>
        </div>
      </section>
    </main>
  );
}
