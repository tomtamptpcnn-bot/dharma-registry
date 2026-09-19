"use client";
import "@ant-design/v5-patch-for-react-19";
import { App, ConfigProvider } from "antd";
import thTH from "antd/locale/th_TH";
import dayjs from "dayjs";
import "dayjs/locale/th";
dayjs.locale("th");
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider
      locale={thTH}
      theme={{
        token: {
          colorPrimary: "#176854",
          colorInfo: "#176854",
          colorText: "#243c36",
          colorBgLayout: "#f4f7f6",
          borderRadius: 8,
          fontFamily: "Tahoma, Arial, sans-serif",
          controlHeight: 42,
        },
        components: {
          Table: { headerBg: "#f1f6f3" },
          Button: { primaryShadow: "none" },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  );
}
