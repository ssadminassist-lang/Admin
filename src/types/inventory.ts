export type StockStatus = 'EN_STOCK' | 'STOCK_BAJO' | 'AGOTADO';

export type MovementType = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

export interface BlouseVariant {
  id: string;
  blouseId: string;
  sku: string;
  color: string;
  size: string;
  currentStock: number;
  minStock: number;
  price?: number;
  cost?: number;
  totalEntries: number;
  totalExits: number;
}

export interface Blouse {
  id: string;
  code: string; // e.g. "BLU-001"
  name: string;
  description: string;
  category: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  colors: string[];
  sizes: string[];
  variants: BlouseVariant[];
}

export interface StockMovement {
  id: string;
  timestamp: string; // ISO 8601
  type: MovementType;
  blouseId: string;
  blouseCode: string;
  blouseName: string;
  variantId: string;
  sku: string;
  color: string;
  size: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  responsible: string;
  note?: string;
}

export interface InventorySettings {
  storeName: string;
  currencySymbol: string;
  defaultMinStock: number;
  entryReasons: string[];
  exitReasons: string[];
  adjustmentReasons: string[];
  responsibles: string[];
  categories: string[];
  colorPalette: { name: string; hex: string }[];
  standardSizes: string[];
}

export type ActiveTab = 
  | 'dashboard' 
  | 'buscador' 
  | 'inventario' 
  | 'movimientos' 
  | 'reportes' 
  | 'configuracion';

export interface MovementFormData {
  type: MovementType;
  blouseId: string;
  variantId: string;
  quantity: number;
  reason: string;
  responsible: string;
  note?: string;
}
