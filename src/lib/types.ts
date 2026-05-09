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
  pricePerCm2: number;
  unitPrice: number;
  total: number;
};

export type CalculatorInput = {
  material: string;
  density: string;
  thickness: string;
  lengthCm: string;
  widthCm: string;
  qty: string;
};
