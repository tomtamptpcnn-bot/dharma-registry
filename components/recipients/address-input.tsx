"use client";
import { useState } from "react";
import { Input, Select } from "antd";
import {
  joinAddress,
  splitAddress,
  thaiAddresses,
  type AddressParts,
} from "@/lib/thai-address";
export function AddressInput({
  value,
  onChange,
  disabled,
  id,
}: {
  value?: string | null;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [lastValue, setLastValue] = useState(value);
  const [parts, setParts] = useState(() => splitAddress(value));
  if (value !== lastValue) {
    setLastValue(value);
    setParts(splitAddress(value));
  }
  const districts = thaiAddresses[parts.province ?? ""] ?? {};
  const subdistricts = districts[parts.district ?? ""] ?? [];
  const postal = subdistricts.find(([name]) => name === parts.subdistrict)?.[1];
  const update = (patch: Partial<AddressParts>) => {
    const next = { ...parts, ...patch };
    const serialized = joinAddress(next);
    setParts(next);
    setLastValue(serialized);
    onChange?.(serialized);
  };
  const options = (names: string[]) =>
    names.map((name) => ({ label: name, value: name }));
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <label className="md:col-span-2">
        บ้านเลขที่ หมู่บ้าน หมู่ที่ ซอย ถนน
        <Input
          id={id}
          value={parts.detail}
          disabled={disabled}
          maxLength={700}
          placeholder="เช่น 12/3 หมู่ 4 บ้านหนองทอน"
          onChange={(event) => update({ detail: event.target.value })}
        />
      </label>
      <label>
        จังหวัด
        <Select
          className="w-full"
          aria-label="จังหวัด"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="เลือกจังหวัด"
          disabled={disabled}
          value={parts.province}
          options={options(Object.keys(thaiAddresses))}
          onChange={(province) =>
            update({ province, district: undefined, subdistrict: undefined })
          }
        />
      </label>
      <label>
        อำเภอ / เขต
        <Select
          className="w-full"
          aria-label="อำเภอ / เขต"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="เลือกอำเภอ / เขต"
          disabled={disabled || !parts.province}
          value={parts.district}
          options={options(Object.keys(districts))}
          onChange={(district) => update({ district, subdistrict: undefined })}
        />
      </label>
      <label>
        ตำบล / แขวง
        <Select
          className="w-full"
          aria-label="ตำบล / แขวง"
          showSearch
          allowClear
          optionFilterProp="label"
          placeholder="เลือกตำบล / แขวง"
          disabled={disabled || !parts.district}
          value={parts.subdistrict}
          options={options(subdistricts.map(([name]) => name))}
          onChange={(subdistrict) => update({ subdistrict })}
        />
      </label>
      <label>
        รหัสไปรษณีย์
        <Input
          value={postal ?? ""}
          readOnly
          placeholder="เติมอัตโนมัติเมื่อเลือกตำบล"
        />
      </label>
    </div>
  );
}
