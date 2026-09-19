import type { Metadata } from "next";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { Providers } from "@/components/shared/providers";
import "./globals.css";
export const metadata: Metadata = {
  title: {
    default: "ทะเบียนประวัติผู้รับธรรมะ",
    template: "%s | ทะเบียนผู้รับธรรมะ",
  },
  description: "ระบบทะเบียนประวัติผู้รับธรรมะสำหรับผู้ดูแลระบบ",
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body>
        <AntdRegistry>
          <Providers>{children}</Providers>
        </AntdRegistry>
      </body>
    </html>
  );
}
