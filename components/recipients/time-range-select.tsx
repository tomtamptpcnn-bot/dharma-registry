"use client";

import { useState } from "react";
import { Input, Select } from "antd";

export type TimeRangeValue = {
  start: string | null;
  end: string | null;
};

const presets = [{ label: "13:00–15:00", value: "13:00–15:00" }];

export function TimeRangeSelect({
  value,
  onChange,
  disabled,
  id,
}: {
  value?: TimeRangeValue;
  onChange?: (value: TimeRangeValue) => void;
  disabled?: boolean;
  id?: string;
}) {
  const [custom, setCustom] = useState(false);
  const range =
    value?.start && value?.end ? `${value.start}–${value.end}` : null;
  const hasValue = Boolean(value?.start || value?.end);
  const isPreset = presets.some((preset) => preset.value === range);
  const showCustom = custom || (hasValue && !isPreset);

  return (
    <div>
      <Select
        id={id}
        className="w-full"
        allowClear
        disabled={disabled}
        placeholder="เลือกช่วงเวลาที่รับธรรม"
        value={showCustom ? "custom" : (range ?? undefined)}
        options={[...presets, { label: "กำหนดเอง", value: "custom" }]}
        onChange={(selected: string | undefined) => {
          if (selected === "custom") {
            setCustom(true);
            return;
          }
          setCustom(false);
          const [start, end] = selected?.split("–") ?? [];
          onChange?.({ start: start ?? null, end: end ?? null });
        }}
      />
      {showCustom && (
        <div className="mt-3 grid grid-cols-2 gap-x-6">
          <label>
            <span className="mb-2 block">เวลาเริ่ม</span>
            <Input
              type="time"
              step={60}
              disabled={disabled}
              value={value?.start ?? ""}
              onChange={(event) =>
                onChange?.({
                  start: event.target.value || null,
                  end: value?.end ?? null,
                })
              }
            />
          </label>
          <label>
            <span className="mb-2 block">เวลาสิ้นสุด</span>
            <Input
              type="time"
              step={60}
              disabled={disabled}
              value={value?.end ?? ""}
              onChange={(event) =>
                onChange?.({
                  start: value?.start ?? null,
                  end: event.target.value || null,
                })
              }
            />
          </label>
        </div>
      )}
    </div>
  );
}
