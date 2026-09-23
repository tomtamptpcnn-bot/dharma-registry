"use client";
import { useState } from "react";
import {
  Alert,
  Modal,
  Space,
  App,
  Button,
  Form,
  Input,
  Select,
  Table,
  Tabs,
  Tag,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  optionCategories,
  optionLabels,
  type OptionCategory,
} from "@/types/options";
import {
  createRegistryOption,
  manageRegistryOption,
} from "@/app/admin/options/actions";
import type { CountedOption } from "@/lib/option-counts";
export function OptionsManager({
  options,
  total,
  unassigned,
}: {
  options: CountedOption[];
  total: number;
  unassigned: Record<OptionCategory, number>;
}) {
  const [category, setCategory] = useState<OptionCategory>("recommended_by");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  function clearSearch() {
    setSearchInput("");
    setQuery("");
    setPage(1);
  }
  const categoryOptions = options.filter((o) => o.category === category);
  const filteredOptions = categoryOptions.filter((o) =>
    o.value
      .toLocaleLowerCase("th-TH")
      .includes(query.toLocaleLowerCase("th-TH")),
  );
  const [target, setTarget] = useState<CountedOption | null>(null);
  const [operation, setOperation] = useState<"rename" | "delete">("rename");
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  function openAction(row: CountedOption, action: "rename" | "delete") {
    setTarget(row);
    setOperation(action);
    setEditValue(row.value);
    setEditError("");
  }
  async function confirmAction() {
    if (!target || saving) return;
    setSaving(true);
    setEditError("");
    try {
      const result = await manageRegistryOption({
        id: target.id,
        operation,
        value: editValue,
      });
      if (result.error) {
        setEditError(result.error);
        return;
      }
      message.success(
        operation === "rename"
          ? "แก้ไขชื่อและทะเบียนที่เกี่ยวข้องเรียบร้อยแล้ว"
          : "ลบรายการเรียบร้อยแล้ว",
      );
      setTarget(null);
      clearSearch();
    } catch {
      setEditError("ดำเนินการไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [form] = Form.useForm();
  const { message } = App.useApp();
  async function save(input: { category: OptionCategory; value: string }) {
    setBusy(true);
    setError("");
    try {
      const result = await createRegistryOption(input);
      if (result.error) {
        setError(result.error);
        return;
      }
      message.success("เพิ่มตัวเลือกเรียบร้อยแล้ว");
      form.resetFields(["value"]);
      setCategory(input.category);
      clearSearch();
    } catch {
      setError("เพิ่มตัวเลือกไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <h1 className="page-heading">จัดการข้อมูลตัวเลือก</h1>
      <p className="page-description mb-6">
        เพิ่ม แก้ไข และลบข้อมูลตัวเลือกทั้ง 6 หมวด
        ชื่อในหมวดเดียวกันห้ามซ้ำแม้ตัวพิมพ์เล็ก–ใหญ่ต่างกัน
        ลบได้เฉพาะรายการที่ไม่มีทะเบียนใช้งาน
      </p>
      <section className="section-card mb-6">
        {error && (
          <Alert className="mb-4" type="error" showIcon message={error} />
        )}
        <Form
          form={form}
          layout="vertical"
          onFinish={save}
          initialValues={{ category: "recommended_by" }}
          disabled={busy}
        >
          <div className="grid md:grid-cols-[1fr_2fr_auto] gap-x-4 items-end">
            <Form.Item
              name="category"
              label="หมวดข้อมูล"
              rules={[{ required: true, message: "กรุณาเลือกหมวด" }]}
            >
              <Select
                options={optionCategories.map((value) => ({
                  value,
                  label: optionLabels[value],
                }))}
              />
            </Form.Item>
            <Form.Item
              name="value"
              label="ชื่อรายการ"
              rules={[
                {
                  required: true,
                  whitespace: true,
                  message: "กรุณาระบุชื่อรายการ",
                },
              ]}
            >
              <Input maxLength={1000} />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={busy}
                icon={<PlusOutlined />}
              >
                เพิ่มข้อมูล
              </Button>
            </Form.Item>
          </div>
        </Form>
      </section>
      <section className="section-card">
        <Tabs
          activeKey={category}
          onChange={(key) => {
            setCategory(key as OptionCategory);
            clearSearch();
          }}
          items={optionCategories.map((key) => ({
            key,
            label: (
              <>
                {optionLabels[key]}{" "}
                <Tag>
                  {options.filter((o) => o.category === key).length} รายการ
                </Tag>
              </>
            ),
          }))}
        />
        <div className="flex flex-wrap gap-3 mb-4 text-sm">
          <Tag color="green">
            มี{optionLabels[category]}{" "}
            {(total - unassigned[category]).toLocaleString("th-TH")} คน
          </Tag>
          <Tag>
            ยังไม่ระบุ {unassigned[category].toLocaleString("th-TH")} คน
          </Tag>
          <span className="text-gray-500">
            ทะเบียนทั้งหมด {total.toLocaleString("th-TH")} รายการ
          </span>
        </div>
        <form
          className="mb-4"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(searchInput.trim());
            setPage(1);
          }}
        >
          <label htmlFor="option-search" className="block mb-2 text-sm">
            ค้นหา{optionLabels[category]}
          </label>
          <div className="flex flex-wrap gap-2">
            <Input
              id="option-search"
              className="!w-full sm:!w-80"
              value={searchInput}
              onChange={(event) => {
                setSearchInput(event.target.value);
                if (!event.target.value) {
                  setQuery("");
                  setPage(1);
                }
              }}
              placeholder={`ค้นหาชื่อ${optionLabels[category]}`}
              prefix={<SearchOutlined />}
              allowClear
              maxLength={1000}
            />
            <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
              ค้นหา
            </Button>
            <Button
              htmlType="button"
              onClick={clearSearch}
              icon={<ReloadOutlined />}
            >
              ล้างค่า
            </Button>
          </div>
          <p className="mt-3 text-sm text-gray-500" role="status">
            แสดง {filteredOptions.length.toLocaleString("th-TH")} จาก{" "}
            {categoryOptions.length.toLocaleString("th-TH")} รายการ
            {query && ` สำหรับ “${query}”`}
          </p>
        </form>
        <Table<CountedOption>
          key={category}
          rowKey="id"
          scroll={{ x: 650 }}
          dataSource={filteredOptions}
          columns={[
            {
              title: "จัดการ",
              key: "actions",
              width: 180,
              render: (_, row) => (
                <Space>
                  <Button
                    icon={<EditOutlined />}
                    onClick={() => openAction(row, "rename")}
                    aria-label={`แก้ไข ${row.value}`}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    danger
                    disabled={row.recipientCount > 0}
                    title={
                      row.recipientCount > 0
                        ? `ลบไม่ได้ มีทะเบียนใช้งาน ${row.recipientCount} รายการ`
                        : "ลบรายการที่ไม่มีทะเบียนใช้งาน"
                    }
                    icon={<DeleteOutlined />}
                    onClick={() => openAction(row, "delete")}
                    aria-label={`ลบ ${row.value}`}
                  >
                    ลบ
                  </Button>
                </Space>
              ),
            },
            { title: optionLabels[category], dataIndex: "value" },
            {
              title: "จำนวนผู้รับธรรมะ",
              dataIndex: "recipientCount",
              width: 180,
              align: "right",
              sorter: (a, b) => a.recipientCount - b.recipientCount,
              render: (count: number) => (
                <Tag color={count > 0 ? "green" : undefined}>
                  {count.toLocaleString("th-TH")} คน
                </Tag>
              ),
            },
          ]}
          pagination={{
            current: page,
            onChange: setPage,
            pageSize: 10,
            showSizeChanger: false,
            hideOnSinglePage: true,
          }}
          locale={{
            emptyText: query
              ? "ไม่พบรายการที่ตรงกับคำค้นหา"
              : "ยังไม่มีรายการในหมวดนี้",
          }}
        />
        <p className="mt-4 text-xs text-gray-500">
          นับตามรายการทะเบียนในแต่ละหมวด ผู้รับธรรมะหนึ่งรายการอาจอยู่ในหลายหมวด
          จึงไม่ควรนำยอดข้ามหมวดมารวมกัน
        </p>
      </section>
      <Modal
        title={operation === "rename" ? "แก้ไขรายการ" : "ยืนยันการลบรายการ"}
        open={Boolean(target)}
        onCancel={() => {
          if (!saving) setTarget(null);
        }}
        onOk={confirmAction}
        confirmLoading={saving}
        okText={operation === "rename" ? "บันทึกการแก้ไข" : "ยืนยันการลบ"}
        cancelText="ยกเลิก"
        okButtonProps={{
          danger: operation === "delete",
          disabled: operation === "delete" && (target?.recipientCount ?? 0) > 0,
        }}
        cancelButtonProps={{ disabled: saving }}
        closable={!saving}
        maskClosable={!saving}
      >
        {editError && (
          <Alert className="mb-4" type="error" showIcon message={editError} />
        )}
        {target && (
          <p className="mb-3">
            {optionLabels[target.category]}: {target.value}
          </p>
        )}
        {operation === "rename" ? (
          <>
            <label htmlFor="edit-option-name">ชื่อรายการใหม่</label>
            <Input
              id="edit-option-name"
              className="mt-2"
              value={editValue}
              onChange={(event) => setEditValue(event.target.value)}
              maxLength={1000}
              disabled={saving}
            />
            <p className="text-gray-500 mt-3">
              ทะเบียนที่ใช้รายการนี้ {target?.recipientCount ?? 0} รายการ
              จะเปลี่ยนเป็นชื่อใหม่ด้วย
            </p>
          </>
        ) : (
          <p>
            {(target?.recipientCount ?? 0) > 0
              ? `ยังมีทะเบียนใช้รายการนี้ ${target?.recipientCount} รายการ กรุณาเปลี่ยนค่าในทะเบียนเหล่านั้นก่อนลบ`
              : "ต้องการลบรายการนี้หรือไม่? เมื่อลบแล้วจะไม่แสดงในช่องเลือก"}
          </p>
        )}
      </Modal>
    </>
  );
}
