"use client";
import { Button, Result } from "antd";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Result
      status="error"
      title="ไม่สามารถโหลดข้อมูลได้"
      subTitle="กรุณาตรวจสอบการเชื่อมต่อ การตั้งค่า Supabase และการติดตั้งฐานข้อมูล แล้วลองอีกครั้ง"
      extra={
        <Button type="primary" onClick={reset}>
          ลองอีกครั้ง
        </Button>
      }
    />
  );
}
