import dayjs from "dayjs";
export const formatDate = (value: string | null) =>
  value ? dayjs(value).format("DD/MM/YYYY") : "—";
export const formatMoney = (value: number | null) =>
  value === null
    ? "—"
    : new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
