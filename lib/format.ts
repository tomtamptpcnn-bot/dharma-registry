import dayjs from "dayjs";
import buddhistEra from "dayjs/plugin/buddhistEra";
dayjs.extend(buddhistEra);
export const formatDate = (value: string | null) =>
  value ? dayjs(value).format("DD/MM/BBBB") : "—";
export const formatMoney = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
