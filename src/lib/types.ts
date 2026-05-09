export const DENSITY_OPTIONS = [
  "Super Low",
  "Low",
  "Med",
  "High",
  "Super High",
] as const;

export type Density = (typeof DENSITY_OPTIONS)[number];

export type CuttingPrice = {
  id: string;
  material: string;
  materialCode?: string;
  density: Density;
  densityCode?: string;
  thickness: string;
  itemCode?: string;
  pricePerCm2: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type EstimationItem = {
  id: string;
  priceId: string;
  material: string;
  density: Density;
  thickness: string;
  lengthCm: number;
  widthCm: number;
  areaCm2: number;
  qty: number;
  offerPricePerCm2: number;
  pricePerCm2: number;
  offerUnitPrice: number;
  offerTotal: number;
  unitPrice: number;
  total: number;
};

export const ESTIMATION_DRAFT_STATUSES = [
  "Draft",
  "Sudah Dikirim",
  "Deal",
  "Batal",
] as const;

export type EstimationDraftStatus = (typeof ESTIMATION_DRAFT_STATUSES)[number];

export const CUSTOMER_PRICE_MODES = ["Offer Price", "Bottom Price"] as const;

export type CustomerPriceMode = (typeof CUSTOMER_PRICE_MODES)[number];

export type EstimationDraft = {
  id: string;
  customerName: string;
  status: EstimationDraftStatus;
  customerPriceMode: CustomerPriceMode;
  items: EstimationItem[];
  createdAt: string;
  updatedAt: string;
};

export type CalculatorInput = {
  material: string;
  density: string;
  thickness: string;
  lengthCm: string;
  widthCm: string;
  qty: string;
};
