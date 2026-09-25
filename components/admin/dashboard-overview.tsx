"use client";
import { useState } from "react";
import Link from "next/link";
import { Button, Empty, Select, Table, Tabs, Tag, Progress } from "antd";
import { PlusOutlined, TeamOutlined } from "@ant-design/icons";
import type { DashboardStats } from "@/lib/dashboard-stats";
import type { DharmaRecipient } from "@/types/recipient";
import { optionLabels } from "@/types/options";
import { formatDateTime, formatDate, formatMoney } from "@/lib/format";
type Recent = Pick<
  DharmaRecipient,
  "id" | "full_name" | "received_date" | "received_place" | "created_at"
>;
const monthNames = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];
export function DashboardOverview({
  stats,
  recent,
}: {
  stats: DashboardStats;
  recent: Recent[];
}) {
  const [year, setYear] = useState(stats.today.slice(0, 4));
  const months = stats.monthly.find((item) => item.year === year)?.months ?? [];
  const max = Math.max(1, ...months.map((m) => m.count));
  const cards = [
    {
      label: "ทะเบียนผู้รับธรรมะทั้งหมด",
      value: stats.total.toLocaleString("th-TH"),
      unit: "รายการ",
      detail: "นับตามทะเบียนที่บันทึกในระบบ",
    },
    {
      label: "รับธรรมะเดือนนี้",
      value: stats.monthCount.toLocaleString("th-TH"),
      unit: "คน",
      detail: "ตั้งแต่ต้นเดือนถึงวันนี้",
    },
    {
      label: "รับธรรมะปีนี้",
      value: stats.yearCount.toLocaleString("th-TH"),
      unit: "คน",
      detail: "ตั้งแต่ต้นปีถึงวันนี้",
    },
    {
      label: "ยอดสร้างบุญทั้งหมด",
      value: formatMoney(stats.totalMerit),
      unit: "บาท",
      detail: `ระบุยอดแล้ว ${stats.knownMerit.toLocaleString("th-TH")} รายการ`,
    },
  ];
  return (
    <>
      <div className="text-xs text-gray-400 mb-5">เมนูหลัก / ภาพรวมระบบ</div>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-7">
        <div>
          <h1 className="page-heading">ภาพรวมระบบ</h1>
          <p className="page-description">
            ข้อมูล ณ วันที่ {formatDate(stats.today)} · เขตเวลาไทย
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/recipients">
            <Button icon={<TeamOutlined />}>ดูทะเบียนทั้งหมด</Button>
          </Link>
          <Link href="/admin/recipients/create">
            <Button type="primary" icon={<PlusOutlined />}>
              เพิ่มผู้รับธรรมะ
            </Button>
          </Link>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <div className="section-card" key={card.label}>
            <h2 className="text-sm text-gray-500">{card.label}</h2>
            <div className="text-3xl font-semibold text-[#176854] mt-4 break-words">
              {card.value}{" "}
              <span className="text-xs font-normal text-gray-500">
                {card.unit}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-3">{card.detail}</p>
          </div>
        ))}
      </div>
      <section className="section-card mb-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-semibold">สถิติการรับธรรมะรายเดือน</h2>
            <p className="text-sm text-gray-500 mt-2">
              ยอดสร้างบุญเดือนนี้ถึงวันนี้ {formatMoney(stats.monthMerit)} บาท
            </p>
          </div>
          <Select
            aria-label="เลือกปีของสถิติ"
            value={year}
            onChange={setYear}
            className="min-w-40"
            options={stats.monthly.map((y) => ({
              value: y.year,
              label: `ปี พ.ศ. ${Number(y.year) + 543}`,
            }))}
          />
        </div>
        <div className="overflow-x-auto">
          <div
            className="grid grid-cols-12 gap-2 min-w-[600px] pt-4"
            role="img"
            aria-label={`กราฟจำนวนผู้รับธรรมะรายเดือนปี ${Number(year) + 543} รายละเอียดอยู่ในตารางด้านล่าง`}
          >
            {months.map((m, i) => (
              <div key={m.month} className="text-center">
                <div className="h-36 flex flex-col justify-end items-center">
                  <span className="text-xs mb-2">{m.count}</span>
                  <div
                    className="bg-[#27836a] rounded-t w-full max-w-10"
                    style={{
                      height: `${(m.count / max) * 110}px`,
                      minHeight: m.count ? 4 : 0,
                    }}
                  />
                </div>
                <div className="border-t border-gray-200 pt-2 text-xs text-gray-500">
                  {monthNames[i]}
                </div>
              </div>
            ))}
          </div>
        </div>
        <Table
          className="mt-6"
          size="small"
          rowKey="month"
          dataSource={months}
          pagination={false}
          columns={[
            {
              title: "เดือน",
              dataIndex: "month",
              render: (_: string, __, index) => monthNames[index],
            },
            { title: "ผู้รับธรรมะ (คน)", dataIndex: "count", align: "right" },
            {
              title: "สร้างบุญ (บาท)",
              dataIndex: "merit",
              align: "right",
              render: formatMoney,
            },
          ]}
          summary={() => (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>รวมปีที่เลือก</Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                {months.reduce((n, m) => n + m.count, 0)}
              </Table.Summary.Cell>
              <Table.Summary.Cell index={2} align="right">
                {formatMoney(
                  months.reduce((n, m) => n + Math.round(m.merit * 100), 0) /
                    100,
                )}
              </Table.Summary.Cell>
            </Table.Summary.Row>
          )}
        />
        <p className="text-xs text-gray-400 mt-3">
          อ้างอิงวันที่รับธรรม ไม่รวมรายการที่ยังไม่ระบุวันที่
          กราฟและตารางรวมวันที่ในอนาคตด้วย ({stats.future} รายการทั้งระบบ)
        </p>
      </section>
      <section className="section-card mb-6">
        <div className="flex justify-between gap-4">
          <h2 className="font-semibold">จำนวนผู้รับธรรมะแยกตามหมวด</h2>
          <Link href="/admin/options" className="text-sm text-[#176854]">
            จัดการตัวเลือก →
          </Link>
        </div>
        <Tabs
          items={stats.groups.map((group) => ({
            key: group.category,
            label: optionLabels[group.category],
            children: (
              <>
                <div className="mb-4">
                  <Tag color="green">มีข้อมูล {group.items.length} รายการ</Tag>
                  <Tag>ยังไม่ระบุ {group.missing} คน</Tag>
                </div>
                <Table
                  key={group.category}
                  rowKey="name"
                  dataSource={group.items}
                  pagination={{
                    pageSize: 5,
                    showSizeChanger: false,
                    hideOnSinglePage: true,
                  }}
                  locale={{ emptyText: "ยังไม่มีข้อมูลในหมวดนี้" }}
                  columns={[
                    {
                      title: optionLabels[group.category],
                      dataIndex: "name",
                      align: ["class_name", "level"].includes(group.category)
                        ? "center"
                        : "left",
                    },
                    {
                      title: "จำนวน (คน)",
                      dataIndex: "count",
                      align: "right",
                      sorter: (a, b) => a.count - b.count,
                    },
                    {
                      title: "สัดส่วนของทะเบียนทั้งหมด",
                      key: "ratio",
                      responsive: ["sm"],
                      render: (_, row) => (
                        <Progress
                          percent={
                            stats.total
                              ? Math.round((row.count / stats.total) * 100)
                              : 0
                          }
                          strokeColor="#176854"
                          size="small"
                        />
                      ),
                    },
                  ]}
                />
              </>
            ),
          }))}
        />
        <p className="text-xs text-gray-400 mt-3">
          นับตามรายการทะเบียน แยกแต่ละหมวด ไม่ควรนำยอดข้ามหมวดมารวมกัน
        </p>
      </section>
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="section-card">
          <h2 className="font-semibold mb-5">ช่วงอายุผู้รับธรรมะ</h2>
          {stats.ageRanges.map((item) => (
            <div key={item.name} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>{item.name}</span>
                <span>{item.count} คน</span>
              </div>
              <Progress
                percent={
                  stats.total ? Math.round((item.count / stats.total) * 100) : 0
                }
                strokeColor="#176854"
                showInfo={false}
              />
            </div>
          ))}
          <p className="text-xs text-gray-400">
            อ้างอิงอายุที่บันทึก ไม่ใช่อายุที่คำนวณ ณ วันนี้ · ยังไม่ระบุ{" "}
            {stats.missing.find((m) => m.label === "ยังไม่ระบุอายุ")?.count ??
              0}{" "}
            คน
          </p>
        </section>
        <section className="section-card">
          <h2 className="font-semibold mb-2">ข้อมูลที่ยังไม่ระบุ</h2>
          <p className="text-xs text-gray-400 mb-5">
            ช่องเหล่านี้เป็นข้อมูลเพิ่มเติม ไม่บังคับกรอก
          </p>
          {stats.missing.map((item) => (
            <div
              key={item.label}
              className="flex justify-between gap-3 py-3 border-b border-gray-100 text-sm"
            >
              <span>{item.label}</span>
              <Tag color={item.count ? "gold" : "green"}>
                {item.count} รายการ
              </Tag>
            </div>
          ))}
        </section>
      </div>
      <section className="section-card">
        <div className="flex justify-between gap-3 mb-5">
          <h2 className="font-semibold">ทะเบียนที่เพิ่มล่าสุด</h2>
          <Link href="/admin/recipients" className="text-sm text-[#176854]">
            ดูทั้งหมด →
          </Link>
        </div>
        {recent.length ? (
          recent.map((r) => (
            <Link
              key={r.id}
              href={`/admin/recipients/${r.id}`}
              className="flex flex-wrap justify-between gap-3 py-4 border-t border-gray-100"
            >
              <div>
                <p className="font-medium text-[#176854]">{r.full_name}</p>
                <p className="text-xs text-gray-500 mt-2">
                  สถานที่รับธรรม: {r.received_place || "ยังไม่ระบุ"}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                วันที่รับธรรม {formatDate(r.received_date)}
                <p className="text-xs mt-2">
                  เพิ่มเมื่อ {formatDateTime(r.created_at)}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <Empty description="ยังไม่มีข้อมูลผู้รับธรรมะ" />
        )}
      </section>
    </>
  );
}
