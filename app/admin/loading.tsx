import { Skeleton } from "antd";
export default function Loading() {
  return (
    <div className="section-card" role="status" aria-label="กำลังโหลดข้อมูล">
      <Skeleton active paragraph={{ rows: 8 }} />
    </div>
  );
}
