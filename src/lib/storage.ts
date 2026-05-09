import seedData from "@/data/cutting-price-master-seed.json";
import type {
  CuttingPrice,
  CustomerPriceMode,
  EstimationDraft,
  EstimationDraftStatus,
  EstimationItem,
} from "./types";

export const MASTER_STORAGE_KEY = "cutting_price_master";
export const ESTIMATION_STORAGE_KEY = "cutting_estimation_items";
export const ESTIMATION_DRAFTS_STORAGE_KEY = "cutting_estimation_drafts";
export const CUSTOMER_STORAGE_KEY = "cutting_customer_name";
export const OFFER_MULTIPLIER_STORAGE_KEY = "cutting_offer_multiplier";
export const DEFAULT_OFFER_MULTIPLIER = 1.5;

const validDensities = new Set([
  "Super Low",
  "Low",
  "Med",
  "High",
  "Super High",
]);

const validDraftStatuses = new Set<EstimationDraftStatus>([
  "Draft",
  "Sudah Dikirim",
  "Deal",
  "Batal",
]);

const validCustomerPriceModes = new Set<CustomerPriceMode>([
  "Offer Price",
  "Bottom Price",
]);

export function normalizePriceRows(rows: unknown): CuttingPrice[] {
  const sourceRows =
    Array.isArray(rows) ? rows : rows && typeof rows === "object" && Array.isArray((rows as { rows?: unknown }).rows)
      ? (rows as { rows: unknown[] }).rows
      : [];

  if (!sourceRows.length) return [];

  return sourceRows
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

export function loadOfferMultiplier(): number {
  if (typeof window === "undefined") return DEFAULT_OFFER_MULTIPLIER;

  const stored = Number(window.localStorage.getItem(OFFER_MULTIPLIER_STORAGE_KEY));
  return stored > 0 ? stored : DEFAULT_OFFER_MULTIPLIER;
}

export function saveOfferMultiplier(multiplier: number) {
  window.localStorage.setItem(
    OFFER_MULTIPLIER_STORAGE_KEY,
    String(multiplier > 0 ? multiplier : DEFAULT_OFFER_MULTIPLIER),
  );
}

function normalizeEstimationItems(rows: unknown): EstimationItem[] {
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row): row is Record<string, unknown> => {
      return Boolean(row && typeof row === "object" && typeof row.id === "string");
    })
    .map((row) => {
      const pricePerCm2 = Number(row.pricePerCm2) || 0;
      const unitPrice = Number(row.unitPrice) || 0;
      const total = Number(row.total) || 0;

      return {
        ...row,
        offerPricePerCm2:
          Number(row.offerPricePerCm2) > 0
            ? Number(row.offerPricePerCm2)
            : pricePerCm2,
        pricePerCm2,
        offerUnitPrice:
          Number(row.offerUnitPrice) > 0 ? Number(row.offerUnitPrice) : unitPrice,
        offerTotal: Number(row.offerTotal) > 0 ? Number(row.offerTotal) : total,
        unitPrice,
        total,
      } as EstimationItem;
    });
}

export function createEstimationDraft(
  customerName = "Customer Baru",
): EstimationDraft {
  const now = new Date().toISOString();

  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customerName,
    status: "Draft",
    customerPriceMode: "Offer Price",
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function loadEstimationDrafts(): EstimationDraft[] {
  if (typeof window === "undefined") return [];

  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(ESTIMATION_DRAFTS_STORAGE_KEY) || "[]",
    );

    if (Array.isArray(parsed) && parsed.length) {
      return parsed
        .filter((row): row is Record<string, unknown> => {
          return Boolean(row && typeof row === "object" && typeof row.id === "string");
        })
        .map((row) => {
          const now = new Date().toISOString();
          const status = String(row.status) as EstimationDraftStatus;
          const customerPriceMode = String(
            row.customerPriceMode,
          ) as CustomerPriceMode;

          return {
            id: String(row.id),
            customerName:
              typeof row.customerName === "string" && row.customerName.trim()
                ? row.customerName
                : "Customer Baru",
            status: validDraftStatuses.has(status) ? status : "Draft",
            customerPriceMode: validCustomerPriceModes.has(customerPriceMode)
              ? customerPriceMode
              : "Offer Price",
            items: normalizeEstimationItems(row.items),
            createdAt: typeof row.createdAt === "string" ? row.createdAt : now,
            updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : now,
          };
        });
    }
  } catch {
    return [];
  }

  let legacyItems: EstimationItem[] = [];
  try {
    legacyItems = normalizeEstimationItems(
      JSON.parse(window.localStorage.getItem(ESTIMATION_STORAGE_KEY) || "[]"),
    );
  } catch {
    legacyItems = [];
  }

  const legacyCustomer = loadCustomerName().trim();
  const draft = createEstimationDraft(legacyCustomer || "Customer Baru");

  return [{ ...draft, items: legacyItems }];
}

export function saveEstimationDrafts(rows: EstimationDraft[]) {
  window.localStorage.setItem(ESTIMATION_DRAFTS_STORAGE_KEY, JSON.stringify(rows));
}

export function loadCustomerName(): string {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(CUSTOMER_STORAGE_KEY) || "";
}

export function saveCustomerName(name: string) {
  window.localStorage.setItem(CUSTOMER_STORAGE_KEY, name);
}
