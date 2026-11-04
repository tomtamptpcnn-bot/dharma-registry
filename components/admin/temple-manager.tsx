"use client";
import { useState } from "react";
import { App, Button, Input, Modal, Table, Tooltip } from "antd";
import { DeleteOutlined, EditOutlined, KeyOutlined, PlusOutlined, SyncOutlined } from "@ant-design/icons";
import { createTemple, manageTemple, migrateLegacyManagerEmails, resetTempleManagerPassword } from "@/app/admin/temples/actions";

type Temple = { id: string; name: string; caretaker_name: string; manager_username: string; created_at: string; recipient_count: number; total_merit: number };
export function TempleManager({ temples }: { temples: Temple[] }) {
  const [name, setName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Temple | null>(null);
  const [editName, setEditName] = useState("");
  const [editManager, setEditManager] = useState("");
  const [resetting, setResetting] = useState<Temple | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const { message } = App.useApp();
  async function add() {
    setBusy(true);
    const result = await createTemple({ templeName: name, managerName, username, password });
    setBusy(false);
    if (result.error) return void message.error(result.error);
    setName("");
    setManagerName("");
    setUsername("");
    setPassword("");
    message.success(`สร้างสถานธรรมและบัญชีผู้ดูแล ${result.username} แล้ว`);
    window.location.reload();
  }
  async function saveEdit() {
    if (!editing || busy) return;
    setBusy(true);
    const result = await manageTemple({ id: editing.id, operation: "rename", name: editName, caretakerName: editManager });
    setBusy(false);
    if (result.error) return void message.error(result.error);
    message.success("แก้ไขข้อมูลสถานธรรมแล้ว");
    setEditing(null);
    window.location.reload();
  }
  function deleteTemple(temple: Temple) {
    Modal.confirm({
      title: `ลบสถานธรรม ${temple.name}?`,
      content: "ลบได้เฉพาะสาขาที่ยังไม่มีทะเบียนผู้รับธรรมะ รายการตัวเลือกและสิทธิ์ผู้ดูแลของสาขานี้จะถูกลบด้วย บัญชี Auth จะยังอยู่แต่จะไม่มีสิทธิ์เข้าใช้ระบบ",
      okText: "ลบสถานธรรม",
      okButtonProps: { danger: true },
      cancelText: "ยกเลิก",
      onOk: async () => {
        setBusy(true);
        try {
          const result = await manageTemple({ id: temple.id, operation: "delete" });
          if (result.error) {
            message.error(result.error);
            return;
          }
          message.success(`ลบสถานธรรม ${temple.name} แล้ว`);
          window.location.reload();
        } finally {
          setBusy(false);
        }
      },
    });
  }
  async function resetPassword() {
    if (!resetting || busy) return;
    setBusy(true);
    const result = await resetTempleManagerPassword({ id: resetting.id, password: newPassword });
    setBusy(false);
    if (result.error) return void message.error(result.error);
    setResetting(null);
    setNewPassword("");
    message.success("รีเซ็ตรหัสผ่านผู้ดูแลแล้ว");
  }
  function migrateOldEmails() {
    Modal.confirm({
      title: "ย้ายบัญชีทั้งหมดเป็น @dharma.com?",
      content: "ระบบจะเปลี่ยนอีเมล Auth ของบัญชีที่ผูกกับผู้ใช้ทุกบัญชี รวมถึงบัญชีที่ใช้อีเมลจริง ให้เป็น username@dharma.com โดยคง UUID รหัสผ่าน และสิทธิ์เดิมไว้ หากอีเมลปลายทางถูกใช้อยู่แล้ว ระบบจะข้ามบัญชีนั้น",
      okText: "ย้ายบัญชี",
      cancelText: "ยกเลิก",
      onOk: async () => {
        setBusy(true);
        const result = await migrateLegacyManagerEmails();
        setBusy(false);
        if ("error" in result) return void message.error(result.error);
        message.success(`เปลี่ยนอีเมลแล้ว ${result.updated} บัญชี · ถูกต้องอยู่แล้ว ${result.unchanged} · ข้าม ${result.skipped}`);
        if (result.failures.length) message.warning(`มี ${result.failures.length} บัญชีที่เปลี่ยนไม่สำเร็จ: ${result.failures.slice(0, 3).join("; ")}`);
      },
    });
  }
  return <>
    <div className="text-xs text-gray-400 mb-5">เมนูหลัก / จัดการสถานธรรม</div>
    <h1 className="page-heading">จัดการสถานธรรม</h1>
    <p className="page-description mb-6">สร้างสาขาพร้อมบัญชีผู้ดูแล แก้ไขข้อมูล และรีเซ็ตรหัสผ่าน</p>
    <div className="section-card mb-6">
      {/* <div className="flex justify-end mb-4">
        <Tooltip title="เปลี่ยนอีเมล Auth ของทุกบัญชีที่เชื่อมกับผู้ใช้ให้เป็น @dharma.com">
          <Button icon={<SyncOutlined />} loading={busy} onClick={migrateOldEmails}>ย้ายทุกบัญชีเป็น @dharma.com</Button>
        </Tooltip>
      </div> */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Input aria-label="ชื่อสถานธรรม" value={name} onChange={(event) => setName(event.target.value)} placeholder="ชื่อสถานธรรม" maxLength={200} />
        <Input aria-label="ชื่อผู้ดูแล" value={managerName} onChange={(event) => setManagerName(event.target.value)} placeholder="ชื่อ-นามสกุลผู้ดูแล" maxLength={200} />
        <Input aria-label="Username" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase())} placeholder="Username (ภาษาอังกฤษ/ตัวเลข)" maxLength={32} autoCapitalize="none" />
        <Input.Password aria-label="Password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (อย่างน้อย 8 ตัวอักษร)" maxLength={72} autoComplete="new-password" />
      </div>
      <Button type="primary" icon={<PlusOutlined />} loading={busy} onClick={add}>สร้างสถานธรรมและบัญชีผู้ดูแล</Button>
    </div>
    <div className="section-card">
      <Input.Search aria-label="ค้นหาสถานธรรม" placeholder="ค้นหาชื่อสถานธรรม ผู้ดูแล หรือ Username" allowClear value={search} onChange={(event) => setSearch(event.target.value)} className="mb-4 max-w-md" />
      <Table rowKey="id" dataSource={[...temples].filter((temple) => [temple.name, temple.caretaker_name, temple.manager_username].some((value) => value.toLocaleLowerCase("th").includes(search.trim().toLocaleLowerCase("th")))).sort((a, b) => a.name.localeCompare(b.name, "th"))} pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total, range) => `${range[0]}–${range[1]} จาก ${total} รายการ` }} columns={[{ title: "ชื่อสถานธรรม", dataIndex: "name", sorter: (a: Temple, b: Temple) => a.name.localeCompare(b.name, "th") }, { title: "ผู้ดูแล", dataIndex: "caretaker_name", render: (value: string) => value || "—" }, { title: "Username", dataIndex: "manager_username", render: (value: string) => value || "—" }, { title: "ทะเบียน", dataIndex: "recipient_count", align: "right", sorter: (a: Temple, b: Temple) => a.recipient_count - b.recipient_count, render: (count: number) => `${count.toLocaleString("th-TH")} รายการ` }, { title: "สร้างบุญรวม", dataIndex: "total_merit", align: "right", sorter: (a: Temple, b: Temple) => a.total_merit - b.total_merit, render: (amount: number) => `${amount.toLocaleString("th-TH", { maximumFractionDigits: 2 })} บาท` }, { title: "จัดการ", key: "actions", width: 160, render: (_, temple: Temple) => {
      const canDelete = temple.recipient_count === 0 && temples.length > 1;
      const deleteTooltip = temple.recipient_count > 0
        ? `ลบไม่ได้ มีทะเบียนผู้รับธรรมะ ${temple.recipient_count.toLocaleString("th-TH")} รายการ`
        : temples.length <= 1
          ? "ต้องเหลือสถานธรรมอย่างน้อยหนึ่งแห่ง"
          : "ลบสถานธรรมที่ไม่มีทะเบียน";
      return <div className="flex gap-1"><Tooltip title="แก้ไขข้อมูลสถานธรรม"><Button aria-label={`แก้ไข ${temple.name}`} icon={<EditOutlined />} onClick={() => { setEditing(temple); setEditName(temple.name); setEditManager(temple.caretaker_name); }} /></Tooltip><Tooltip title="รีเซ็ตรหัสผ่าน"><Button aria-label={`รีเซ็ตรหัสผ่าน ${temple.name}`} icon={<KeyOutlined />} onClick={() => { setResetting(temple); setNewPassword(""); }} /></Tooltip><Tooltip title={deleteTooltip}><span><Button danger disabled={!canDelete || busy} aria-label={`ลบสถานธรรม ${temple.name}`} icon={<DeleteOutlined />} loading={busy} onClick={() => deleteTemple(temple)} /></span></Tooltip></div>;
    } }]} /></div>
    <Modal title="แก้ไขข้อมูลสถานธรรม" open={!!editing} onCancel={() => setEditing(null)} onOk={saveEdit} confirmLoading={busy} okText="บันทึก" cancelText="ยกเลิก">
      <div className="grid gap-4 pt-4">
        <Input aria-label="ชื่อสถานธรรม" value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="ชื่อสถานธรรม" maxLength={200} />
        <Input aria-label="ชื่อผู้ดูแล" value={editManager} onChange={(event) => setEditManager(event.target.value)} placeholder="ชื่อผู้ดูแล" maxLength={200} />
      </div>
    </Modal>
    <Modal title={`รีเซ็ตรหัสผ่านผู้ดูแล ${resetting?.name ?? ""}`} open={!!resetting} onCancel={() => setResetting(null)} onOk={resetPassword} confirmLoading={busy} okText="ตั้งรหัสผ่านใหม่" cancelText="ยกเลิก">
      <div className="pt-4">
        <Input.Password aria-label="รหัสผ่านใหม่" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="รหัสผ่านใหม่ อย่างน้อย 8 ตัวอักษร" maxLength={72} autoComplete="new-password" />
        <p className="text-xs text-gray-500 mt-2">ผู้ดูแลต้องใช้รหัสผ่านใหม่นี้ในการเข้าสู่ระบบครั้งถัดไป</p>
      </div>
    </Modal>
  </>;
}
