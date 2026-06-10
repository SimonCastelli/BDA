import { clsx } from 'clsx';
import { WineCategory, OrderStatus, CATEGORY_LABELS, STATUS_LABELS } from '../../types';

const categoryColors: Record<WineCategory, string> = {
  tinto:     'bg-red-100 text-red-800 border-red-200',
  blanco:    'bg-yellow-50 text-yellow-800 border-yellow-200',
  rosado:    'bg-pink-100 text-pink-700 border-pink-200',
  espumante: 'bg-blue-50 text-blue-700 border-blue-200',
  dulce:     'bg-amber-100 text-amber-800 border-amber-200',
  otro:      'bg-gray-100 text-gray-700 border-gray-200',
};

const statusColors: Record<OrderStatus, string> = {
  draft:     'bg-gray-100 text-gray-700 border-gray-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export function CategoryBadge({ category }: { category: WineCategory }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', categoryColors[category])}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', statusColors[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
