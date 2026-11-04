"use client";
import { Table, Tag } from "antd";

const actionLabels: Record<string, string> = {
  insert: "สร้าง",
  update: "แก้ไข",
  delete: "ลบ",
  login: "เข้าสู่ระบบ",
  logout: "ออกจากระบบ",
  manager_account_created: "สร้างบัญชีผู้ดูแลสาขา",
  manager_password_reset: "รีเซ็ตรหัสผ่านผู้ดูแลสาขา",
  manager_email_migrated: "เปลี่ยนอีเมลบัญชีผู้ดูแล",
};
const entityLabels: Record<string, string> = {
  recipient: "ทะเบียนผู้รับธรรมะ",
  option: "ข้อมูลตัวเลือก",
  temple: "สถานธรรม",
  temple_manager: "บัญชีผู้ดูแล",
};
const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  temple_admin: "ผู้ดูแลสาขา",
  system: "ระบบ",
  unknown: "ไม่ทราบบัญชี",
};
const fieldLabels: Record<string, string> = {
  full_name: "ชื่อ-นามสกุล",
  gender: "เพศ",
  birth_date: "วันเกิด",
  age: "อายุ",
  phone: "เบอร์โทรศัพท์",
  address: "ที่อยู่",
  recommended_by: "อาจารย์แนะนำ",
  certified_by: "อาจารย์รับรอง",
  transmitted_by: "อาจารย์ถ่ายทอดเบิกธรรม",
  class_name: "ชั้น",
  level: "ระดับ",
  received_place: "สถานที่รับธรรม",
  received_date: "วันที่รับธรรม",
  created_at: "วันที่สร้าง",
  updated_at: "วันที่แก้ไข",
  caretaker_name: "ชื่อผู้ดูแล",
  manager_username: "ชื่อผู้ใช้",
  name: "ชื่อ",
  password: "รหัสผ่าน",
  email: "อีเมล",
};
const categoryLabels: Record<string, string> = {
  recommended_by: "อาจารย์แนะนำ",
  certified_by: "อาจารย์รับรอง",
  transmitted_by: "อาจารย์ถ่ายทอดเบิกธรรม",
  class_name: "ชั้น",
  level: "ระดับ",
  received_place: "สถานที่รับธรรม",
};
export type ActivityLog = {
  id: number;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string;
  temple_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  dharma_temples: { name: string } | null;
};

export function ActivityLogTable({ logs }: { logs: ActivityLog[] }) {
  function detailText(row: ActivityLog) {
    const details = row.details ?? {};
    const name = typeof details.name === "string" ? details.name : null;
    const value = typeof details.value === "string" ? details.value : null;
    const username = typeof details.username === "string" ? details.username : null;
    const previousName = typeof details.previous_name === "string" ? details.previous_name : null;
    const oldEmail = typeof details.old_email === "string" ? details.old_email : null;
    const newEmail = typeof details.new_email === "string" ? details.new_email : null;
    const category = typeof details.category === "string" ? categoryLabels[details.category] ?? details.category : null;
    const changed = Array.isArray(details.changed_fields)
      ? details.changed_fields.map((field) => typeof field === "string" ? fieldLabels[field] ?? field : "").filter(Boolean)
      : [];

    if (row.action === "login" || row.action === "logout") return "บัญชีผู้ใช้";
    if (row.action === "manager_account_created") return username ? `ชื่อผู้ใช้ ${username}` : "บัญชีผู้ดูแลสาขา";
    if (row.action === "manager_password_reset") return "ตั้งรหัสผ่านใหม่ให้บัญชีผู้ดูแลสาขา";
    if (row.action === "manager_email_migrated") return oldEmail && newEmail ? `เปลี่ยนอีเมลจาก ${oldEmail} เป็น ${newEmail}` : "เปลี่ยนอีเมลบัญชีผู้ดูแล";
    if (row.entity_type === "option") return [category, value && `รายการ “${value}”`].filter(Boolean).join(" · ") || "ข้อมูลตัวเลือก";
    if (row.entity_type === "temple") {
      return previousName && name && previousName !== name
        ? `เปลี่ยนชื่อจาก “${previousName}” เป็น “${name}”`
        : name ?? "สถานธรรม";
    }
    if (row.entity_type === "recipient") {
      const recipientName = name ? `“${name}”` : "ผู้รับธรรมะ";
      return changed.length ? `${recipientName} · แก้ไข ${changed.join(", ")}` : recipientName;
    }
    if (row.entity_type === "temple_manager") return username ? `บัญชี ${username}` : "บัญชีผู้ดูแลสาขา";
    return name ?? value ?? "—";
  }

  return (
    <section className="section-card !p-0 overflow-hidden">
      <Table<ActivityLog>
        rowKey="id"
        dataSource={logs}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 25, showSizeChanger: false }}
        locale={{ emptyText: "ยังไม่มีประวัติกิจกรรม" }}
        columns={[
          {
            title: "วันและเวลา",
            dataIndex: "created_at",
            width: 190,
            render: (value: string) => new Intl.DateTimeFormat("th-TH", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Bangkok",
            }).format(new Date(value)),
          },
          {
            title: "ผู้ทำรายการ",
            key: "actor",
            width: 220,
            render: (_, row) => <div>{row.actor_name || row.actor_email || roleLabels[row.actor_role] || row.actor_role}<div className="text-xs text-gray-400">{roleLabels[row.actor_role] || row.actor_role}</div></div>,
          },
          {
            title: "สถานธรรม",
            key: "temple",
            width: 180,
            render: (_, row) => row.dharma_temples?.name ?? (row.actor_role === "super_admin" ? "ทุกสาขา" : "—"),
          },
          {
            title: "กิจกรรม",
            key: "activity",
            width: 230,
            render: (_, row) => <><Tag color={row.action === "delete" ? "red" : row.action.includes("reset") ? "orange" : "green"}>{actionLabels[row.action] || "ทำรายการ"}</Tag>{entityLabels[row.entity_type] || "ข้อมูล"}</>,
          },
          {
            title: "รายละเอียด",
            key: "details",
            render: (_, row) => <span title={row.entity_id ?? undefined}>{detailText(row)}</span>,
          },
        ]}
      />
    </section>
  );
}
