export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("id-ID").format(Number.isFinite(value) ? value : 0);
}

export function toNumber(value: string): number {
  return Number(String(value).replace(",", "."));
}

export function sortText(a: string, b: string): number {
  return a.localeCompare(b, "id-ID", { numeric: true, sensitivity: "base" });
}
