import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(buddhistEra);
dayjs.extend(utc);
dayjs.extend(timezone);
export const formatDate = (value: string | null) =>
  value ? dayjs(value).format("DD/MM/BBBB") : "—";
export const formatDateTime = (value: string | null) =>
  value
    ? dayjs(value).tz("Asia/Bangkok").format("DD/MM/BBBB HH:mm:ss น.")
    : "—";
export const formatMoney = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

export const formatTimeRange = (start: string | null, end: string | null) => {
  if (!start) return "—";
  return end ? `${start.slice(0, 5)}–${end.slice(0, 5)}` : start.slice(0, 5);
};
