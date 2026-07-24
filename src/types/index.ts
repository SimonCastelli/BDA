export type WineCategory = string;

export interface Category {
  id: string;
  label: string;
  color: string;
}

export const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: 'bg-red-100 text-red-800 border-red-200',        label: 'Rojo' },
  { value: 'bg-yellow-50 text-yellow-800 border-yellow-200', label: 'Amarillo' },
  { value: 'bg-pink-100 text-pink-700 border-pink-200',      label: 'Rosa' },
  { value: 'bg-blue-50 text-blue-700 border-blue-200',       label: 'Azul' },
  { value: 'bg-amber-100 text-amber-800 border-amber-200',   label: 'Ámbar' },
  { value: 'bg-gray-100 text-gray-700 border-gray-200',      label: 'Gris' },
  { value: 'bg-green-100 text-green-700 border-green-200',   label: 'Verde' },
  { value: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Violeta' },
  { value: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Naranja' },
  { value: 'bg-teal-100 text-teal-700 border-teal-200',      label: 'Verde agua' },
];

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
