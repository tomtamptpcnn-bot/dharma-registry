"use client";
import { useState } from "react";
import { Alert, App, Button, Input, Modal, Select } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { createRegistryOption } from "@/app/admin/options/actions";
import {
  optionLabels,
  type OptionCategory,
  type RegistryOption,
} from "@/types/options";
export function OptionSelect({
  category,
  options,
  value,
  onChange,
  disabled,
}: {
  category: OptionCategory;
  options: RegistryOption[];
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
}) {
  const [added, setAdded] = useState<RegistryOption[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { message } = App.useApp();
  const names = new Set(
    [...options, ...added]
      .filter((o) => o.category === category)
      .map((o) => o.value),
  );
  // Preserve legacy values in an edit form without silently clearing them.
  if (value) names.add(value);
  async function create() {
    if (!name.trim()) {
      setError("กรุณาระบุชื่อรายการ");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await createRegistryOption({ category, value: name });
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setAdded((previous) => [...previous, result.data]);
        onChange?.(result.data.value);
        setOpen(false);
        setName("");
        message.success("เพิ่มตัวเลือกเรียบร้อยแล้ว");
      }
    } catch {
      setError("เพิ่มตัวเลือกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="flex gap-2">
        <Select
          className="min-w-0 flex-1"
          showSearch
          allowClear
          optionFilterProp="label"
          disabled={disabled}
          value={value}
          onChange={(v) => onChange?.(v ?? null)}
          placeholder={`เลือก${optionLabels[category]}`}
          options={[...names]
            .sort((a, b) => a.localeCompare(b, "th"))
            .map((v) => ({ label: v, value: v }))}
          notFoundContent="ยังไม่มีตัวเลือก กดปุ่ม + เพื่อเพิ่ม"
        />
        <Button
          disabled={disabled}
          icon={<PlusOutlined />}
          aria-label={`เพิ่ม${optionLabels[category]}`}
          title={`เพิ่ม${optionLabels[category]}`}
          onClick={() => {
            setError("");
            setName("");
            setOpen(true);
          }}
        />
      </div>
      <Modal
        title={`เพิ่ม${optionLabels[category]}`}
        open={open}
        onCancel={() => {
          if (!busy) setOpen(false);
        }}
        onOk={create}
        okText="เพิ่มและเลือก"
        cancelText="ยกเลิก"
        confirmLoading={busy}
        closable={!busy}
        maskClosable={!busy}
        cancelButtonProps={{ disabled: busy }}
      >
        {error && (
          <Alert type="error" showIcon message={error} className="mb-4" />
        )}
        <label htmlFor={`new-${category}`}>ชื่อ{optionLabels[category]}</label>
        <Input
          id={`new-${category}`}
          className="mt-2"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={1000}
          disabled={busy}
          onPressEnter={(e) => {
            e.preventDefault();
            if (!busy) void create();
          }}
        />
      </Modal>
    </>
  );
}
