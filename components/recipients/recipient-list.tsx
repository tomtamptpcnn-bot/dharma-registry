"use client";
import type { RegistryOption } from "@/types/options";
import { useTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  App,
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Space,
  Select,
  Table,
  Tag,
} from "antd";
import type { TableColumnsType } from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import type { DharmaRecipient } from "@/types/recipient";
import type { ListFilters } from "@/lib/recipients";
import { formatDate, formatMoney } from "@/lib/format";
import { deleteRecipient } from "@/app/actions";
interface SearchValues {
  q?: string;
  level?: string;
  dates?: [Dayjs | null, Dayjs | null];
}
export function RecipientList({
  data,
  total,
  page,
  pageSize,
  filters,
  options,
}: {
  data: DharmaRecipient[];
  total: number;
  page: number;
  pageSize: number;
  filters: ListFilters;
  options: RegistryOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);
  const [target, setTarget] = useState<DharmaRecipient | null>(null);
  const { message } = App.useApp();
  function navigate(values: ListFilters) {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    startTransition(() => router.push(`/admin/recipients?${params}`));
  }
  function search(values: SearchValues) {
    navigate({
      sort: filters.sort,
      q: values.q?.trim(),
      level: values.level?.trim(),
      from: values.dates?.[0]?.format("YYYY-MM-DD"),
      to: values.dates?.[1]?.format("YYYY-MM-DD"),
      page: "1",
      pageSize: String(pageSize),
    });
  }
  async function remove() {
    if (!target) return;
    setDeleting(true);
    try {
      const result = await deleteRecipient(target.id);
      if (result.error) {
        message.error(result.error);
        return;
      }
      message.success("ลบข้อมูลเรียบร้อยแล้ว");
      setTarget(null);
      if (data.length === 1 && page > 1)
        navigate({ ...filters, page: String(page - 1) });
    } catch {
      message.error("ลบข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setDeleting(false);
    }
  }
  const text = (value: string | number | null) => value ?? "—";
  const columns: TableColumnsType<DharmaRecipient> = [
    {
      title: "ลำดับ",
      width: 70,
      render: (_, __, index) => (page - 1) * pageSize + index + 1,
    },
    {
      title: "ชื่อ-นามสกุล",
      dataIndex: "full_name",
      fixed: "left",
      width: 210,
      render: (value: string, record) => (
        <Link
          className="font-semibold !text-[#176854]"
          href={`/admin/recipients/${record.id}`}
        >
          {value}
        </Link>
      ),
    },
    { title: "อายุ", dataIndex: "age", width: 70, render: text },
    { title: "ชื่อเล่น", dataIndex: "nickname", width: 110, render: text },
    { title: "ที่อยู่", dataIndex: "address", width: 250, render: text },
    { title: "เบอร์โทร", dataIndex: "phone", width: 130, render: text },
    {
      title: "อาจารย์แนะนำ",
      dataIndex: "recommended_by",
      width: 160,
      render: text,
    },
    {
      title: "อาจารย์รับรอง",
      dataIndex: "certified_by",
      width: 160,
      render: text,
    },
    {
      title: "วันที่รับธรรม",
      dataIndex: "received_date",
      sorter: true,
      sortOrder:
        filters.sort === "date_asc"
          ? "ascend"
          : filters.sort === "date_desc"
            ? "descend"
            : null,
      showSorterTooltip: { title: "เรียงวันที่เก่าสุด / ล่าสุด" },
      width: 130,
      render: formatDate,
    },
    {
      title: "สร้างบุญ (บาท)",
      dataIndex: "merit_amount",
      width: 130,
      align: "right",
      render: formatMoney,
    },
    { title: "ชั้น", dataIndex: "class_name", width: 100, render: text },
    {
      title: "ระดับ",
      dataIndex: "level",
      width: 120,
      render: (value: string | null) =>
        value ? <Tag color="green">{value}</Tag> : "—",
    },
    {
      title: "สถานที่รับธรรม",
      dataIndex: "received_place",
      width: 240,
      render: text,
    },
    {
      title: "จัดการ",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size={2}>
          <Link href={`/admin/recipients/${record.id}`}>
            <Button
              type="text"
              icon={<EyeOutlined />}
              aria-label={`ดูรายละเอียด ${record.full_name}`}
              title="ดูรายละเอียด"
            />
          </Link>
          <Link href={`/admin/recipients/${record.id}/edit`}>
            <Button
              type="text"
              icon={<EditOutlined />}
              aria-label={`แก้ไข ${record.full_name}`}
              title="แก้ไข"
            />
          </Link>
          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            aria-label={`ลบ ${record.full_name}`}
            title="ลบ"
            onClick={() => setTarget(record)}
          />
        </Space>
      ),
    },
  ];
  return (
    <>
      <div className="text-xs text-gray-400 mb-5">
        จัดการข้อมูล / ทะเบียนผู้รับธรรมะ
      </div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div>
          <h1 className="page-heading">ทะเบียนผู้รับธรรมะ</h1>
          <p className="page-description">
            จัดการ ค้นหา และดูแลประวัติผู้รับธรรมะทั้งหมด
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/recipients/print?${new URLSearchParams(Object.entries(filters).filter(([key, value]) => Boolean(value) && !["page", "pageSize"].includes(key)))}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button icon={<PrinterOutlined />}>ส่งออก / พิมพ์</Button>
          </Link>
          <Link href="/admin/recipients/create">
            <Button type="primary" icon={<PlusOutlined />}>
              เพิ่มผู้รับธรรมะ
            </Button>
          </Link>
        </div>
      </div>
      <div className="section-card mb-6">
        <div className="flex items-center gap-3 mb-5">
          <span className="bg-[#e8f1eb] text-[#176854] rounded-lg p-2">
            <SearchOutlined />
          </span>
          <h2 className="font-semibold">ค้นหาทะเบียน</h2>
        </div>
        <Form
          key={JSON.stringify(filters)}
          layout="vertical"
          onFinish={search}
          initialValues={{
            q: filters.q,
            level: filters.level,
            dates:
              filters.from && filters.to
                ? [dayjs(filters.from), dayjs(filters.to)]
                : undefined,
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_1.5fr_1fr_auto] gap-x-4 items-end">
            <Form.Item name="q" label="ค้นหาข้อมูล">
              <Input
                allowClear
                prefix={<SearchOutlined className="text-gray-400" />}
                placeholder="ชื่อ-นามสกุล เบอร์โทร หรือที่อยู่"
                maxLength={100}
              />
            </Form.Item>
            <Form.Item name="dates" label="วันที่รับธรรม">
              <DatePicker.RangePicker
                className="w-full"
                format="DD/MM/YYYY"
                placeholder={["วันที่เริ่มต้น", "วันที่สิ้นสุด"]}
              />
            </Form.Item>
            <Form.Item name="level" label="ระดับ">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="ทุกระดับ"
                options={options
                  .filter((o) => o.category === "level")
                  .map((o) => ({ label: o.value, value: o.value }))}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={pending}
                  icon={<SearchOutlined />}
                >
                  ค้นหา
                </Button>
                <Button icon={<ReloadOutlined />} onClick={() => navigate({})}>
                  ล้างค่า
                </Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </div>
      <section className="section-card !p-0 overflow-hidden">
        <div className="p-5 flex items-center gap-3 border-b border-[#e5ebe7]">
          <TeamOutlined className="text-[#176854] text-xl" />
          <h2 className="font-semibold">รายชื่อผู้รับธรรมะ</h2>
          <Tag bordered={false} color="green">
            {total.toLocaleString("th-TH")} รายการ
          </Tag>
        </div>
        <Table<DharmaRecipient>
          onChange={(_, __, sorter, extra) => {
            if (extra.action !== "sort") return;
            const selected = Array.isArray(sorter) ? sorter[0] : sorter;
            navigate({
              ...filters,
              page: "1",
              sort:
                selected.order === "ascend"
                  ? "date_asc"
                  : selected.order === "descend"
                    ? "date_desc"
                    : undefined,
            });
          }}
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={pending}
          scroll={{ x: 2130 }}
          locale={{
            emptyText:
              filters.q || filters.level || filters.from
                ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไข"
                : "ยังไม่มีข้อมูลผู้รับธรรมะ เริ่มต้นด้วยปุ่มเพิ่มผู้รับธรรมะ",
          }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50],
            showTotal: (count, range) =>
              `${count === 0 ? 0 : range[0]}–${range[1]} จาก ${count} รายการ`,
            onChange: (nextPage, size) =>
              navigate({
                ...filters,
                page: String(size !== pageSize ? 1 : nextPage),
                pageSize: String(size),
              }),
            responsive: true,
          }}
        />
        <div className="px-5 pb-4 text-xs text-gray-400">
          เลื่อนตารางในแนวนอนเพื่อดูข้อมูลและปุ่มจัดการทั้งหมด
        </div>
      </section>
      <Modal
        title="ยืนยันการลบข้อมูล"
        open={Boolean(target)}
        onCancel={() => {
          if (!deleting) setTarget(null);
        }}
        onOk={remove}
        okText="ยืนยันการลบ"
        cancelText="ยกเลิก"
        okButtonProps={{ danger: true }}
        confirmLoading={deleting}
        cancelButtonProps={{ disabled: deleting }}
        closable={!deleting}
        maskClosable={!deleting}
      >
        <p>
          ต้องการลบทะเบียนของ <strong>{target?.full_name}</strong> หรือไม่?
        </p>
        <p className="text-gray-500 mt-3">
          เมื่อลบแล้วจะไม่สามารถกู้คืนข้อมูลผ่านระบบนี้ได้
        </p>
      </Modal>
    </>
  );
}
