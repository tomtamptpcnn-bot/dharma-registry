import { Skeleton } from "antd";
export default function Loading() {
  return (
    <main className="p-8" role="status" aria-label="กำลังโหลด">
      <Skeleton active paragraph={{ rows: 6 }} />
    </main>
  );
}
