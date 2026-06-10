export type WineCategory = 'tinto' | 'blanco' | 'rosado' | 'espumante' | 'dulce' | 'otro';

export interface WinePrices {
  bottle: number;
  case: number;
  market: number;
}

export interface Wine {
  id: string;
  name: string;
  code: string;
  category: WineCategory;
  vintage?: number;
  region?: string;
  winery?: string;
  varietal?: string;
  stock: number;
  bottlesPerCase: number;
  prices: WinePrices;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'draft' | 'confirmed' | 'delivered' | 'cancelled';
export type PriceType = 'bottle' | 'case' | 'market' | 'custom';
export type OrderUnit = 'bottle' | 'case';

export interface OrderItem {
  id: string;
  wineId: string;
  wineName: string;
  wineCode: string;
  quantity: number;
  unit: OrderUnit;
  priceType: PriceType;
  unitPrice: number;
  subtotal: number;
}

export interface Client {
  name: string;
  phone?: string;
  address?: string;
  email?: string;
  cuit?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  client: Client;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  deliveryDate?: string;
}

export const CATEGORY_LABELS: Record<WineCategory, string> = {
  tinto: 'Tinto',
  blanco: 'Blanco',
  rosado: 'Rosado',
  espumante: 'Espumante',
  dulce: 'Dulce',
  otro: 'Otro',
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  draft: 'Borrador',
  confirmed: 'Confirmado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  bottle: 'Por Botella',
  case: 'Por Caja',
  market: 'Mercado / Rest.',
  custom: 'Personalizado',
};

export const PRICE_TYPE_SHORT: Record<PriceType, string> = {
  bottle: 'Botella Suelta',
  case: 'Caja Entera',
  market: 'Mercado/Rest.',
  custom: 'Personalizado',
};

export interface StockReceptionItem {
  wineId: string;
  wineName: string;
  wineCode: string;
  quantity: number;
  isNew: boolean;
}

export interface StockReception {
  id: string;
  receptionNumber: string;
  items: StockReceptionItem[];
  totalBottles: number;
  newWinesCount: number;
  notes?: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  name: string;
  company?: string;
  phone?: string;
  address?: string;
  email?: string;
  cuit?: string;
  defaultPriceType: 'bottle' | 'case' | 'market';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
