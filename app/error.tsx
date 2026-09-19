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
      title="ไม่สามารถเชื่อมต่อระบบได้"
      subTitle="กรุณาตรวจสอบการเชื่อมต่อและการตั้งค่า Supabase แล้วลองอีกครั้ง"
      extra={
        <Button type="primary" onClick={reset}>
          ลองอีกครั้ง
        </Button>
      }
    />
  );
}
