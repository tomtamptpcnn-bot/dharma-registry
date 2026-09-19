"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body
        style={{
          fontFamily: "Tahoma, sans-serif",
          padding: 32,
          textAlign: "center",
        }}
      >
        <h1>เกิดข้อผิดพลาดในการแสดงผล</h1>
        <p>กรุณาลองโหลดหน้าอีกครั้ง</p>
        <button onClick={reset}>ลองอีกครั้ง</button>
      </body>
    </html>
  );
}
