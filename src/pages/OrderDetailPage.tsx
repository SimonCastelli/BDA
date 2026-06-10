import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileDown, Trash2, CheckCircle, Truck, XCircle, Package } from 'lucide-react';
import { useOrderStore } from '../store/orderStore';
import { useWineStore } from '../store/wineStore';
import { OrderStatus, PRICE_TYPE_LABELS, STATUS_LABELS } from '../types';
import { formatCurrency, formatDate, formatDateShort } from '../utils/format';
import { generateRemitoPDF } from '../utils/pdf';
import { StatusBadge } from '../components/ui/Badge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, updateStatus, deleteOrder } = useOrderStore();
  const { wines, updateStock } = useWineStore();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-lg font-semibold text-gray-700 mb-2">Pedido no encontrado</p>
        <p className="text-sm text-gray-500 mb-6">El pedido que buscás no existe o fue eliminado.</p>
        <button onClick={() => navigate('/pedidos')} className="btn-secondary">
          <ArrowLeft size={16} />
          Volver a pedidos
        </button>
      </div>
    );
  }

  // Calculate what will be deducted when delivered
  const deductions = order.items.map((item) => {
    const wine = wines.find((w) => w.id === item.wineId);
    const bpc = wine?.bottlesPerCase ?? 6;
    const bottles = item.unit === 'case' ? item.quantity * bpc : item.quantity;
    return { item, wine, bottles };
  });
  const totalToDeduct = deductions.reduce((s, d) => s + d.bottles, 0);

  function confirmDeliver() {
    for (const { item, bottles } of deductions) {
      updateStock(item.wineId, -bottles);
    }
    updateStatus(order!.id, 'delivered');
    setShowDeliverModal(false);
  }

  function handleStatusClick(status: OrderStatus) {
    if (status === 'delivered') {
      setShowDeliverModal(true);
    } else {
      updateStatus(order!.id, status);
    }
  }

  const statusActions: { status: OrderStatus; label: string; icon: React.ReactNode; className: string }[] = ([
    { status: 'confirmed' as OrderStatus, label: 'Marcar Confirmado', icon: <CheckCircle size={15} />, className: 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100' },
    { status: 'delivered' as OrderStatus, label: 'Marcar Entregado',  icon: <Truck size={15} />,       className: 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100' },
    { status: 'cancelled' as OrderStatus, label: 'Cancelar pedido',   icon: <XCircle size={15} />,     className: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100' },
  ]).filter((a) => a.status !== order.status);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pedidos')} className="btn-ghost">
            <ArrowLeft size={16} />
            Volver
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button onClick={() => generateRemitoPDF(order)} className="btn-secondary">
            <FileDown size={16} />
            Descargar Remito (PDF)
          </button>
          {statusActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusClick(action.status)}
              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${action.className}`}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          <button onClick={() => setShowDeleteDialog(true)} className="btn-danger">
            <Trash2 size={15} />
            Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Datos del cliente</h2>
          <p className="text-base font-semibold text-gray-900 mb-2">{order.client.name}</p>
          <div className="space-y-1">
            {order.client.phone && (
              <div className="flex gap-2 text-sm"><span className="text-gray-400 w-16 flex-shrink-0">Teléfono</span><span className="text-gray-700">{order.client.phone}</span></div>
            )}
            {order.client.email && (
              <div className="flex gap-2 text-sm"><span className="text-gray-400 w-16 flex-shrink-0">Email</span><span className="text-gray-700">{order.client.email}</span></div>
            )}
            {order.client.address && (
              <div className="flex gap-2 text-sm"><span className="text-gray-400 w-16 flex-shrink-0">Dirección</span><span className="text-gray-700">{order.client.address}</span></div>
            )}
            {order.client.cuit && (
              <div className="flex gap-2 text-sm"><span className="text-gray-400 w-16 flex-shrink-0">CUIT</span><span className="text-gray-700">{order.client.cuit}</span></div>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Detalles del pedido</h2>
          <div className="space-y-1">
            <div className="flex gap-2 text-sm"><span className="text-gray-400 w-24 flex-shrink-0">N° Pedido</span><span className="font-mono font-semibold text-burgundy">{order.orderNumber}</span></div>
            <div className="flex gap-2 text-sm"><span className="text-gray-400 w-24 flex-shrink-0">Fecha</span><span className="text-gray-700">{formatDateShort(order.createdAt)}</span></div>
            <div className="flex gap-2 text-sm"><span className="text-gray-400 w-24 flex-shrink-0">Estado</span><StatusBadge status={order.status} /></div>
            {order.deliveryDate && (
              <div className="flex gap-2 text-sm"><span className="text-gray-400 w-24 flex-shrink-0">Entrega</span><span className="text-gray-700">{formatDateShort(order.deliveryDate)}</span></div>
            )}
            {order.paymentMethod && (
              <div className="flex gap-2 text-sm"><span className="text-gray-400 w-24 flex-shrink-0">Pago</span><span className="text-gray-700">{order.paymentMethod}</span></div>
            )}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Productos ({order.items.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header text-center w-10">#</th>
                <th className="table-header text-left">Producto</th>
                <th className="table-header text-center">Unidad</th>
                <th className="table-header text-center">Cantidad</th>
                <th className="table-header text-right">Precio Unit.</th>
                <th className="table-header text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="table-cell text-center text-gray-400 text-xs">{index + 1}</td>
                  <td className="table-cell">
                    <div className="font-medium text-gray-900">{item.wineName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.wineCode} · {PRICE_TYPE_LABELS[item.priceType]}</div>
                  </td>
                  <td className="table-cell text-center text-gray-600">{item.unit === 'bottle' ? 'Botella' : 'Caja'}</td>
                  <td className="table-cell text-center font-medium text-gray-700">{item.quantity}</td>
                  <td className="table-cell text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                  <td className="table-cell text-right font-semibold text-gray-900">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-4 border-t border-gray-100 flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-medium text-gray-700">{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Descuento ({order.discount}%)</span>
                <span className="text-green-600 font-medium">-{formatCurrency(order.subtotal * order.discount / 100)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900 text-base">TOTAL</span>
              <span className="font-bold text-xl text-burgundy">{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.notes && (
        <div className="card p-5">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Observaciones</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{order.notes}</p>
        </div>
      )}

      {/* Delivery confirmation modal */}
      <Modal open={showDeliverModal} onClose={() => setShowDeliverModal(false)} title="Confirmar entrega" size="md">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Truck size={18} className="text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Al confirmar la entrega se descontará el stock automáticamente.</p>
              <p className="text-xs text-green-600 mt-0.5">Se restarán <strong>{totalToDeduct} botellas</strong> del inventario.</p>
            </div>
          </div>

          <div className="space-y-1.5 max-h-56 overflow-y-auto">
            {deductions.map(({ item, wine, bottles }) => (
              <div key={item.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-800">{item.wineName}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.wineCode}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs">
                  <span className="text-gray-500">
                    {item.quantity} {item.unit === 'bottle' ? 'bot.' : `caja${item.quantity !== 1 ? 's' : ''}`}
                  </span>
                  <span className="text-red-600 font-semibold">−{bottles} bot.</span>
                  {wine && (
                    <span className="text-gray-400">
                      (quedan {Math.max(0, wine.stock - bottles)})
                    </span>
                  )}
                  {!wine && <span className="text-amber-600 text-xs">vino no encontrado</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button onClick={() => setShowDeliverModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={confirmDeliver} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm bg-green-600 text-white hover:bg-green-700 transition-colors">
              <Truck size={15} />
              Confirmar entrega y descontar stock
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={() => { deleteOrder(order.id); navigate('/pedidos'); }}
        title="Eliminar pedido"
        message={`¿Estás seguro que querés eliminar el pedido ${order.orderNumber}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
