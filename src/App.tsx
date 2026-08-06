import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { StockPage } from './pages/StockPage';
import { PricesPage } from './pages/PricesPage';
import { OrdersPage } from './pages/OrdersPage';
import { NewOrderPage } from './pages/NewOrderPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { ContactsPage } from './pages/ContactsPage';
import { StockIntakePage } from './pages/StockIntakePage';
import { ConfigPage } from './pages/ConfigPage';
import { LiquidacionesPage } from './pages/LiquidacionesPage';
import { NewLiquidacionPage } from './pages/NewLiquidacionPage';
import { useWineStore } from './store/wineStore';
import { useOrderStore } from './store/orderStore';
import { useContactStore } from './store/contactStore';
import { useReceptionStore } from './store/receptionStore';
import { useCategoryStore } from './store/categoryStore';
import { useLiquidacionStore } from './store/liquidacionStore';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const initWines = useWineStore((s) => s.init);
  const initOrders = useOrderStore((s) => s.init);
  const initContacts = useContactStore((s) => s.init);
  const initReceptions = useReceptionStore((s) => s.init);
  const initCategories = useCategoryStore((s) => s.init);
  const initLiquidaciones = useLiquidacionStore((s) => s.init);

  useEffect(() => {
    Promise.all([initWines(), initOrders(), initContacts(), initReceptions(), initCategories(), initLiquidaciones()])
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-xl font-semibold text-burgundy mb-2">No se pudo conectar al servidor</p>
          <p className="text-gray-600 text-sm">Asegurate de que el servidor esté corriendo con <code className="bg-gray-100 px-1 rounded">node server.js</code></p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-burgundy border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Cargando BDA...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/precios" element={<PricesPage />} />
        <Route path="/pedidos" element={<OrdersPage />} />
        <Route path="/pedidos/nuevo" element={<NewOrderPage />} />
        <Route path="/pedidos/:id" element={<OrderDetailPage />} />
        <Route path="/contactos" element={<ContactsPage />} />
        <Route path="/recepcion" element={<StockIntakePage />} />
        <Route path="/liquidaciones" element={<LiquidacionesPage />} />
        <Route path="/liquidaciones/nueva" element={<NewLiquidacionPage />} />
        <Route path="/configuracion" element={<ConfigPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
