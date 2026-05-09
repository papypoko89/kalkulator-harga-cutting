import seedData from "@/data/cutting-price-master-seed.json";
import type { CuttingPrice, EstimationItem } from "./types";

export const MASTER_STORAGE_KEY = "cutting_price_master";
export const ESTIMATION_STORAGE_KEY = "cutting_estimation_items";
export const CUSTOMER_STORAGE_KEY = "cutting_customer_name";

const validDensities = new Set([
  "Super Low",
  "Low",
  "Med",
  "High",
  "Super High",
]);

export function normalizePriceRows(rows: unknown): CuttingPrice[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row): row is Record<string, unknown> => {
      if (!row || typeof row !== "object") return false;
      return (
        typeof row.material === "string" &&
        typeof row.density === "string" &&
        validDensities.has(row.density) &&
        typeof row.thickness === "string" &&
        Number(row.pricePerCm2) > 0
      );
    })
    .map((row, index) => {
      const now = new Date().toISOString();
      return {
        id: typeof row.id === "string" ? row.id : `import-${index}-${Date.now()}`,
        material: String(row.material).trim(),
        materialCode: typeof row.materialCode === "string" ? row.materialCode : "",
        density: row.density as CuttingPrice["density"],
        densityCode: typeof row.densityCode === "string" ? row.densityCode : "",
        thickness: String(row.thickness).trim(),
        itemCode: typeof row.itemCode === "string" ? row.itemCode : "",
        pricePerCm2: Number(row.pricePerCm2),
        isActive: typeof row.isActive === "boolean" ? row.isActive : true,
        createdAt: typeof row.createdAt === "string" ? row.createdAt : now,
        updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now,
      };
    });
}

export function getDefaultMaster(): CuttingPrice[] {
  return normalizePriceRows(seedData);
}

export function loadMaster(): CuttingPrice[] {
  if (typeof window === "undefined") return getDefaultMaster();

  const stored = window.localStorage.getItem(MASTER_STORAGE_KEY);
  if (!stored) {
    const defaults = getDefaultMaster();
    window.localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = normalizePriceRows(JSON.parse(stored));
    return parsed.length ? parsed : getDefaultMaster();
  } catch {
    return getDefaultMaster();
  }
}

export function saveMaster(rows: CuttingPrice[]) {
  window.localStorage.setItem(MASTER_STORAGE_KEY, JSON.stringify(rows));
}

export function loadEstimationItems(): EstimationItem[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ESTIMATION_STORAGE_KEY) || "[]",
    );
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEstimationItems(rows: EstimationItem[]) {
  window.localStorage.setItem(ESTIMATION_STORAGE_KEY, JSON.stringify(rows));
}

export function loadCustomerName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CUSTOMER_STORAGE_KEY) || "";
}

export function saveCustomerName(name: string) {
  window.localStorage.setItem(CUSTOMER_STORAGE_KEY, name);
}
