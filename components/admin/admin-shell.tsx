"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { App, Avatar, Button, Drawer, Menu } from "antd";
import {
  BookOutlined,
  DashboardOutlined,
  TeamOutlined,
  LogoutOutlined,
  MenuOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import { logout } from "@/app/actions";
export function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email: string;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { message } = App.useApp();
  async function signOut() {
    setBusy(true);
    try {
      const result = await logout();
      if (result?.error) message.error(result.error);
    } catch {
      message.error("ออกจากระบบไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }
  const navigation = (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 px-6 py-8">
        <span className="bg-[#176854] text-white p-3 rounded-xl text-xl">
          <BookOutlined />
        </span>
        <div className="font-bold leading-6">
          ทะเบียนผู้รับธรรมะ
          <div className="text-xs font-normal text-gray-400">
            ระบบจัดการข้อมูลภายใน
          </div>
        </div>
      </div>
      <div className="text-[11px] text-gray-400 px-7 mb-3">เมนูหลัก</div>
      <Menu
        mode="inline"
        selectedKeys={[
          path.startsWith("/admin/options")
            ? "options"
            : path.startsWith("/admin/dashboard")
              ? "dashboard"
              : "recipients",
        ]}
        onClick={() => setOpen(false)}
        style={{ border: 0, padding: "0 12px" }}
        items={[
          {
            key: "options",
            icon: <BookOutlined />,
            label: <Link href="/admin/options">จัดการข้อมูลตัวเลือก</Link>,
          },
          {
            key: "dashboard",
            icon: <DashboardOutlined />,
            label: <Link href="/admin/dashboard">ภาพรวมระบบ</Link>,
          },
          {
            key: "recipients",
            icon: <TeamOutlined />,
            label: <Link href="/admin/recipients">ทะเบียนผู้รับธรรมะ</Link>,
          },
        ]}
      />
      <div className="mt-auto p-5 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
          <SafetyCertificateOutlined /> สำหรับผู้ดูแลระบบเท่านั้น
        </div>
        <Button
          icon={<LogoutOutlined />}
          block
          onClick={signOut}
          loading={busy}
        >
          ออกจากระบบ
        </Button>
      </div>
    </div>
  );
  if (path === "/admin/recipients/print") return <>{children}</>;
  return (
    <div className="min-h-screen">
      <aside className="hidden lg:block fixed left-0 top-0 bottom-0 w-[250px] bg-white border-r border-[#e5ebe7]">
        {navigation}
      </aside>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        placement="left"
        width={270}
        styles={{ body: { padding: 0 } }}
        title="เมนูผู้ดูแลระบบ"
      >
        {navigation}
      </Drawer>
      <div className="lg:ml-[250px]">
        <header className="h-20 bg-white border-b border-[#e5ebe7] px-5 md:px-9 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button
              className="lg:!hidden"
              type="text"
              icon={<MenuOutlined />}
              aria-label="เปิดเมนู"
              onClick={() => setOpen(true)}
            />
            <span className="font-semibold text-sm md:text-base">
              ทะเบียนประวัติผู้รับธรรมะ
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold">ผู้ดูแลระบบ</div>
              <div className="text-xs text-gray-400 mt-1 max-w-48 truncate">
                {email}
              </div>
            </div>
            <Avatar
              style={{ background: "#e7f0eb", color: "#176854" }}
              icon={<UserOutlined />}
            />
          </div>
        </header>
        <main className="p-4 md:p-8 lg:p-9 max-w-[1800px] mx-auto">
          {children}
        </main>
        <footer className="px-8 pb-6 text-xs text-gray-400">
          ทะเบียนประวัติผู้รับธรรมะ · ระบบงานภายใน
        </footer>
      </div>
    </div>
  );
}
