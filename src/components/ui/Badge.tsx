import { clsx } from 'clsx';
import { OrderStatus, STATUS_LABELS } from '../../types';
import { useCategoryStore } from '../../store/categoryStore';

const statusColors: Record<OrderStatus, string> = {
  draft:     'bg-gray-100 text-gray-700 border-gray-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export function CategoryBadge({ category }: { category: string }) {
  const getLabel = useCategoryStore((s) => s.getLabel);
  const getColor = useCategoryStore((s) => s.getColor);
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border', getColor(category))}>
      {getLabel(category)}
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
